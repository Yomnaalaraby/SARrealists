import { NextResponse } from 'next/server';
import { createFallbackResponse } from '@/ai/fallback';
import { retrieveChunks, sourcesForChunks } from '@/ai/knowledge';
import { buildPrompts } from '@/ai/promptBuilder';
import {
  ChatRequestSchema,
  filterValidActions,
  type ChatRequest,
  type ChatResponse,
} from '@/ai/types';

const ACTION_BLOCK = /```json_actions\s*([\s\S]*?)```/i;
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;
const rateBuckets = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (rateBuckets.get(key) ?? []).filter((stamp) => now - stamp < WINDOW_MS);
  recent.push(now);
  rateBuckets.set(key, recent);
  return recent.length > MAX_REQUESTS_PER_WINDOW;
}

function splitActions(answer: string): { answer: string; actions: unknown } {
  const match = answer.match(ACTION_BLOCK);
  if (!match) return { answer, actions: [] };
  const withoutBlock = answer.replace(ACTION_BLOCK, '').trim();
  try {
    return { answer: withoutBlock, actions: JSON.parse(match[1]) };
  } catch {
    return { answer: withoutBlock, actions: [] };
  }
}

function withConfidenceTag(answer: string, confidenceTag: string): string {
  return answer.includes(confidenceTag) ? answer : `${answer.trim()}\n\n${confidenceTag}`;
}

function responsePayload(
  request: ChatRequest,
  chunks: ReturnType<typeof retrieveChunks>,
  prompts: ReturnType<typeof buildPrompts>,
  answer: string,
  actions: unknown,
  isFallback = false,
): ChatResponse {
  return {
    answer,
    persona: request.persona,
    language: prompts.language,
    sources: sourcesForChunks(chunks),
    confidenceTag: prompts.confidenceTag,
    actions: filterValidActions(actions),
    isFallback,
  };
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (contentLength > 20_000) {
    return NextResponse.json({ error: 'Request body is too large.' }, { status: 413 });
  }

  const forwarded = request.headers.get('x-forwarded-for') ?? 'local';
  if (isRateLimited(forwarded.split(',')[0].trim())) {
    return NextResponse.json(
      { error: 'Too many questions in a short period. Please wait a minute and try again.' },
      { status: 429 },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = ChatRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid chat request.', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const chatRequest = parsed.data;
  const chunks = retrieveChunks(chatRequest.question);
  const prompts = buildPrompts({
    personaId: chatRequest.persona,
    question: chatRequest.question,
    clickContext: chatRequest.clickContext,
    retrievedChunks: chunks,
    language: chatRequest.language,
    enableActions: chatRequest.enableActions,
  });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(createFallbackResponse(chatRequest, chunks, prompts));
  }

  const baseUrl = (
    process.env.OPENAI_BASE_URL ||
    process.env.OPENAI_API_BASE ||
    'https://api.openai.com/v1'
  ).replace(/\/$/, '');
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  try {
    const completion = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 3000,
        messages: [
          { role: 'system', content: prompts.systemPrompt },
          { role: 'user', content: prompts.userTurn },
        ],
      }),
      signal: AbortSignal.timeout(35_000),
    });

    if (!completion.ok) {
      const detail = await completion.text();
      console.error('Chat completion failed:', completion.status, detail.slice(0, 500));
      return NextResponse.json(createFallbackResponse(chatRequest, chunks, prompts));
    }

    const data = (await completion.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const rawAnswer = data.choices?.[0]?.message?.content;
    if (!rawAnswer || !rawAnswer.trim()) {
      return NextResponse.json(createFallbackResponse(chatRequest, chunks, prompts));
    }

    const { answer, actions } = splitActions(rawAnswer);
    return NextResponse.json(
      responsePayload(
        chatRequest,
        chunks,
        prompts,
        withConfidenceTag(answer, prompts.confidenceTag),
        actions,
      ),
    );
  } catch (error) {
    console.error('Chat completion request failed:', error);
    return NextResponse.json(createFallbackResponse(chatRequest, chunks, prompts));
  }
}

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createFallbackResponse } from '@/ai/fallback';
import { retrieveChunks } from '@/ai/knowledge';
import { buildPrompts } from '@/ai/promptBuilder';
import { ChatRequestSchema } from '@/ai/types';
import { ChatPanel } from '@/components/ai/ChatPanel';

const request = {
  question: 'What does NISAR L-band see through clouds?',
  persona: 'scientist' as const,
  language: 'en' as const,
};

describe('NISAR chatbot', () => {
  it('retrieves citable NISAR sources', () => {
    const chunks = retrieveChunks('What is NISAR L-band?');
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].citationTag).toMatch(/^S\d+$/);
    expect(chunks.some((chunk) => chunk.text.includes('L-band'))).toBe(true);
  });

  it('rejects malformed chat requests', () => {
    expect(ChatRequestSchema.safeParse({ question: '', persona: 'scientist' }).success).toBe(false);
    expect(
      ChatRequestSchema.safeParse({ question: 'x'.repeat(1201), persona: 'scientist' }).success,
    ).toBe(false);
  });

  it('builds a grounded fallback ending with the confidence tag', () => {
    const chunks = retrieveChunks(request.question);
    const prompts = buildPrompts({
      personaId: request.persona,
      question: request.question,
      retrievedChunks: chunks,
      language: request.language,
    });
    const response = createFallbackResponse(request, chunks, prompts);
    expect(response.isFallback).toBe(true);
    expect(response.answer).toContain(prompts.confidenceTag);
    expect(response.sources.length).toBeGreaterThan(0);
  });

  it('opens the panel, sends a suggestion, and renders a fallback answer', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        answer: 'NISAR radar can see through clouds and smoke. [S1]\n\nConfidence & data limits: No map pixel selected.',
        persona: 'scientist',
        language: 'en',
        sources: [
          {
            id: 'nisar-mission',
            title: 'NASA — NISAR Mission Overview',
            url: 'https://nisar.jpl.nasa.gov/mission/overview/',
            attribution: 'NASA/JPL-Caltech',
            citationTag: 'S1',
          },
        ],
        confidenceTag: 'Confidence & data limits: No map pixel selected.',
        isFallback: true,
      }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    render(<ChatPanel />);
    fireEvent.click(screen.getByRole('button', { name: /ask lumen/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /what can nisar see through clouds/i }));

    expect(await screen.findByText(/NISAR radar can see through clouds/i)).toBeInTheDocument();
    expect(screen.getByText(/Grounded local answer/i)).toBeInTheDocument();
    expect(screen.getByText(/NASA — NISAR Mission Overview/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/chat',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

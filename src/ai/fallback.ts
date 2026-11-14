import { PERSONAS } from './personas';
import { sourcesForChunks } from './knowledge';
import type { BuiltPrompts } from './promptBuilder';
import type {
  ChatRequest,
  ChatResponse,
  CitedSource,
  RetrievedChunk,
} from './types';

function valueLines(request: ChatRequest): string[] {
  const ctx = request.clickContext;
  if (!ctx) return [];
  const entries = Object.entries(ctx.values).slice(0, 6);
  const lines = entries.map(([key, value]) => `- ${key}: ${value === null ? 'unavailable (null)' : value}`);
  lines.push(`- Dates: ${ctx.datesCount} over ${ctx.recordDays} days`);
  lines.push(`- Polarizations: ${ctx.polsAvailable.join(', ') || 'none'}`);
  if (ctx.siteNotes?.limits) lines.push(`- Site limitation: ${ctx.siteNotes.limits}`);
  return lines;
}

function fallbackBody(
  request: ChatRequest,
  chunks: RetrievedChunk[],
  language: 'en' | 'ar',
): string {
  const persona = PERSONAS[request.persona];
  const ctx = request.clickContext;
  const sourceSentence = chunks.length
    ? chunks
        .slice(0, 2)
        .map((chunk) => `${chunk.text} [${chunk.citationTag}]`)
        .join(' ')
    : '';
  const values = valueLines(request);

  if (language === 'ar') {
    const intro = ctx
      ? `لم يتم تكوين خدمة الذكاء الاصطناعي بعد، لذلك هذا ملخص محلي للنقطة المحددة (${ctx.lon.toFixed(3)}, ${ctx.lat.toFixed(3)}).`
      : 'لم يتم تكوين خدمة الذكاء الاصطناعي بعد، لذلك هذا ملخص محلي من المعرفة المرفقة.';
    const personaLine =
      request.persona === 'decision_maker'
        ? 'الخلاصة: هذه ملاحظات بحثية للرصد، وليست أمراً تشغيلياً أو شهادة سلامة.'
        : request.persona === 'student'
          ? 'تذكر: الرادار يقيس مقدار الطاقة المرتدة، لا صورة مرئية مثل الكاميرا.'
          : request.persona === 'enthusiast'
            ? 'الحقيقة المدهشة: رادار NISAR يعمل ليلاً ونهاراً ويرى عبر السحب والدخان.'
            : 'التفسير: تعتمد شدة الارتداد الراداري على خشونة السطح ورطوبته وهندسة الرصد.';
    return [
      intro,
      personaLine,
      sourceSentence,
      values.length ? 'قيم النقطة المحددة:' : '',
      ...values,
      'حدود البيانات: لا توجد قيم رستر متصلة بهذه النقطة في هذه النسخة؛ لا تفترض قياسات غير معروضة.',
      `(${persona.labelAr})`,
      '',
      language === 'ar' ? 'الثقة وحدود البيانات: لم يتم تحديد قيم رستر؛ راجع سجل المشاهد والترابط قبل أي استنتاج.' : '',
    ].filter(Boolean).join('\n');
  }

  const intro = ctx
    ? `The AI service is not configured yet, so this is a local grounded summary for the selected point (${ctx.lon.toFixed(3)}, ${ctx.lat.toFixed(3)}).`
    : 'The AI service is not configured yet, so this is a local grounded summary from the bundled NISAR references.';
  const personaLine =
    request.persona === 'decision_maker'
      ? 'Bottom line: treat this as a research observation for monitoring, not an operational order or a safety certification.'
      : request.persona === 'student'
        ? 'Remember: radar measures returned microwave energy, not a photograph. Roughness and moisture change the return.'
        : request.persona === 'enthusiast'
          ? 'The surprising part: NISAR works day and night, and its radar can see through clouds and smoke.'
          : 'Interpretation: radar brightness depends on surface roughness, moisture, and viewing geometry; a change in brightness is not automatically damage.';
  return [
    intro,
    personaLine,
    sourceSentence,
    values.length ? 'Selected-point values:' : '',
    ...values,
    'Data limit: no raster values are attached to this point in this build; do not infer measurements that are not shown.',
    `(${persona.label})`,
  ].filter(Boolean).join('\n');
}

export function createFallbackResponse(
  request: ChatRequest,
  chunks: RetrievedChunk[],
  prompts: BuiltPrompts,
): ChatResponse {
  const sources: CitedSource[] = sourcesForChunks(chunks);
  const body = fallbackBody(request, chunks, prompts.language);
  const answer = body.endsWith(prompts.confidenceTag)
    ? body
    : `${body}\n\n${prompts.confidenceTag}`;
  return {
    answer,
    persona: request.persona,
    language: prompts.language,
    sources,
    confidenceTag: prompts.confidenceTag,
    actions: [],
    isFallback: true,
  };
}

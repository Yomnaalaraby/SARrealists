'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, MapPin, Send, Sparkles, Trash2, X } from 'lucide-react';
import { PersonaSwitcher } from '@/ai/components/PersonaSwitcher';
import { SITE_NOTES } from '@/ai/knowledge';
import {
  DEFAULT_PERSONA_ID,
  loadSavedPersona,
  savePersona,
} from '@/ai/personas';
import type {
  ChatResponse,
  CitedSource,
  ClickContext,
  MapAction,
  PersonaId,
  SiteId,
  SupportedLanguage,
} from '@/ai/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: CitedSource[];
  isFallback?: boolean;
}

const SITE_MAP: Record<SiteId, 'california' | 'himalayas' | 'delta'> = {
  california: 'california',
  himalaya: 'himalayas',
  nile_delta: 'delta',
};

const COPY = {
  en: {
    open: 'Ask LUMEN',
    title: 'LUMEN',
    subtitle: 'NISAR science assistant',
    close: 'Close assistant',
    clear: 'Clear conversation',
    placeholder: 'Ask about radar, a site, or the selected point…',
    send: 'Send question',
    thinking: 'LUMEN is reading the sources…',
    welcome:
      'I explain NISAR radar observations using the loaded mission sources. When the interactive map is available, click a location to attach it, then ask what the data can and cannot tell you.',
    noContext: 'No map point attached',
    context: 'Map point',
    removeContext: 'Remove map point',
    fallback: 'Grounded local answer',
    sources: 'Sources',
    suggestions: 'Try asking',
    error: 'The assistant could not answer. Please try again.',
    offline:
      'The AI service is not configured. I can still answer from the bundled NISAR references.',
    language: 'Language',
    persona: 'Explanation style',
  },
  ar: {
    open: 'اسأل LUMEN',
    title: 'LUMEN',
    subtitle: 'مساعد علوم NISAR',
    close: 'إغلاق المساعد',
    clear: 'مسح المحادثة',
    placeholder: 'اسأل عن الرادار أو الموقع أو النقطة المحددة…',
    send: 'إرسال السؤال',
    thinking: 'LUMEN يقرأ المصادر…',
    welcome:
      'أشرح ملاحظات رادار NISAR باستخدام مصادر المهمة المحمّلة. عندما تتوفر الخريطة التفاعلية، اضغط على موقع لإرفاقه، ثم اسأل ماذا تستطيع البيانات أن تخبرك وماذا لا تستطيع.',
    noContext: 'لا توجد نقطة خريطة مرفقة',
    context: 'نقطة الخريطة',
    removeContext: 'إزالة نقطة الخريطة',
    fallback: 'إجابة محلية موثقة',
    sources: 'المصادر',
    suggestions: 'جرّب أن تسأل',
    error: 'تعذر على المساعد الإجابة. حاول مرة أخرى.',
    offline:
      'خدمة الذكاء الاصطناعي غير مهيأة. يمكنني الإجابة من مراجع NISAR المرفقة.',
    language: 'اللغة',
    persona: 'أسلوب الشرح',
  },
} as const;

function inferSite(lon: number, lat: number): SiteId | undefined {
  if (lon >= -125 && lon <= -114 && lat >= 32 && lat <= 42) return 'california';
  if (lon >= 29 && lon <= 33 && lat >= 29 && lat <= 32) return 'nile_delta';
  if (lon >= 74 && lon <= 96 && lat >= 26 && lat <= 36) return 'himalaya';
  return undefined;
}

function contextFromPoint(lon: number, lat: number): ClickContext | undefined {
  const siteId = inferSite(lon, lat);
  if (!siteId) return undefined;
  return {
    siteId,
    lon,
    lat,
    date: new Date().toISOString().slice(0, 10),
    values: {},
    polsAvailable: ['HH', 'HV'],
    datesCount: 0,
    recordDays: 0,
    siteNotes: SITE_NOTES[siteId],
    activeLayer: 'map',
  };
}

function suggestionsFor(persona: PersonaId, language: SupportedLanguage): string[] {
  if (language === 'ar') {
    return persona === 'decision_maker'
      ? ['ما أهم ما يمكن أن تخبرني به هذه النقطة؟', 'ما حدود البيانات هنا؟']
      : persona === 'student'
        ? ['اشرح الارتداد الراداري بتشبيه بسيط.', 'ما معنى الترابط؟']
        : ['ماذا يستطيع NISAR رؤيته عبر السحب؟', 'ما الفرق بين L-band وS-band؟'];
  }
  return persona === 'decision_maker'
    ? ['What is the bottom line for this point?', 'What are the data blind spots here?']
    : persona === 'student'
      ? ['Explain radar backscatter with a simple analogy.', 'What does coherence mean?']
      : ['What can NISAR see through clouds?', 'What is the difference between L-band and S-band?'];
}

function actionLabel(action: MapAction): string {
  if (action.type === 'flyTo') return `Map moved to ${action.siteId.replace('_', ' ')}`;
  if (action.type === 'setLayer') return `Layer set to ${action.layerId}`;
  if (action.type === 'setDate') return `Date set to ${action.date}`;
  return `Style changed to ${action.persona.replace('_', ' ')}`;
}

export function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [persona, setPersona] = useState<PersonaId>(DEFAULT_PERSONA_ID);
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<ClickContext | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messageSeq = useRef(0);
  const copy = COPY[language];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPersona(loadSavedPersona());
  }, []);

  useEffect(() => {
    savePersona(persona);
  }, [persona]);

  useEffect(() => {
    const onMapClick = (event: Event) => {
      const detail = (event as CustomEvent<{ lon: number; lat: number }>).detail;
      if (!detail || !Number.isFinite(detail.lon) || !Number.isFinite(detail.lat)) return;
      const next = contextFromPoint(detail.lon, detail.lat);
      if (next) {
        setContext(next);
        setOpen(true);
      }
    };
    window.addEventListener('sar:map-click', onMapClick);
    return () => window.removeEventListener('sar:map-click', onMapClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(timer);
    };
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, loading]);

  const nextMessageId = (prefix: 'u' | 'a') => {
    messageSeq.current += 1;
    return `${prefix}-${messageSeq.current}`;
  };

  const executeActions = (actions: MapAction[]) => {
    for (const action of actions) {
      if (action.type === 'flyTo') {
        window.dispatchEvent(new CustomEvent('flyToLocation', { detail: SITE_MAP[action.siteId] }));
      } else if (action.type === 'setPersona') {
        setPersona(action.persona);
      } else if (action.type === 'setLayer') {
        window.dispatchEvent(new CustomEvent('sar:set-layer', { detail: action.layerId }));
      } else if (action.type === 'setDate') {
        window.dispatchEvent(new CustomEvent('sar:set-date', { detail: action.date }));
      }
    }
    if (actions.length) setActionNote(actions.map(actionLabel).join(' · '));
  };

  const send = async (questionOverride?: string) => {
    const question = (questionOverride ?? input).trim();
    if (!question || loading) return;
    setInput('');
    setError(null);
    setActionNote(null);
    const userMessage: ChatMessage = {
      id: nextMessageId('u'),
      role: 'user',
      content: question,
    };
    setMessages((current) => [...current, userMessage]);
    setLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          persona,
          clickContext: context,
          language,
          enableActions: true,
        }),
      });
      const payload = (await response.json()) as ChatResponse & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || copy.error);
      }
      setMessages((current) => [
        ...current,
        {
          id: nextMessageId('a'),
          role: 'assistant',
          content: payload.answer,
          sources: payload.sources,
          isFallback: payload.isFallback,
        },
      ]);
      executeActions(payload.actions ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-cyan-400/40 bg-[#07111f]/95 px-4 py-3 text-sm font-semibold text-cyan-100 shadow-[0_0_35px_rgba(34,211,238,0.25)] backdrop-blur transition hover:border-cyan-300 hover:bg-[#0a1b2f]"
          aria-label={copy.open}
        >
          <Bot size={18} />
          {copy.open}
          {context && <span className="h-2 w-2 rounded-full bg-emerald-400" />}
        </button>
      )}

      {open && (
        <section
          role="dialog"
          aria-modal="false"
          aria-label={`${copy.title} — ${copy.subtitle}`}
          className="fixed bottom-4 right-4 z-50 flex max-h-[min(760px,calc(100vh-2rem))] w-[min(430px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-cyan-400/30 bg-[#06101d]/98 text-slate-100 shadow-2xl shadow-cyan-950/50 backdrop-blur-xl"
        >
          <header className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300">
                <Bot size={20} />
              </span>
              <div>
                <h2 className="text-sm font-bold tracking-wide text-white">{copy.title}</h2>
                <p className="text-[11px] text-slate-400">{copy.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMessages([])}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                aria-label={copy.clear}
                title={copy.clear}
              >
                <Trash2 size={16} />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                aria-label={copy.close}
                title={copy.close}
              >
                <X size={18} />
              </button>
            </div>
          </header>

          <div className="border-b border-white/10 px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                {copy.persona}
              </span>
              <div className="flex rounded-lg border border-white/10 p-0.5" aria-label={copy.language}>
                {(['en', 'ar'] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLanguage(code)}
                    aria-pressed={language === code}
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      language === code ? 'bg-cyan-400/20 text-cyan-200' : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    {code === 'en' ? 'EN' : 'ع'}
                  </button>
                ))}
              </div>
            </div>
            <PersonaSwitcher
              persona={persona}
              onChange={setPersona}
              language={language}
              compact
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {context && (
              <div className="mb-3 flex items-start justify-between gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-[11px] text-emerald-100">
                <span className="flex items-start gap-1.5">
                  <MapPin size={14} className="mt-0.5 shrink-0" />
                  <span>
                    <strong className="block text-emerald-200">{copy.context}</strong>
                    {context.lon.toFixed(3)}, {context.lat.toFixed(3)} · {context.siteId.replace('_', ' ')}
                    <span className="block text-emerald-200/60">
                      {context.datesCount} dates · {context.polsAvailable.join('/')}
                    </span>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setContext(undefined)}
                  className="rounded p-1 text-emerald-200/70 hover:bg-emerald-400/15 hover:text-white"
                  aria-label={copy.removeContext}
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {messages.length === 0 && (
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] p-3 text-xs leading-relaxed text-slate-300">
                <Sparkles size={15} className="mb-1.5 text-cyan-300" />
                {copy.welcome}
                <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {copy.suggestions}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {suggestionsFor(persona, language).map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void send(suggestion)}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-left text-[11px] text-slate-300 transition hover:border-cyan-400/40 hover:text-white"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 space-y-3" aria-live="polite">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={
                    message.role === 'user'
                      ? 'ml-8 rounded-xl rounded-br-sm border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-50'
                      : 'mr-2 rounded-xl rounded-bl-sm border border-white/10 bg-white/[0.04] px-3 py-2 text-xs leading-relaxed text-slate-200'
                  }
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.isFallback && (
                    <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-amber-300/80">
                      {copy.fallback}
                    </div>
                  )}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 border-t border-white/10 pt-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        {copy.sources}
                      </div>
                      <ul className="mt-1 space-y-1">
                        {message.sources.map((source) => (
                          <li key={`${message.id}-${source.citationTag}`} className="text-[10px] text-slate-400">
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-300 underline decoration-cyan-500/40 underline-offset-2 hover:text-cyan-200"
                            >
                              [{source.citationTag}] {source.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-xs text-cyan-200/80">
                  <Loader2 size={14} className="animate-spin" />
                  {copy.thinking}
                </div>
              )}
              {error && (
                <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-200">
                  {error}
                </div>
              )}
              {actionNote && (
                <div className="text-[10px] text-emerald-300/80">{actionNote}</div>
              )}
              <div ref={endRef} />
            </div>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
            className="border-t border-white/10 p-3"
          >
            <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-black/20 p-2 focus-within:border-cyan-400/50">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void send();
                  }
                }}
                rows={2}
                maxLength={1200}
                placeholder={copy.placeholder}
                className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-1 py-1 text-xs text-white outline-none placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-400 text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={copy.send}
              >
                <Send size={16} />
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-500">
              {context ? copy.context : copy.noContext} · NISAR / NASA sources
            </p>
          </form>
        </section>
      )}
    </>
  );
}

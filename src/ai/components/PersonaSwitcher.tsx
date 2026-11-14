'use client';

import { PERSONA_LIST, type PersonaDefinition } from '@/ai/personas';
import type { PersonaId, SupportedLanguage } from '@/ai/types';

interface PersonaSwitcherProps {
  persona: PersonaId;
  onChange: (persona: PersonaId) => void;
  language?: SupportedLanguage;
  compact?: boolean;
}

function labelFor(persona: PersonaDefinition, language: SupportedLanguage): string {
  return language === 'ar' ? persona.labelAr : persona.label;
}

function descriptionFor(persona: PersonaDefinition, language: SupportedLanguage): string {
  return language === 'ar' ? persona.uiDescriptionAr : persona.uiDescription;
}

export function PersonaSwitcher({
  persona,
  onChange,
  language = 'en',
  compact = false,
}: PersonaSwitcherProps) {
  return (
    <div
      className={compact ? 'grid grid-cols-2 gap-1.5' : 'grid grid-cols-2 gap-2'}
      role="group"
      aria-label={language === 'ar' ? 'اختر أسلوب الشرح' : 'Choose explanation style'}
    >
      {PERSONA_LIST.map((item) => {
        const active = item.id === persona;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={active}
            title={descriptionFor(item, language)}
            onClick={() => onChange(item.id)}
            className={[
              'text-left rounded-lg border px-2.5 py-2 transition-colors',
              compact ? 'text-[11px]' : 'text-xs',
              active
                ? 'border-cyan-400/70 bg-cyan-400/15 text-cyan-100'
                : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-cyan-400/40 hover:text-white',
            ].join(' ')}
          >
            <span className="block font-semibold">{labelFor(item, language)}</span>
            {!compact && (
              <span className="mt-0.5 block text-[10px] leading-snug text-slate-400">
                {descriptionFor(item, language)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

'use client';

import { PersonaSwitcher } from '@/ai/components/PersonaSwitcher';
import type { PersonaId, SupportedLanguage } from '@/ai/types';

interface PersonaToggleProps {
  persona: PersonaId;
  onChange: (persona: PersonaId) => void;
  language?: SupportedLanguage;
}

/** Compact persona selector used by the chat header and map sidebars. */
export function PersonaToggle({ persona, onChange, language = 'en' }: PersonaToggleProps) {
  return (
    <PersonaSwitcher
      persona={persona}
      onChange={onChange}
      language={language}
      compact
    />
  );
}

export default PersonaToggle;

'use client';

import type { Language } from '../types';

export function LanguageToggle({
  language,
  onChange,
}: {
  language: Language;
  onChange: (language: Language) => void;
}) {
  return (
    <div className="language-toggle" role="group" aria-label="Language">
      <button
        type="button"
        className={`language-toggle__option ${language === 'en' ? 'is-active' : ''}`}
        aria-pressed={language === 'en'}
        onClick={() => onChange('en')}
      >
        EN
      </button>
      <button
        type="button"
        className={`language-toggle__option ${language === 'ar' ? 'is-active' : ''}`}
        aria-pressed={language === 'ar'}
        onClick={() => onChange('ar')}
      >
        ع
      </button>
    </div>
  );
}

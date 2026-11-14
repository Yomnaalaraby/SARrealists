'use client';

import { useEffect, useRef } from 'react';
import { PixelSprite } from '../art/PixelSprite';
import { getLensSprite } from '../art/sprites';
import { localize } from '../content';
import { t } from '../i18n';
import type { Language, Lens } from '../types';
import { PixelButton } from './ui';

export function LensCodex({
  lenses,
  language,
  open,
  onClose,
}: {
  lenses: Lens[];
  language: Language;
  open: boolean;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="codex-backdrop" role="presentation" onClick={onClose}>
      <section
        className="codex"
        role="dialog"
        aria-modal="true"
        aria-labelledby="codex-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="codex__header">
          <div>
            <p className="pixel-eyebrow">{t(language, 'codexHelp')}</p>
            <h2 id="codex-title">{t(language, 'codex')}</h2>
          </div>
          <PixelButton ref={closeRef} variant="ghost" onClick={onClose} aria-label={t(language, 'close')}>
            ×
          </PixelButton>
        </header>
        <div className="codex__list">
          {lenses.map((lens) => (
            <article className="codex__item" key={lens.id}>
              <PixelSprite sprite={getLensSprite(lens.id)} scale={3} />
              <div>
                <h3>{localize(lens.name, language)}</h3>
                <p><strong>{t(language, 'measures')}:</strong> {localize(lens.measures, language)}</p>
                <p><strong>{t(language, 'teaches')}:</strong> {localize(lens.teaches, language)}</p>
                <p><strong>{t(language, 'lensLimits')}:</strong> {localize(lens.limits, language)}</p>
                <a href={lens.source.url} target="_blank" rel="noreferrer">
                  {lens.source.title}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

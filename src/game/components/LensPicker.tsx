'use client';

import { useState } from 'react';
import { PixelSprite } from '../art/PixelSprite';
import { getLensSprite } from '../art/sprites';
import { localize } from '../content';
import { t } from '../i18n';
import type { Language, Lens, LensId } from '../types';
import { PixelButton, PixelPanel, SectionHeading } from './ui';

export function LensPicker({
  lenses,
  picked,
  language,
  onToggle,
  onConfirm,
  onOpenCodex,
}: {
  lenses: Lens[];
  picked: LensId[];
  language: Language;
  onToggle: (lensId: LensId) => void;
  onConfirm: () => void;
  onOpenCodex: () => void;
}) {
  const [focused, setFocused] = useState<LensId>(lenses[0]?.id ?? 'brightness');
  const focusedLens = lenses.find((lens) => lens.id === focused) ?? lenses[0];
  const full = picked.length >= 2;

  return (
    <section className="phase phase--picker" aria-labelledby="picker-title">
      <PixelPanel className="phase__panel">
        <SectionHeading eyebrow={t(language, 'lensResults')} title={t(language, 'chooseLenses')}>
          {t(language, 'chooseHelp')}
        </SectionHeading>

        <div className="picker-status">
          <span className="picker-status__count">{t(language, 'selected', { count: picked.length })}</span>
          <PixelButton variant="ghost" onClick={onOpenCodex}>
            {t(language, 'codex')}
          </PixelButton>
        </div>

        <div className="lens-grid" role="group" aria-label={t(language, 'chooseLenses')}>
          {lenses.map((lens) => {
            const selected = picked.includes(lens.id);
            const disabled = full && !selected;
            return (
              <button
                type="button"
                key={lens.id}
                className={`lens-card ${selected ? 'is-selected' : ''}`}
                aria-pressed={selected}
                aria-disabled={disabled}
                onClick={() => {
                  if (!disabled) {
                    onToggle(lens.id);
                  }
                }}
                onFocus={() => setFocused(lens.id)}
              >
                <PixelSprite sprite={getLensSprite(lens.id)} scale={3} />
                <span className="lens-card__name">{localize(lens.name, language)}</span>
                <span className="lens-card__measure">{localize(lens.measures, language)}</span>
                <span className="lens-card__check" aria-hidden="true">
                  {selected ? '■' : '□'}
                </span>
              </button>
            );
          })}
        </div>

        {focusedLens ? (
          <aside className="lens-focus" aria-live="polite">
            <h3>{localize(focusedLens.name, language)}</h3>
            <p>
              <strong>{t(language, 'measures')}:</strong> {localize(focusedLens.measures, language)}
            </p>
            <p>
              <strong>{t(language, 'teaches')}:</strong> {localize(focusedLens.teaches, language)}
            </p>
            <p>
              <strong>{t(language, 'lensLimits')}:</strong> {localize(focusedLens.limits, language)}
            </p>
          </aside>
        ) : null}

        <div className="phase__actions">
          <PixelButton onClick={onConfirm} disabled={picked.length !== 2}>
            {t(language, 'confirmLenses')}
          </PixelButton>
        </div>
      </PixelPanel>
    </section>
  );
}

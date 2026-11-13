'use client';

import { useState } from 'react';
import { PixelCanvas } from '../art/PixelCanvas';
import { localize } from '../content';
import { t } from '../i18n';
import type { Language, Mission, Reveal } from '../types';
import { PixelBadge, PixelButton, PixelPanel, SectionHeading } from './ui';

export function EarthReveal({
  reveal,
  missions,
  language,
  onContinue,
}: {
  reveal: Reveal;
  missions: Mission[];
  language: Language;
  onContinue: () => void;
}) {
  const [index, setIndex] = useState(0);
  const beat = reveal.beats[index];
  const isLast = index >= reveal.beats.length - 1;
  const showPlaces = index >= 1;

  return (
    <section className="phase phase--reveal" aria-labelledby="reveal-title">
      <div className="phase__art phase__art--earth">
        <PixelCanvas scene="earth" seed="earth-reveal" label={t(language, 'revealTitle')} />
      </div>
      <PixelPanel className="phase__panel">
        <SectionHeading eyebrow={t(language, 'gameTitle')} title={t(language, 'revealTitle')}>
          {t(language, 'gameSubtitle')}
        </SectionHeading>

        <div className="reveal-beat" aria-live="polite">
          <p className="pixel-eyebrow">{String(index + 1).padStart(2, '0')} / {String(reveal.beats.length).padStart(2, '0')}</p>
          <p className="phase__body phase__body--large">{localize(beat.text, language)}</p>
          {beat.source ? (
            <a href={beat.source.url} target="_blank" rel="noreferrer">
              {beat.source.title}
            </a>
          ) : null}
        </div>

        {showPlaces ? (
          <div className="place-list">
            {missions.map((mission) => {
              const place = reveal.places[mission.id];
              if (!place) {
                return null;
              }
              return (
                <article className="place-card" key={mission.id}>
                  <span className="place-card__alias">{mission.alias}</span>
                  <span aria-hidden="true">→</span>
                  <strong>{localize(place.name, language)}</strong>
                </article>
              );
            })}
          </div>
        ) : null}

        {isLast ? (
          <>
            <p className="closing-line">{localize(reveal.closingLine, language)}</p>
            <div className="badge-row">
              <PixelBadge tone="cyan">{t(language, 'closing')}</PixelBadge>
            </div>
          </>
        ) : null}

        <div className="phase__actions">
          {isLast ? (
            <PixelButton onClick={onContinue}>{t(language, 'revealContinue')}</PixelButton>
          ) : (
            <PixelButton onClick={() => setIndex((current) => current + 1)}>{t(language, 'next')}</PixelButton>
          )}
        </div>
      </PixelPanel>
    </section>
  );
}

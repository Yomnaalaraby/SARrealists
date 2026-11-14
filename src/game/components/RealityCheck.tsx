'use client';

import { localize } from '../content';
import { t } from '../i18n';
import type { Language, Lens, LensId, Mission } from '../types';
import { PixelBadge, PixelButton, PixelPanel, SectionHeading, StatusBadge } from './ui';

export function RealityCheck({
  mission,
  picked,
  lenses,
  language,
  onContinue,
  isLast,
}: {
  mission: Mission;
  picked: LensId[];
  lenses: Lens[];
  language: Language;
  onContinue: () => void;
  isLast: boolean;
}) {
  const check = mission.realityCheck;
  return (
    <section className="phase phase--reality" aria-labelledby="reality-title">
      <PixelPanel className="phase__panel">
        <SectionHeading eyebrow={mission.alias} title={t(language, 'realityTitle')}>
          {t(language, 'explain')}
        </SectionHeading>

        <div className="reality-grid">
          <article>
            <h3>{t(language, 'explain')}</h3>
            <p>{localize(check.explain, language)}</p>
          </article>
          <article>
            <h3>{t(language, 'limits')}</h3>
            <p>{localize(check.limits, language)}</p>
          </article>
          <article>
            <h3>{t(language, 'benefit')}</h3>
            <p>{localize(check.benefit, language)}</p>
          </article>
        </div>

        <p className="source-line">
          <strong>{t(language, 'source')}:</strong>{' '}
          <a href={check.source.url} target="_blank" rel="noreferrer">
            {check.source.title}
          </a>
        </p>

        <h3 className="contact-title">{t(language, 'rightLenses')}</h3>
        <div className="contact-sheet">
          {lenses.map((lens) => {
            const result = mission.lensResults[lens.id];
            const chosen = picked.includes(lens.id);
            return (
              <article className={`contact-tile ${chosen ? 'is-chosen' : ''}`} key={lens.id}>
                <div className="contact-tile__top">
                  <strong>{localize(lens.name, language)}</strong>
                  {chosen ? <PixelBadge tone="accent">{t(language, 'chosen')}</PixelBadge> : null}
                </div>
                {result ? (
                  <>
                    <StatusBadge status={result.status} label={t(language, result.status)} />
                    <p>{localize(result.caption, language)}</p>
                  </>
                ) : (
                  <p className="muted">{t(language, 'noSignal')}</p>
                )}
              </article>
            );
          })}
        </div>

        <div className="phase__actions">
          <PixelButton onClick={onContinue}>
            {isLast ? t(language, 'finishMission') : t(language, 'nextMission')}
          </PixelButton>
        </div>
      </PixelPanel>
    </section>
  );
}

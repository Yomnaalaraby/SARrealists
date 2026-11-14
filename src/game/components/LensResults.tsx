'use client';

import { localize } from '../content';
import { t } from '../i18n';
import type { Language, Lens, LensId, Mission } from '../types';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { ChartVisual } from './ChartVisual';
import { PixelBadge, PixelButton, PixelPanel, SectionHeading, StatusBadge } from './ui';

function statusLabel(language: Language, status: 'clear' | 'weak' | 'blind'): string {
  return t(language, status);
}

export function LensResults({
  mission,
  picked,
  lenses,
  language,
  onContinue,
  onOpenCodex,
}: {
  mission: Mission;
  picked: LensId[];
  lenses: Lens[];
  language: Language;
  onContinue: () => void;
  onOpenCodex: () => void;
}) {
  return (
    <section className="phase phase--results" aria-labelledby="results-title">
      <PixelPanel className="phase__panel">
        <SectionHeading eyebrow={mission.alias} title={t(language, 'lensResults')}>
          {t(language, 'dates')}: {mission.data.dates.join(' · ')} · {t(language, 'track')} {mission.data.track} {mission.data.direction}
        </SectionHeading>

        <div className="results-list">
          {picked.map((lensId) => {
            const lens = lenses.find((entry) => entry.id === lensId);
            if (!lens) {
              return null;
            }
            const result = mission.lensResults[lensId];
            return (
              <article className="result-card" key={lensId}>
                <header className="result-card__header">
                  <div>
                    <p className="pixel-eyebrow">{localize(lens.name, language)}</p>
                    <h3>{result ? localize(result.caption, language) : t(language, 'noSignal')}</h3>
                  </div>
                  {result ? (
                    <StatusBadge status={result.status} label={statusLabel(language, result.status)} />
                  ) : (
                    <StatusBadge status="blind" label={t(language, 'noSignal')} />
                  )}
                </header>

                {result?.visual ? (
                  result.visual.kind === 'pair' ? (
                    <BeforeAfterSlider
                      images={result.visual.images}
                      labels={result.visual.labels}
                      alt={result.visual.alt}
                      language={language}
                    />
                  ) : result.visual.kind === 'single' ? (
                    <figure className="single-visual">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/${result.visual.images[0]}`}
                        alt={localize(result.visual.alt, language)}
                        width={160}
                        height={90}
                        loading="lazy"
                      />
                      <figcaption>{localize(result.visual.alt, language)}</figcaption>
                    </figure>
                  ) : (
                    <ChartVisual
                      series={result.visual.series}
                      language={language}
                      alt={localize(result.visual.alt, language)}
                    />
                  )
                ) : (
                  <p className="result-card__empty">{t(language, 'noSignal')}</p>
                )}

                <footer className="result-card__meta">
                  <PixelBadge tone="danger">{t(language, 'placeholderData')}</PixelBadge>
                  <PixelBadge>{t(language, 'illustration')}</PixelBadge>
                  <PixelBadge tone="cyan">
                    {t(language, 'pixelSize')}: {mission.data.pixelMeters} {t(language, 'meters')}
                  </PixelBadge>
                </footer>
              </article>
            );
          })}
        </div>

        <div className="phase__actions">
          <PixelButton variant="ghost" onClick={onOpenCodex}>
            {t(language, 'codex')}
          </PixelButton>
          <PixelButton onClick={onContinue}>{t(language, 'decisionTitle')}</PixelButton>
        </div>
      </PixelPanel>
    </section>
  );
}

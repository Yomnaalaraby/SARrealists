'use client';

import { getCrewMember, localize } from '../content';
import { t } from '../i18n';
import type { DecisionRecord, Language, Mission, Story } from '../types';
import { PixelBadge, PixelButton, PixelPanel, SectionHeading } from './ui';

const QUALITY_LABEL = {
  strong: 'qualityStrong',
  partial: 'qualityPartial',
  blind: 'qualityBlind',
} as const;

export function OutcomePanel({
  mission,
  record,
  story,
  language,
  onContinue,
}: {
  mission: Mission;
  record: DecisionRecord;
  story: Story;
  language: Language;
  onContinue: () => void;
}) {
  const outcome = mission.outcomes[record.quality][record.decision];
  const injuredNames = outcome.injuredRoles.map((role) =>
    localize(getCrewMember(story, role).name, language),
  );

  return (
    <section className="phase phase--outcome" aria-labelledby="outcome-title">
      <PixelPanel className="phase__panel">
        <SectionHeading
          eyebrow={`${mission.alias} · ${t(language, 'missionComplete')}`}
          title={t(language, 'outcome')}
        >
          {t(language, 'whyQuality', { quality: t(language, QUALITY_LABEL[record.quality]) })}
        </SectionHeading>

        <div className="badge-row">
          <PixelBadge tone={record.quality === 'strong' ? 'success' : record.quality === 'partial' ? 'accent' : 'danger'}>
            {t(language, QUALITY_LABEL[record.quality])}
          </PixelBadge>
          <PixelBadge>{t(language, record.decision)}</PixelBadge>
          {record.usedHint ? <PixelBadge tone="cyan">{t(language, 'usedHint')}</PixelBadge> : null}
        </div>

        <p className="phase__body phase__body--large">{localize(outcome.text, language)}</p>
        {outcome.followUp ? <p className="phase__body">{localize(outcome.followUp, language)}</p> : null}

        {record.pickedMisleading ? (
          <p className="warning-note" role="alert">
            {t(language, 'misleadingWarning')}
          </p>
        ) : null}

        <div className={`injury-box ${outcome.injuredRoles.length > 0 ? 'is-danger' : 'is-safe'}`}>
          <h3>{t(language, 'injured')}</h3>
          {injuredNames.length > 0 ? (
            <ul>
              {injuredNames.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          ) : (
            <p>{t(language, 'noInjuries')}</p>
          )}
        </div>

        <div className="phase__actions">
          <PixelButton onClick={onContinue}>{t(language, 'realityTitle')}</PixelButton>
        </div>
      </PixelPanel>
    </section>
  );
}

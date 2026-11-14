'use client';

import { useState } from 'react';
import { PixelCanvas } from '../art/PixelCanvas';
import { getCrewMember, localize } from '../content';
import { t } from '../i18n';
import type { CrewInjuryMap, Language, Mission, Role, Story } from '../types';
import { CrewBar } from './CrewBar';
import { DialogueScene } from './DialogueScene';
import { PixelBadge, PixelButton, PixelPanel, SectionHeading } from './ui';

export function Briefing({
  mission,
  missionIndex,
  missionCount,
  story,
  crew,
  language,
  scene,
  consultedRole,
  onConsult,
  onContinue,
}: {
  mission: Mission;
  missionIndex: number;
  missionCount: number;
  story: Story;
  crew: CrewInjuryMap;
  language: Language;
  scene: 'smoke' | 'ice' | 'delta' | 'coast';
  consultedRole?: Role;
  onConsult: (role: Role) => void;
  onContinue: () => void;
}) {
  const [dialogueDone, setDialogueDone] = useState(false);
  const hint = consultedRole ? mission.crewHints[consultedRole] : undefined;
  const consulted = consultedRole ? getCrewMember(story, consultedRole) : undefined;

  if (!dialogueDone) {
    return (
      <section className="phase phase--briefing" aria-labelledby="briefing-title">
        <div className="phase__art">
          <PixelCanvas
            scene={scene}
            seed={mission.id}
            label={`${mission.alias}: ${localize(mission.title, language)}`}
          />
        </div>
        <PixelPanel className="phase__panel">
          <DialogueScene
            lines={mission.dialogue}
            story={story}
            language={language}
            title={localize(mission.title, language)}
            continueLabel={t(language, 'briefCrew')}
            onComplete={() => setDialogueDone(true)}
          />
        </PixelPanel>
      </section>
    );
  }

  return (
    <section className="phase phase--briefing" aria-labelledby="briefing-title">
      <div className="phase__art">
        <PixelCanvas
          scene={scene}
          seed={mission.id}
          label={`${mission.alias}: ${localize(mission.title, language)}`}
        />
      </div>
      <PixelPanel className="phase__panel">
        <SectionHeading
          eyebrow={`${t(language, 'missionLabel')} ${missionIndex + 1} ${t(language, 'of')} ${missionCount} · ${mission.alias}`}
          title={localize(mission.title, language)}
        >
          {t(language, 'briefing')}
        </SectionHeading>

        <div className="badge-row">
          <PixelBadge tone="accent">{t(language, 'passesBefore', { count: mission.data.passes })}</PixelBadge>
          <PixelBadge>{t(language, 'baseline')}: {mission.data.baselineDays} {t(language, 'days')}</PixelBadge>
          <PixelBadge tone="cyan">{t(language, 'confidence')}: {t(language, mission.data.confidence)}</PixelBadge>
        </div>

        <dl className="data-grid">
          <div>
            <dt>{t(language, 'dates')}</dt>
            <dd>{mission.data.dates.join(' · ')}</dd>
          </div>
          <div>
            <dt>{t(language, 'track')}</dt>
            <dd>{mission.data.track} · {mission.data.direction}</dd>
          </div>
          <div>
            <dt>{t(language, 'pixelSize')}</dt>
            <dd>{mission.data.pixelMeters} {t(language, 'meters')}</dd>
          </div>
        </dl>

        <div className="consult-block">
          <h3>{t(language, 'consultTitle')}</h3>
          <p className="pixel-subtitle">{t(language, 'consultHelp')}</p>
          <CrewBar
            story={story}
            crew={crew}
            language={language}
            consultedRole={consultedRole}
            onConsult={onConsult}
            availableHints={mission.crewHints}
          />
          {hint && consulted ? (
            <div className="consult-hint" role="status">
              <strong>{localize(consulted.name, language)}</strong>
              <p>{localize(hint.text, language)}</p>
            </div>
          ) : null}
        </div>

        <div className="phase__actions">
          <PixelButton onClick={onContinue}>{t(language, 'chooseLenses')}</PixelButton>
        </div>
      </PixelPanel>
    </section>
  );
}

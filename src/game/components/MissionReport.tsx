'use client';

import { getCrewMember, localize } from '../content';
import { t } from '../i18n';
import type {
  DecisionRecord,
  Language,
  Mission,
  MissionReport as MissionReportType,
  Reveal,
  Story,
} from '../types';
import { PixelButton, PixelPanel, SectionHeading } from './ui';

const QUALITY_LABEL = {
  strong: 'qualityStrong',
  partial: 'qualityPartial',
  blind: 'qualityBlind',
} as const;

const DATA_ANALYSIS_SITES: Record<string, string> = {
  california: 'california',
  himalaya: 'himalayas',
  nile_delta: 'nile',
};

export function MissionReport({
  report,
  story,
  missions,
  reveal,
  decisions,
  language,
  onReplay,
}: {
  report: MissionReportType;
  story: Story;
  missions: Mission[];
  reveal: Reveal;
  decisions: DecisionRecord[];
  language: Language;
  onReplay: () => void;
}) {
  const ending = story.endings.find((entry) => entry.id === report.endingId) ?? story.endings[0];
  const lastDecision = decisions[decisions.length - 1];
  const lastPlace = lastDecision ? reveal.places[lastDecision.missionId] : undefined;
  const siteRoute = lastPlace
    ? DATA_ANALYSIS_SITES[lastPlace.siteId] ?? lastPlace.siteId
    : null;
  const route = lastPlace && siteRoute
    ? reveal.callToAction.route
        .replaceAll('{siteId}', siteRoute)
        .replaceAll('{lon}', String(lastPlace.lon))
        .replaceAll('{lat}', String(lastPlace.lat))
        .replaceAll('{zoom}', String(lastPlace.zoom))
        .replaceAll('{lenses}', lastDecision?.pickedLenses.join(',') ?? '')
    : '/data-analysis';

  return (
    <section className="phase phase--report" aria-labelledby="report-title">
      <PixelPanel className="phase__panel report">
        <SectionHeading eyebrow={t(language, 'reportSubtitle')} title={t(language, 'reportTitle')}>
          {ending ? localize(ending.title, language) : ''}
        </SectionHeading>

        <div className="report-stats">
          <div>
            <span>{t(language, 'healthyCrew')}</span>
            <strong>{report.healthyCrew} / 8</strong>
          </div>
          <div>
            <span>{t(language, 'bestDecisions')}</span>
            <strong>{report.bestDecisions} / {report.totalMissions}</strong>
          </div>
          <div>
            <span>{t(language, 'score')}</span>
            <strong>{report.score}</strong>
          </div>
        </div>

        {ending ? <p className="phase__body phase__body--large">{localize(ending.text, language)}</p> : null}

        {report.injuredRoles.length > 0 ? (
          <div className="injury-box is-danger">
            <h3>{t(language, 'injuredCrew')}</h3>
            <ul>
              {report.injuredRoles.map((role) => (
                <li key={role}>{localize(getCrewMember(story, role).name, language)}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <h3 className="contact-title">{t(language, 'progress')}</h3>
        <ol className="decision-log">
          {decisions.map((record) => {
            const mission = missions.find((entry) => entry.id === record.missionId);
            if (!mission) {
              return null;
            }
            return (
              <li key={record.missionId}>
                <div>
                  <strong>{localize(mission.title, language)}</strong>
                  <span>{t(language, record.decision)} · {t(language, QUALITY_LABEL[record.quality])}</span>
                </div>
                <div className="decision-log__meta">
                  {record.pickedLenses.join(' + ')}
                  {record.injuredRoles.length > 0 ? ` · ${record.injuredRoles.length} ${t(language, 'injured')}` : ''}
                </div>
              </li>
            );
          })}
        </ol>

        <div className="phase__actions">
          <PixelButton variant="ghost" onClick={onReplay}>{t(language, 'replay')}</PixelButton>
          <a className="pixel-button pixel-button--primary" href={route}>
            {localize(reveal.callToAction.label, language)}
          </a>
        </div>
        <p className="muted">{t(language, 'mapHint')}</p>
      </PixelPanel>
    </section>
  );
}

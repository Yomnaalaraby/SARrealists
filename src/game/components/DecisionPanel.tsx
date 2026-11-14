'use client';

import { t } from '../i18n';
import type { Decision, Language, Mission } from '../types';
import { PixelButton, PixelPanel, SectionHeading } from './ui';

const DECISION_ORDER: Decision[] = ['go', 'delay', 'reroute'];
const DECISION_HINT = {
  go: 'goHint',
  delay: 'delayHint',
  reroute: 'rerouteHint',
} as const;

export function DecisionPanel({
  mission,
  language,
  onDecide,
}: {
  mission: Mission;
  language: Language;
  onDecide: (decision: Decision) => void;
}) {
  return (
    <section className="phase phase--decision" aria-labelledby="decision-title">
      <PixelPanel className="phase__panel">
        <SectionHeading eyebrow={mission.alias} title={t(language, 'decisionTitle')}>
          {t(language, 'decisionHelp')}
        </SectionHeading>
        <div className="decision-grid">
          {DECISION_ORDER.filter((decision) => mission.decisions.includes(decision)).map((decision) => (
            <article className="decision-card" key={decision}>
              <h3>{t(language, decision)}</h3>
              <p>{t(language, DECISION_HINT[decision])}</p>
              <PixelButton
                variant={decision === 'go' ? 'danger' : decision === 'delay' ? 'secondary' : 'primary'}
                onClick={() => onDecide(decision)}
              >
                {t(language, decision)}
              </PixelButton>
            </article>
          ))}
        </div>
      </PixelPanel>
    </section>
  );
}

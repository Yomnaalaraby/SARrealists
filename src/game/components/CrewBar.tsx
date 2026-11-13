'use client';

import { CREW_ACCENTS } from '../art/sprites';
import { getCrewMember, localize } from '../content';
import { t } from '../i18n';
import { ROLES, type CrewInjuryMap, type Language, type Role, type Story } from '../types';

const SKIN = ['#e8b98a', '#c98d5a', '#8d5a3b', '#f0c9a0', '#a86b45', '#d9a06e', '#b97a50', '#efbd92'];
const HAIR = ['#3b2a20', '#20263a', '#5a3b2a', '#111118', '#6b4a2b', '#2b2118', '#4a3325', '#1b1b22'];

function CrewAvatar({ role, index, injured }: { role: Role; index: number; injured: boolean }) {
  const accent = CREW_ACCENTS[role] ?? '#ffd166';
  return (
    <svg
      viewBox="0 0 24 30"
      width="48"
      height="60"
      role="img"
      aria-hidden="true"
      style={{ opacity: injured ? 0.55 : 1, filter: injured ? 'grayscale(0.75)' : undefined }}
    >
      <rect x="4" y="2" width="16" height="6" fill={HAIR[index % HAIR.length]} />
      <rect x="5" y="6" width="14" height="8" fill={SKIN[index % SKIN.length]} />
      <rect x="7" y="9" width="2" height="2" fill="#101018" />
      <rect x="15" y="9" width="2" height="2" fill="#101018" />
      <rect x="10" y="12" width="4" height="1" fill="#8c3b3b" />
      <rect x="4" y="14" width="16" height="10" fill="#3b4a63" />
      <rect x="10" y="14" width="4" height="5" fill={accent} />
      <rect x="2" y="15" width="3" height="7" fill={SKIN[index % SKIN.length]} />
      <rect x="19" y="15" width="3" height="7" fill={SKIN[index % SKIN.length]} />
      <rect x="6" y="24" width="5" height="5" fill="#20263a" />
      <rect x="13" y="24" width="5" height="5" fill="#20263a" />
      {injured ? (
        <g>
          <rect x="14" y="4" width="7" height="3" fill="#f2e9d8" transform="rotate(35 17 5)" />
          <rect x="16" y="2" width="3" height="7" fill="#f2e9d8" transform="rotate(35 17 5)" />
          <rect x="16.5" y="4" width="2" height="3" fill="#ff5c5c" transform="rotate(35 17 5)" />
        </g>
      ) : null}
    </svg>
  );
}

interface CrewBarProps {
  story: Story;
  crew: CrewInjuryMap;
  language: Language;
  consultedRole?: Role;
  onConsult?: (role: Role) => void;
  availableHints?: Partial<Record<Role, unknown>>;
}

export function CrewBar({
  story,
  crew,
  language,
  consultedRole,
  onConsult,
  availableHints,
}: CrewBarProps) {
  return (
    <div className="crew-bar" aria-label={t(language, 'healthyCrew')}>
      {ROLES.map((role, index) => {
        const member = getCrewMember(story, role);
        const injured = crew[role] === true;
        const canConsult = Boolean(onConsult && !injured && availableHints?.[role]);
        const isConsulted = consultedRole === role;
        return (
          <div
            key={role}
            className={`crew-card ${injured ? 'is-injured' : ''} ${isConsulted ? 'is-consulted' : ''}`}
          >
            <CrewAvatar role={role} index={index} injured={injured} />
            <div className="crew-card__text">
              <strong>{localize(member.name, language)}</strong>
              <span>{localize(member.title, language)}</span>
              {injured ? (
                <em className="crew-card__injury">
                  {t(language, 'unavailable')}
                </em>
              ) : null}
            </div>
            {onConsult ? (
              <button
                type="button"
                className="crew-card__consult"
                disabled={!canConsult}
                aria-pressed={isConsulted}
                onClick={() => onConsult(role)}
              >
                {isConsulted
                  ? t(language, 'consulted')
                  : injured
                    ? t(language, 'unavailable')
                    : canConsult
                      ? t(language, 'consultTitle')
                      : t(language, 'noHint')}
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

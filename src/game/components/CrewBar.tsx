'use client';

import { getCrewMember, localize } from '../content';
import { t } from '../i18n';
import { ROLES, type CrewInjuryMap, type Language, type Role, type Story } from '../types';
import { CrewAvatar } from './CrewPortrait';

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

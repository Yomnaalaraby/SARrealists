'use client';

import { CREW_ACCENTS } from '../art/sprites';
import { ROLES, type DialogueSpeaker, type Role } from '../types';

const SKIN = ['#e8b98a', '#c98d5a', '#8d5a3b', '#f0c9a0', '#a86b45', '#d9a06e', '#b97a50', '#efbd92'];
const HAIR = ['#3b2a20', '#20263a', '#5a3b2a', '#111118', '#6b4a2b', '#2b2118', '#4a3325', '#1b1b22'];

export function CrewAvatar({
  role,
  index,
  injured,
  size = 48,
}: {
  role: Role;
  index: number;
  injured: boolean;
  size?: number;
}) {
  const accent = CREW_ACCENTS[role] ?? '#ffd166';
  return (
    <svg
      viewBox="0 0 24 30"
      width={size}
      height={size * 1.25}
      preserveAspectRatio="none"
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

function CaptainPortrait({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 32 40" width={size} height={size * 1.25} preserveAspectRatio="none" role="img" aria-hidden="true">
      <rect x="5" y="3" width="22" height="7" fill="#f2c14e" />
      <rect x="7" y="5" width="18" height="3" fill="#1b2438" />
      <rect x="8" y="10" width="16" height="9" fill="#c98d5a" />
      <rect x="10" y="13" width="3" height="2" fill="#101018" />
      <rect x="19" y="13" width="3" height="2" fill="#101018" />
      <rect x="13" y="17" width="6" height="1" fill="#7d3030" />
      <rect x="6" y="20" width="20" height="13" fill="#25324a" />
      <rect x="13" y="20" width="6" height="7" fill="#f2c14e" />
      <rect x="14" y="22" width="4" height="2" fill="#101018" />
      <rect x="3" y="22" width="4" height="8" fill="#c98d5a" />
      <rect x="25" y="22" width="4" height="8" fill="#c98d5a" />
      <rect x="9" y="33" width="6" height="5" fill="#141b2a" />
      <rect x="17" y="33" width="6" height="5" fill="#141b2a" />
    </svg>
  );
}

function AiPortrait({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 32 40" width={size} height={size * 1.25} preserveAspectRatio="none" role="img" aria-hidden="true">
      <rect x="14" y="1" width="4" height="5" fill="#7de2d1" />
      <rect x="4" y="6" width="24" height="24" rx="2" fill="#17283a" />
      <rect x="7" y="9" width="18" height="18" rx="1" fill="#0c1520" />
      <rect x="10" y="14" width="12" height="3" fill="#7de2d1" />
      <rect x="12" y="19" width="8" height="2" fill="#3aa69a" />
      <rect x="7" y="30" width="18" height="3" fill="#253b52" />
      <rect x="10" y="33" width="4" height="5" fill="#253b52" />
      <rect x="18" y="33" width="4" height="5" fill="#253b52" />
    </svg>
  );
}

export function CrewPortrait({
  speaker,
  injured = false,
  size = 96,
}: {
  speaker: DialogueSpeaker;
  injured?: boolean;
  size?: number;
}) {
  if (speaker === 'captain') {
    return <CaptainPortrait size={size} />;
  }
  if (speaker === 'ai') {
    return <AiPortrait size={size} />;
  }
  const role = speaker as Role;
  return <CrewAvatar role={role} index={ROLES.indexOf(role)} injured={injured} size={size} />;
}

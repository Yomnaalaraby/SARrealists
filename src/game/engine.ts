import {
  DECISIONS,
  ROLES,
  type CrewInjuryMap,
  type Decision,
  type Ending,
  type EndingStats,
  type GameContent,
  type GameState,
  type LensId,
  type Mission,
  type MissionReport,
  type Outcome,
  type QualityTier,
  type Relevance,
  type Role,
} from './types';

export function createHealthyCrew(): CrewInjuryMap {
  return Object.fromEntries(ROLES.map((role) => [role, false])) as CrewInjuryMap;
}

export function isCrewAvailable(crew: CrewInjuryMap, role: Role): boolean {
  return crew[role] !== true;
}

export function healthyCrewCount(crew: CrewInjuryMap): number {
  return ROLES.filter((role) => crew[role] !== true).length;
}

export function injuredRoles(crew: CrewInjuryMap): Role[] {
  return ROLES.filter((role) => crew[role] === true);
}

/**
 * Quality is intentionally a pure, authored mapping:
 * - strong: two essential lenses, or one essential + one helpful
 * - partial: exactly one essential or helpful lens
 * - blind: anything else (including two helpful lenses)
 *
 * Two helpful lenses are deliberately not strong: the mission needs a lens
 * that answers the core hazard question, not two nice-to-haves.
 */
export function qualityTier(
  relevance: Partial<Record<LensId, Relevance>>,
  picked: LensId[],
): QualityTier {
  if (picked.length !== 2) {
    throw new Error(`qualityTier expects exactly 2 lenses, received ${picked.length}`);
  }
  if (new Set(picked).size !== 2) {
    throw new Error('qualityTier expects two different lenses');
  }

  const values = picked.map((lensId) => relevance[lensId] ?? 'irrelevant');
  const essentialCount = values.filter((value) => value === 'essential').length;
  const helpfulCount = values.filter((value) => value === 'helpful').length;

  if (essentialCount === 2 || (essentialCount >= 1 && helpfulCount >= 1)) {
    return 'strong';
  }
  if (essentialCount + helpfulCount === 1) {
    return 'partial';
  }
  return 'blind';
}

export function pickedMisleadingLens(
  relevance: Partial<Record<LensId, Relevance>>,
  picked: LensId[],
): boolean {
  return picked.some((lensId) => relevance[lensId] === 'misleading');
}

export function resolveOutcome(
  mission: Mission,
  tier: QualityTier,
  decision: Decision,
): Outcome {
  const outcome = mission.outcomes[tier]?.[decision];
  if (!outcome) {
    throw new Error(`No outcome for mission ${mission.id}, tier ${tier}, decision ${decision}`);
  }
  return outcome;
}

export function applyInjuries(crew: CrewInjuryMap, roles: Role[]): CrewInjuryMap {
  const next: CrewInjuryMap = { ...crew };
  for (const role of roles) {
    if (ROLES.includes(role)) {
      next[role] = true;
    }
  }
  return next;
}

export function isBestDecision(mission: Mission, decision: Decision): boolean {
  return mission.bestDecision === decision;
}

export function selectEnding(endings: Ending[], stats: EndingStats): Ending {
  if (endings.length === 0) {
    throw new Error('selectEnding requires at least one ending');
  }
  const ranked = [...endings].sort(
    (a, b) => b.minHealthy - a.minHealthy || b.minBestDecisions - a.minBestDecisions,
  );
  const match = ranked.find(
    (ending) =>
      stats.healthy >= ending.minHealthy && stats.bestDecisions >= ending.minBestDecisions,
  );
  return match ?? ranked[ranked.length - 1];
}

export function countBestDecisions(content: GameContent, decisions: GameState['decisions']): number {
  return decisions.filter((record) => {
    const mission = content.missions.missions.find((entry) => entry.id === record.missionId);
    return mission ? mission.bestDecision === record.decision : false;
  }).length;
}

export function scoreRun(healthy: number, bestDecisions: number, totalMissions: number): number {
  const crewScore = healthy * 100;
  const decisionScore = bestDecisions * 50;
  const completionScore = totalMissions * 25;
  return crewScore + decisionScore + completionScore;
}

export function buildMissionReport(
  content: GameContent,
  state: GameState,
  now: Date = new Date(),
): MissionReport {
  const healthy = healthyCrewCount(state.crew);
  const bestDecisions = countBestDecisions(content, state.decisions);
  const totalMissions = content.missions.missions.length;
  const ending = selectEnding(content.story.endings, {
    healthy,
    bestDecisions,
    totalMissions,
  });

  return {
    version: 'v1',
    completedAt: now.toISOString(),
    healthyCrew: healthy,
    injuredRoles: injuredRoles(state.crew),
    bestDecisions,
    totalMissions,
    endingId: ending.id,
    score: scoreRun(healthy, bestDecisions, totalMissions),
  };
}

export function allDecisionsRecorded(content: GameContent, state: GameState): boolean {
  return state.decisions.length === content.missions.missions.length;
}

export function isDecision(value: string): value is Decision {
  return (DECISIONS as readonly string[]).includes(value);
}

import { getMissionAt } from './content';
import {
  applyInjuries,
  buildMissionReport,
  createHealthyCrew,
  isBestDecision,
  pickedMisleadingLens,
  qualityTier,
  resolveOutcome,
} from './engine';
import {
  ROLES,
  type Decision,
  type GameContent,
  type GameState,
  type LensId,
  type MissionReport,
  type Role,
} from './types';

export const BEST_REPORT_KEY = 'captain-dio:best-report:v1';

export function createInitialState(): GameState {
  return {
    phase: 'title',
    missionIndex: 0,
    crew: createHealthyCrew(),
    pickedLenses: [],
    usedHint: false,
    decisions: [],
  };
}

export type GameAction =
  | { type: 'START' }
  | { type: 'ACADEMY_COMPLETE' }
  | { type: 'BRIEFING_COMPLETE' }
  | { type: 'CONSULT'; role: Role }
  | { type: 'TOGGLE_LENS'; lensId: LensId }
  | { type: 'USE_HINT' }
  | { type: 'CONFIRM_LENSES' }
  | { type: 'CONTINUE_TO_DECISION' }
  | { type: 'DECIDE'; decision: Decision }
  | { type: 'CONTINUE_TO_REALITY' }
  | { type: 'NEXT_MISSION' }
  | { type: 'SHOW_REPORT' }
  | { type: 'RESET' };

export type GameReducer = (state: GameState, action: GameAction) => GameState;

export function createGameReducer(content: Pick<GameContent, 'missions'>): GameReducer {
  return function reducer(state, action) {
    switch (action.type) {
      case 'START':
        return { ...state, phase: 'academy' };

      case 'ACADEMY_COMPLETE':
        return state.phase === 'academy' ? { ...state, phase: 'briefing' } : state;

      case 'BRIEFING_COMPLETE':
        return state.phase === 'briefing' ? { ...state, phase: 'lens-pick' } : state;

      case 'CONSULT': {
        if (state.phase !== 'briefing' && state.phase !== 'lens-pick') {
          return state;
        }
        const mission = getMissionAt(content, state.missionIndex);
        if (!mission.crewHints[action.role] || state.crew[action.role] === true) {
          return state;
        }
        return { ...state, consultedRole: action.role };
      }

      case 'TOGGLE_LENS': {
        if (state.phase !== 'lens-pick') {
          return state;
        }
        if (state.pickedLenses.includes(action.lensId)) {
          return {
            ...state,
            pickedLenses: state.pickedLenses.filter((lensId) => lensId !== action.lensId),
          };
        }
        if (state.pickedLenses.length >= 2) {
          return state;
        }
        return { ...state, pickedLenses: [...state.pickedLenses, action.lensId] };
      }

      case 'USE_HINT':
        return state.phase === 'lens-pick' ? { ...state, usedHint: true } : state;

      case 'CONFIRM_LENSES':
        return state.phase === 'lens-pick' && state.pickedLenses.length === 2
          ? { ...state, phase: 'lens-results' }
          : state;

      case 'CONTINUE_TO_DECISION':
        return state.phase === 'lens-results' ? { ...state, phase: 'decision' } : state;

      case 'DECIDE': {
        if (state.phase !== 'decision') {
          return state;
        }
        const mission = getMissionAt(content, state.missionIndex);
        if (!mission.decisions.includes(action.decision)) {
          return state;
        }
        const tier = qualityTier(mission.relevance, state.pickedLenses);
        const outcome = resolveOutcome(mission, tier, action.decision);
        const crew = applyInjuries(state.crew, outcome.injuredRoles);
        return {
          ...state,
          crew,
          phase: 'outcome',
          decisions: [
            ...state.decisions,
            {
              missionId: mission.id,
              pickedLenses: [...state.pickedLenses],
              consultedRole: state.consultedRole,
              quality: tier,
              decision: action.decision,
              injuredRoles: [...outcome.injuredRoles],
              pickedMisleading: pickedMisleadingLens(mission.relevance, state.pickedLenses),
              usedHint: state.usedHint,
            },
          ],
        };
      }

      case 'CONTINUE_TO_REALITY':
        return state.phase === 'outcome' ? { ...state, phase: 'reality-check' } : state;

      case 'NEXT_MISSION': {
        if (state.phase !== 'reality-check') {
          return state;
        }
        const nextIndex = state.missionIndex + 1;
        if (nextIndex >= content.missions.missions.length) {
          return { ...state, phase: 'reveal', pickedLenses: [], consultedRole: undefined };
        }
        return {
          ...state,
          phase: 'briefing',
          missionIndex: nextIndex,
          pickedLenses: [],
          consultedRole: undefined,
          usedHint: false,
        };
      }

      case 'SHOW_REPORT':
        return state.phase === 'reveal' ? { ...state, phase: 'report' } : state;

      case 'RESET':
        return createInitialState();

      default:
        return state;
    }
  };
}

export function isMissionReport(value: unknown): value is MissionReport {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const report = value as Partial<MissionReport>;
  return (
    report.version === 'v1' &&
    typeof report.completedAt === 'string' &&
    typeof report.healthyCrew === 'number' &&
    Array.isArray(report.injuredRoles) &&
    report.injuredRoles.every((role) => (ROLES as readonly string[]).includes(role)) &&
    typeof report.bestDecisions === 'number' &&
    typeof report.totalMissions === 'number' &&
    typeof report.endingId === 'string' &&
    typeof report.score === 'number'
  );
}

function defaultStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function loadBestReport(storage: Storage | null = defaultStorage()): MissionReport | null {
  if (!storage) {
    return null;
  }
  try {
    const raw = storage.getItem(BEST_REPORT_KEY);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    return isMissionReport(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export interface PersistResult {
  saved: boolean;
  best: MissionReport;
}

/**
 * Stores only the highest-scoring report. Ties keep the existing best.
 */
export function persistBestReport(
  report: MissionReport,
  storage: Storage | null = defaultStorage(),
): PersistResult {
  const existing = loadBestReport(storage);
  if (existing && existing.score >= report.score) {
    return { saved: false, best: existing };
  }
  if (!storage) {
    return { saved: false, best: existing ?? report };
  }
  try {
    storage.setItem(BEST_REPORT_KEY, JSON.stringify(report));
  } catch {
    return { saved: false, best: existing ?? report };
  }
  return { saved: true, best: report };
}

export function createReport(
  content: Pick<GameContent, 'story' | 'missions'>,
  state: GameState,
  now?: Date,
): MissionReport {
  return buildMissionReport(content, state, now);
}

export { isBestDecision };

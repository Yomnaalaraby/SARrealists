import { describe, expect, it } from 'vitest';
import {
  applyInjuries,
  createHealthyCrew,
  healthyCrewCount,
  injuredRoles,
  isCrewAvailable,
  pickedMisleadingLens,
  qualityTier,
  resolveOutcome,
  selectEnding,
} from '../src/game/engine';
import { createGameReducer, createInitialState } from '../src/game/state';
import type { LensId, Relevance } from '../src/game/types';
import { loadTestContent } from './helpers';

const relevance = (values: Partial<Record<LensId, Relevance>>): Partial<Record<LensId, Relevance>> =>
  values;

describe('qualityTier', () => {
  it('is strong for two essential lenses', () => {
    expect(qualityTier(relevance({ brightness: 'essential', water: 'essential' }), ['brightness', 'water'])).toBe('strong');
  });

  it('is strong for one essential and one helpful lens', () => {
    expect(qualityTier(relevance({ brightness: 'essential', water: 'helpful' }), ['brightness', 'water'])).toBe('strong');
  });

  it('is partial for exactly one essential lens', () => {
    expect(qualityTier(relevance({ brightness: 'essential', optical: 'misleading' }), ['brightness', 'optical'])).toBe('partial');
  });

  it('is partial for exactly one helpful lens', () => {
    expect(qualityTier(relevance({ water: 'helpful' }), ['water', 'iceflow'])).toBe('partial');
  });

  it('is blind for two helpful lenses', () => {
    expect(qualityTier(relevance({ water: 'helpful', brightness: 'helpful' }), ['water', 'brightness'])).toBe('blind');
  });

  it('is blind for two irrelevant or misleading lenses', () => {
    expect(qualityTier(relevance({ optical: 'misleading' }), ['optical', 'iceflow'])).toBe('blind');
  });

  it('rejects the wrong number of lenses and duplicates', () => {
    expect(() => qualityTier({}, ['brightness'])).toThrow();
    expect(() => qualityTier({}, ['brightness', 'brightness'])).toThrow();
  });
});

describe('misleading lens detection', () => {
  it('flags a misleading pick even when the tier is partial', () => {
    expect(pickedMisleadingLens({ brightness: 'essential', optical: 'misleading' }, ['brightness', 'optical'])).toBe(true);
    expect(pickedMisleadingLens({ brightness: 'essential', water: 'helpful' }, ['brightness', 'water'])).toBe(false);
  });
});

describe('crew state', () => {
  it('starts healthy and persists injuries', () => {
    const crew = createHealthyCrew();
    expect(healthyCrewCount(crew)).toBe(8);
    expect(isCrewAvailable(crew, 'pilot')).toBe(true);

    const injured = applyInjuries(crew, ['pilot', 'medic', 'pilot']);
    expect(injured.pilot).toBe(true);
    expect(injured.medic).toBe(true);
    expect(injuredRoles(injured)).toEqual(['medic', 'pilot']);
    expect(isCrewAvailable(injured, 'pilot')).toBe(false);
    expect(healthyCrewCount(crew)).toBe(8);
  });
});

describe('outcomes', () => {
  const content = loadTestContent();

  it('returns the authored outcome for every tier and decision', () => {
    for (const mission of content.missions.missions) {
      for (const tier of ['strong', 'partial', 'blind'] as const) {
        for (const decision of mission.decisions) {
          expect(resolveOutcome(mission, tier, decision).text.en).toContain('PLACEHOLDER');
        }
      }
    }
  });

  it('throws for an unknown outcome', () => {
    const mission = content.missions.missions[0];
    expect(() => resolveOutcome(mission, 'strong', 'reroute')).not.toThrow();
    expect(() => resolveOutcome({ ...mission, outcomes: { ...mission.outcomes, strong: {} as never } }, 'strong', 'reroute')).toThrow();
  });
});

describe('endings', () => {
  const content = loadTestContent();

  it('selects the highest matching ending', () => {
    expect(selectEnding(content.story.endings, { healthy: 8, bestDecisions: 4, totalMissions: 4 }).id).toBe('pathfinder');
    expect(selectEnding(content.story.endings, { healthy: 7, bestDecisions: 4, totalMissions: 4 }).id).toBe('guardian');
    expect(selectEnding(content.story.endings, { healthy: 4, bestDecisions: 2, totalMissions: 4 }).id).toBe('survivor');
    expect(selectEnding(content.story.endings, { healthy: 1, bestDecisions: 1, totalMissions: 4 }).id).toBe('lumen-protocol');
  });
});

describe('reducer', () => {
  const content = loadTestContent();

  it('runs a mission with a strong pick and no injuries', () => {
    const reducer = createGameReducer(content);
    let state = createInitialState();
    state = reducer(state, { type: 'START' });
    expect(state.phase).toBe('academy');
    state = reducer(state, { type: 'ACADEMY_COMPLETE' });
    expect(state.phase).toBe('briefing');
    state = reducer(state, { type: 'CONSULT', role: 'engineer' });
    expect(state.consultedRole).toBe('engineer');
    state = reducer(state, { type: 'BRIEFING_COMPLETE' });
    expect(state.phase).toBe('lens-pick');
    state = reducer(state, { type: 'TOGGLE_LENS', lensId: 'brightness' });
    state = reducer(state, { type: 'TOGGLE_LENS', lensId: 'water' });
    expect(state.pickedLenses).toEqual(['brightness', 'water']);
    state = reducer(state, { type: 'CONFIRM_LENSES' });
    expect(state.phase).toBe('lens-results');
    state = reducer(state, { type: 'CONTINUE_TO_DECISION' });
    state = reducer(state, { type: 'DECIDE', decision: 'reroute' });
    expect(state.phase).toBe('outcome');
    expect(state.decisions).toHaveLength(1);
    expect(state.decisions[0].quality).toBe('strong');
    expect(state.decisions[0].injuredRoles).toEqual([]);
    state = reducer(state, { type: 'CONTINUE_TO_REALITY' });
    state = reducer(state, { type: 'NEXT_MISSION' });
    expect(state.phase).toBe('briefing');
    expect(state.missionIndex).toBe(1);
    expect(state.pickedLenses).toEqual([]);
  });

  it('keeps injured crew unavailable for consultation in later missions', () => {
    const reducer = createGameReducer(content);
    let state = createInitialState();
    state = reducer(state, { type: 'START' });
    state = reducer(state, { type: 'ACADEMY_COMPLETE' });
    state = reducer(state, { type: 'BRIEFING_COMPLETE' });
    state = reducer(state, { type: 'TOGGLE_LENS', lensId: 'brightness' });
    state = reducer(state, { type: 'TOGGLE_LENS', lensId: 'optical' });
    state = reducer(state, { type: 'CONFIRM_LENSES' });
    state = reducer(state, { type: 'CONTINUE_TO_DECISION' });
    state = reducer(state, { type: 'DECIDE', decision: 'go' });
    expect(state.crew.pilot).toBe(true);
    state = reducer(state, { type: 'CONTINUE_TO_REALITY' });
    state = reducer(state, { type: 'NEXT_MISSION' });
    const before = state;
    state = reducer(state, { type: 'CONSULT', role: 'pilot' });
    expect(state).toEqual(before);
  });

  it('never allows more than two lenses or confirming fewer', () => {
    const reducer = createGameReducer(content);
    let state = createInitialState();
    state = reducer(state, { type: 'START' });
    state = reducer(state, { type: 'ACADEMY_COMPLETE' });
    state = reducer(state, { type: 'CONFIRM_LENSES' });
    expect(state.phase).toBe('briefing');
    state = reducer(state, { type: 'BRIEFING_COMPLETE' });
    state = reducer(state, { type: 'TOGGLE_LENS', lensId: 'brightness' });
    state = reducer(state, { type: 'TOGGLE_LENS', lensId: 'water' });
    state = reducer(state, { type: 'TOGGLE_LENS', lensId: 'optical' });
    expect(state.pickedLenses).toEqual(['brightness', 'water']);
  });
});

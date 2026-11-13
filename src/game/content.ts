import { z } from 'zod';
import {
  CONFIDENCES,
  DECISIONS,
  DIRECTIONS,
  LENS_IDS,
  LENS_STATUSES,
  LANGUAGES,
  RELEVANCE_VALUES,
  RELIABILITIES,
  ROLES,
  type CrewHint,
  type GameContent,
  type Language,
  type Lens,
  type LensId,
  type LocalizedText,
  type Mission,
  type RealPlace,
  type Role,
  type Source,
  type StoryCrewMember,
} from './types';

const localizedTextSchema = z.object({
  en: z.string().min(1),
  ar: z.string().min(1).optional(),
});

const sourceSchema = z.object({
  title: z.string().min(1),
  url: z
    .string()
    .url()
    .refine((value) => value.startsWith('https://'), 'Source URLs must use https'),
});

const storyCrewSchema = z.object({
  role: z.enum(ROLES),
  name: localizedTextSchema,
  title: localizedTextSchema,
});

const endingSchema = z.object({
  id: z.string().min(1),
  title: localizedTextSchema,
  text: localizedTextSchema,
  minHealthy: z.number().int().min(0).max(8),
  minBestDecisions: z.number().int().min(0),
});

const storySchema = z.object({
  version: z.string().min(1),
  ship: localizedTextSchema,
  planet: localizedTextSchema,
  captain: localizedTextSchema,
  ai: localizedTextSchema,
  crew: z.array(storyCrewSchema).length(8),
  endings: z.array(endingSchema).min(1),
});

const lensSchema = z.object({
  id: z.enum(LENS_IDS),
  name: localizedTextSchema,
  measures: localizedTextSchema,
  teaches: localizedTextSchema,
  limits: localizedTextSchema,
  source: sourceSchema,
  icon: z.string().min(1),
});

const lensLibrarySchema = z.object({
  version: z.string().min(1),
  lenses: z.array(lensSchema).min(1),
});

const chartPointSchema = z.object({
  date: z.string().min(1),
  value: z.number().finite(),
});

const chartSeriesSchema = z.object({
  unit: z.string().min(1),
  label: localizedTextSchema,
  points: z.array(chartPointSchema).min(2),
});

const pairVisualSchema = z.object({
  kind: z.literal('pair'),
  images: z.tuple([z.string().min(1), z.string().min(1)]),
  labels: z.tuple([localizedTextSchema, localizedTextSchema]).optional(),
  alt: localizedTextSchema,
});

const singleVisualSchema = z.object({
  kind: z.literal('single'),
  images: z.tuple([z.string().min(1)]),
  alt: localizedTextSchema,
});

const chartVisualSchema = z.object({
  kind: z.literal('chart'),
  series: chartSeriesSchema,
  alt: localizedTextSchema,
});

const visualSchema = z.discriminatedUnion('kind', [
  pairVisualSchema,
  singleVisualSchema,
  chartVisualSchema,
]);

const lensResultSchema = z.object({
  status: z.enum(LENS_STATUSES),
  caption: localizedTextSchema,
  visual: visualSchema.optional(),
});

const missionDataSchema = z.object({
  dates: z.array(z.string().min(1)).min(1),
  track: z.number().int().min(0),
  direction: z.enum(DIRECTIONS),
  pixelMeters: z.number().positive(),
  passes: z.number().int().min(1),
  baselineDays: z.number().min(0),
  confidence: z.enum(CONFIDENCES),
});

const outcomeSchema = z.object({
  injuredRoles: z.array(z.enum(ROLES)).max(2),
  text: localizedTextSchema,
  followUp: localizedTextSchema.optional(),
});

const outcomeTableSchema = z.object({
  strong: z.object({
    go: outcomeSchema,
    delay: outcomeSchema,
    reroute: outcomeSchema,
  }),
  partial: z.object({
    go: outcomeSchema,
    delay: outcomeSchema,
    reroute: outcomeSchema,
  }),
  blind: z.object({
    go: outcomeSchema,
    delay: outcomeSchema,
    reroute: outcomeSchema,
  }),
});

const crewHintSchema = z.object({
  text: localizedTextSchema,
  suggestsLens: z.enum(LENS_IDS),
  reliability: z.enum(RELIABILITIES),
});

const realityCheckSchema = z.object({
  explain: localizedTextSchema,
  limits: localizedTextSchema,
  benefit: localizedTextSchema,
  source: sourceSchema,
});

const missionSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Mission ids must be lowercase kebab-case'),
  siteId: z.string().min(1),
  title: localizedTextSchema,
  briefing: localizedTextSchema,
  alias: z.string().min(1),
  data: missionDataSchema,
  relevance: z.record(z.string(), z.enum(RELEVANCE_VALUES)),
  lensResults: z.record(z.string(), lensResultSchema),
  decisions: z.array(z.enum(DECISIONS)).min(1),
  bestDecision: z.enum(DECISIONS),
  outcomes: outcomeTableSchema,
  realityCheck: realityCheckSchema,
  crewHints: z.record(z.string(), crewHintSchema),
  hints: z.array(localizedTextSchema).optional(),
});

const missionsFileSchema = z.object({
  version: z.string().min(1),
  missions: z.array(missionSchema).min(1),
});

const realPlaceSchema = z.object({
  name: localizedTextSchema,
  siteId: z.string().min(1),
  lon: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
  zoom: z.number().min(0).max(24),
});

const revealBeatSchema = z.object({
  id: z.string().min(1),
  text: localizedTextSchema,
  placeId: z.string().min(1).optional(),
  source: sourceSchema.optional(),
});

const crewRealWorldSchema = z.object({
  role: z.enum(ROLES),
  user: localizedTextSchema,
  decides: localizedTextSchema,
  source: sourceSchema,
});

const callToActionSchema = z.object({
  label: localizedTextSchema,
  route: z.string().min(1),
});

const revealSchema = z.object({
  version: z.string().min(1),
  places: z.record(z.string(), realPlaceSchema),
  beats: z.array(revealBeatSchema).min(1),
  crewRoleToRealWorld: z.array(crewRealWorldSchema).length(8),
  callToAction: callToActionSchema,
  closingLine: localizedTextSchema,
});

const factSchema = z.object({
  id: z.string().min(1),
  claim: localizedTextSchema,
  value: z.string().min(1),
  source: sourceSchema.optional(),
  status: z.enum(['verified', 'todo']),
});

const factsFileSchema = z.object({
  version: z.string().min(1),
  facts: z.array(factSchema).min(1),
});

const gameContentSchema = z.object({
  story: storySchema,
  lenses: lensLibrarySchema,
  missions: missionsFileSchema,
  reveal: revealSchema,
  facts: factsFileSchema,
});

function isLensId(value: string): value is LensId {
  return (LENS_IDS as readonly string[]).includes(value);
}

function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

/**
 * Structural cross-checks that zod cannot express, shared by the parser and
 * the build-time validator.
 */
export function collectContentErrors(content: GameContent): string[] {
  const errors: string[] = [];

  const lensIds = new Set(content.lenses.lenses.map((lens) => lens.id));
  const crewRoles = new Set(content.story.crew.map((member) => member.role));
  if (crewRoles.size !== content.story.crew.length) {
    errors.push('story.crew contains duplicate roles');
  }
  if (content.story.crew.length !== 8) {
    errors.push('story.crew must contain exactly 8 members');
  }

  const missionIds = new Set<string>();
  for (const mission of content.missions.missions) {
    if (missionIds.has(mission.id)) {
      errors.push(`Duplicate mission id: ${mission.id}`);
    }
    missionIds.add(mission.id);

    if (!content.reveal.places[mission.id]) {
      errors.push(`reveal.places is missing an entry for mission ${mission.id}`);
    }

    for (const lensId of Object.keys(mission.relevance)) {
      if (!isLensId(lensId) || !lensIds.has(lensId)) {
        errors.push(`${mission.id}: relevance references unknown lens ${lensId}`);
      }
    }
    for (const lensId of Object.keys(mission.lensResults)) {
      if (!isLensId(lensId) || !lensIds.has(lensId)) {
        errors.push(`${mission.id}: lensResults references unknown lens ${lensId}`);
      }
    }
    for (const role of Object.keys(mission.crewHints)) {
      if (!isRole(role)) {
        errors.push(`${mission.id}: crewHints references unknown role ${role}`);
      }
    }
    if (!mission.decisions.includes(mission.bestDecision)) {
      errors.push(`${mission.id}: bestDecision is not listed in decisions`);
    }
    const uniqueDecisions = new Set(mission.decisions);
    if (uniqueDecisions.size !== mission.decisions.length) {
      errors.push(`${mission.id}: decisions contains duplicates`);
    }
    for (const decision of DECISIONS) {
      if (!uniqueDecisions.has(decision)) {
        errors.push(`${mission.id}: decisions is missing "${decision}"`);
      }
    }
  }

  for (const [placeId] of Object.entries(content.reveal.places)) {
    if (!missionIds.has(placeId)) {
      errors.push(`reveal.places contains an unknown mission id: ${placeId}`);
    }
  }

  const route = content.reveal.callToAction.route;
  for (const token of ['{siteId}', '{lon}', '{lat}', '{zoom}', '{lenses}']) {
    if (!route.includes(token)) {
      errors.push(`reveal.callToAction.route is missing ${token}`);
    }
  }

  const worldRoles = new Set(content.reveal.crewRoleToRealWorld.map((entry) => entry.role));
  for (const role of ROLES) {
    if (!worldRoles.has(role)) {
      errors.push(`reveal.crewRoleToRealWorld is missing role ${role}`);
    }
  }

  return errors;
}

export function parseGameContent(raw: unknown): GameContent {
  const parsed = gameContentSchema.parse(raw) as GameContent;
  const errors = collectContentErrors(parsed);
  if (errors.length > 0) {
    throw new Error(`Invalid game content:\n- ${errors.join('\n- ')}`);
  }
  return parsed;
}

export function isLanguage(value: string): value is Language {
  return (LANGUAGES as readonly string[]).includes(value);
}

export interface LocalizeOptions {
  dev?: boolean;
  context?: string;
}

export function localize(
  text: LocalizedText,
  language: Language,
  options: LocalizeOptions = {},
): string {
  if (language === 'en') {
    return text.en;
  }
  if (text.ar && text.ar.trim().length > 0) {
    return text.ar;
  }
  if (options.dev && typeof console !== 'undefined') {
    console.warn(
      `[captain-dio] Missing Arabic text for ${options.context ?? 'unknown field'}; falling back to English.`,
    );
  }
  return text.en;
}

export function getLens(content: GameContent, lensId: LensId): Lens {
  const lens = content.lenses.lenses.find((entry) => entry.id === lensId);
  if (!lens) {
    throw new Error(`Unknown lens: ${lensId}`);
  }
  return lens;
}

export function getMission(content: GameContent, missionId: string): Mission {
  const mission = content.missions.missions.find((entry) => entry.id === missionId);
  if (!mission) {
    throw new Error(`Unknown mission: ${missionId}`);
  }
  return mission;
}

export function getMissionAt(content: GameContent, index: number): Mission {
  const mission = content.missions.missions[index];
  if (!mission) {
    throw new Error(`No mission at index ${index}`);
  }
  return mission;
}

export function getPlaceForMission(content: GameContent, missionId: string): RealPlace {
  const place = content.reveal.places[missionId];
  if (!place) {
    throw new Error(`No real place for mission: ${missionId}`);
  }
  return place;
}

export function getCrewMember(story: GameContent['story'], role: Role): StoryCrewMember {
  const member = story.crew.find((entry) => entry.role === role);
  if (!member) {
    throw new Error(`Unknown crew role: ${role}`);
  }
  return member;
}

export function getCrewHint(mission: Mission, role: Role): CrewHint | undefined {
  return mission.crewHints[role];
}

export function getSourceText(source: Source): string {
  return `${source.title} (${source.url})`;
}

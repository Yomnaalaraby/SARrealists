export const LANGUAGES = ['en', 'ar'] as const;
export type Language = (typeof LANGUAGES)[number];

export interface LocalizedText {
  en: string;
  ar?: string;
}

export const ROLES = [
  'geologist',
  'agronomist',
  'medic',
  'engineer',
  'pilot',
  'glaciologist',
  'hydrologist',
  'cook',
] as const;
export type Role = (typeof ROLES)[number];

export const DIALOGUE_SPEAKERS = ['captain', 'ai', ...ROLES] as const;
export type DialogueSpeaker = (typeof DIALOGUE_SPEAKERS)[number];

export interface DialogueLine {
  speaker: DialogueSpeaker;
  text: LocalizedText;
}

export const LENS_IDS = [
  'brightness',
  'water',
  'moisture',
  'motion',
  'stability',
  'iceflow',
  'optical',
] as const;
export type LensId = (typeof LENS_IDS)[number];

export const RELEVANCE_VALUES = [
  'essential',
  'helpful',
  'irrelevant',
  'misleading',
] as const;
export type Relevance = (typeof RELEVANCE_VALUES)[number];

export const LENS_STATUSES = ['clear', 'weak', 'blind'] as const;
export type LensStatus = (typeof LENS_STATUSES)[number];

export const QUALITY_TIERS = ['strong', 'partial', 'blind'] as const;
export type QualityTier = (typeof QUALITY_TIERS)[number];

export const DECISIONS = ['go', 'delay', 'reroute'] as const;
export type Decision = (typeof DECISIONS)[number];

export const CONFIDENCES = ['low', 'medium', 'high'] as const;
export type Confidence = (typeof CONFIDENCES)[number];

export const RELIABILITIES = ['good', 'biased', 'wrong'] as const;
export type Reliability = (typeof RELIABILITIES)[number];

export const DIRECTIONS = ['ASCENDING', 'DESCENDING'] as const;
export type Direction = (typeof DIRECTIONS)[number];

export const PHASES = [
  'title',
  'academy',
  'briefing',
  'lens-pick',
  'lens-results',
  'decision',
  'outcome',
  'reality-check',
  'reveal',
  'report',
] as const;
export type Phase = (typeof PHASES)[number];

export interface Source {
  title: string;
  url: string;
}

export interface StoryCrewMember {
  role: Role;
  name: LocalizedText;
  title: LocalizedText;
}

export interface Ending {
  id: string;
  title: LocalizedText;
  text: LocalizedText;
  minHealthy: number;
  minBestDecisions: number;
}

export interface Story {
  version: string;
  ship: LocalizedText;
  planet: LocalizedText;
  captain: LocalizedText;
  ai: LocalizedText;
  intro: DialogueLine[];
  crew: StoryCrewMember[];
  endings: Ending[];
}

export interface Lens {
  id: LensId;
  name: LocalizedText;
  measures: LocalizedText;
  teaches: LocalizedText;
  limits: LocalizedText;
  source: Source;
  icon: string;
}

export interface LensLibrary {
  version: string;
  lenses: Lens[];
}

export interface ChartPoint {
  date: string;
  value: number;
}

export interface ChartSeries {
  unit: string;
  label: LocalizedText;
  points: ChartPoint[];
}

export interface PairVisual {
  kind: 'pair';
  images: [string, string];
  labels?: [LocalizedText, LocalizedText];
  alt: LocalizedText;
}

export interface SingleVisual {
  kind: 'single';
  images: [string];
  alt: LocalizedText;
}

export interface ChartVisual {
  kind: 'chart';
  series: ChartSeries;
  alt: LocalizedText;
}

export type Visual = PairVisual | SingleVisual | ChartVisual;

export interface LensResult {
  status: LensStatus;
  caption: LocalizedText;
  visual?: Visual;
}

export interface MissionData {
  dates: string[];
  track: number;
  direction: Direction;
  pixelMeters: number;
  passes: number;
  baselineDays: number;
  confidence: Confidence;
}

export interface Outcome {
  injuredRoles: Role[];
  text: LocalizedText;
  followUp?: LocalizedText;
}

export type OutcomeTable = Record<QualityTier, Record<Decision, Outcome>>;

export interface CrewHint {
  text: LocalizedText;
  suggestsLens: LensId;
  reliability: Reliability;
}

export interface RealityCheck {
  explain: LocalizedText;
  limits: LocalizedText;
  benefit: LocalizedText;
  source: Source;
}

export interface Mission {
  id: string;
  siteId: string;
  title: LocalizedText;
  briefing: LocalizedText;
  dialogue: DialogueLine[];
  alias: string;
  data: MissionData;
  relevance: Partial<Record<LensId, Relevance>>;
  lensResults: Partial<Record<LensId, LensResult>>;
  decisions: Decision[];
  bestDecision: Decision;
  outcomes: OutcomeTable;
  realityCheck: RealityCheck;
  crewHints: Partial<Record<Role, CrewHint>>;
  hints?: LocalizedText[];
}

export interface MissionsFile {
  version: string;
  missions: Mission[];
}

export interface RealPlace {
  name: LocalizedText;
  siteId: string;
  lon: number;
  lat: number;
  zoom: number;
}

export interface RevealBeat {
  id: string;
  text: LocalizedText;
  placeId?: string;
  source?: Source;
}

export interface CrewRealWorld {
  role: Role;
  user: LocalizedText;
  decides: LocalizedText;
  source: Source;
}

export interface CallToAction {
  label: LocalizedText;
  route: string;
}

export interface Reveal {
  version: string;
  places: Record<string, RealPlace>;
  beats: RevealBeat[];
  crewRoleToRealWorld: CrewRealWorld[];
  callToAction: CallToAction;
  closingLine: LocalizedText;
}

export interface Fact {
  id: string;
  claim: LocalizedText;
  value: string;
  source?: Source;
  status: 'verified' | 'todo';
}

export interface FactsFile {
  version: string;
  facts: Fact[];
}

export interface CoreContent {
  story: Story;
  lenses: LensLibrary;
  missions: MissionsFile;
  facts: FactsFile;
}

export interface GameContent extends CoreContent {
  reveal: Reveal;
}

export type CrewInjuryMap = Record<Role, boolean>;

export interface DecisionRecord {
  missionId: string;
  pickedLenses: LensId[];
  consultedRole?: Role;
  quality: QualityTier;
  decision: Decision;
  injuredRoles: Role[];
  pickedMisleading: boolean;
  usedHint: boolean;
}

export interface GameState {
  phase: Phase;
  missionIndex: number;
  crew: CrewInjuryMap;
  pickedLenses: LensId[];
  consultedRole?: Role;
  usedHint: boolean;
  decisions: DecisionRecord[];
}

export interface MissionReport {
  version: string;
  completedAt: string;
  healthyCrew: number;
  injuredRoles: Role[];
  bestDecisions: number;
  totalMissions: number;
  endingId: string;
  score: number;
}

export interface EndingStats {
  healthy: number;
  bestDecisions: number;
  totalMissions: number;
}

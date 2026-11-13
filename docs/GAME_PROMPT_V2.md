# Captain DIO — Game Specification v2

This is the working specification for the story-driven NISAR game embedded in
**Dancing with the SARs**. It merges the original two prompt files with the
spoiler-safety, crew-consultation, evidence, and data-provenance ideas agreed
for this implementation.

## Integration decision

- The game lives in the existing **Next.js 16 App Router** project, not a
  separate Vite app. It is mounted at `/game` and keeps the app's TypeScript,
  Tailwind, and Vercel setup.
- Game code lives in `src/game/`; static content lives in `public/game/`.
- No runtime dependency on `raw.githubusercontent.com`, Unsplash, or any other
  external host. Radar/illustration assets are local files.
- The current `/game` placeholder page is replaced in Message 2.

## Story and teaching goals

Captain DIO commands the colony ship *Aurelia Dawn*. The ship's AI LUMEN helps
analyze a SAR satellite. The crew of eight lands on the seemingly uninhabited
planet Aurelia, where wildfires, moving ice, and rising carbon turn out to be
real NISAR observations of Earth. The final reveal is data-driven from
`public/game/reveal.json`.

The player learns four things in 5–8 minutes:

1. Radar sends its own signal and works through smoke, cloud, and darkness;
   it responds to roughness and the dielectric constant.
2. Different radar products (lenses) reveal different hazards and have limits.
3. Repeat passes mean decisions are made with limited, imperfect information.
4. Real people use NISAR data to make real decisions.

The game never says the satellite "predicts" a disaster. It detects changes and
early-warning signals. Crew who make a mistake are injured and out of action;
nobody dies and there is no game over.

## Mechanics

Each mission follows:

`briefing → consult (optional) → pick exactly two lenses → lens results → decision → outcome → reality check`

- The crew member consultation is a new v2 mechanic. Each role can suggest a
  lens with a qualitative hint. Hints are authored, can be biased or wrong, and
  injured crew are unavailable.
- Quality tier is a pure function:
  - `strong`: two essential lenses, or one essential + one helpful.
  - `partial`: exactly one essential or helpful lens.
  - `blind`: anything else, including two helpful lenses.
- Picking a `misleading` lens sets `pickedMisleading` even when the tier is
  `partial`, so the UI can show the wrong assumption the player acted on.
- Outcomes are authored for all `tier × decision` combinations. Nothing is
  random.
- The optional AI hint is controlled by `ENABLE_AI_HINT` (default false). The
  game also ships authored `hints` per mission so it remains playable when
  `/api/chat` is unavailable.

## Spoiler-safe content

`missions.json` deliberately contains **no real place names, coordinates, or
place-specific source URLs**. Those live in `reveal.json`, which is loaded only
after mission 4.

- Mission `siteId` values are opaque (`sector-4`, `sector-9`, …).
- `reveal.places[missionId]` contains the real name, the real map `siteId`,
  longitude, latitude, and zoom.
- The validator rejects any pre-reveal mission text, image path, or alt text
  that contains a real place name.
- The map deep link and shareable Mission Report are gated until the reveal.

## Data contracts

### `public/game/missions.json`

Each mission contains:

- `id`, opaque `siteId`, localized `title`/`briefing`, `alias`
- `data`: `dates`, `track`, `direction`, `pixelMeters`, `passes`,
  `baselineDays`, `confidence`
- `relevance`: lens id → `essential | helpful | irrelevant | misleading`
- `lensResults`: lens id → `status`, localized `caption`, optional `visual`
- `visual`: `pair` (before/after), `single`, or `chart` (localized label,
  unit, dated points), always with neutral localized `alt`
- `decisions` (all three) and `bestDecision`
- `outcomes`: complete `strong`/`partial`/`blind` × `go`/`delay`/`reroute`
  table, each with `injuredRoles`, localized `text`, optional `followUp`
- `realityCheck`: localized `explain`, `limits`, `benefit`, https `source`
- `crewHints`: role → localized hint, suggested lens, reliability
- optional authored `hints`

### `public/game/reveal.json`

- `places`: mission id → real name, real map `siteId`, lon, lat, zoom
- ordered `beats` with localized text, optional place overlay and source
- `crewRoleToRealWorld`: all eight roles, each with real user, decision, source
- `callToAction`: localized label and route template using
  `{siteId}`, `{lon}`, `{lat}`, `{zoom}`, `{lenses}`
- `closingLine`

### Other content

- `story.json`: ship, planet, captain, AI, eight crew members, endings.
- `lenses.json`: seven lenses with name, measures, teaches, limits, source.
- `facts.json`: claim registry. Verified facts require a source; unverified
  claims are marked `todo` and carry `TODO: needs source`.

All localized text accepts `en` and optional `ar`. Missing Arabic falls back to
English; the dev build logs a warning, production does not.

## Validation

`npm run validate:content` runs `scripts/validate_content.ts` and fails on:

- schema errors, duplicate mission/lens/crew ids, unknown lens/role references
- missing or duplicate outcome entries, `bestDecision` not in `decisions`
- missing `reveal.places` entry or CTA placeholder
- non-https sources, invalid or descending ISO dates, non-positive
  `pixelMeters`, missing passes/baseline
- missing image files, absolute/escaping image paths
- text over the grapheme limits (briefing 400, outcome 350, explain 450,
  limits 220, plus caption/title/lens/hint limits)
- real place names leaking into pre-reveal mission content or alt text
- verified facts without a source, missing crew-to-real-world roles

## Art and audio

- 16-bit pixel-art presentation, 160×90 logical scenes scaled by the largest
  integer factor; canvas 2D with smoothing disabled.
- One shared 24–32 color palette, data-driven sprites, seeded procedural
  backgrounds, 4–6 FPS sprite animation.
- Radar visuals are **not** pixel-quantized or recolored. They use fixed
  per-channel stretches and nearest-neighbor upscaling only; each image carries
  a “Real NISAR data” badge with dates, track/direction, and `pixelMeters`.
- Illustrations are labeled “Illustration” so they cannot be mistaken for data.
- No audio by default; optional WebAudio beeps behind a setting, default off.

## Accessibility and i18n

- Fully keyboard operable, visible focus, ARIA labels, slider arrow-key support.
- Color is never the only signal: lens status and injury state include icons and
  text.
- Arabic RTL uses logical CSS properties and a readable Arabic font; pixel fonts
  are for short Latin labels only. Never mirror radar imagery.
- Typewriter text advances by grapheme clusters and respects
  `prefers-reduced-motion` (first frame / instant text).
- Screen-reader phase announcements and focus management between phases.
- Tests must assert zero external network requests during the game.

## Implementation plan

- **Message 1 (done):** types, zod content layer, pure engine, reducer, best
  report persistence, five JSON files with placeholder content, placeholder
  gradient images, validator, Vitest suite.
- **Message 2:** pixel-art system, components, GameApp, i18n, `/game` route,
  PlayButton, lens picker/results, decision/outcome/reality-check, codex,
  crew bar, reveal, report, accessibility.
- **Message 3:** README mission-authoring guide, REFERENCES generator, judge
  guide, asset pipeline from `out_web` catalogs, bundle/network checks, polish.

## Repository facts to respect

- The repo currently has no `/api/chat` route; keep the hint flag guarded and
  use authored hints as fallback.
- The current `/game` page is a placeholder.
- Existing `LevelOneSmoke` uses Unsplash URLs; the new game must not reuse it.
- The main map reads `out_web` from GitHub raw at runtime. The game must be
  self-contained; the deep-link CTA will need map query-param support in a later
  message.
- Mission dates and facts are placeholders until supplied or sourced. Do not
  invent acquisition dates, resolutions, revisit times, or causes.

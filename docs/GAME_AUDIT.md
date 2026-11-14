# Captain DIO — Game Audit

_Last updated: 2026-11-14_

## Current state

The game is playable end to end at `/game`: academy briefing, four missions,
crew consultation, two-lens selection, results, decision, outcome, reality
check, Earth reveal, mission report, English/Arabic UI, keyboard support, and
the optional LUMEN assistant are wired.

The remaining work is mostly **content authenticity and production polish**, not
core mechanics.

## What was completed in this pass

- Replaced all 22 gradient placeholder images with original **160×90 pixel-art
  illustrations**.
- Added a deterministic generator at `scripts/generate_game_images.py`, using
  the shared `src/game/art/palette.ts` palette.
- Removed the literal `PLACEHOLDER:` / `نص مؤقت:` prefixes from the playable
  mission, story, and reveal copy so the game no longer displays placeholder
  labels during play.
- Kept the `facts.json` TODO intact because it still needs a source.
- Added the asset generation command to the README.

## Remaining blockers

### P0 — Real NISAR data versus illustrations

The 22 mission images are now coherent pixel-art **illustrations**, not NISAR
raster crops. This is honest for a demo and the UI labels them “Illustration,”
but it does not satisfy the spec’s “Real NISAR data” badge requirement.

To ship the data claim, the project still needs:

- Local, licensed NISAR/ASF crops for the four sites, stored under
  `public/game/data/` or similar.
- Fixed per-channel stretches and nearest-neighbor scaling only; do not
  pixel-quantize or recolor radar values.
- Dates, track/direction, pixel spacing, polarizations, and coherence metadata
  attached to each crop.
- A switch from the `illustration` badge to the real-data badge only for assets
  that have that metadata.

Until then, keep the current “Illustration” and “Placeholder data” labels.

### P0 — Facts and acquisition metadata

`public/game/facts.json` still contains one `todo` fact for NISAR repeat cycle
and latency. Mission dates, passes, baselines, and confidence values are demo
values until they are tied to real acquisitions. Do not replace them with
invented values; add a source and acquisition record first.

### P1 — Editorial review of all copy

The literal placeholder labels are gone, but the copy is still a first draft.
It needs a subject-matter review and an Arabic-language review, especially:

- mission titles and briefings
- lens captions and limits
- all 36 outcome cells
- crew hints and reliability labels
- reality-check explanations
- story endings
- reveal beats and crew-to-real-world decisions

The spoiler rule still matters: pre-reveal mission text must not contain real
place names, coordinates, or place-specific source URLs. Those belong only in
`reveal.json`.

### P1 — Message 3 deliverables

The specification’s Message 3 is not finished yet:

- README mission-authoring guide (partially covered by the current README)
- `REFERENCES` generator / source index
- judge or reviewer guide
- final asset pipeline documentation
- bundle-size and zero-external-network checks

### P2 — Optional integrations

- `ENABLE_AI_HINT` is not wired; the game currently uses the authored crew hints
  and mission hints, which is the safe default.
- Optional WebAudio beeps are not implemented; audio remains off by default.
- If real radar crops replace illustrations, update alt text and remove the
  illustration badge for those specific assets.

## Pixel-art asset inventory

All files are 160×90 PNGs in `public/game/img/`.

| Mission | Assets |
| --- | --- |
| Smoke basin | `m1-smoke_brightness_a/b`, `m1-smoke_optical_a`, `m1-smoke_water_a` |
| Glacier | `m2-glacier_iceflow_a/b`, `m2-glacier_brightness_a/b`, `m2-glacier_optical_a`, `m2-glacier_motion_a` |
| Delta | `m3-delta_moisture_a/b`, `m3-delta_water_a/b`, `m3-delta_brightness_a`, `m3-delta_optical_a`, `m3-delta_stability_a` |
| Foundations | `m4-foundations_motion_a`, `m4-foundations_stability_a`, `m4-foundations_optical_a`, `m4-foundations_water_a`, `m4-foundations_brightness_a` |

Regenerate them with:

```bash
python3 scripts/generate_game_images.py
```

## Recommended next step

Decide whether the next milestone is:

1. **Demo polish:** keep illustrations, finish editorial review, and add the
   authoring/judge docs; or
2. **Data-backed release:** source real NISAR crops and metadata first, then
   replace the illustration assets and badges.

Do not mix generated art with a “Real NISAR data” claim. The current labels are
intentionally honest until real data is supplied.

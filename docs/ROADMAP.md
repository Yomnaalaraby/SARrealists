# SARrealists Roadmap — Data Explorer and Captain DIO

_Last updated: 2026-11-14_

This document saves the agreed direction while the NISAR product archive is
still being processed. It covers two workstreams:

1. The map-first data explorer and data-analysis page.
2. The Captain DIO story treatment.

The current game remains playable while these changes are built.

---

# Part A — Map-first data explorer

## Decision

Use **MapLibre GL JS** for the data explorer. Do not add another map engine.

The repository already depends on `maplibre-gl` and has
`src/components/map/NISARMapViewer.tsx`. Extend that viewer instead of building
a second map stack. Mapbox can remain for the landing-page globe if desired.

## Why MapLibre

- Local raster tiles in EPSG:3857
- GeoJSON vectors in EPSG:4326
- Hover/click events with `lngLat`
- `RasterTileSource.setTiles()` for date and polarization changes
- No Mapbox token required for the data layer
- Already present in the project

## Expected data mapping

```text
out/{site}/
  catalog.json                 -> site config, layers, dates, bounds, legends
  tiles/{layer}/{date}/{z}/{x}/{y}.png
                               -> interactive raster layer
  vectors/*.geojson            -> line/fill overlays
  grids/cursor_grid_{date}.json
                               -> nearest-cell hover values
  timeseries/points.json       -> clickable chart pins
  plots/monthly/*.png          -> report/export figures
  plots/heatmap_clean/*.png    -> legends/export, not the primary map layer
  plots/pol_freq_explorer_*.png
                               -> comparison figure, not the primary map layer
  qa_preview.png               -> QA/documentation only
```

## Explorer UX

```text
Site landing
  -> short dialogue
  -> “Show me the site”
  -> MapLibre flies to the site
  -> default product + latest date
  -> time scrubber and play/pause
  -> hover/tap values
  -> “Explore all products” reveals product/polarization controls
  -> “Analyze this site” opens the analysis view
```

Default products:

| Site | Default product |
| --- | --- |
| California | Burn scar / vegetation change + optical context |
| Himalaya | Glacier velocity + coherence |
| Nile Delta | Soil moisture + surface water / subsidence |

## Controls

```text
Product:       Wildfire | Soil moisture | Subsidence | Glacier velocity | Water
Polarization:  VV | VH | HH | HV | RGB composite | Dual-frequency
Time:          previous | date scrubber | next | play
```

Rules:

- Product first, polarization second.
- Only show combinations present in the catalog.
- Keep the date and map extent when switching.
- Preload next/previous dates.
- Pause playback when the user pans, zooms, or opens a tooltip.
- Add a **Compare** mode for before/after or polarization comparison.

## Hover values

- Desktop: hover tooltip.
- Mobile: tap to pin a readout.
- Show product, date, polarization, value, units, and confidence.
- Load one `cursor_grid_{date}.json` at a time and cache it.
- Use nearest-cell lookup from the grid bounds.
- If grids are large, convert to compact binary or a small lookup endpoint.

## Data-analysis page

The analysis page should answer “what changed, why it matters, and what can we
not conclude?” It should not duplicate the map.

Sections:

1. Site snapshot: bounds, date range, passes, products, coverage.
2. Key indicators: burned area, soil-moisture anomaly, subsidence rate,
   glacier velocity, water extent, coherence.
3. Time-series charts: click a point to highlight that date on the map.
4. Product comparison: VV/VH, L-band/S-band, radar/optical, before/after.
5. “What this means”: decisions supported and limitations.
6. Data quality and provenance: dates, track, pixel spacing, polarizations,
   confidence, gaps, sources.
7. Export: CSV, report/PNG, shareable map URL.

## Hosting and Drive

- Code, catalog JSON, and a small demo subset: GitHub.
- Full tiles, grids, and archives: object storage/CDN such as Cloudflare R2,
  S3, Vercel Blob, or Supabase Storage.
- Drive: staging and ingestion only, not runtime tile hosting.
- The full `out/` tree should not be committed to GitHub.

The Google Drive connector is not currently authorized in this session. Once it
is enabled, or a shared folder link is provided, the archive can be downloaded
to the sandbox, inspected, and split into a small GitHub demo subset plus a
full object-storage upload.

## Pending input

- Actual `catalog.json` schema
- One sample tile, grid, vector, and points file
- Approximate archive size and tile count
- Public/private hosting decision
- Site ID normalization (`himalaya` vs `himalayas`, `nile_delta` vs `nile`)

---

# Part B — Captain DIO story treatment

## Premise

The colony ship **Aurelia Dawn** has been travelling for roughly **100
light-years**. Captain DIO and the crew wake from cryo-sleep and land on an
Earth-like world they call **Aurelia**. It appears uninhabited: no settlements,
no signals, no human activity. But the world is active and dangerous.

A mysterious carbon event has left the planet with:

- wildfires and burn scars
- moving glaciers and unstable ice
- wet, shifting river deltas
- subsiding ground

The crew has a NISAR-like radar satellite and the ship AI **LUMEN**. Their job
is to use radar products to choose safe landing routes, camps, farms, and
building sites before the crew reaches each hazard.

The player is the mission analyst helping DIO’s crew interpret the data.

## Narrative spine

### Act 1 — Arrival

- Cold open: ship log, 100 light-years, cryo wake-up.
- Captain DIO addresses the crew.
- LUMEN detects an anomalous carbon signature and several active hazards.
- Academy briefing teaches the core idea: radar sees through smoke, cloud, and
  darkness, but every product has limits.

### Act 2 — Four missions

| Mission | Hazard | Default evidence | Decision |
| --- | --- | --- | --- |
| 1 | Wildfire smoke over the landing basin | Brightness + water | Land, delay, or reroute |
| 2 | Moving glacier above the camp | Ice flow + stability | Take the ridge route, delay, or reroute |
| 3 | Wet delta fields and flood risk | Soil moisture + water | Farm now, delay, or move the fields |
| 4 | Soft ground under the first permanent building | Motion + stability | Build, delay, or move the foundation |

Each mission follows:

```text
briefing -> consult crew -> choose two lenses -> results -> decision
-> outcome -> reality check
```

Crew consultation is biased and imperfect. Injured crew become unavailable.
Nobody dies; injuries remove people from the rest of the mission.

### Act 3 — The pattern

LUMEN cross-matches the terrain, river channels, burn scars, and glacier
profiles against its Earth archive. The matches are too exact.

The carbon event is not alien. The hazard pattern is the pattern of a living
planet under stress. The crew’s star fix does not match the navigation log.

### Act 4 — The reveal

The “new planet” is Earth.

The 100-light-year route was a folded jump that brought the ship home. The
crew spent the mission preparing to survive a world they had never left.

The final message is not “we found a new planet.” It is:

> There is no Planet B. The only habitable world we have is the one we left.

The reveal should be emotional, not a gotcha. The data was real all along.

## Why the twist works

- It explains why the radar data matches Earth.
- It turns the hazards into a warning rather than alien set dressing.
- It makes the NISAR products matter: the crew needed them to protect people.
- It gives the player a clear call to action after the game: explore the real
  NISAR data and protect the real sites.

## Character and dialogue rules

- Keep Captain DIO, LUMEN, and the eight-person crew.
- Use the **medic** and **agronomist** for the doctor/farmer perspectives.
- Do not invent quotes from real native residents. If a local voice is needed,
  use a clearly fictional composite character or an archived Earth message.
- Keep dialogue short: 3–5 lines per beat, with a skip option.
- Let the cook provide one moment of humor; the medic and geologist carry the
  emotional weight.
- The crew can be wrong. The player’s job is to weigh evidence, not obey rank.

## Endings

| Ending | Condition | Tone |
| --- | --- | --- |
| The Pathfinder | All crew healthy, all best decisions | “We can live here.” Then the reveal. |
| The Guardian | Most crew healthy, most best decisions | “We can protect it.” |
| The Survivor | Colony survives, injuries visible | “We survived, but not without cost.” |
| LUMEN Protocol | Too many injured | LUMEN takes over; the warning remains. |

## Game-to-explorer handoff

After the mission report, the CTA opens the real data explorer:

```text
/data-explorer?site=himalaya&date=20261109&layer=velocity
```

The dialogue and game stay as they are; the explorer becomes the “live” view of
the sites the crew just analyzed.

## Confirmed decisions

- Folded-jump explanation: **confirmed**.
- Crew-led dialogue instead of invented native voices: **confirmed**.
- Opening arrival copy, four mission briefings, seven reveal beats, revised endings, and the new “Explore the real Earth data” CTA are implemented in the game content.
- Dedicated speaker-by-speaker dialogue screens with crew portraits are implemented for the opening and every mission briefing.

## Open questions

1. Keep the name **Captain DIO**, or rename to **Captain Dew**?
2. Is the 100-light-year journey a folded jump, a generation ship, or a
   simulation? The current treatment uses a folded jump so the literal Earth
   reveal remains coherent.
3. Should the carbon event be purely natural, human-caused, or left ambiguous
   until the reveal?
4. Do you want a voiced narrator, or text-only pixel cutscenes?
5. Should the four missions map exactly to California, Himalaya, Nile Delta,
   and Nile Delta coast, or should the fourth move to California fault motion?

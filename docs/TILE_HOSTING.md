# Tile hosting and frontend wiring

## Where the tiles are

The 285 COGs are **not** in this repository. They live in Google Drive:

```
nisar_outputs/<site>/cog/<layer>/<date>.tif
```

with `<site>` = `california`, `himalaya`, `nile_delta`. Note that they sit under
the top-level site folders, not under `out_web/<site>/cog/`.

They are 1.54 GB in total, in mixed projections (EPSG:32611 for California,
32644 for the Himalayas, 32635/32636 and eight EPSG:6933 files for the Nile),
20–160 m resolution, float32 with NaN nodata.

## Generated tiles (preview)

Generated with `scripts/render_webmercator_tiles.py --zoom 8-11`:

| Site | Layers | Size |
|---|---|---|
| california | 11 | 46 MB |
| himalaya | 11 | 75 MB |
| nile_delta | 13 | 353 MB |
| **total** | **35** | **474 MB / 17,017 files** |

Published to **https://mohamadadel510.github.io/SARrealists-tiles/** (GitHub
Pages, CORS `*`, `Cache-Control: max-age=600`).

```
https://mohamadadel510.github.io/SARrealists-tiles/<site>/tiles_<letter>/<layer>/<date>/{z}/{x}/{y}.png
https://mohamadadel510.github.io/SARrealists-tiles/<site>/tiles_<letter>/catalog.json
```

The repository behind it is
[`Mohamadadel510/SARrealists-tiles`](https://github.com/Mohamadadel510/SARrealists-tiles).

## Why z8–11

The source COGs are 20–160 m. At these latitudes z11 is already 3–13 m/px, so
higher zooms only upsample; z14 on the Nile AOI alone produced ~110–240 MB per
layer-date. GitHub Pages is capped at ~1 GB, which z8–11 fits with room to
spare.

If higher zooms are needed later, re-run with `--zoom 8-13` (California and
Himalaya) or `--zoom 8-12` (Nile) and move the output to object storage
(Cloudflare R2 free tier covers ~10 GB) instead of Pages.

## Regenerating

```bash
# 1. COGs (rclone remote already configured for the Drive account)
rclone copy manus_google_drive:nisar_outputs/california/cog out_web/california/cog --include "*.tif"
rclone copy manus_google_drive:nisar_outputs/himalaya/cog   out_web/himalaya/cog   --include "*.tif"
rclone copy manus_google_drive:nisar_outputs/nile_delta/cog out_web/nile_delta/cog --include "*.tif"
# catalog.json per site is needed for the colour ramps
rclone copyto manus_google_drive:nisar_outputs/out_web/california/catalog.json out_web/california/catalog.json

# 2. tiles
python3 scripts/render_webmercator_tiles.py \
  --sites california himalaya nile_delta --zoom 8-11 --processes 6

# 3. publish
git -C /path/to/tiles-repo add -A && git -C /path/to/tiles-repo commit -m "tiles" && git -C /path/to/tiles-repo push
```

`gdal2tiles` only accepts 8-bit input, so the script colorizes each float COG
with the catalog's `color_range`/`colormap` first, warps it to EPSG:3857 with
`gdalwarp`, verifies the result, tiles it, then prunes fully transparent tiles
and palette-quantizes the rest (about 2.2× smaller).

## Frontend

`MapComponent.tsx` reads `NEXT_PUBLIC_TILE_BASE_URL` and appends
`/<site>/tiles_<letter>/<layer>/<date>/{z}/{x}/{y}.png`. Dates are taken from
the per-site `catalog.json`, so the Nile RVI empty-date URL and the hardcoded
Himalayas change range are gone.

```bash
# .env.local
NEXT_PUBLIC_TILE_BASE_URL=https://mohamadadel510.github.io/SARrealists-tiles
```

Leave it empty to serve tiles from `public/` on the same origin.

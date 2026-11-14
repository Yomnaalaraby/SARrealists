#!/usr/bin/env python3
"""
Render Mapbox-ready XYZ tiles from the pipeline COGs, correctly.

What this fixes relative to the originally proposed snippet:
  * `gdal2tiles.py` has no `--webmercator` flag (it errors out); the projection
    is selected with `-p mercator` / `--profile=mercator`.
  * `gdal_translate -a_srs EPSG:3857` only *relabels* the CRS. It leaves the
    UTM easting/northing values untouched, so the raster is placed near
    3°E / 32°N (a "floating rectangle"). A real reprojection needs `gdalwarp`.
  * `--tmscompatible` is only valid for the `raster` profile; combining it with
    the mercator profile is rejected. `--xyz` already emits XYZ (Mapbox) order.
  * Zoom levels are capped by the source resolution instead of blindly
    generating z18 (which is ~3.7 TB of tiles for this project).

Usage (from repo root, after the pipeline has produced out_web/<site>/cog/):
  python3 scripts/render_webmercator_tiles.py \
      --sites california himalaya nile_delta \
      --zoom 8-14 --processes 4

  # only one layer / one date
  python3 scripts/render_webmercator_tiles.py --sites california \
      --layers hh_db --dates 20251124 --zoom 8-14

Output layout (matches what the frontend requests):
  public/<site>/tiles_<letter>/<layer>/<date>/{z}/{x}/{y}.png
"""
from __future__ import annotations

import argparse
import json
import math
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

SITE_LETTER = {
    "california": "c",
    "himalaya": "h",
    "himalayas": "h",
    "nile_delta": "n",
}

WEB_MERCATOR_RES_Z0 = 156543.03392804097  # metres/pixel at z0, equator


def run(cmd: list[str], **kw) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, check=True, text=True, capture_output=True, **kw)


def gdalinfo_json(path: Path) -> dict:
    return json.loads(run(["gdalinfo", "-json", str(path)]).stdout)


def epsg_of(path: Path) -> int | None:
    """Robust EPSG lookup through PROJ."""
    srs = run(["gdalsrsinfo", "-o", "epsg", str(path)]).stdout.strip()
    for token in srs.replace("\n", " ").split():
        if token.startswith("EPSG:") and token.split(":")[1].isdigit():
            return int(token.split(":")[1])
    return None


def max_zoom_for(info: dict, lat: float) -> int:
    """Largest zoom whose ground resolution is no finer than ~1.2x the source."""
    gt = info["geoTransform"]
    res = max(abs(gt[1]), abs(gt[5]))
    coslat = max(0.05, math.cos(math.radians(lat)))
    z = 0
    for zz in range(0, 23):
        if WEB_MERCATOR_RES_Z0 * coslat / (2 ** zz) >= res / 1.2:
            z = zz
        else:
            break
    return max(0, z)


def reproject_to_3857(src: Path, dst: Path) -> None:
    """Real reprojection (not -a_srs). Writes a tiled, deflated GeoTIFF."""
    run(
        [
            "gdalwarp",
            "-q",
            "-overwrite",
            "-t_srs", "EPSG:3857",
            "-r", "bilinear",
            "-of", "GTiff",
            "-co", "TILED=YES",
            "-co", "COMPRESS=DEFLATE",
            "-co", "BIGTIFF=IF_SAFER",
            str(src),
            str(dst),
        ]
    )
    info = gdalinfo_json(dst)
    epsg = epsg_of(dst)
    if epsg != 3857:
        raise RuntimeError(f"Reprojection check failed for {src}: got EPSG:{epsg}")


def render(src_3857: Path, out_dir: Path, zmin: int, zmax: int,
           processes: int, resampling: str, nodata: str | None) -> None:
    cmd = [
        "gdal2tiles.py",
        "-q",
        "--xyz",
        "--profile=mercator",
        f"--zoom={zmin}-{zmax}",
        f"--resampling={resampling}",
        f"--processes={processes}",
        "--tiledriver=PNG",
        "--tilesize=256",
    ]
    if nodata is not None:
        cmd.append(f"--srcnodata={nodata}")
    cmd += [str(src_3857), str(out_dir)]
    run(cmd)


def dir_size(path: Path) -> int:
    return sum(p.stat().st_size for p in path.rglob("*") if p.is_file())


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out-web", default="out_web", type=Path)
    ap.add_argument("--public", default="public", type=Path)
    ap.add_argument("--sites", nargs="+", default=list(SITE_LETTER))
    ap.add_argument("--layers", nargs="*", default=None,
                    help="Restrict to these layer directories (e.g. hh_db rvi).")
    ap.add_argument("--dates", nargs="*", default=None,
                    help="Restrict to these dates / date ranges (YYYYMMDD[_YYYYMMDD]).")
    ap.add_argument("--zoom", default="8-auto", help="'8-14', '8-auto' or '8-18'.")
    ap.add_argument("--resampling", default="bilinear",
                    choices=["average", "bilinear", "cubic", "near"])
    ap.add_argument("--processes", default=4, type=int)
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--keep-warped", action="store_true",
                    help="Keep the intermediate EPSG:3857 GeoTIFFs.")
    args = ap.parse_args()

    if shutil.which("gdalwarp") is None or shutil.which("gdal2tiles.py") is None:
        sys.exit("GDAL command line tools (gdalwarp, gdal2tiles.py) are required.")

    total_bytes = 0
    rendered = skipped = failed = 0
    tmp_root = Path(tempfile.mkdtemp(prefix="wm3857_"))

    for site in args.sites:
        letter = SITE_LETTER.get(site)
        if letter is None:
            print(f"[skip] unknown site {site}", file=sys.stderr)
            continue
        cog_root = args.out_web / site / "cog"
        if not cog_root.is_dir():
            print(f"[skip] no COG directory {cog_root}", file=sys.stderr)
            continue
        out_root = args.public / site / f"tiles_{letter}"

        for tif in sorted(cog_root.rglob("*.tif")):
            rel = tif.relative_to(cog_root)
            layer = rel.parts[0]
            date = tif.stem
            if args.layers and layer not in args.layers:
                continue
            if args.dates and date not in args.dates:
                continue

            out_dir = out_root / rel.parent / date
            if out_dir.exists() and any(out_dir.glob("*/*/*.png")) and not args.force:
                print(f"[skip] {site}/{rel} (exists)")
                skipped += 1
                continue

            t0 = time.time()
            try:
                info = gdalinfo_json(tif)
                epsg = epsg_of(tif)
                ring = info.get("wgs84Extent", {}).get("coordinates", [[[0, 0]]])[0]
                lat = sum(pt[1] for pt in ring) / max(1, len(ring))

                if args.zoom.endswith("-auto"):
                    zmin = int(args.zoom.split("-")[0])
                    zmax = max(zmin, max_zoom_for(info, lat))
                else:
                    zmin, zmax = (int(v) for v in args.zoom.split("-"))

                nodata = info["bands"][0].get("noDataValue")
                nodata_arg = repr(nodata) if nodata is not None else "nan"

                if epsg == 3857:
                    src_3857 = tif
                else:
                    src_3857 = tmp_root / f"{site}_{layer}_{date}_3857.tif"
                    reproject_to_3857(tif, src_3857)

                out_dir.parent.mkdir(parents=True, exist_ok=True)
                render(src_3857, out_dir, zmin, zmax, args.processes,
                       args.resampling, nodata_arg)

                size = dir_size(out_dir)
                total_bytes += size
                rendered += 1
                print(f"[ok]   {site}/{rel}  EPSG:{epsg}->3857  z{zmin}-{zmax}  "
                      f"{size / 1e6:.1f} MB  {time.time() - t0:.1f}s")
                if not args.keep_warped and src_3857 != tif:
                    src_3857.unlink(missing_ok=True)
            except subprocess.CalledProcessError as exc:
                failed += 1
                print(f"[fail] {site}/{rel}: {(exc.stderr or exc.stdout or '')[-400:]}",
                      file=sys.stderr)
            except Exception as exc:  # noqa: BLE001
                failed += 1
                print(f"[fail] {site}/{rel}: {exc}", file=sys.stderr)

    shutil.rmtree(tmp_root, ignore_errors=True)
    print(f"\nRendered {rendered}, skipped {skipped}, failed {failed}. "
          f"Total {total_bytes / 1e9:.2f} GB.")
    if total_bytes > 1e9:
        print("WARNING: output exceeds 1 GB; do not commit it to git. "
              "Serve from object storage / CDN instead.", file=sys.stderr)
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())

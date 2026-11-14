#!/usr/bin/env python3
"""
Render Mapbox-ready XYZ tiles from the pipeline COGs.

The pipeline writes calibrated float32 products (dB, RVI, mm, m/yr) in native
UTM (or EPSG:6933 for some SME2 layers). gdal2tiles only accepts 8-bit data,
so each raster is colorized to RGBA with the catalog's colour range and ramp
before it is warped to Web Mercator and cut into tiles.

What this fixes relative to the originally proposed snippet:
  * `gdal2tiles.py` has no `--webmercator` flag; the projection is chosen with
    `--profile=mercator`.
  * `gdal_translate -a_srs EPSG:3857` only relabels the CRS and leaves UTM
    coordinates in place, which is what produces the floating rectangle. A real
    reprojection needs `gdalwarp -t_srs EPSG:3857`; it is verified here.
  * `--tmscompatible` is only valid for the `raster` profile; `--xyz` already
    emits Mapbox XYZ order.
  * Float32 COGs are colorized first; gdal2tiles would otherwise refuse them.
  * Zoom levels are capped by the source resolution (`--zoom 8-auto`) instead
    of blindly generating z18.

Usage (from repo root, with out_web/<site>/cog/ and catalog.json present):
  python3 scripts/render_webmercator_tiles.py --zoom 8-14 --processes 4

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

import numpy as np
from osgeo import gdal
from matplotlib import colormaps

gdal.UseExceptions()

SITE_LETTER = {
    "california": "c",
    "himalaya": "h",
    "himalayas": "h",
    "nile_delta": "n",
}

DEFAULT_STYLE = {
    "hh_db": ([-22.0, 0.0], "gray"),
    "hv_db": ([-30.0, -8.0], "YlGn"),
    "rvi": ([0.0, 1.0], "YlGn"),
    "pol_ratio_db": ([-15.0, -2.0], "viridis"),
    "freq_diff_db": ([-4.0, 4.0], "coolwarm"),
    "hh_db_change": ([-6.0, 6.0], "RdBu"),
    "hv_db_change": ([-6.0, 6.0], "RdBu"),
    "rvi_change": ([-0.4, 0.4], "RdBu"),
    "los_disp_mm": ([-100.0, 100.0], "RdBu_r"),
    "vert_disp_mm": ([-120.0, 120.0], "RdBu_r"),
    "disp_rate_mm_yr": ([-50.0, 50.0], "RdBu_r"),
    "velocity_m_yr": ([0.0, 150.0], "plasma"),
    "velocity_dir_deg": ([0.0, 360.0], "hsv"),
    "soil_moisture": ([0.0, 1.0], "YlGnBu"),
}

WEB_MERCATOR_RES_Z0 = 156543.03392804097


def run(cmd: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, check=True, text=True, capture_output=True)


def gdalinfo_json(path: Path) -> dict:
    return json.loads(run(["gdalinfo", "-json", str(path)]).stdout)


def epsg_of(path: Path) -> int | None:
    out = run(["gdalsrsinfo", "-o", "epsg", str(path)]).stdout
    for token in out.replace("\n", " ").split():
        if token.startswith("EPSG:") and token.split(":")[1].isdigit():
            return int(token.split(":")[1])
    return None


def max_zoom_for(info: dict, lat: float) -> int:
    """Largest zoom with no more than ~2.5x upsampling of the source."""
    gt = info["geoTransform"]
    res = max(abs(gt[1]), abs(gt[5]))
    coslat = max(0.05, math.cos(math.radians(lat)))
    zmax = 0
    for z in range(0, 23):
        if WEB_MERCATOR_RES_Z0 * coslat / (2 ** z) >= res / 2.5:
            zmax = z
        else:
            break
    return zmax


def read_catalog(out_web: Path, site: str) -> dict:
    path = out_web / site / "catalog.json"
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text()).get("layers", {})
    except json.JSONDecodeError:
        return {}


def style_for(layer: str, catalog: dict) -> tuple[list[float], str]:
    meta = catalog.get(layer, {})
    rng = meta.get("color_range")
    cmap = meta.get("colormap")
    if rng and cmap:
        return [float(rng[0]), float(rng[1])], cmap
    return DEFAULT_STYLE.get(layer, ([0.0, 1.0], "viridis"))


def colorize(src: Path, dst: Path, vmin: float, vmax: float, cmap_name: str) -> None:
    """Write an RGBA GeoTIFF: colorized values, alpha=0 for nodata/NaN."""
    ds = gdal.Open(str(src))
    band = ds.GetRasterBand(1)
    arr = band.ReadAsArray().astype(np.float32)
    nodata = band.GetNoDataValue()
    valid = np.isfinite(arr)
    if nodata is not None and np.isfinite(nodata):
        valid &= arr != nodata
    denom = max(1e-9, vmax - vmin)
    normed = np.clip((arr[valid] - vmin) / denom, 0.0, 1.0)
    cmap = colormaps[cmap_name]
    rgba = np.zeros((arr.shape[0], arr.shape[1], 4), dtype=np.uint8)
    rgba[valid] = np.round(cmap(normed) * 255.0).astype(np.uint8)
    rgba[valid, 3] = 255

    drv = gdal.GetDriverByName("GTiff")
    out = drv.Create(str(dst), ds.RasterXSize, ds.RasterYSize, 4, gdal.GDT_Byte,
                     options=["TILED=YES", "COMPRESS=DEFLATE"])
    out.SetGeoTransform(ds.GetGeoTransform())
    out.SetProjection(ds.GetProjection())
    for i in range(4):
        out.GetRasterBand(i + 1).WriteArray(rgba[..., i])
    out.GetRasterBand(4).SetColorInterpretation(gdal.GCI_AlphaBand)
    out.FlushCache()
    out = None
    ds = None


def rgb_to_rgba(src: Path, dst: Path) -> None:
    """3-band Byte RGB -> RGBA with alpha from the union of the bands."""
    ds = gdal.Open(str(src))
    r, g, b = (ds.GetRasterBand(i).ReadAsArray() for i in (1, 2, 3))
    alpha = np.where((r != 0) | (g != 0) | (b != 0), 255, 0).astype(np.uint8)
    drv = gdal.GetDriverByName("GTiff")
    out = drv.Create(str(dst), ds.RasterXSize, ds.RasterYSize, 4, gdal.GDT_Byte,
                     options=["TILED=YES", "COMPRESS=DEFLATE"])
    out.SetGeoTransform(ds.GetGeoTransform())
    out.SetProjection(ds.GetProjection())
    for i, a in enumerate((r, g, b, alpha)):
        out.GetRasterBand(i + 1).WriteArray(a.astype(np.uint8))
    out.GetRasterBand(4).SetColorInterpretation(gdal.GCI_AlphaBand)
    out.FlushCache()
    out = None
    ds = None


def warp_to_3857(src: Path, dst: Path) -> None:
    gdal.Warp(
        str(dst), str(src),
        dstSRS="EPSG:3857",
        resampleAlg="bilinear",
        format="GTiff",
        creationOptions=["TILED=YES", "COMPRESS=DEFLATE", "BIGTIFF=IF_SAFER"],
    )
    epsg = epsg_of(dst)
    if epsg != 3857:
        raise RuntimeError(f"Reprojection check failed for {src}: got EPSG:{epsg}")


def render(src_3857: Path, out_dir: Path, zmin: int, zmax: int, processes: int) -> None:
    run([
        "gdal2tiles.py", "-q", "--xyz", "--profile=mercator",
        f"--zoom={zmin}-{zmax}", "--resampling=bilinear",
        f"--processes={processes}", "--tiledriver=PNG", "--tilesize=256",
        str(src_3857), str(out_dir),
    ])


def _is_empty(png: Path) -> bool:
    from PIL import Image
    try:
        with Image.open(png) as im:
            return im.mode == "RGBA" and im.getchannel("A").getextrema()[1] == 0
    except Exception:
        return False


def _quantize(batch: list[str]) -> None:
    subprocess.run(
        ["pngquant", "--quality=60-85", "--ext", ".png", "--force", *batch],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )


def prune_and_optimize(out_dir: Path, processes: int) -> None:
    """Drop fully transparent tiles and palette-quantize the rest, in parallel."""
    from concurrent.futures import ThreadPoolExecutor
    workers = max(1, processes)
    pngs = list(out_dir.rglob("*.png"))
    with ThreadPoolExecutor(workers) as pool:
        empty = list(pool.map(_is_empty, pngs))
    removed = 0
    for png, is_empty in zip(pngs, empty):
        if is_empty:
            png.unlink()
            removed += 1
    remaining = [str(p) for p, e in zip(pngs, empty) if not e]
    if remaining and shutil.which("pngquant"):
        batches = [remaining[i:i + 100] for i in range(0, len(remaining), 100)]
        with ThreadPoolExecutor(workers) as pool:
            list(pool.map(_quantize, batches))
    if removed:
        print(f"       pruned {removed} empty tiles", file=sys.stderr)


def write_tile_catalog(out_root: Path) -> None:
    """List the layers/dates actually present so the frontend can pick them."""
    layers: dict[str, list[str]] = {}
    if out_root.is_dir():
        for layer_dir in sorted(p for p in out_root.iterdir() if p.is_dir()):
            dates = sorted(
                d.name for d in layer_dir.iterdir()
                if d.is_dir() and any(d.glob("*/*/*.png"))
            )
            if dates:
                layers[layer_dir.name] = dates
    (out_root / "catalog.json").write_text(
        json.dumps({"layers": layers}, indent=1) + "\n"
    )


def dir_size(path: Path) -> int:
    return sum(p.stat().st_size for p in path.rglob("*") if p.is_file())


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out-web", default="out_web", type=Path)
    ap.add_argument("--public", default="public", type=Path)
    ap.add_argument("--sites", nargs="+", default=list(SITE_LETTER))
    ap.add_argument("--layers", nargs="*", default=None)
    ap.add_argument("--dates", nargs="*", default=None)
    ap.add_argument("--zoom", default="8-auto")
    ap.add_argument("--processes", default=4, type=int)
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--keep-warped", action="store_true")
    ap.add_argument("--no-optimize", action="store_true",
                    help="Skip transparent-tile pruning and pngquant.")
    args = ap.parse_args()

    if shutil.which("gdal2tiles.py") is None:
        sys.exit("gdal2tiles.py (GDAL command line tools) is required.")

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
        catalog = read_catalog(args.out_web, site)
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

                nbands = len(info["bands"])
                is_rgb = nbands == 3 and info["bands"][0]["type"] == "Byte"

                prepared = tmp_root / f"{site}_{layer}_{date}_rgba.tif"
                if is_rgb:
                    rgb_to_rgba(tif, prepared)
                else:
                    (vmin, vmax), cmap_name = style_for(layer, catalog)
                    colorize(tif, prepared, vmin, vmax, cmap_name)

                src_3857 = tmp_root / f"{site}_{layer}_{date}_3857.tif"
                warp_to_3857(prepared, src_3857)

                out_dir.parent.mkdir(parents=True, exist_ok=True)
                render(src_3857, out_dir, zmin, zmax, args.processes)
                if not args.no_optimize:
                    prune_and_optimize(out_dir, args.processes)

                size = dir_size(out_dir)
                total_bytes += size
                rendered += 1
                print(f"[ok]   {site}/{rel}  EPSG:{epsg}->3857  z{zmin}-{zmax}  "
                      f"{size / 1e6:.1f} MB  {time.time() - t0:.1f}s")
                if not args.keep_warped:
                    prepared.unlink(missing_ok=True)
                    src_3857.unlink(missing_ok=True)
            except subprocess.CalledProcessError as exc:
                failed += 1
                print(f"[fail] {site}/{rel}: {(exc.stderr or exc.stdout or '')[-400:]}",
                      file=sys.stderr)
            except Exception as exc:  # noqa: BLE001
                failed += 1
                print(f"[fail] {site}/{rel}: {exc}", file=sys.stderr)

        if out_root.is_dir():
            write_tile_catalog(out_root)

    shutil.rmtree(tmp_root, ignore_errors=True)
    print(f"\nRendered {rendered}, skipped {skipped}, failed {failed}. "
          f"Total {total_bytes / 1e9:.2f} GB.")
    if total_bytes > 1e9:
        print("WARNING: output exceeds 1 GB; do not commit it to git. "
              "Serve from object storage / CDN instead.", file=sys.stderr)
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())

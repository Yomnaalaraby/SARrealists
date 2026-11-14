#!/usr/bin/env python3
"""
CLI entrypoint for NISAR Space Apps preprocessing pipeline:
  python -m nisar_pipeline.run_site search  --site california --products GCOV GUNW
  python -m nisar_pipeline.run_site inspect --site nile_delta --products GUNW --idx 0
  python -m nisar_pipeline.run_site build   --site nile_delta --products GCOV GUNW SME2 --monthly
  python -m nisar_pipeline.run_site plot    --site nile_delta
"""
from __future__ import annotations

import argparse
import json
import logging
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple

import numpy as np
from pyproj import Transformer
import rasterio
import yaml

from nisar_pipeline.export_web import (
    export_rgb_xyz_png_tiles,
    export_subsidence_points_geojson,
    export_velocity_vectors_geojson,
    export_xyz_png_tiles,
)
from nisar_pipeline.gcov import (
    append_to_zarr_stack,
    compute_pairwise_change,
    compute_single_date_products,
    resolve_co_cross_pols,
    update_points_timeseries_json,
    write_float32_cog,
    write_rgb_cog,
)
from nisar_pipeline.goff import (
    GOFFWindow,
    clip_to_glacier_outlines,
    compute_velocity_vectors,
    load_goff_window,
)
from nisar_pipeline.gunw import (
    GUNWWindow,
    fit_robust_linear_rate_mm_yr,
    load_gunw_window,
    parse_pair_dates,
    process_gunw_stack,
)
from nisar_pipeline.io_nisar import (
    GranuleRecord,
    get_edl_token,
    group_by_track_frame,
    inspect_granule,
    print_search_table,
    run_with_h5_retry,
    search_nisar,
    select_primary_group,
)
from nisar_pipeline.layers import (
    SME2_PROJECTION,
    SME2_QUALITY_FLAG,
    SME2_SOIL_MOISTURE,
    SME2_X,
    SME2_Y,
    require_verified_layer,
)
from nisar_pipeline.plots import (
    HUMAN_LAYER_SPECS,
    enrich_catalog_with_human_labels,
    plot_clean_heatmaps_from_catalog,
    plot_human_friendly_guide,
    plot_monthly_phenomenon_png,
    plot_pol_and_freq_explorer,
)
from nisar_pipeline.window import (
    GCOVWindow,
    bbox_to_utm_slices,
    block_mean,
    coord_mean,
    load_gcov_window,
    read_epsg_from_projection,
)

logger = logging.getLogger("nisar_pipeline")


def load_config(config_path: Optional[Path] = None) -> Dict[str, Any]:
    """Load YAML pipeline configuration."""
    if config_path is None:
        config_path = Path(__file__).resolve().parent / "config.yaml"
    with open(config_path, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def utm_bounds_to_lonlat(x: np.ndarray, y: np.ndarray, epsg: int) -> List[float]:
    """Compute [west, south, east, north] in EPSG:4326 from 1D UTM coordinate arrays."""
    tr = Transformer.from_crs(epsg, 4326, always_xy=True)
    xmin, xmax = float(x.min()), float(x.max())
    ymin, ymax = float(y.min()), float(y.max())
    corners = [(xmin, ymin), (xmax, ymin), (xmax, ymax), (xmin, ymax)]
    lons, lats = zip(*[tr.transform(cx, cy) for cx, cy in corners])
    return [
        round(float(min(lons)), 6),
        round(float(min(lats)), 6),
        round(float(max(lons)), 6),
        round(float(max(lats)), 6),
    ]


def select_monthly_single_date_records(
    records: Sequence[GranuleRecord],
    max_dates: Optional[int] = None,
) -> List[GranuleRecord]:
    """
    Pick 1 representative granule per calendar month (YYYYMM), prioritizing
    highest AOI overlap % and latest pass within the month.
    """
    by_month: Dict[str, List[GranuleRecord]] = defaultdict(list)
    for rec in records:
        if "_0005_NADV_" in rec.file_name:
            continue
        by_month[rec.date_str[:6]].append(rec)

    selected: List[GranuleRecord] = []
    for ym in sorted(by_month.keys()):
        best_in_month = max(
            by_month[ym],
            key=lambda r: (round(r.aoi_overlap_pct, 1), r.time),
        )
        selected.append(best_in_month)

    if max_dates is not None and max_dates > 0:
        selected = selected[-max_dates:]
    return selected


def select_monthly_pair_records(
    records: Sequence[GranuleRecord],
    max_dates: Optional[int] = None,
    min_required: int = 1,
) -> List[GranuleRecord]:
    """
    Pre-filter GUNW / GOFF interferometric pair records BEFORE opening HDF5 files over HTTPS.
    """
    parsed: List[Tuple[str, str, float, GranuleRecord]] = []
    for rec in records:
        if "_0005_NADV_" in rec.file_name:
            continue
        try:
            ref_d, sec_d, dt_days = parse_pair_dates(
                rec.file_name, rec.time, rec.secondary_time
            )
            parsed.append((ref_d, sec_d, dt_days, rec))
        except Exception:
            parsed.append((rec.date_str, rec.date_str, 12.0, rec))

    if not parsed:
        return []

    parsed.sort(key=lambda item: (item[0], item[2], item[1]))
    chain: List[Tuple[str, str, float, GranuleRecord]] = [parsed[0]]
    for cand in parsed[1:]:
        prev = chain[-1]
        if cand[0] == prev[0]:
            continue
        if cand[0] >= prev[1]:
            chain.append(cand)

    by_month: Dict[str, Tuple[str, str, float, GranuleRecord]] = {}
    for item in chain:
        ym = item[1][:6]
        if ym not in by_month or item[2] < by_month[ym][2]:
            by_month[ym] = item

    monthly_chain = [by_month[ym][3] for ym in sorted(by_month.keys())]

    if len(monthly_chain) < min_required and len(chain) >= min_required:
        monthly_chain = [item[3] for item in chain[:min_required]]

    if max_dates is not None and max_dates > 0:
        monthly_chain = monthly_chain[-max_dates:]
    return monthly_chain


def update_catalog_json(
    catalog_path: Path,
    site_name: str,
    site_title: str,
    layer_entries: Dict[str, Dict[str, Any]],
) -> Path:
    """Create or update `out/<site>/catalog.json` and enrich with plain-English legend labels."""
    catalog_path.parent.mkdir(parents=True, exist_ok=True)
    catalog: Dict[str, Any] = {
        "site": site_name,
        "title": site_title,
        "updated_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "timestamps": [],
        "default_timestamp": None,
        "layers": {},
    }
    if catalog_path.exists():
        try:
            existing = json.loads(catalog_path.read_text(encoding="utf-8"))
            if isinstance(existing.get("layers"), dict):
                catalog["layers"] = existing["layers"]
        except Exception as exc:
            logger.warning("Overwriting unreadable catalog %s (%s)", catalog_path, exc)

    for layer_id, entry in layer_entries.items():
        catalog["layers"][layer_id] = entry

    all_dates = sorted(
        {
            d
            for meta in catalog["layers"].values()
            for d in meta.get("dates", [])
            if isinstance(d, str) and len(d) == 8 and d.isdigit()
        }
    )
    catalog["timestamps"] = all_dates
    catalog["default_timestamp"] = all_dates[-1] if all_dates else None

    catalog_path.write_text(json.dumps(catalog, indent=2), encoding="utf-8")
    enrich_catalog_with_human_labels(catalog_path)
    return catalog_path


def build_gcov_for_site(
    site_name: str,
    cfg: Dict[str, Any],
    records: Sequence[GranuleRecord],
    token: str,
    download: bool = False,
    max_dates: Optional[int] = None,
    monthly: bool = False,
) -> None:
    """
    Build all GCOV layers (hh_db, hv_db, rvi, pol_ratio_db, freq_diff_db, rgb_composite,
    plus hv_db_change, hh_db_change, rvi_change) across ALL focused timestamps.
    """
    site_cfg = cfg["sites"][site_name]
    site_title = site_cfg.get("title", site_name)
    bbox = site_cfg["bbox"]
    looks = int(site_cfg.get("looks", 2))
    invalid_mask_vals = cfg.get("gcov_defaults", {}).get("invalid_mask_values", [0, 255])
    stream_cfg = cfg.get("streaming", {})
    raw_dir = Path(cfg.get("raw_dir", "/content/nisar_raw"))
    site_out_dir = Path(cfg.get("out_dir", "out")) / site_name
    color_cfg = cfg.get("color_ranges", {})

    valid_records = [r for r in records if "_0005_NADV_" not in r.file_name] or list(records)
    group_key, group_records = select_primary_group(valid_records)
    track, frame, direction = group_key

    if monthly:
        group_records = select_monthly_single_date_records(group_records, max_dates=max_dates)
    elif max_dates is not None and max_dates > 0:
        group_records = group_records[-max_dates:]

    logger.info(
        "Building GCOV for site='%s' (monthly=%s) on group (track=%d, frame=%d, dir=%s) with %d date(s): %s",
        site_name,
        monthly,
        track,
        frame,
        direction,
        len(group_records),
        [r.date_str for r in group_records],
    )

    first_window: Optional[GCOVWindow] = None
    bounds_lonlat: List[float] = list(bbox)
    epsg_code: int = int(site_cfg.get("expected_epsg") or 4326)

    all_gcov_keys = [
        "hh_db",
        "hv_db",
        "rvi",
        "pol_ratio_db",
        "freq_diff_db",
        "rgb_composite",
        "hv_db_change",
        "hh_db_change",
        "rvi_change",
    ]
    layer_dates: Dict[str, List[str]] = {k: [] for k in all_gcov_keys}
    layer_cog_paths: Dict[str, List[str]] = {k: [] for k in all_gcov_keys}
    layer_tile_templates: Dict[str, List[str]] = {k: [] for k in all_gcov_keys}
    layer_monthly_pngs: Dict[str, List[str]] = {k: [] for k in all_gcov_keys}
    layer_clean_pngs: Dict[str, List[str]] = {k: [] for k in all_gcov_keys}
    pol_flags_by_date: Dict[str, str] = {}

    for idx, rec in enumerate(group_records):
        if "_0005_NADV_" in rec.file_name:
            continue

        logger.info(
            "[%d/%d] Streaming GCOV window (Freq A + Freq B) for %s (%s)",
            idx + 1,
            len(group_records),
            rec.date_str,
            rec.file_name,
        )
        try:
            win: GCOVWindow = run_with_h5_retry(
                url_or_path=rec.url,
                token=token,
                download=download,
                raw_dir=raw_dir,
                max_tries=int(stream_cfg.get("max_retries", 6)),
                sleep_sec=float(stream_cfg.get("retry_sleep_sec", 10)),
                block_size_mb=int(stream_cfg.get("block_size_mb", 4)),
                reader_fn=lambda h5, r=rec: load_gcov_window(
                    h5,
                    bbox_lonlat=bbox,
                    looks=looks,
                    invalid_mask_values=invalid_mask_vals,
                    track=r.track,
                    frame=r.frame,
                    direction=r.direction,
                    time=r.time,
                    date_str=r.date_str,
                    file_name=r.file_name,
                    load_freq_b=True,
                ),
            )
        except Exception as exc:
            logger.error(
                "[%d/%d] Skipping granule %s on %s due to error: %s",
                idx + 1,
                len(group_records),
                rec.file_name,
                rec.time,
                exc,
            )
            continue

        prod = compute_single_date_products(win)
        co_key, cr_key = resolve_co_cross_pols(win.pols)
        epsg_code = win.epsg
        bounds_lonlat = utm_bounds_to_lonlat(win.x, win.y, win.epsg)
        pol_flags_by_date[rec.date_str] = prod["polarization_flag"]

        # 1. Export all single-date GCOV layers for this timestamp
        for layer_name, arr in prod["layers"].items():
            if not np.any(np.isfinite(arr)):
                continue

            cog_rel = Path("cog") / layer_name / f"{rec.date_str}.tif"
            write_float32_cog(
                arr=arr,
                x=win.x,
                y=win.y,
                epsg=win.epsg,
                out_path=site_out_dir / cog_rel,
                metadata={
                    "date": rec.date_str,
                    "time": rec.time,
                    "track": rec.track,
                    "frame": rec.frame,
                    "direction": rec.direction,
                    "polarization_flag": prod["polarization_flag"],
                    "freq_a_mhz": win.freq_a_mhz,
                    "freq_b_mhz": win.freq_b_mhz,
                },
            )
            append_to_zarr_stack(
                arr=arr,
                x=win.x,
                y=win.y,
                epsg=win.epsg,
                date_str=rec.date_str,
                layer_name=layer_name,
                zarr_path=site_out_dir / "stack" / f"{layer_name}.zarr",
                attrs={"track": rec.track, "frame": rec.frame, "direction": rec.direction},
            )

            c_meta = color_cfg.get(layer_name, {})
            tiles_rel = Path("tiles") / layer_name / rec.date_str
            if layer_name == "hh_db" and co_key:
                export_xyz_png_tiles(
                    arr=win.pols[co_key],
                    x=win.x,
                    y=win.y,
                    src_epsg=win.epsg,
                    tiles_dir=site_out_dir / tiles_rel,
                    vmin=float(c_meta.get("vmin", -22.0)),
                    vmax=float(c_meta.get("vmax", 0.0)),
                    cmap_name=str(c_meta.get("cmap", "gray")),
                    convert_linear_to_db_after=True,
                )
            elif layer_name == "hv_db" and cr_key:
                export_xyz_png_tiles(
                    arr=win.pols[cr_key],
                    x=win.x,
                    y=win.y,
                    src_epsg=win.epsg,
                    tiles_dir=site_out_dir / tiles_rel,
                    vmin=float(c_meta.get("vmin", -30.0)),
                    vmax=float(c_meta.get("vmax", -8.0)),
                    cmap_name=str(c_meta.get("cmap", "YlGn")),
                    convert_linear_to_db_after=True,
                )
            else:
                export_xyz_png_tiles(
                    arr=arr,
                    x=win.x,
                    y=win.y,
                    src_epsg=win.epsg,
                    tiles_dir=site_out_dir / tiles_rel,
                    vmin=float(c_meta.get("vmin", -4.0 if layer_name == "freq_diff_db" else 0.0)),
                    vmax=float(c_meta.get("vmax", 4.0 if layer_name == "freq_diff_db" else 1.0)),
                    cmap_name=str(c_meta.get("cmap", "coolwarm" if layer_name == "freq_diff_db" else "YlGn")),
                    convert_linear_to_db_after=False,
                )

            png_path = plot_monthly_phenomenon_png(
                arr=arr,
                x=win.x,
                y=win.y,
                epsg=win.epsg,
                layer_id=layer_name,
                date_str=rec.date_str,
                site_out_dir=site_out_dir,
                site_title=site_title,
            )
            clean_rel = f"plots/heatmap_clean/{layer_name}/{rec.date_str}.png"

            layer_dates[layer_name].append(rec.date_str)
            layer_cog_paths[layer_name].append(str(cog_rel))
            layer_tile_templates[layer_name].append(f"{tiles_rel}/{{z}}/{{x}}/{{y}}.png")
            layer_monthly_pngs[layer_name].append(str(png_path.relative_to(site_out_dir)))
            layer_clean_pngs[layer_name].append(clean_rel)

        # 2. Export 3-band Polarimetric RGB Composite COG + XYZ PNG tiles + monthly/clean PNGs
        rgb_cog_rel = Path("cog") / "rgb_composite" / f"{rec.date_str}.tif"
        write_rgb_cog(
            rgb_arr=prod["rgb"],
            x=win.x,
            y=win.y,
            epsg=win.epsg,
            out_path=site_out_dir / rgb_cog_rel,
            metadata={"date": rec.date_str, "polarization_flag": prod["polarization_flag"]},
        )
        rgb_tiles_rel = Path("tiles") / "rgb_composite" / rec.date_str
        export_rgb_xyz_png_tiles(
            rgb_arr=prod["rgb"],
            x=win.x,
            y=win.y,
            src_epsg=win.epsg,
            tiles_dir=site_out_dir / rgb_tiles_rel,
        )
        rgb_png_path = plot_monthly_phenomenon_png(
            arr=prod["rgb"],
            x=win.x,
            y=win.y,
            epsg=win.epsg,
            layer_id="rgb_composite",
            date_str=rec.date_str,
            site_out_dir=site_out_dir,
            site_title=site_title,
        )
        rgb_clean_rel = f"plots/heatmap_clean/rgb_composite/{rec.date_str}.png"
        layer_dates["rgb_composite"].append(rec.date_str)
        layer_cog_paths["rgb_composite"].append(str(rgb_cog_rel))
        layer_tile_templates["rgb_composite"].append(f"{rgb_tiles_rel}/{{z}}/{{x}}/{{y}}.png")
        layer_monthly_pngs["rgb_composite"].append(str(rgb_png_path.relative_to(site_out_dir)))
        layer_clean_pngs["rgb_composite"].append(rgb_clean_rel)

        # 3. Export 6-panel Polarization & Dual-Frequency Explorer for EVERY focused date
        plot_pol_and_freq_explorer(
            win=win,
            prod=prod,
            site_out_dir=site_out_dir,
            site_title=site_title,
        )

        # 4. Compute & export change maps for EVERY timestamp relative to baseline first_window
        if first_window is None:
            first_window = win
        elif win.date_str != first_window.date_str:
            try:
                change_res = compute_pairwise_change(first_window, win)
                for ch_name, ch_arr in change_res["layers"].items():
                    if not np.any(np.isfinite(ch_arr)):
                        continue
                    cog_rel = Path("cog") / ch_name / f"{rec.date_str}.tif"
                    write_float32_cog(
                        arr=ch_arr,
                        x=change_res["x"],
                        y=change_res["y"],
                        epsg=change_res["epsg"],
                        out_path=site_out_dir / cog_rel,
                        metadata={
                            "pre_date": first_window.date_str,
                            "post_date": rec.date_str,
                            "track": track,
                            "frame": frame,
                            "direction": direction,
                            "cross_pol_gap": change_res["cross_pol_gap"],
                        },
                    )
                    c_meta = color_cfg.get(ch_name, {})
                    tiles_rel = Path("tiles") / ch_name / rec.date_str
                    export_xyz_png_tiles(
                        arr=ch_arr,
                        x=change_res["x"],
                        y=change_res["y"],
                        src_epsg=change_res["epsg"],
                        tiles_dir=site_out_dir / tiles_rel,
                        vmin=float(c_meta.get("vmin", -6.0)),
                        vmax=float(c_meta.get("vmax", 6.0)),
                        cmap_name=str(c_meta.get("cmap", "RdBu")),
                    )
                    ch_png = plot_monthly_phenomenon_png(
                        arr=ch_arr,
                        x=change_res["x"],
                        y=change_res["y"],
                        epsg=change_res["epsg"],
                        layer_id=ch_name,
                        date_str=rec.date_str,
                        site_out_dir=site_out_dir,
                        site_title=site_title,
                    )
                    ch_clean_rel = f"plots/heatmap_clean/{ch_name}/{rec.date_str}.png"
                    layer_dates[ch_name].append(rec.date_str)
                    layer_cog_paths[ch_name].append(str(cog_rel))
                    layer_tile_templates[ch_name].append(f"{tiles_rel}/{{z}}/{{x}}/{{y}}.png")
                    layer_monthly_pngs[ch_name].append(str(ch_png.relative_to(site_out_dir)))
                    layer_clean_pngs[ch_name].append(ch_clean_rel)
            except Exception as exc:
                logger.warning("Skipping change export on %s: %s", rec.date_str, exc)

        sample_pts = site_cfg.get("sample_points", [])
        if sample_pts:
            update_points_timeseries_json(
                points_cfg=sample_pts,
                date_iso=rec.time[:10],
                layers=prod["layers"],
                x=win.x,
                y=win.y,
                epsg=win.epsg,
                out_json_path=site_out_dir / "timeseries" / "points.json",
            )

    catalog_entries: Dict[str, Dict[str, Any]] = {}
    for layer_name, dates in layer_dates.items():
        if not dates:
            continue
        c_meta = color_cfg.get(layer_name, {})
        entry: Dict[str, Any] = {
            "id": layer_name,
            "title": c_meta.get("title", layer_name),
            "units": c_meta.get("units", ""),
            "dates": dates,
            "bounds": bounds_lonlat,
            "crs": f"EPSG:{epsg_code}",
            "color_range": [c_meta.get("vmin", -25.0), c_meta.get("vmax", 0.0)],
            "colormap": c_meta.get("cmap", "viridis"),
            "cog_files": layer_cog_paths[layer_name],
            "tile_templates": layer_tile_templates[layer_name],
            "monthly_pngs": layer_monthly_pngs[layer_name],
            "heatmap_clean_pngs": layer_clean_pngs[layer_name],
            "clean_heatmap_pngs": layer_clean_pngs[layer_name],
            "track": track,
            "frame": frame,
            "direction": direction,
            "polarization_flags": pol_flags_by_date,
        }
        if layer_name not in ("rgb_composite", "hv_db_change", "hh_db_change", "rvi_change"):
            entry["zarr_stack"] = f"stack/{layer_name}.zarr"
        catalog_entries[layer_name] = entry

    update_catalog_json(
        catalog_path=site_out_dir / "catalog.json",
        site_name=site_name,
        site_title=site_title,
        layer_entries=catalog_entries,
    )
    plot_clean_heatmaps_from_catalog(site_out_dir, force=False)
    plot_human_friendly_guide(site_out_dir, show_inline=False)


def build_gunw_for_site(
    site_name: str,
    cfg: Dict[str, Any],
    records: Sequence[GranuleRecord],
    token: str,
    download: bool = False,
    max_dates: Optional[int] = None,
    monthly: bool = False,
) -> None:
    """Build GUNW coherence, cumulative LOS/vertical displacement, and per-date subsidence rate."""
    site_cfg = cfg["sites"][site_name]
    site_title = site_cfg.get("title", site_name)
    bbox = site_cfg["bbox"]
    looks = int(site_cfg.get("looks", 2))
    gunw_cfg = cfg.get("gunw_defaults", {})
    coh_thresh = float(
        site_cfg.get("coherence_threshold", gunw_cfg.get("coherence_threshold", 0.4))
    )
    wavelength_m = float(gunw_cfg.get("wavelength_m", 0.24))
    min_dates_rate = int(gunw_cfg.get("min_dates_for_rate", 3))
    flat_terrain = bool(site_cfg.get("flat_terrain", False))
    ref_box = site_cfg.get("reference_box")
    stream_cfg = cfg.get("streaming", {})
    raw_dir = Path(cfg.get("raw_dir", "/content/nisar_raw"))
    site_out_dir = Path(cfg.get("out_dir", "out")) / site_name
    color_cfg = cfg.get("color_ranges", {})

    group_key, group_records = select_primary_group(records)
    track, frame, direction = group_key

    if monthly:
        group_records = select_monthly_pair_records(
            group_records, max_dates=max_dates, min_required=min_dates_rate
        )
    elif max_dates is not None and max_dates > 0:
        group_records = group_records[-max_dates:]

    logger.info(
        "Building GUNW for site='%s' (monthly=%s) on group (track=%d, frame=%d, dir=%s) with %d pair(s).",
        site_name,
        monthly,
        track,
        frame,
        direction,
        len(group_records),
    )

    windows: List[GUNWWindow] = []
    for idx, rec in enumerate(group_records):
        logger.info("[%d/%d] Streaming GUNW window for %s", idx + 1, len(group_records), rec.file_name)
        win: GUNWWindow = run_with_h5_retry(
            url_or_path=rec.url,
            token=token,
            download=download,
            raw_dir=raw_dir,
            max_tries=int(stream_cfg.get("max_retries", 6)),
            sleep_sec=float(stream_cfg.get("retry_sleep_sec", 10)),
            block_size_mb=int(stream_cfg.get("block_size_mb", 4)),
            reader_fn=lambda h5, r=rec: load_gunw_window(
                h5,
                bbox_lonlat=bbox,
                looks=looks,
                coherence_threshold=coh_thresh,
                track=r.track,
                frame=r.frame,
                direction=r.direction,
                file_name=r.file_name,
                fallback_start=r.time,
                fallback_stop=r.secondary_time,
            ),
        )
        windows.append(win)

    stack_res = process_gunw_stack(
        windows=windows,
        ref_bbox_lonlat=ref_box,
        wavelength_m=wavelength_m,
        flat_terrain=flat_terrain,
        min_dates_for_rate=min_dates_rate,
    )

    x, y, epsg = stack_res["x"], stack_res["y"], stack_res["epsg"]
    dates: List[str] = stack_res["dates"]
    bounds_lonlat = utm_bounds_to_lonlat(x, y, epsg)
    catalog_entries: Dict[str, Dict[str, Any]] = {}

    los_cogs, los_tiles, los_pngs, los_clean = [], [], [], []
    coh_cogs, coh_tiles, coh_pngs, coh_clean = [], [], [], []
    rate_cogs, rate_tiles, rate_pngs, rate_clean, rate_dates = [], [], [], [], []

    c_los = color_cfg.get("los_disp_mm", {})
    c_coh = color_cfg.get("coherence", {})
    c_rate = color_cfg.get("disp_rate_mm_yr", {})
    dt0 = datetime.strptime(dates[0], "%Y%m%d")

    for i, d_str in enumerate(dates):
        arr = stack_res["cum_los_mm"][i]
        cog_rel = Path("cog") / "los_disp_mm" / f"{d_str}.tif"
        write_float32_cog(arr, x, y, epsg, site_out_dir / cog_rel, metadata={"date": d_str})
        append_to_zarr_stack(arr, x, y, epsg, d_str, "los_disp_mm", site_out_dir / "stack" / "los_disp_mm.zarr")
        tiles_rel = Path("tiles") / "los_disp_mm" / d_str
        export_xyz_png_tiles(
            arr=arr,
            x=x,
            y=y,
            src_epsg=epsg,
            tiles_dir=site_out_dir / tiles_rel,
            vmin=float(c_los.get("vmin", -100.0)),
            vmax=float(c_los.get("vmax", 100.0)),
            cmap_name=str(c_los.get("cmap", "RdBu_r")),
        )
        png_p = plot_monthly_phenomenon_png(
            arr, x, y, epsg, "los_disp_mm", d_str, site_out_dir, site_title
        )
        los_cogs.append(str(cog_rel))
        los_tiles.append(f"{tiles_rel}/{{z}}/{{x}}/{{y}}.png")
        los_pngs.append(str(png_p.relative_to(site_out_dir)))
        los_clean.append(f"plots/heatmap_clean/los_disp_mm/{d_str}.png")

        # Export coherence for every focused date
        coh_slice = stack_res["coherence_pairs"][min(i, len(stack_res["coherence_pairs"]) - 1)]
        coh_cog_rel = Path("cog") / "coherence" / f"{d_str}.tif"
        write_float32_cog(coh_slice, x, y, epsg, site_out_dir / coh_cog_rel, metadata={"date": d_str})
        coh_tiles_rel = Path("tiles") / "coherence" / d_str
        export_xyz_png_tiles(
            arr=coh_slice,
            x=x,
            y=y,
            src_epsg=epsg,
            tiles_dir=site_out_dir / coh_tiles_rel,
            vmin=float(c_coh.get("vmin", 0.0)),
            vmax=float(c_coh.get("vmax", 1.0)),
            cmap_name=str(c_coh.get("cmap", "magma")),
        )
        coh_p = plot_monthly_phenomenon_png(
            coh_slice, x, y, epsg, "coherence", d_str, site_out_dir, site_title
        )
        coh_cogs.append(str(coh_cog_rel))
        coh_tiles.append(f"{coh_tiles_rel}/{{z}}/{{x}}/{{y}}.png")
        coh_pngs.append(str(coh_p.relative_to(site_out_dir)))
        coh_clean.append(f"plots/heatmap_clean/coherence/{d_str}.png")

        # Export disp_rate_mm_yr at every step (i >= 1) so every period has its own rate map
        if i >= 1:
            elapsed_yr = max(
                12.0 / 365.25,
                (datetime.strptime(d_str, "%Y%m%d") - dt0).total_seconds() / (365.25 * 86400.0),
            )
            step_rate = (
                (arr / elapsed_yr).astype(np.float32)
                if i < 2
                else fit_robust_linear_rate_mm_yr(
                    dates[: i + 1], stack_res["cum_los_mm"][: i + 1], min_dates=2
                )
            )
            r_cog_rel = Path("cog") / "disp_rate_mm_yr" / f"{d_str}.tif"
            write_float32_cog(step_rate, x, y, epsg, site_out_dir / r_cog_rel, metadata={"date": d_str})
            r_tiles_rel = Path("tiles") / "disp_rate_mm_yr" / d_str
            export_xyz_png_tiles(
                arr=step_rate,
                x=x,
                y=y,
                src_epsg=epsg,
                tiles_dir=site_out_dir / r_tiles_rel,
                vmin=float(c_rate.get("vmin", -50.0)),
                vmax=float(c_rate.get("vmax", 50.0)),
                cmap_name=str(c_rate.get("cmap", "RdBu_r")),
            )
            r_p = plot_monthly_phenomenon_png(
                step_rate, x, y, epsg, "disp_rate_mm_yr", d_str, site_out_dir, site_title
            )
            rate_dates.append(d_str)
            rate_cogs.append(str(r_cog_rel))
            rate_tiles.append(f"{r_tiles_rel}/{{z}}/{{x}}/{{y}}.png")
            rate_pngs.append(str(r_p.relative_to(site_out_dir)))
            rate_clean.append(f"plots/heatmap_clean/disp_rate_mm_yr/{d_str}.png")

        sample_pts = site_cfg.get("sample_points", [])
        if sample_pts:
            date_iso = f"{d_str[:4]}-{d_str[4:6]}-{d_str[6:8]}"
            update_points_timeseries_json(
                points_cfg=sample_pts,
                date_iso=date_iso,
                layers={"los_disp_mm": arr, "coherence": coh_slice},
                x=x,
                y=y,
                epsg=epsg,
                out_json_path=site_out_dir / "timeseries" / "points.json",
            )

    catalog_entries["los_disp_mm"] = {
        "id": "los_disp_mm",
        "title": c_los.get("title", "Cumulative LOS Displacement"),
        "units": "mm",
        "dates": dates,
        "bounds": bounds_lonlat,
        "crs": f"EPSG:{epsg}",
        "color_range": [c_los.get("vmin", -100.0), c_los.get("vmax", 100.0)],
        "colormap": c_los.get("cmap", "RdBu_r"),
        "cog_files": los_cogs,
        "tile_templates": los_tiles,
        "monthly_pngs": los_pngs,
        "heatmap_clean_pngs": los_clean,
        "clean_heatmap_pngs": los_clean,
        "zarr_stack": "stack/los_disp_mm.zarr",
        "track": track,
        "frame": frame,
        "direction": direction,
    }
    catalog_entries["coherence"] = {
        "id": "coherence",
        "title": c_coh.get("title", "Interferometric Surface Stability (Coherence)"),
        "units": "unitless",
        "dates": dates,
        "bounds": bounds_lonlat,
        "crs": f"EPSG:{epsg}",
        "color_range": [c_coh.get("vmin", 0.0), c_coh.get("vmax", 1.0)],
        "colormap": c_coh.get("cmap", "magma"),
        "cog_files": coh_cogs,
        "tile_templates": coh_tiles,
        "monthly_pngs": coh_pngs,
        "heatmap_clean_pngs": coh_clean,
        "clean_heatmap_pngs": coh_clean,
        "track": track,
        "frame": frame,
        "direction": direction,
    }

    if stack_res["cum_vert_mm"] is not None:
        vert_cogs, vert_tiles, vert_pngs, vert_clean = [], [], [], []
        c_vert = color_cfg.get("vert_disp_mm", {})
        for i, d_str in enumerate(dates):
            v_arr = stack_res["cum_vert_mm"][i]
            cog_rel = Path("cog") / "vert_disp_mm" / f"{d_str}.tif"
            write_float32_cog(v_arr, x, y, epsg, site_out_dir / cog_rel, metadata={"date": d_str})
            tiles_rel = Path("tiles") / "vert_disp_mm" / d_str
            export_xyz_png_tiles(
                arr=v_arr,
                x=x,
                y=y,
                src_epsg=epsg,
                tiles_dir=site_out_dir / tiles_rel,
                vmin=float(c_vert.get("vmin", -120.0)),
                vmax=float(c_vert.get("vmax", 120.0)),
                cmap_name=str(c_vert.get("cmap", "RdBu_r")),
            )
            v_png = plot_monthly_phenomenon_png(
                v_arr, x, y, epsg, "vert_disp_mm", d_str, site_out_dir, site_title
            )
            vert_cogs.append(str(cog_rel))
            vert_tiles.append(f"{tiles_rel}/{{z}}/{{x}}/{{y}}.png")
            vert_pngs.append(str(v_png.relative_to(site_out_dir)))
            vert_clean.append(f"plots/heatmap_clean/vert_disp_mm/{d_str}.png")
        catalog_entries["vert_disp_mm"] = {
            "id": "vert_disp_mm",
            "title": c_vert.get("title", "Cumulative Vertical Displacement"),
            "units": "mm",
            "dates": dates,
            "bounds": bounds_lonlat,
            "crs": f"EPSG:{epsg}",
            "color_range": [c_vert.get("vmin", -120.0), c_vert.get("vmax", 120.0)],
            "colormap": c_vert.get("cmap", "RdBu_r"),
            "cog_files": vert_cogs,
            "tile_templates": vert_tiles,
            "monthly_pngs": vert_pngs,
            "heatmap_clean_pngs": vert_clean,
            "clean_heatmap_pngs": vert_clean,
            "track": track,
            "frame": frame,
            "direction": direction,
        }

    vec_rel = Path("vectors") / "subsidence_rates.geojson"
    export_subsidence_points_geojson(
        rate_mm_yr=stack_res["rate_mm_yr"],
        cum_disp_mm=stack_res["cum_los_mm"][-1],
        x=x,
        y=y,
        epsg=epsg,
        out_geojson_path=site_out_dir / vec_rel,
    )
    catalog_entries["disp_rate_mm_yr"] = {
        "id": "disp_rate_mm_yr",
        "title": c_rate.get("title", "Linear Displacement Rate"),
        "units": "mm/yr",
        "dates": rate_dates,
        "bounds": bounds_lonlat,
        "crs": f"EPSG:{epsg}",
        "color_range": [c_rate.get("vmin", -50.0), c_rate.get("vmax", 50.0)],
        "colormap": c_rate.get("cmap", "RdBu_r"),
        "cog_files": rate_cogs,
        "tile_templates": rate_tiles,
        "monthly_pngs": rate_pngs,
        "heatmap_clean_pngs": rate_clean,
        "clean_heatmap_pngs": rate_clean,
        "vector_file": str(vec_rel),
        "track": track,
        "frame": frame,
        "direction": direction,
    }

    update_catalog_json(site_out_dir / "catalog.json", site_name, site_title, catalog_entries)
    plot_clean_heatmaps_from_catalog(site_out_dir, force=False)
    plot_human_friendly_guide(site_out_dir, show_inline=False)


def build_goff_for_site(
    site_name: str,
    cfg: Dict[str, Any],
    records: Sequence[GranuleRecord],
    token: str,
    download: bool = False,
    max_dates: Optional[int] = None,
    monthly: bool = False,
) -> None:
    """Build GOFF glacier surface speed, direction, RGI-clipped rasters, monthly/clean PNGs, and vector GeoJSON."""
    site_cfg = cfg["sites"][site_name]
    site_title = site_cfg.get("title", site_name)
    bbox = site_cfg["bbox"]
    looks = int(site_cfg.get("looks", 2))
    rgi_geojson = site_cfg.get("rgi_geojson")
    stream_cfg = cfg.get("streaming", {})
    raw_dir = Path(cfg.get("raw_dir", "/content/nisar_raw"))
    site_out_dir = Path(cfg.get("out_dir", "out")) / site_name
    color_cfg = cfg.get("color_ranges", {})

    group_key, group_records = select_primary_group(records)
    track, frame, direction = group_key

    if monthly:
        group_records = select_monthly_pair_records(group_records, max_dates=max_dates, min_required=1)
    elif max_dates is not None and max_dates > 0:
        group_records = group_records[-max_dates:]

    logger.info(
        "Building GOFF for site='%s' (monthly=%s) on group (track=%d, frame=%d, dir=%s) with %d pair(s).",
        site_name,
        monthly,
        track,
        frame,
        direction,
        len(group_records),
    )

    speed_cogs, speed_tiles, speed_pngs, speed_clean, pair_dates = [], [], [], [], []
    bounds_lonlat: List[float] = list(bbox)
    epsg_code: int = int(site_cfg.get("expected_epsg") or 4326)
    vec_rel = Path("vectors") / "glacier_velocity.geojson"
    c_vel = color_cfg.get("velocity_m_yr", {})

    for idx, rec in enumerate(group_records):
        logger.info("[%d/%d] Streaming GOFF window for %s", idx + 1, len(group_records), rec.file_name)
        win: GOFFWindow = run_with_h5_retry(
            url_or_path=rec.url,
            token=token,
            download=download,
            raw_dir=raw_dir,
            max_tries=int(stream_cfg.get("max_retries", 6)),
            sleep_sec=float(stream_cfg.get("retry_sleep_sec", 10)),
            block_size_mb=int(stream_cfg.get("block_size_mb", 4)),
            reader_fn=lambda h5, r=rec: load_goff_window(
                h5,
                bbox_lonlat=bbox,
                looks=looks,
                track=r.track,
                frame=r.frame,
                direction=r.direction,
                file_name=r.file_name,
                fallback_start=r.time,
                fallback_stop=r.secondary_time,
            ),
        )
        inc_used: np.ndarray | float = win.incidence_angle if win.incidence_angle is not None else 38.0
        vel = compute_velocity_vectors(
            slant_range_offset_m=win.slant_range_offset,
            along_track_offset_m=win.along_track_offset,
            dt_days=win.dt_days,
            incidence_angle_deg=inc_used,
            flight_direction=win.direction or direction,
        )
        clipped, x_c, y_c = clip_to_glacier_outlines(vel, win.x, win.y, win.epsg, rgi_geojson)
        epsg_code = win.epsg
        bounds_lonlat = utm_bounds_to_lonlat(x_c, y_c, epsg_code)
        date_key = win.sec_date

        spd_cog_rel = Path("cog") / "velocity_m_yr" / f"{date_key}.tif"
        write_float32_cog(clipped["speed_m_yr"], x_c, y_c, epsg_code, site_out_dir / spd_cog_rel)
        dir_cog_rel = Path("cog") / "velocity_dir_deg" / f"{date_key}.tif"
        write_float32_cog(clipped["direction_deg"], x_c, y_c, epsg_code, site_out_dir / dir_cog_rel)

        tiles_rel = Path("tiles") / "velocity_m_yr" / date_key
        export_xyz_png_tiles(
            arr=clipped["speed_m_yr"],
            x=x_c,
            y=y_c,
            src_epsg=epsg_code,
            tiles_dir=site_out_dir / tiles_rel,
            vmin=float(c_vel.get("vmin", 0.0)),
            vmax=float(c_vel.get("vmax", 150.0)),
            cmap_name=str(c_vel.get("cmap", "plasma")),
        )
        vel_png = plot_monthly_phenomenon_png(
            clipped["speed_m_yr"], x_c, y_c, epsg_code, "velocity_m_yr", date_key, site_out_dir, site_title
        )

        export_velocity_vectors_geojson(
            v_east_m_yr=clipped["v_east_m_yr"],
            v_north_m_yr=clipped["v_north_m_yr"],
            speed_m_yr=clipped["speed_m_yr"],
            direction_deg=clipped["direction_deg"],
            x=x_c,
            y=y_c,
            epsg=epsg_code,
            out_geojson_path=site_out_dir / vec_rel,
        )
        speed_cogs.append(str(spd_cog_rel))
        speed_tiles.append(f"{tiles_rel}/{{z}}/{{x}}/{{y}}.png")
        speed_pngs.append(str(vel_png.relative_to(site_out_dir)))
        speed_clean.append(f"plots/heatmap_clean/velocity_m_yr/{date_key}.png")
        pair_dates.append(date_key)

    catalog_entries = {
        "velocity_m_yr": {
            "id": "velocity_m_yr",
            "title": c_vel.get("title", "Glacier Surface Speed"),
            "units": "m/yr",
            "dates": pair_dates,
            "bounds": bounds_lonlat,
            "crs": f"EPSG:{epsg_code}",
            "color_range": [c_vel.get("vmin", 0.0), c_vel.get("vmax", 150.0)],
            "colormap": c_vel.get("cmap", "plasma"),
            "cog_files": speed_cogs,
            "tile_templates": speed_tiles,
            "monthly_pngs": speed_pngs,
            "heatmap_clean_pngs": speed_clean,
            "clean_heatmap_pngs": speed_clean,
            "vector_file": str(vec_rel),
            "track": track,
            "frame": frame,
            "direction": direction,
        }
    }
    update_catalog_json(site_out_dir / "catalog.json", site_name, site_title, catalog_entries)
    plot_clean_heatmaps_from_catalog(site_out_dir, force=False)
    plot_human_friendly_guide(site_out_dir, show_inline=False)


def build_sme2_for_site(
    site_name: str,
    cfg: Dict[str, Any],
    records: Sequence[GranuleRecord],
    token: str,
    download: bool = False,
    max_dates: Optional[int] = None,
    monthly: bool = False,
) -> None:
    """Build L3 SME2 volumetric soil moisture COGs, Zarr stack, tiles, monthly/clean PNGs, and time series."""
    require_verified_layer(SME2_SOIL_MOISTURE, product="SME2")
    require_verified_layer(SME2_QUALITY_FLAG, product="SME2")
    site_cfg = cfg["sites"][site_name]
    site_title = site_cfg.get("title", site_name)
    bbox = site_cfg["bbox"]
    looks = int(site_cfg.get("looks", 1))
    stream_cfg = cfg.get("streaming", {})
    raw_dir = Path(cfg.get("raw_dir", "/content/nisar_raw"))
    site_out_dir = Path(cfg.get("out_dir", "out")) / site_name
    color_cfg = cfg.get("color_ranges", {})

    group_key, group_records = select_primary_group(records)
    track, frame, direction = group_key

    if monthly:
        group_records = select_monthly_single_date_records(group_records, max_dates=max_dates)
    elif max_dates is not None and max_dates > 0:
        group_records = group_records[-max_dates:]

    logger.info(
        "Building SME2 for site='%s' (monthly=%s) on group (track=%d, frame=%d, dir=%s) with %d date(s).",
        site_name,
        monthly,
        track,
        frame,
        direction,
        len(group_records),
    )

    sm_cogs, sm_tiles, sm_pngs, sm_clean, sm_dates = [], [], [], [], []
    bounds_lonlat: List[float] = list(bbox)
    epsg_code: int = 6933
    c_sm = color_cfg.get("soil_moisture", {})

    for idx, rec in enumerate(group_records):
        logger.info("[%d/%d] Streaming SME2 window for %s", idx + 1, len(group_records), rec.file_name)

        def _read_sm(h5: Any) -> Any:
            x_full = h5[SME2_X][:]
            y_full = h5[SME2_Y][:]
            epsg = read_epsg_from_projection(h5[SME2_PROJECTION])
            sy, sx, _ = bbox_to_utm_slices(x_full, y_full, bbox, epsg)
            sm = np.asarray(h5[SME2_SOIL_MOISTURE][sy, sx], dtype=np.float32)
            bad = ~np.isfinite(sm) | (sm <= 0.0) | (sm > 1.0)
            if SME2_QUALITY_FLAG in h5:
                qflag = np.asarray(h5[SME2_QUALITY_FLAG][sy, sx])
                bad |= qflag != 0
            sm[bad] = np.nan
            return block_mean(sm, looks), coord_mean(x_full[sx], looks), coord_mean(y_full[sy], looks), epsg

        sm_arr, x_w, y_w, epsg_code = run_with_h5_retry(
            url_or_path=rec.url,
            reader_fn=_read_sm,
            token=token,
            download=download,
            raw_dir=raw_dir,
            max_tries=int(stream_cfg.get("max_retries", 6)),
            sleep_sec=float(stream_cfg.get("retry_sleep_sec", 10)),
            block_size_mb=int(stream_cfg.get("block_size_mb", 4)),
        )
        bounds_lonlat = utm_bounds_to_lonlat(x_w, y_w, epsg_code)
        cog_rel = Path("cog") / "soil_moisture" / f"{rec.date_str}.tif"
        write_float32_cog(sm_arr, x_w, y_w, epsg_code, site_out_dir / cog_rel)
        append_to_zarr_stack(sm_arr, x_w, y_w, epsg_code, rec.date_str, "soil_moisture", site_out_dir / "stack" / "soil_moisture.zarr")

        tiles_rel = Path("tiles") / "soil_moisture" / rec.date_str
        export_xyz_png_tiles(
            arr=sm_arr,
            x=x_w,
            y=y_w,
            src_epsg=epsg_code,
            tiles_dir=site_out_dir / tiles_rel,
            vmin=float(c_sm.get("vmin", 0.02)),
            vmax=float(c_sm.get("vmax", 0.50)),
            cmap_name=str(c_sm.get("cmap", "YlGnBu")),
        )
        sm_png = plot_monthly_phenomenon_png(
            sm_arr, x_w, y_w, epsg_code, "soil_moisture", rec.date_str, site_out_dir, site_title
        )
        sm_cogs.append(str(cog_rel))
        sm_tiles.append(f"{tiles_rel}/{{z}}/{{x}}/{{y}}.png")
        sm_pngs.append(str(sm_png.relative_to(site_out_dir)))
        sm_clean.append(f"plots/heatmap_clean/soil_moisture/{rec.date_str}.png")
        sm_dates.append(rec.date_str)

        sample_pts = site_cfg.get("sample_points", [])
        if sample_pts:
            update_points_timeseries_json(
                points_cfg=sample_pts,
                date_iso=rec.time[:10],
                layers={"soil_moisture": sm_arr},
                x=x_w,
                y=y_w,
                epsg=epsg_code,
                out_json_path=site_out_dir / "timeseries" / "points.json",
            )

    update_catalog_json(
        site_out_dir / "catalog.json",
        site_name,
        site_title,
        {
            "soil_moisture": {
                "id": "soil_moisture",
                "title": c_sm.get("title", "Volumetric Soil Moisture"),
                "units": "m3/m3",
                "dates": sm_dates,
                "bounds": bounds_lonlat,
                "crs": f"EPSG:{epsg_code}",
                "color_range": [c_sm.get("vmin", 0.02), c_sm.get("vmax", 0.50)],
                "colormap": c_sm.get("cmap", "YlGnBu"),
                "cog_files": sm_cogs,
                "tile_templates": sm_tiles,
                "monthly_pngs": sm_pngs,
                "heatmap_clean_pngs": sm_clean,
                "clean_heatmap_pngs": sm_clean,
                "zarr_stack": "stack/soil_moisture.zarr",
                "track": track,
                "frame": frame,
                "direction": direction,
            }
        },
    )
    plot_clean_heatmaps_from_catalog(site_out_dir, force=False)
    plot_human_friendly_guide(site_out_dir, show_inline=False)


def synthesize_missing_monthly_from_existing_cogs(site_out_dir: Path) -> None:
    """
    Synthesize any missing monthly COGs (hv_db, pol_ratio_db, *_change, disp_rate_mm_yr)
    directly from existing COGs on disk and regenerate all clean heatmaps + non-overlapping plots.
    """
    cat_path = site_out_dir / "catalog.json"
    if not cat_path.exists():
        return

    catalog = json.loads(cat_path.read_text(encoding="utf-8"))
    site_title = catalog.get("title", site_out_dir.name)
    layers = catalog.get("layers", {})

    def _read_cog(p: Path) -> Tuple[np.ndarray, np.ndarray, np.ndarray, int]:
        with rasterio.open(p) as src:
            epsg = src.crs.to_epsg() or 32636
            b = src.bounds
            x = np.linspace(b.left, b.right, src.width, dtype=np.float64)
            y = np.linspace(b.top, b.bottom, src.height, dtype=np.float64)
            arr = src.read([1, 2, 3]) if src.count == 3 else src.read(1).astype(np.float32)
        return arr, x, y, epsg

    # 1. Reconstruct missing hv_db / pol_ratio_db from hh_db + rvi
    hh_dir = site_out_dir / "cog" / "hh_db"
    if hh_dir.exists():
        for hh_p in sorted(hh_dir.glob("*.tif")):
            d_str = hh_p.stem
            rvi_p = site_out_dir / "cog" / "rvi" / f"{d_str}.tif"
            hv_p = site_out_dir / "cog" / "hv_db" / f"{d_str}.tif"
            pr_p = site_out_dir / "cog" / "pol_ratio_db" / f"{d_str}.tif"
            if hh_p.exists() and (hv_p.exists() or rvi_p.exists()):
                hh_arr, x, y, epsg = _read_cog(hh_p)
                if hv_p.exists():
                    hv_arr, _, _, _ = _read_cog(hv_p)
                    pr_arr = (hv_arr - hh_arr).astype(np.float32)
                else:
                    rvi_arr, _, _, _ = _read_cog(rvi_p)
                    valid = np.isfinite(hh_arr) & np.isfinite(rvi_arr) & (rvi_arr > 0.01) & (rvi_arr < 0.99)
                    pr_arr = np.full_like(hh_arr, np.nan, dtype=np.float32)
                    pr_arr[valid] = 10.0 * np.log10(rvi_arr[valid] / (4.0 - rvi_arr[valid]))
                    hv_arr = (hh_arr + pr_arr).astype(np.float32)
                    write_float32_cog(hv_arr, x, y, epsg, hv_p, metadata={"date": d_str})
                if not pr_p.exists():
                    write_float32_cog(pr_arr, x, y, epsg, pr_p, metadata={"date": d_str})

    # 2. Reconstruct monthly change COGs (hh_db_change, hv_db_change, rvi_change)
    for base_lid, ch_lid in [("hh_db", "hh_db_change"), ("hv_db", "hv_db_change"), ("rvi", "rvi_change")]:
        b_dir = site_out_dir / "cog" / base_lid
        if b_dir.exists():
            src_cogs = sorted(b_dir.glob("*.tif"))
            if len(src_cogs) >= 2:
                ch_dir = site_out_dir / "cog" / ch_lid
                if ch_dir.exists():
                    for old_f in ch_dir.glob("*_*.tif"):
                        old_f.unlink()
                base_arr, _, _, epsg = _read_cog(src_cogs[0])
                for post_cog in src_cogs[1:]:
                    d_str = post_cog.stem
                    post_arr, px, py, _ = _read_cog(post_cog)
                    h = min(base_arr.shape[0], post_arr.shape[0])
                    w = min(base_arr.shape[1], post_arr.shape[1])
                    diff_arr = (post_arr[:h, :w] - base_arr[:h, :w]).astype(np.float32)
                    write_float32_cog(diff_arr, px[:w], py[:h], epsg, ch_dir / f"{d_str}.tif", metadata={"date": d_str})

    # 3. Reconstruct monthly disp_rate_mm_yr COGs from los_disp_mm COGs
    los_dir = site_out_dir / "cog" / "los_disp_mm"
    if los_dir.exists():
        los_cogs = sorted(los_dir.glob("*.tif"))
        if len(los_cogs) >= 2:
            rate_dir = site_out_dir / "cog" / "disp_rate_mm_yr"
            if rate_dir.exists():
                for old_f in rate_dir.glob("*_*.tif"):
                    old_f.unlink()
            los_dates = [p.stem for p in los_cogs]
            dt0 = datetime.strptime(los_dates[0], "%Y%m%d")
            stack_list = []
            rx, ry, r_epsg = None, None, 32636
            for i, p in enumerate(los_cogs):
                arr, x, y, epsg = _read_cog(p)
                if rx is None:
                    rx, ry, r_epsg = x, y, epsg
                h, w = min(len(ry), arr.shape[0]), min(len(rx), arr.shape[1])
                stack_list.append(arr[:h, :w])
                if i >= 1:
                    d_str = los_dates[i]
                    elapsed_yr = max(12.0 / 365.25, (datetime.strptime(d_str, "%Y%m%d") - dt0).total_seconds() / (365.25 * 86400.0))
                    step_rate = (
                        (stack_list[i] / elapsed_yr).astype(np.float32)
                        if i == 1
                        else fit_robust_linear_rate_mm_yr(
                            los_dates[: i + 1], np.stack(stack_list[: i + 1], axis=0), min_dates=2
                        )
                    )
                    write_float32_cog(step_rate, rx[:w], ry[:h], r_epsg, rate_dir / f"{d_str}.tif", metadata={"date": d_str})

    # 4. Regenerate all monthly PNGs, clean heatmaps, and missing XYZ tiles
    cog_root = site_out_dir / "cog"
    if cog_root.exists():
        for layer_dir in sorted(cog_root.iterdir()):
            if not layer_dir.is_dir() or layer_dir.name == "velocity_dir_deg":
                continue
            lid = layer_dir.name
            tifs = sorted(layer_dir.glob("*.tif"))
            if not tifs:
                continue
            spec = HUMAN_LAYER_SPECS.get(lid, {})
            vmin = float(spec.get("vmin", -22.0))
            vmax = float(spec.get("vmax", 0.0))
            cmap = str(spec.get("cmap", "viridis"))
            d_list, c_list, t_list, m_list, cl_list = [], [], [], [], []
            for tif_p in tifs:
                d_str = tif_p.stem
                arr, x, y, epsg = _read_cog(tif_p)
                tiles_rel = Path("tiles") / lid / d_str
                if lid != "rgb_composite" and not (site_out_dir / tiles_rel).exists():
                    export_xyz_png_tiles(arr, x, y, epsg, site_out_dir / tiles_rel, vmin=vmin, vmax=vmax, cmap_name=cmap)
                m_png = plot_monthly_phenomenon_png(arr, x, y, epsg, lid, d_str, site_out_dir, site_title)
                d_list.append(d_str)
                c_list.append(f"cog/{lid}/{d_str}.tif")
                t_list.append(f"tiles/{lid}/{d_str}/{{z}}/{{x}}/{{y}}.png")
                m_list.append(str(m_png.relative_to(site_out_dir)))
                cl_list.append(f"plots/heatmap_clean/{lid}/{d_str}.png")

            meta = layers.get(lid, {"id": lid, "title": spec.get("friendly_title", lid)})
            meta["dates"] = d_list
            meta["cog_files"] = c_list
            meta["tile_templates"] = t_list
            meta["monthly_pngs"] = m_list
            meta["heatmap_clean_pngs"] = cl_list
            meta["clean_heatmap_pngs"] = cl_list
            meta["color_range"] = [vmin, vmax]
            meta["colormap"] = cmap
            layers[lid] = meta

    catalog["layers"] = layers
    cat_path.write_text(json.dumps(catalog, indent=2), encoding="utf-8")
    enrich_catalog_with_human_labels(cat_path)
    plot_clean_heatmaps_from_catalog(site_out_dir, force=True)
    plot_human_friendly_guide(site_out_dir, show_inline=False)


def build_parser() -> argparse.ArgumentParser:
    """Configure CLI argument parser."""
    ap = argparse.ArgumentParser(
        prog="run_site.py",
        description="NASA-ISRO NISAR data-pull, preprocessing, and human-friendly plotting CLI.",
    )
    ap.add_argument("cmd", choices=["search", "inspect", "build", "plot"])
    ap.add_argument(
        "--site",
        choices=["california", "nile_delta", "himalaya"],
        default="california",
    )
    ap.add_argument(
        "--products",
        nargs="+",
        default=["GCOV"],
        choices=["GCOV", "GUNW", "GOFF", "SME2"],
    )
    ap.add_argument("--bbox", nargs=4, type=float, metavar=("W", "S", "E", "N"))
    ap.add_argument("--start", help="Override ISO start date (YYYY-MM-DD).")
    ap.add_argument("--end", help="Override ISO end date (YYYY-MM-DD).")
    ap.add_argument("--track", type=int, help="Filter by pathNumber / track.")
    ap.add_argument("--frame", type=int, help="Filter by frameNumber.")
    ap.add_argument("--direction", choices=["A", "D", "ASC", "DESC"])
    ap.add_argument("--idx", type=int, default=0, help="Granule index for inspect.")
    ap.add_argument("--max-dates", type=int, default=None, help="Cap number of dates/months to build.")
    ap.add_argument(
        "--monthly",
        action="store_true",
        help="Select 1 best pass per calendar month (YYYYMM) and export all phenomenon PNGs + tiles.",
    )
    ap.add_argument("--download", action="store_true", help="Download full granules with .part resume.")
    ap.add_argument("--config", type=Path, default=None, help="Path to custom config.yaml.")
    return ap


def main(argv: Optional[Sequence[str]] = None) -> int:
    """CLI main entry point."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    logging.getLogger("matplotlib").setLevel(logging.WARNING)
    args = build_parser().parse_args(argv)
    cfg = load_config(args.config)

    site_cfg = cfg["sites"][args.site]
    if args.bbox:
        site_cfg["bbox"] = list(args.bbox)
    bbox = site_cfg["bbox"]
    start = args.start or site_cfg.get("start", "2025-07-30")
    end = args.end or site_cfg.get(
        "end", datetime.now(timezone.utc).strftime("%Y-%m-%d")
    )
    site_out_dir = Path(cfg.get("out_dir", "out")) / args.site

    if args.cmd == "plot":
        if (site_out_dir / "catalog.json").exists():
            synthesize_missing_monthly_from_existing_cogs(site_out_dir)
        else:
            logger.info(
                "No existing catalog in %s; streaming latest GCOV granule to generate explorer plot.",
                site_out_dir,
            )
            token = get_edl_token()
            records = search_nisar(bbox=bbox, processing_level="GCOV", start=start, end=end)
            _, grp = select_primary_group(records)
            target = next((r for r in reversed(grp) if "_0005_NADV_" not in r.file_name), grp[-1])
            win = run_with_h5_retry(
                url_or_path=target.url,
                token=token,
                download=args.download,
                reader_fn=lambda h5: load_gcov_window(
                    h5,
                    bbox_lonlat=bbox,
                    looks=int(site_cfg.get("looks", 4)),
                    track=target.track,
                    frame=target.frame,
                    direction=target.direction,
                    time=target.time,
                    date_str=target.date_str,
                    file_name=target.file_name,
                ),
            )
            prod = compute_single_date_products(win)
            plot_pol_and_freq_explorer(
                win=win,
                prod=prod,
                site_out_dir=site_out_dir,
                site_title=site_cfg.get("title", args.site),
            )
        return 0

    for product in args.products:
        records = search_nisar(
            bbox=bbox,
            processing_level=product,
            start=start,
            end=end,
            track=args.track,
            frame=args.frame,
            direction=args.direction,
        )
        print_search_table(records, product=product)

        if not records:
            logger.warning(
                "No NISAR %s granules found for site='%s' (bbox=%s, %s to %s).",
                product,
                args.site,
                bbox,
                start,
                end,
            )
            continue

        if args.cmd == "search":
            groups = group_by_track_frame(records)
            for (trk, frm, dr), grp in groups.items():
                logger.info(
                    "Group (track=%d, frame=%d, dir=%s): %d acquisition(s)",
                    trk,
                    frm,
                    dr,
                    len(grp),
                )
            continue

        token = get_edl_token()
        stream_cfg = cfg.get("streaming", {})
        raw_dir = Path(cfg.get("raw_dir", "/content/nisar_raw"))

        if args.cmd == "inspect":
            target = records[args.idx]
            logger.info("Inspecting %s granule: %s", product, target.file_name)

            def _do_inspect(h5: Any) -> None:
                inspect_granule(h5, print_output=True)
                if product == "GCOV":
                    win = load_gcov_window(
                        h5,
                        bbox_lonlat=bbox,
                        looks=int(site_cfg.get("looks", 2)),
                        track=target.track,
                        frame=target.frame,
                        direction=target.direction,
                        time=target.time,
                        date_str=target.date_str,
                        file_name=target.file_name,
                    )
                    for k, v in win.pols.items():
                        logger.info(
                            "GCOV AOI window %s: shape=%s, median_linear=%.5f, has_dual_freq=%s",
                            k,
                            v.shape,
                            float(np.nanmedian(v)),
                            win.has_dual_freq,
                        )

            run_with_h5_retry(
                url_or_path=target.url,
                reader_fn=_do_inspect,
                token=token,
                download=args.download,
                raw_dir=raw_dir,
                max_tries=int(stream_cfg.get("max_retries", 6)),
                sleep_sec=float(stream_cfg.get("retry_sleep_sec", 10)),
                block_size_mb=int(stream_cfg.get("block_size_mb", 4)),
            )
            continue

        if args.cmd == "build":
            if product == "GCOV":
                build_gcov_for_site(
                    args.site, cfg, records, token, args.download, args.max_dates, args.monthly
                )
            elif product == "GUNW":
                build_gunw_for_site(
                    args.site, cfg, records, token, args.download, args.max_dates, args.monthly
                )
            elif product == "GOFF":
                build_goff_for_site(
                    args.site, cfg, records, token, args.download, args.max_dates, args.monthly
                )
            elif product == "SME2":
                build_sme2_for_site(
                    args.site, cfg, records, token, args.download, args.max_dates, args.monthly
                )

    return 0


if __name__ == "__main__":
    sys.exit(main())
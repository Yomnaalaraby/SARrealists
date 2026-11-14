# NASA-ISRO NISAR Geospatial Preprocessing Pipeline

Stream-first Python pipeline that pulls AOI windows from ~7 GB NISAR L2/L3 HDF5 granules on ASF DAAC without downloading whole files, computes calibrated radar products in native UTM, and exports lightweight Cloud-Optimized GeoTIFFs, Zarr stacks, and JSON catalogs for web visualization.

## Map-ready clean heatmaps

The pipeline keeps the labeled `plots/monthly/` figures for reports and QA, and
adds text-free overlays at `plots/heatmap_clean/<layer>/<date>.png`. These have
no title, axes, colorbar, labels, or padding, and they use transparent nodata.

Build directly into the web export and generate clean images after the COGs exist:

```bash
python -m nisar_pipeline.run_site build \
  --site nile_delta --products GCOV GUNW SME2 --monthly \
  --out-dir out_web --clean-size 1600

python -m nisar_pipeline.run_site clean \
  --site nile_delta --out-dir out_web --clean-size 1600 --force-clean
```

`clean` is a catalog post-process: it reads `cog_files` for every layer and adds
`heatmap_clean_pngs` to `catalog.json`. It works for GCOV, GUNW, GOFF, and SME2
without regenerating the scientific products. The web map prefers
`heatmap_clean_pngs` and falls back to `monthly_pngs` for older catalogs.

## Faster processing

For the interactive map, XYZ tiles are optional because the viewer uses the
clean PNG overlays. Skip the most expensive exports during a Colab run:

```bash
python -m nisar_pipeline.run_site build \
  --site nile_delta --products GCOV GUNW SME2 --monthly \
  --out-dir out_web --skip-tiles --clean-size 1200 --looks 2 --max-dates 12
```

Use `--skip-zarr` too if you do not need the Zarr stacks. Keep the default
(no skip flags) when you need XYZ tiles for a future tile-based map or the
Zarr stacks for downstream analysis.

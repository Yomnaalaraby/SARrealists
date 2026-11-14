// src/lib/nisarData.ts
// نقطة تحكم واحدة لكل روابط NISAR الحقيقية

const BASE = 'https://cdn.jsdelivr.net/gh/Yomnaalaraby/SARrealists@main/out_web';

// ⚠️ ملاحظة: الـ catalog يستخدم YYYYMMDD، والـ timeseries يستخدم YYYY-MM-DD
export const SITES = {
  california: {
    folder: 'california',
    bounds: [-118.807, 33.971, -117.997, 34.309] as [number, number, number, number],
    center: [-118.4, 34.14] as [number, number],
    zoom: 9,
    defaultDate: '20261026',
    // التواريخ الحقيقية من الـ catalog
    dates: ['20251124','20251206','20251230','20260111','20260123','20260204','20260228','20260312','20260324','20260405','20260429','20260511','20260523','20260604','20260628','20260710','20260722','20260815','20260827','20260908','20260920','20261026'],
  },
  himalayas: {
    folder: 'himalaya',
    bounds: [78.736, 30.640, 79.459, 31.260] as [number, number, number, number],
    center: [79.09, 30.95] as [number, number],
    zoom: 10,
    defaultDate: '20261109',
    dates: ['20251126','20251220','20260125','20260218','20260326','20260419','20260525','20260630','20260724','20260829','20260922','20261028','20261109'],
  },
  nile: {
    folder: 'nile_delta',
    bounds: [29.798, 29.965, 32.262, 31.636] as [number, number, number, number],
    center: [31.03, 30.8] as [number, number],
    zoom: 8,
    defaultDate: '20261024',
    dates: ['20251216','20260626','20260708','20260720','20260813','20260825','20260906','20260930','20261012','20261024'],
  },
};

/** يبني رابط صورة حقيقية من plots/monthly */
export function plotUrl(site: keyof typeof SITES, layer: string, date: string): string {
  return `${BASE}/${SITES[site].folder}/plots/monthly/${layer}/${date}.png`;
}

/** Text-free, map-ready heatmap (preferred for overlays and comparisons). */
export function heatmapUrl(site: keyof typeof SITES, layer: string, date: string): string {
  return `${BASE}/${SITES[site].folder}/plots/heatmap_clean/${layer}/${date}.png`;
}

/** يبني رابط vector GeoJSON */
export function vectorUrl(site: keyof typeof SITES, file: string): string {
  return `${BASE}/${SITES[site].folder}/vectors/${file}`;
}

/** يبني رابط catalog أو timeseries */
export function jsonUrl(site: keyof typeof SITES, path: string): string {
  return `${BASE}/${SITES[site].folder}/${path}`;
}

/** تنسيق التاريخ YYYYMMDD → "Nov 24, 2025" */
export function prettyDate(yyyymmdd: string): string {
  const y = yyyymmdd.slice(0, 4), m = yyyymmdd.slice(4, 6), d = yyyymmdd.slice(6, 8);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
}

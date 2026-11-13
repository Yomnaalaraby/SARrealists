// src/lib/nisarConfig.ts
// نقطة واحدة للتحكم في كل URLs والإعدادات

import type { NISARCatalog } from '@/types/nisar';

// ⚠️ مهم: استخدمنا raw.githubusercontent.com لأن out_web ليس في public/
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/Yomnaalaraby/SARrealists/main/out_web';

export const SITES = {
  himalaya: {
    id: 'himalaya' as const,
    title: 'Himalayan Glaciers',
    catalogUrl: `${GITHUB_RAW_BASE}/himalaya/catalog.json`,
    basePath: `${GITHUB_RAW_BASE}/himalaya`,
    // إحداثيات المركز التقريبية للهيمالايا (Gangotri)
    defaultCenter: [79.09, 30.95] as [number, number],
    defaultZoom: 10,
  },
  california: {
    id: 'california' as const,
    title: 'California Wildfires',
    catalogUrl: `${GITHUB_RAW_BASE}/california/catalog.json`,
    basePath: `${GITHUB_RAW_BASE}/california`,
    defaultCenter: [-119.4, 36.7] as [number, number],
    defaultZoom: 6,
  },
  nile_delta: {
    id: 'nile_delta' as const,
    title: 'Nile Delta Agriculture',
    catalogUrl: `${GITHUB_RAW_BASE}/nile_delta/catalog.json`,
    basePath: `${GITHUB_RAW_BASE}/nile_delta`,
    defaultCenter: [31.0, 30.5] as [number, number],
    defaultZoom: 8,
  },
} as const;

export type SiteId = keyof typeof SITES;

/**
 * يبني رابط tile كامل من template نسبي
 * مثال: "tiles/hh_db/20251126/{z}/{x}/{y}.png" 
 *    → "https://raw.githubusercontent.com/.../himalaya/tiles/hh_db/20251126/{z}/{x}/{y}.png"
 */
export function buildTileUrl(basePath: string, template: string): string {
  return `${basePath}/${template}`;
}

/**
 * يبني رابط vector GeoJSON
 */
export function buildVectorUrl(basePath: string, vectorFile: string): string {
  return `${basePath}/${vectorFile}`;
}

/**
 * يبني رابط صورة شهرية ثابتة
 */
export function buildMonthlyPngUrl(basePath: string, pngPath: string): string {
  return `${basePath}/${pngPath}`;
}
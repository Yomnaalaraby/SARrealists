// src/types/nisar.ts
// TypeScript interfaces مطابقة تماماً لهيكل catalog.json

export interface LegendStop {
  value: number;
  label: string;
}

export interface NISARLayer {
  id: string;
  title: string;
  friendly_title: string;
  what_it_shows: string;
  units: string;
  dates: string[];
  bounds: [number, number, number, number]; // [west, south, east, north]
  crs: string;
  color_range: [number, number];
  colormap: string;
  cog_files: string[];
  tile_templates: string[];
  monthly_pngs: string[];
  heatmap_clean_pngs?: string[];
  track?: number;
  frame?: number;
  direction?: string;
  polarization_flags?: Record<string, string>;
  zarr_stack?: string;
  vector_file?: string; // موجود فقط في velocity_m_yr
  legend_stops: LegendStop[];
}

export interface NISARCatalog {
  site: 'himalaya' | 'california' | 'nile_delta';
  title: string;
  updated_utc: string;
  timestamps: string[];
  default_timestamp: string;
  layers: Record<string, NISARLayer>;
}

// Helper: تحويل timestamp مثل "20251126" إلى نص مقروء
export function formatTimestamp(ts: string): string {
  if (ts.includes('_')) {
    const [pre, post] = ts.split('_');
    return `${formatDate(pre)} → ${formatDate(post)}`;
  }
  return formatDate(ts);
}

function formatDate(ts: string): string {
  const year = ts.slice(0, 4);
  const month = ts.slice(4, 6);
  const day = ts.slice(6, 8);
  return `${year}-${month}-${day}`;
}

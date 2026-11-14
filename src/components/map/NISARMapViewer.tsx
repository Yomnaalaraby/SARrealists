'use client';

import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { NISARLayer } from '@/types/nisar';
import { SITES, type SiteId } from '@/lib/nisarConfig';

interface NISARMapViewerProps {
  siteId: SiteId;
  layer: NISARLayer | null;
  timestamp: string;
  visible: boolean;
  opacity?: number;
  height?: string;
}

export function NISARMapViewer({
  siteId,
  layer,
  timestamp,
  visible,
  opacity = 0.9,
  height = '500px',
}: NISARMapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const sourceId = 'nisar-image';
  const layerId = 'nisar-image-layer';

  // 1. تهيئة الخريطة
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    const site = SITES[siteId];

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles',
            paint: { 'raster-opacity': 0.35 },
          },
        ],
      },
      center: site.defaultCenter,
      zoom: site.defaultZoom,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(new maplibregl.ScaleControl(), 'bottom-left');

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [siteId]);

  // 2. إضافة Image Overlay بدل الـ tiles
  useEffect(() => {
    if (!map.current || !layer) return;
    const m = map.current;

    const updateLayer = () => {
      // تنظيف
      if (m.getLayer(layerId)) m.removeLayer(layerId);
      if (m.getSource(sourceId)) m.removeSource(sourceId);
      if (!visible) return;

      // Prefer map-ready heatmaps; monthly plots remain a compatibility fallback.
      const cleanPath = layer.heatmap_clean_pngs?.find((p) => p.includes(timestamp));
      const pngPath = cleanPath ?? layer.monthly_pngs.find((p) => p.includes(timestamp));
      if (!pngPath) {
        console.warn(`No image for ${timestamp} in layer ${layer.id}`);
        return;
      }
      const isCleanHeatmap = Boolean(cleanPath);

      const imageUrl = `${SITES[siteId].basePath}/${pngPath}`;
      const [west, south, east, north] = layer.bounds;

      // ✅ Image Overlay — يضع الصورة فوق الإحداثيات الحقيقية
      m.addSource(sourceId, {
        type: 'image',
        url: imageUrl,
        coordinates: [
          [west, north],   // أعلى يسار
          [east, north],   // أعلى يمين
          [east, south],   // أسفل يمين
          [west, south],   // أسفل يسار
        ],
      });

      m.addLayer({
        id: layerId,
        type: 'raster',
        source: sourceId,
        paint: {
          'raster-opacity': opacity,
          'raster-resampling': isCleanHeatmap ? 'nearest' : 'linear',
        },
      });

      // طيّر إلى حدود الصورة
      m.fitBounds(
        [[west, south], [east, north]],
        { padding: 40, duration: 1500, maxZoom: 12 }
      );
    };

    if (m.isStyleLoaded()) {
      updateLayer();
    } else {
      m.once('load', updateLayer);
    }
  }, [layer, timestamp, visible, opacity, siteId]);

  return (
    <div
      ref={mapContainer}
      style={{ height, width: '100%' }}
      className="rounded-xl overflow-hidden border border-cyan-500/20"
    />
  );
}

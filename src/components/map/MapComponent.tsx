'use client';
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface MapComponentProps {
  showDashboard?: boolean;
}

const LOCATIONS: Record<string, { center: [number, number]; zoom: number; pitch?: number; bearing?: number }> = {
  hero: { center: [30, 25], zoom: 1.5, pitch: 0, bearing: 0 },
  california: { center: [-118.4, 34.14], zoom: 9, pitch: 45, bearing: 0 },
  himalayas: { center: [79.09, 30.95], zoom: 10, pitch: 45, bearing: 0 },
  nile_delta: { center: [31.03, 30.8], zoom: 8, pitch: 40, bearing: 0 },
};

const SITE_META: Record<string, { folder: string; letter: string }> = {
  california: { folder: 'california', letter: 'c' },
  himalayas: { folder: 'himalayas', letter: 'h' },
  nile_delta: { folder: 'nile_delta', letter: 'n' },
};

// Tiles live outside the Next.js bundle (they are far too large for git).
// Point this at the CDN/tile-server root; empty means same-origin /public.
const TILE_BASE = (process.env.NEXT_PUBLIC_TILE_BASE_URL ?? '').replace(/\/+$/, '');

type TileCatalog = { layers: Record<string, string[]> };
const catalogCache = new Map<string, Promise<TileCatalog>>();

function loadTileCatalog(site: string): Promise<TileCatalog> {
  const cached = catalogCache.get(site);
  if (cached) return cached;
  const { folder, letter } = SITE_META[site];
  const url = `${TILE_BASE}/${folder}/tiles_${letter}/catalog.json`;
  const pending = fetch(url)
    .then((res) => (res.ok ? (res.json() as Promise<TileCatalog>) : { layers: {} }))
    .catch(() => ({ layers: {} }));
  catalogCache.set(site, pending);
  return pending;
}

function layerFor(layerId: string, polarization: string): string | null {
  if (layerId === 'GCOV') return polarization === 'HH' ? 'hh_db' : 'hv_db';
  if (layerId === 'RVI') return 'rvi';
  if (layerId === 'CHANGE') return 'hv_db_change';
  return null;
}

export default function MapComponent({ showDashboard = false }: MapComponentProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const requestTokenRef = useRef(0);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: LOCATIONS.hero.center,
      zoom: LOCATIONS.hero.zoom,
      pitch: LOCATIONS.hero.pitch,
      bearing: LOCATIONS.hero.bearing,
      projection: 'globe',
    });

    mapRef.current = map;

    map.on('style.load', () => {
      map.setFog({ color: 'rgb(10, 10, 10)', 'high-color': 'rgb(20, 20, 30)', 'horizon-blend': 0.1 });
    });

    const handleFlyTo = (event: Event) => {
      const location = (event as CustomEvent).detail;
      const loc = LOCATIONS[location];
      if (loc && mapRef.current) {
        mapRef.current.flyTo({ center: loc.center, zoom: loc.zoom, pitch: loc.pitch || 0, bearing: loc.bearing || 0, duration: 4000 });
      }
    };

    const handleToggleLayer = async (event: Event) => {
      const { layerId, polarization, active, region } = (event as CustomEvent).detail;
      const map = mapRef.current;
      if (!map || !map.isStyleLoaded()) return;

      const sourceId = 'nisar-tiles-source';
      const layerIdMap = 'nisar-tiles-layer';
      const token = ++requestTokenRef.current;

      if (map.getLayer(layerIdMap)) map.removeLayer(layerIdMap);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      if (!active) return;

      const site = SITE_META[region] ? region : null;
      const actualLayerName = layerFor(layerId, polarization);
      if (!site || !actualLayerName) return;

      // Dates come from the generated catalog instead of hardcoded strings,
      // so new acquisitions appear without touching this component.
      const catalog = await loadTileCatalog(site);
      if (token !== requestTokenRef.current || !map.isStyleLoaded()) return;

      const dates = catalog.layers?.[actualLayerName] ?? [];
      const datePath = dates[dates.length - 1];
      if (!datePath) {
        console.warn(`[NISAR] No tiles for ${site}/${actualLayerName}; run scripts/render_webmercator_tiles.py`);
        return;
      }

      const { folder, letter } = SITE_META[site];
      const tileUrl = `${TILE_BASE}/${folder}/tiles_${letter}/${actualLayerName}/${datePath}/{z}/{x}/{y}.png`;

      map.addSource(sourceId, {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
      });

      map.addLayer({
        id: layerIdMap,
        type: 'raster',
        source: sourceId,
        paint: { 'raster-opacity': 0.85, 'raster-fade-duration': 500 },
      });

      const loc = LOCATIONS[region];
      if (loc) {
        map.flyTo({ center: loc.center, zoom: loc.zoom, pitch: 45, duration: 2000 });
      }
    };

    window.addEventListener('flyToLocation', handleFlyTo);
    window.addEventListener('toggleNisarLayer', handleToggleLayer);

    return () => {
      window.removeEventListener('flyToLocation', handleFlyTo);
      window.removeEventListener('toggleNisarLayer', handleToggleLayer);
      map.remove();
    };
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      if (showDashboard) {
        mapRef.current.dragPan.enable();
        mapRef.current.scrollZoom.enable();
        mapRef.current.dragRotate.enable();
        mapRef.current.touchZoomRotate.enable();
        mapRef.current.doubleClickZoom.enable();
        mapRef.current.boxZoom.enable();
      } else {
        mapRef.current.dragPan.disable();
        mapRef.current.scrollZoom.disable();
        mapRef.current.dragRotate.disable();
        mapRef.current.touchZoomRotate.disable();
        mapRef.current.doubleClickZoom.disable();
        mapRef.current.boxZoom.disable();
      }
    }
  }, [showDashboard]);

  return <div ref={mapContainerRef} className="w-full h-full" />;
}

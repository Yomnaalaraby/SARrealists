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

export default function MapComponent({ showDashboard = false }: MapComponentProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

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

    const handleToggleLayer = (event: Event) => {
      const { layerId, polarization, active, region } = (event as CustomEvent).detail;
      const map = mapRef.current;
      if (!map || !map.isStyleLoaded()) return;

      const sourceId = 'nisar-tiles-source';
      const layerIdMap = 'nisar-tiles-layer';

      if (map.getLayer(layerIdMap)) map.removeLayer(layerIdMap);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      if (!active) return;

      // ✅ تحديد اسم الفولدر والطبقة بناءً على الهيكل الفعلي في الريبو
      let folderName = region === 'nile_delta' ? 'nile_delta' : region;
      let actualLayerName = '';
      let datePath = '';

      if (layerId === 'GCOV') {
        actualLayerName = polarization === 'HH' ? 'hh_db' : 'hv_db';
        datePath = region === 'himalayas' ? '20251126' : '20251124'; // تاريخ افتراضي
      } else if (layerId === 'RVI') {
        actualLayerName = 'rvi';
        datePath = region === 'himalayas' ? '20251126' : ''; // فارغ إذا كان الفولدر يحتوي على التواريخ مباشرة
      } else if (layerId === 'CHANGE') {
        actualLayerName = 'hv_db_change';
        datePath = region === 'california' ? '20251124_20251206' : '20251112_20251124';
      }

      // ✅ بناء المسار بدقة متناهية
      const tileUrl = `/${folderName}/tiles_${folderName === 'california' ? 'c' : folderName === 'himalayas' ? 'h' : 'n'}/${actualLayerName}/${datePath}/{z}/{x}/{y}.png`;

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
'use client';
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface MapComponentProps {
  showDashboard?: boolean;
}

export default function MapComponent({ showDashboard = false }: MapComponentProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const LOCATIONS: Record<string, { center: [number, number]; zoom: number; pitch?: number; bearing?: number }> = {
    hero: { center: [30, 25], zoom: 1.5, pitch: 0, bearing: 0 },
    california: { center: [-119.4179, 36.7783], zoom: 5.5, pitch: 45, bearing: 0 },
    himalayas: { center: [85, 28], zoom: 6, pitch: 45, bearing: 0 },
    delta: { center: [31.0, 30.5], zoom: 6, pitch: 40, bearing: 0 },
  };

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
      map.setFog({
        color: 'rgb(10, 10, 10)',
        'high-color': 'rgb(20, 20, 30)',
        'horizon-blend': 0.1,
      });
    });

    // الاستماع لحدث الطيران
    const handleFlyTo = (event: Event) => {
      const location = (event as CustomEvent).detail;
      const loc = LOCATIONS[location];
      if (loc && mapRef.current) {
        mapRef.current.flyTo({
          center: loc.center,
          zoom: loc.zoom,
          pitch: loc.pitch || 0,
          bearing: loc.bearing || 0,
          duration: 4000,
        });
      }
    };

    window.addEventListener('flyToLocation', handleFlyTo);

    return () => {
      window.removeEventListener('flyToLocation', handleFlyTo);
      map.remove();
    };
  }, []);

  // ✅ تصحيح: تفعيل/تعطيل التفاعل بناءً على الـ Dashboard
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
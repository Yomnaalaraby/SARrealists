// src/hooks/useNISARCatalog.ts
// Hook ذكي يجلب catalog ويدير الـ state

import { useState, useEffect } from 'react';
import type { NISARCatalog, NISARLayer } from '@/types/nisar';
import { SITES, type SiteId } from '@/lib/nisarConfig';

interface UseNISARCatalogReturn {
  catalog: NISARCatalog | null;
  currentLayer: NISARLayer | null;
  currentTimestamp: string;
  availableLayers: NISARLayer[];
  availableTimestamps: string[];
  loading: boolean;
  error: string | null;
  setLayerId: (layerId: string) => void;
  setTimestamp: (timestamp: string) => void;
  getTileUrl: (layerId: string, timestamp: string) => string | null;
  getVectorUrl: () => string | null;
}

export function useNISARCatalog(siteId: SiteId): UseNISARCatalogReturn {
  const [catalog, setCatalog] = useState<NISARCatalog | null>(null);
  const [currentLayerId, setCurrentLayerId] = useState<string>('rgb_composite');
  const [currentTimestamp, setCurrentTimestamp] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. جلب الـ catalog عند أول تحميل
  useEffect(() => {
    let cancelled = false;
    
    async function fetchCatalog() {
      setLoading(true);
      setError(null);
      try {
        const site = SITES[siteId];
        const response = await fetch(site.catalogUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to load catalog: ${response.status}`);
        }
        
        const data: NISARCatalog = await response.json();
        
        if (!cancelled) {
          setCatalog(data);
          setCurrentTimestamp(data.default_timestamp);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setLoading(false);
        }
      }
    }
    
    fetchCatalog();
    return () => { cancelled = true; };
  }, [siteId]);

  // 2. حساب الطبقات والتواريخ المتاحة
  const availableLayers = catalog 
    ? Object.values(catalog.layers) 
    : [];
  
  const availableTimestamps = catalog?.timestamps ?? [];

  // 3. الطبقة الحالية
  const currentLayer = catalog?.layers[currentLayerId] ?? null;

  // 4. دالة بناء رابط Tile ديناميكياً
  const getTileUrl = (layerId: string, timestamp: string): string | null => {
    if (!catalog) return null;
    const layer = catalog.layers[layerId];
    if (!layer) return null;
    
    // ابحث عن الـ template المطابق للتاريخ
    const template = layer.tile_templates.find(t => t.includes(timestamp));
    if (!template) return null;
    
    return `${SITES[siteId].basePath}/${template}`;
  };

  // 5. دالة بناء رابط Vector (للأنهار الجليدية)
  const getVectorUrl = (): string | null => {
    if (!currentLayer?.vector_file) return null;
    return `${SITES[siteId].basePath}/${currentLayer.vector_file}`;
  };

  return {
    catalog,
    currentLayer,
    currentTimestamp,
    availableLayers,
    availableTimestamps,
    loading,
    error,
    setLayerId: setCurrentLayerId,
    setTimestamp: setCurrentTimestamp,
    getTileUrl,
    getVectorUrl,
  };
}
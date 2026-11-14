'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Map, Flame, Snowflake, Wheat, Layers, Eye, EyeOff, ChevronLeft, ChevronRight, Rocket, X, Wrench } from 'lucide-react';
import Link from 'next/link';

interface DashboardProps {
  onRegionJump: (region: string) => void;
  onClose: () => void;
}

export default function Dashboard({ onRegionJump, onClose }: DashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentRegion, setCurrentRegion] = useState('california');
  const [activeLayers, setActiveLayers] = useState({
    GCOV: true,
    RVI: false,
    CHANGE: false,
  });
  const [polarization, setPolarization] = useState<'HH' | 'HV'>('HV');

  const regions = [
    { id: 'california', name: 'California', icon: Flame, color: 'red' },
    { id: 'himalayas', name: 'Himalayas', icon: Snowflake, color: 'cyan' },
    { id: 'nile_delta', name: 'Nile Delta', icon: Wheat, color: 'green' },
  ];

  const getAvailableLayers = () => {
    const layers = [
      { id: 'GCOV', name: 'GCOV (Backscatter)', description: polarization === 'HV' ? 'Volume scattering (Canopy)' : 'Surface bounce' },
    ];

    if (currentRegion === 'california') {
      layers.push({ id: 'CHANGE', name: 'Burn Change Map', description: 'HV difference: Pre vs Post Fire' });
    } else if (currentRegion === 'himalayas') {
      layers.push({ id: 'RVI', name: 'Radar Vegetation Index', description: 'Snow/Ice surface classification' });
    } else if (currentRegion === 'nile_delta') {
      layers.push({ id: 'RVI', name: 'Radar Vegetation Index', description: 'Crop health and density mapping' });
    }

    return layers;
  };

  const handleRegionJump = (regionId: string) => {
    setCurrentRegion(regionId);
    onRegionJump(regionId);
    setActiveLayers({ GCOV: true, RVI: false, CHANGE: false });
  };

  const toggleLayer = (layerId: string) => {
    setActiveLayers((prev) => {
      const newState = !prev[layerId as keyof typeof prev];
      
      window.dispatchEvent(new CustomEvent('toggleNisarLayer', {
        detail: { 
          layerId, 
          polarization, 
          active: newState, 
          region: currentRegion 
        }
      }));

      return { ...prev, [layerId]: newState };
    });
  };

  return (
    <div className="relative w-full h-screen">
      <button
        onClick={onClose}
        className="absolute top-9.5 right-4 z-50 w-10 h-10 bg-black/80 backdrop-blur-md rounded-lg border border-white/20 flex items-center justify-center text-white hover:bg-red-600/80 transition-all cursor-pointer"
      >
        <X className="w-5 h-5" />
      </button>

      <motion.div
        initial={false}
        animate={{ width: sidebarOpen ? 320 : 0 }}
        className="absolute left-0 top-0 bottom-0 z-20 bg-black/90 backdrop-blur-md border-r border-white/10 overflow-y-auto"
      >
        <div className="w-80 h-full flex flex-col overflow-y-auto">
          
          {/* ✅ HEADER مع مؤشر Under Development الأنيق */}
          <div className="p-6 border-b border-white/10 shrink-0">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-bold text-white">Mission Control</h2>
              
              {/* 🚧 Badge: Under Development */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                </span>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Under Dev</span>
              </div>
            </div>
            <p className="text-xs text-gray-400">Free-Roam Exploration Mode (Beta)</p>
          </div>

          <div className="p-6 border-b border-white/10 shrink-0">
            <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
              <Map className="w-4 h-4" /> Region Jumpers
            </h3>
            <div className="space-y-2">
              {regions.map((region) => {
                const Icon = region.icon;
                return (
                  <button
                    key={region.id}
                    onClick={() => handleRegionJump(region.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                      currentRegion === region.id
                        ? `bg-${region.color}-600/30 border border-${region.color}-500/50`
                        : `bg-${region.color}-600/10 hover:bg-${region.color}-600/20 border border-${region.color}-500/20`
                    }`}
                  >
                    <Icon className={`w-5 h-5 text-${region.color}-400`} />
                    <span className="text-sm font-medium text-white">{region.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6 border-b border-white/10 shrink-0">
            <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Data Layers
            </h3>
            <div className="space-y-2">
              {getAvailableLayers().map((layer) => (
                <div key={layer.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{layer.name}</p>
                    <p className="text-xs text-gray-400">{layer.description}</p>
                  </div>
                  <button
                    onClick={() => toggleLayer(layer.id)}
                    className={`p-2 rounded-lg transition-all cursor-pointer ${
                      activeLayers[layer.id as keyof typeof activeLayers] ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {activeLayers[layer.id as keyof typeof activeLayers] ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-bold text-gray-300 mb-3">Polarization</h3>
              <div className="grid grid-cols-2 gap-2">
                {(['HH', 'HV'] as const).map((pol) => (
                  <button
                    key={pol}
                    onClick={() => {
                      setPolarization(pol);
                      const activeLayer = Object.entries(activeLayers).find(([_, isActive]) => isActive)?.[0];
                      if (activeLayer === 'GCOV') {
                        window.dispatchEvent(new CustomEvent('toggleNisarLayer', {
                          detail: { layerId: 'GCOV', polarization: pol, active: true, region: currentRegion }
                        }));
                      }
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                      polarization === pol ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400'
                    }`}
                  >
                    {pol}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-white/10 shrink-0 mt-auto mb-5">
            <Link href="/beyond">
              <button className="w-full mb-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-600/30">
                <Rocket className="w-5 h-5" />
                <span>Explore Beyond 2025</span>
              </button>
            </Link>
          </div>
        </div>
      </motion.div>

      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute left-4 top-20 z-30 w-10 h-10 bg-black/80 backdrop-blur-md rounded-lg border border-white/20 flex items-center justify-center text-white hover:bg-black/90 transition-all cursor-pointer"
        style={{ left: sidebarOpen ? 336 : 16 }}
      >
        {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>

      <div className="absolute top-20 right-4 z-20 bg-black/80 backdrop-blur-md rounded-lg border border-white/20 p-4 max-w-sm">
        <h3 className="text-sm font-bold text-white mb-2">Free-Roam Mode</h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          Explore the globe freely. Use the sidebar to jump between regions, toggle real NISAR tile layers, and switch polarization modes.
        </p>
      </div>
    </div>
  );
}
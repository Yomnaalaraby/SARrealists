'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wheat, Mountain, ArrowLeft, Layers, Activity } from 'lucide-react';
import Link from 'next/link';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { plotUrl, prettyDate } from '@/lib/nisarData';
import { jsonUrl } from '@/lib/nisarData';
const AGRI_PHASES = [
    {
        id: 'before',
        label: 'Before Season',
        title: 'Pre-Season Planning',
        color: 'bg-green-600',
        points: [
            'Evaluates soil roughness and moisture distribution prior to planting.',
            'Helps optimize irrigation scheduling and land allocation.',
            'Global, systematic L-band coverage supports soil-moisture and cropland-area baselines every 12 days.',
        ],
    },
    {
        id: 'during',
        label: 'Growing Season',
        title: 'Crop & Water Monitoring',
        color: 'bg-emerald-600',
        points: [
            'Tracks crop growth stages (phenology) consistently regardless of weather.',
            'Identifies crop types via polarization signatures (HH/HV) and detects water stress.',
            'The 12-day time series tracks phenology, and flooded rice fields have a distinctive signature.',
        ],
    },
    {
        id: 'after',
        label: 'After Harvest',
        title: 'Yield & Environmental Impact',
        color: 'bg-teal-600',
        points: [
            'Estimates crop yield and monitors agricultural land loss due to urban sprawl.',
            'Multi-year L-band InSAR measures millimeter-scale subsidence.',
            'Salinity is inferred indirectly (soil moisture, roughness, crop stress) and needs ground data.',
        ],
    },
];




const SUBSIDENCE_YEARS = [
    { year: 2019, maxMm: -8, intensity: 0.3 },
    { year: 2020, maxMm: -12, intensity: 0.45 },
    { year: 2021, maxMm: -18, intensity: 0.6 },
    { year: 2022, maxMm: -25, intensity: 0.8 },
    { year: 2023, maxMm: -32, intensity: 1.0 },
    { year: 2024, maxMm: -28, intensity: 0.9 },
];

const SUBSIDENCE_PROFILE = [
    { distance: 0, subsidence: 0 },
    { distance: 10, subsidence: -5 },
    { distance: 20, subsidence: -12 },
    { distance: 30, subsidence: -20 },
    { distance: 40, subsidence: -28 },
    { distance: 50, subsidence: -15 },
    { distance: 60, subsidence: -5 },
    { distance: 70, subsidence: 0 },
];

export default function NileDataPage() {
    const [activeTab, setActiveTab] = useState<'agriculture' | 'subsidence'>('agriculture');
    const [polarizationMode, setPolarizationMode] = useState<'HH' | 'HV'>('HV');
    const [activePhase, setActivePhase] = useState('before');
const SUBSIDENCE_DATES = ['20260626','20260708','20260813','20260906'];

    const currentPhase = AGRI_PHASES.find((p) => p.id === activePhase)!;

    // ✅ State للـ Subsidence
const [subIdx, setSubIdx] = useState(SUBSIDENCE_DATES.length - 1);
const [subPlaying, setSubPlaying] = useState(false);
const [subZoom, setSubZoom] = useState(22);
const [subPanX, setSubPanX] = useState(0);
const [subPanY, setSubPanY] = useState(0);

// ✅ Play effect
useEffect(() => {
  if (!subPlaying) return;
  const timer = setInterval(() => {
    setSubIdx(prev => (prev + 1) % SUBSIDENCE_DATES.length);
  }, 1500);
  return () => clearInterval(timer);
}, [subPlaying]);

     const [soilMoistureData, setSoilMoistureData] = useState<any[]>([]);

useEffect(() => {
  fetch(jsonUrl('nile', 'timeseries/points.json'))
    .then(r => r.json())
    .then(points => {
      // نجمع البيانات من كل المزارع
      const data = points
        .map((farm: any) => {
          // نلاقي أول قيمة مش null في sm
          const idx = farm.sm.findIndex((v: number | null) => v !== null);
          if (idx === -1) return null;
          
          return {
            location: farm.id.replace('nile_', '').replace('_', ' '),
            moisture: Math.round(farm.sm[idx] * 100),
            date: farm.dates[idx].slice(5)
          };
        })
        .filter((x: any) => x !== null);
      
      setSoilMoistureData(data);
    });
}, []);

    return (
        <div className="min-h-screen bg-black pt-24 pb-20 px-4 md:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Back Button & Header */}
                <div className="mb-8">
                    <Link href="/data-analysis" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">Back to Regions</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-green-600/20 rounded-xl flex items-center justify-center border border-green-500/30">
                            <Wheat className="w-7 h-7 text-green-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white">Nile Delta Data Analysis</h1>
                            <p className="text-green-300/70">Food Security, Soil Moisture & Coastal Subsidence</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="grid grid-cols-2 gap-2 bg-black/30 p-1 rounded-lg mb-8 border border-green-500/10">
                    <button
                        onClick={() => setActiveTab('agriculture')}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all cursor-pointer ${activeTab === 'agriculture' ? 'bg-green-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <Wheat className="w-4 h-4" /> Smart Agriculture
                    </button>
                    <button
                        onClick={() => setActiveTab('subsidence')}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all cursor-pointer ${activeTab === 'subsidence' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <Layers className="w-4 h-4" /> Coastal Subsidence
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'agriculture' ? (
                        <motion.div
                            key="agriculture"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {/* Polarization & Soil Moisture */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-green-500/20">
                                    <h2 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                                        <span className="bg-green-600 text-xs px-2 py-1 rounded text-white">LEVEL 1</span>
                                        Polarization Physics
                                    </h2>
                                    <div className="flex gap-2 mb-4">
                                        <button
                                            onClick={() => setPolarizationMode('HH')}
                                            className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${polarizationMode === 'HH' ? 'bg-green-600 text-white' : 'bg-black/30 text-gray-400 hover:bg-green-900/40'
                                                }`}
                                        >
                                            HH Polarization
                                        </button>
                                        <button
                                            onClick={() => setPolarizationMode('HV')}
                                            className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${polarizationMode === 'HV' ? 'bg-green-600 text-white' : 'bg-black/30 text-gray-400 hover:bg-green-900/40'
                                                }`}
                                        >
                                            HV Polarization
                                        </button>
                                    </div>
                                    <div className="bg-black/30 p-4 rounded-lg text-sm text-gray-200 leading-relaxed border-l-4 border-green-500 min-h-[100px]">
                                        {polarizationMode === 'HV' ? (
                                            <p><strong className="text-green-400">Volume Scattering (HV):</strong> Dense crops scatter the signal internally, making healthy vegetation appear bright in HV. Used to track crop density and phenology.</p>
                                        ) : (
                                            <p><strong className="text-green-400">Specular Reflection (HH):</strong> Surface water acts as a mirror reflecting radar away, making flooded areas and smooth soil appear dark in HH. Used for water tracking.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Soil Moisture Chart */}
                                <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-green-500/20">
  <h2 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
    💧 Soil Moisture - Real NISAR Measurements
  </h2>
  
  <ResponsiveContainer width="100%" height={220}>
    <BarChart data={soilMoistureData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
      <XAxis dataKey="location" stroke="#9CA3AF" fontSize={11} tick={{ fill: '#9CA3AF' }} />
      <YAxis stroke="#9CA3AF" fontSize={11} unit="%" domain={[0, 30]} />
      <Tooltip
        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid #10B981', borderRadius: '8px' }}
        formatter={(value: any) => [`${value}%`, 'Soil Moisture']}
      />
      <Bar dataKey="moisture" fill="#10B981" radius={[6, 6, 0, 0]} barSize={40} />
    </BarChart>
  </ResponsiveContainer>
  
  <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-green-500/10">
    💡 Real NISAR soil moisture measurements across 4 Nile Delta locations - Dec 2025 to Oct 2026
  </p>
</div>

                            </div>

                            {/* Agriculture Phases */}
                            <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-green-500/20">
                                <h2 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                                    <Activity className="w-5 h-5" /> Agricultural Lifecycle
                                </h2>
                                <div className="flex gap-2 mb-4">
                                    {AGRI_PHASES.map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => setActivePhase(p.id)}
                                            className={`flex-1 py-2 rounded-md text-sm font-bold transition-all cursor-pointer ${activePhase === p.id ? `${p.color} text-white shadow-md` : 'bg-black/30 text-gray-400 hover:text-white'
                                                }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activePhase}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="bg-black/30 rounded-xl border border-green-500/20 p-4"
                                    >
                                        <h3 className="text-lg font-bold text-white mb-3">{currentPhase.title}</h3>
                                        <ul className="space-y-2">
                                            {currentPhase.points.map((pt, i) => (
                                                <li key={i} className="text-sm text-gray-300 leading-relaxed flex gap-2">
                                                    <span className="text-green-400 shrink-0">▸</span>
                                                    {pt}
                                                </li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="subsidence"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Coastal Subsidence Heatmap */}
                                <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-emerald-500/20">
                                    <h2 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2">
                                        <Layers className="w-5 h-5" /> Coastal Subsidence Map
                                    </h2>
                                       {/* ✅ خريطة الهبوط الساحلي الحقيقية */}
   {/* ===== Coastal Subsidence Map — Time Series حقيقي ===== */}
<div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-emerald-500/20">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
      <Layers className="w-5 h-5" /> Coastal Subsidence Map
    </h2>
    <button
      onClick={() => setSubPlaying(!subPlaying)}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
        subPlaying 
          ? 'bg-red-600 text-white' 
          : 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/40 border border-emerald-500/30'
      }`}
    >
      {subPlaying ? '⏸ Pause' : '▶ Play Timeline'}
    </button>
  </div>

  {/* 🗺️ الخريطة مع أزرار تحكم */}
  <div className="relative h-72 rounded-xl overflow-hidden border border-emerald-500/20 mb-3 bg-white">
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `url(${plotUrl('nile', 'vert_disp_mm', SUBSIDENCE_DATES[subIdx])})`,
        backgroundSize: `${130 + subZoom * 8}% ${118 + subZoom * 8}%`,
        backgroundPosition: `${42 + subPanX}% ${50 + subPanY}%`,
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#ffffff',
        transition: 'background-size 0.2s, background-position 0.2s',
      }}
    />
    {/* Badge التاريخ */}
    <span className="absolute top-2 right-2 text-xs text-white font-mono bg-black/70 px-2 py-1 rounded z-10">
      {prettyDate(SUBSIDENCE_DATES[subIdx])}
    </span>
    {/* Progress */}
    <span className="absolute top-2 left-2 text-xs text-white font-mono bg-black/70 px-2 py-1 rounded z-10">
      {subIdx + 1} / {SUBSIDENCE_DATES.length}
    </span>

    {/* 🎮 أزرار التحكم */}
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
      <button onClick={() => setSubZoom(z => z - 1)} className="w-6 h-6 text-white text-xs font-bold hover:bg-white/20 rounded-full cursor-pointer">−</button>
      <button onClick={() => setSubZoom(z => z + 1)} className="w-6 h-6 text-white text-xs font-bold hover:bg-white/20 rounded-full cursor-pointer">+</button>
      <div className="w-px h-4 bg-white/30 mx-1" />
      <button onClick={() => setSubPanX(x => x - 2)} className="w-6 h-6 text-white text-xs font-bold hover:bg-white/20 rounded-full cursor-pointer">←</button>
      <button onClick={() => setSubPanY(y => y - 2)} className="w-6 h-6 text-white text-xs font-bold hover:bg-white/20 rounded-full cursor-pointer">↑</button>
      <button onClick={() => setSubPanY(y => y + 2)} className="w-6 h-6 text-white text-xs font-bold hover:bg-white/20 rounded-full cursor-pointer">↓</button>
      <button onClick={() => setSubPanX(x => x + 2)} className="w-6 h-6 text-white text-xs font-bold hover:bg-white/20 rounded-full cursor-pointer">→</button>
      <div className="w-px h-4 bg-white/30 mx-1" />
      <button onClick={() => { setSubZoom(2); setSubPanX(0); setSubPanY(0); }} className="w-6 h-6 text-white text-[10px] font-bold hover:bg-white/20 rounded-full cursor-pointer">⟲</button>
    </div>
  </div>

  {/* 📅 أزرار التواريخ الحقيقية */}
  <div className="flex gap-1.5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    {SUBSIDENCE_DATES.map((date, i) => (
      <button
        key={date}
        onClick={() => { setSubPlaying(false); setSubIdx(i); }}
        className={`flex-shrink-0 px-3 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
          i === subIdx 
            ? 'bg-emerald-600 text-white shadow-lg scale-105' 
            : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700'
        }`}
      >
        {prettyDate(date).replace(/,.*/, '')}
      </button>
    ))}
  </div>
</div>
                                    
                                </div>

                                {/* Subsidence Profile Chart */}
                                <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-emerald-500/20">
                                    <h2 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2">
                                        <Activity className="w-5 h-5" /> Subsidence Cross-Section
                                    </h2>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <LineChart data={SUBSIDENCE_PROFILE}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis dataKey="distance" stroke="#9CA3AF" fontSize={12} label={{ value: 'Distance (km)', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }} />
                                            <YAxis stroke="#9CA3AF" fontSize={12} label={{ value: 'mm', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }} />
                                            <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
                                            <Line type="monotone" dataKey="subsidence" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />                    </LineChart>
                                    </ResponsiveContainer>
                                    <p className="text-xs text-gray-400 text-center mt-2">
                                        "Crater-like" visual representation of groundwater depletion impact.
                                    </p>
                                </div>
                            </div>

                            {/* Physics Explanation */}
                            <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border-l-4 border-emerald-500">
                                <h3 className="text-lg font-bold text-emerald-400 mb-3 flex items-center gap-2">
                                    <Layers className="w-5 h-5" /> Why L-Band for Subsidence?
                                </h3>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                    Multi-year L-band InSAR measures millimeter-scale subsidence because <strong className="text-emerald-300">L-band keeps coherence better than shorter wavelengths</strong> across agricultural and coastal areas.
                                    It also maps cropland lost to urban growth, providing a dual view of land degradation.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
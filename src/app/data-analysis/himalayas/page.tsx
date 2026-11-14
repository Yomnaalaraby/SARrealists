'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { heatmapUrl, prettyDate } from '@/lib/nisarData';
import { Snowflake, ArrowLeft, Layers, Activity, Compass } from 'lucide-react';
import Link from 'next/link';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const GLOF_PHASES = [
  {
    id: 'before',
    label: 'Before',
    title: 'Baseline & Structural Monitoring',
    color: 'bg-cyan-600',
    points: [
      'Gradual ice flow, seasonal snow accumulation, and slow expansion of meltwater lakes behind natural moraine dams.',
      'InSAR measures millimeter-scale ice velocity and glacier thinning, overcoming persistent mountain cloud cover.',
      'Smooth meltwater appears dark in SAR, allowing regular re-mapping to flag highest-risk lakes.',
    ],
  },
  {
    id: 'during',
    label: 'During',
    title: 'Critical Instability & Trigger',
    color: 'bg-blue-600',
    points: [
      'Rapid ice calving, crevasse formation, deformation of moraine dams, and sudden water level surges.',
      'NISAR cannot give minute-level GLOF alerts, but detects slower precursors between 12-day cycles.',
      'Identifies accelerating ice motion and sudden structural shifts in ice/rock dams preceding a breach.',
    ],
  },
  {
    id: 'after',
    label: 'After',
    title: 'Impact Assessment & Stabilization',
    color: 'bg-indigo-600',
    points: [
      'Downstream flood inundation, infrastructure destruction, and altered river morphology.',
      'NISAR maps flood extent and changed valley geometry through clouds at 3-10 m resolution.',
      'Continued cycles monitor residual glacial instability upstream to prevent secondary events.',
    ],
  },
];


// ✅ بيانات حقيقية من Gangotri Snout (hv_db عبر الزمن)
const HV_TIME_SERIES = [
  { date: 'Nov 26, 2025', hv: -11.84 },
  { date: 'Dec 20, 2025', hv: -12.34 },
  { date: 'Jan 25, 2026', hv: -12.10 },
  { date: 'Feb 18, 2026', hv: -11.56 },
  { date: 'Mar 26, 2026', hv: -15.01 },
  { date: 'Apr 19, 2026', hv: -13.50 },
  { date: 'May 25, 2026', hv: -14.02 },
  { date: 'Jun 30, 2026', hv: -13.95 },
  { date: 'Jul 24, 2026', hv: -11.34 },
  { date: 'Aug 29, 2026', hv: -11.87 },
  { date: 'Sep 22, 2026', hv: -11.77 },
  { date: 'Oct 28, 2026', hv: -12.26 },
  { date: 'Nov 09, 2026', hv: -12.99 },
];

// ✅ التواريخ الحقيقية
const LAKE_DATES = ['20261109'];

const VELOCITY_DATES = [
  '20251126','20251208','20260101','20260206','20260314','20260407',
  '20260501','20260606','20260712','20260817','20260910','20261004'
];

export default function HimalayasDataPage() {
  const [activeTab, setActiveTab] = useState<'frequency' | 'velocity'>('frequency');
  const [freqMode, setFreqMode] = useState<'L-Band' | 'S-Band'>('L-Band');
  const [activePhase, setActivePhase] = useState('before');

  // ✅ State للـ Frequency
  const [freqZoom, setFreqZoom] = useState(0);
  const [freqPanX, setFreqPanX] = useState(0);
  const [freqPanY, setFreqPanY] = useState(0);

  // ✅ State للـ Lake
  const [lakeIdx, setLakeIdx] = useState(0);
  const [lakeZoom, setLakeZoom] = useState(0);
  const [lakePanX, setLakePanX] = useState(0);
  const [lakePanY, setLakePanY] = useState(0);

  // ✅ State للـ Velocity
  const [velIdx, setVelIdx] = useState(VELOCITY_DATES.length - 1);
  const [velPlaying, setVelPlaying] = useState(false);
  const [velZoom, setVelZoom] = useState(0);
  const [velPanX, setVelPanX] = useState(0);
  const [velPanY, setVelPanY] = useState(0);

  const currentPhase = GLOF_PHASES.find((p) => p.id === activePhase)!;

  // ✅ Play effect للـ Velocity
  useEffect(() => {
    if (!velPlaying) return;
    const timer = setInterval(() => {
      setVelIdx(prev => (prev + 1) % VELOCITY_DATES.length);
    }, 1500);
    return () => clearInterval(timer);
  }, [velPlaying]);

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
            <div className="w-14 h-14 bg-cyan-600/20 rounded-xl flex items-center justify-center border border-cyan-500/30">
              <Snowflake className="w-7 h-7 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Himalayan Cryosphere Data</h1>
              <p className="text-cyan-300/70">Glacial Melt, GLOF Risk & Dual-Frequency Analysis</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-black/30 p-1 rounded-lg mb-8 border border-cyan-500/10">
          <button
            onClick={() => setActiveTab('frequency')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'frequency' ? 'bg-cyan-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" /> Dual-Frequency Physics
          </button>
          <button
            onClick={() => setActiveTab('velocity')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'velocity' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" /> Ice Velocity & GLOF Risk
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'frequency' ? (
            <motion.div
              key="frequency"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Frequency Visualizer */}
              <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-cyan-500/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                    <span className="bg-cyan-600 text-xs px-2 py-1 rounded text-white">LEVEL 1</span>
                    Wavelength Determines Penetration
                  </h2>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                    freqMode === 'L-Band' 
                      ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30' 
                      : 'bg-slate-600/20 text-slate-300 border border-slate-500/30'
                  }`}>
                    {freqMode === 'L-Band' ? 'L-Band • 24 cm' : 'S-Band • ~10 cm'}
                  </span>
                </div>

                <div className="relative h-80 rounded-xl overflow-hidden border border-cyan-500/20 mb-4 bg-white">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${heatmapUrl('himalayas', freqMode === 'L-Band' ? 'freq_diff_db' : 'pol_ratio_db', '20261109')})`,
                      backgroundSize: `${152 + freqZoom * 6}% ${125 + freqZoom * 6}%`,
                      backgroundPosition: `${45 + freqPanX}% ${50 + freqPanY}%`,
                      backgroundRepeat: 'no-repeat',
                      backgroundColor: '#ffffff',
                      transition: 'background-image 0.5s ease, background-size 0.2s, background-position 0.2s',
                    }}
                  />
                  <span className="absolute top-2 left-2 text-[10px] text-white font-mono bg-black/70 px-2 py-1 rounded z-10">
                    {freqMode === 'L-Band' ? 'Freq A − Freq B (dB)' : 'HV/HH Ratio (dB)'}
                  </span>

                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                    <button onClick={() => setFreqZoom(z => z - 1)} className="w-6 h-6 text-white text-xs font-bold hover:bg-white/20 rounded-full cursor-pointer">−</button>
                    <button onClick={() => setFreqZoom(z => z + 1)} className="w-6 h-6 text-white text-xs font-bold hover:bg-white/20 rounded-full cursor-pointer">+</button>
                    <div className="w-px h-4 bg-white/30 mx-1" />
                    <button onClick={() => setFreqPanX(x => x - 2)} className="w-6 h-6 text-white text-xs font-bold hover:bg-white/20 rounded-full cursor-pointer">←</button>
                    <button onClick={() => setFreqPanY(y => y - 2)} className="w-6 h-6 text-white text-xs font-bold hover:bg-white/20 rounded-full cursor-pointer">↑</button>
                    <button onClick={() => setFreqPanY(y => y + 2)} className="w-6 h-6 text-white text-xs font-bold hover:bg-white/20 rounded-full cursor-pointer">↓</button>
                    <button onClick={() => setFreqPanX(x => x + 2)} className="w-6 h-6 text-white text-xs font-bold hover:bg-white/20 rounded-full cursor-pointer">→</button>
                    <div className="w-px h-4 bg-white/30 mx-1" />
                    <button onClick={() => { setFreqZoom(0); setFreqPanX(0); setFreqPanY(0); }} className="w-6 h-6 text-white text-[10px] font-bold hover:bg-white/20 rounded-full cursor-pointer">⟲</button>
                  </div>
                </div>

                <div className="flex gap-4 mb-4">
                  <button
                    onClick={() => setFreqMode('L-Band')}
                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                      freqMode === 'L-Band' ? 'bg-cyan-600 text-white' : 'bg-black/30 text-gray-400 hover:bg-cyan-900/40'
                    }`}
                  >
                    L-Band (Deep Penetration)
                  </button>
                  <button
                    onClick={() => setFreqMode('S-Band')}
                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                      freqMode === 'S-Band' ? 'bg-slate-600 text-white' : 'bg-black/30 text-gray-400 hover:bg-slate-900/40'
                    }`}
                  >
                    S-Band (Surface Reflection)
                  </button>
                </div>

                <div className="bg-black/30 p-4 rounded-lg text-sm text-gray-200 leading-relaxed border-l-4 border-cyan-500">
                  {freqMode === 'L-Band' 
                    ? "The 24 cm L-Band wavelength penetrates deep into the ice and snowpack, revealing internal crevasses and glacier thickness hidden from optical sensors. In the map above, RED areas show where L-band (Freq A) produces stronger backscatter than Freq B — indicating deep ice penetration."
                    : "The ~10 cm S-Band wavelength reflects off the outer surface layer, making it highly sensitive to surface roughness and fresh snow accumulation. The HV/HH ratio map above shows where canopy volume scattering dominates (HIGH values) versus flat surface bounce (LOW values)."}
                </div>
              </div>

              {/* GLOF Phases */}
              <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-cyan-500/20">
                <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5" /> GLOF Event Lifecycle
                </h2>
                <div className="flex gap-2 mb-4">
                  {GLOF_PHASES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setActivePhase(p.id)}
                      className={`flex-1 py-2 rounded-md text-sm font-bold transition-all cursor-pointer ${
                        activePhase === p.id ? `${p.color} text-white shadow-md` : 'bg-black/30 text-gray-400 hover:text-white'
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
                    className="bg-black/30 rounded-xl border border-cyan-500/20 p-4"
                  >
                    <h3 className="text-lg font-bold text-white mb-3">{currentPhase.title}</h3>
                    <ul className="space-y-2">
                      {currentPhase.points.map((pt, i) => (
                        <li key={i} className="text-sm text-gray-300 leading-relaxed flex gap-2">
                          <span className="text-cyan-400 shrink-0">▸</span>
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
              key="velocity"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lake Expansion */}
              {/* Lake Expansion */}
<div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-blue-500/20 flex flex-col">
  <h2 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
    <Layers className="w-5 h-5" /> Glacial Lake Expansion (Before → After)
  </h2>
  
  <div className="relative h-80 rounded-xl overflow-hidden border border-blue-500/20 mb-4 bg-gray-900 flex-shrink-0">
    <img
      src={heatmapUrl('himalayas', 'hv_db_change', LAKE_DATES[lakeIdx])}
      alt="HV Change Map"
      className="w-full h-full object-contain"
    />
    <span className="absolute top-2 left-2 text-[10px] text-white font-mono bg-black/70 px-2 py-1 rounded z-10">
      HV Change (dB) — Nov 2025 → Nov 2026
    </span>
  </div>

  <p className="text-xs text-gray-400 mb-4 flex-shrink-0">
    <span className="text-red-400 font-bold">RED</span> = Lake expansion / Ice loss | 
    <span className="text-blue-400 font-bold"> BLUE</span> = New ice / Vegetation growth
  </p>

  {/* ✅ Line Chart - نفس الـ HV Time Series */}
  <div className="pt-4 border-t border-blue-500/20 flex-grow">
    <h3 className="text-sm font-bold text-blue-400 mb-3 text-center">
      HV Backscatter Time Series — Gangotri Snout
    </h3>
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={HV_TIME_SERIES} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="date" 
            stroke="#94a3b8" 
            fontSize={9} 
            angle={-45} 
            textAnchor="end" 
            height={60}
          />
          <YAxis 
            stroke="#94a3b8" 
            fontSize={10} 
            unit=" dB" 
            domain={[-16, -10]}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(0,0,0,0.9)', 
              border: '1px solid #06b6d4', 
              borderRadius: '8px' 
            }}
            formatter={(value: any) => [`${value} dB`, 'HV Backscatter']}
          />
          <Line 
            type="monotone" 
            dataKey="hv" 
            stroke="#06b6d4" 
            strokeWidth={2.5}
            dot={{ fill: '#06b6d4', r: 3 }}
            activeDot={{ r: 5, fill: '#22d3ee' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
    <p className="text-xs text-gray-500 text-center mt-2">
      HV drop = canopy/ice loss (Mar 2026 spike indicates rapid melt season)
    </p>
  </div>
</div>

                {/* Velocity */}
                <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-blue-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2">
                      <Compass className="w-5 h-5" /> Glacier Velocity (GOFF)
                    </h2>
                    <button
                      onClick={() => setVelPlaying(!velPlaying)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        velPlaying 
                          ? 'bg-red-600 text-white' 
                          : 'bg-blue-600/20 text-blue-300 hover:bg-blue-600/40 border border-blue-500/30'
                      }`}
                    >
                      {velPlaying ? '⏸ Pause' : '▶ Play Timeline'}
                    </button>
                  </div>

                  <div className="relative h-72 rounded-xl overflow-hidden border border-blue-500/20 mb-4 bg-white">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `url(${heatmapUrl('himalayas', 'velocity_m_yr', VELOCITY_DATES[velIdx])})`,
                        backgroundSize: `${152 + velZoom * 6}% ${125 + velZoom * 6}%`,
                        backgroundPosition: `${45 + velPanX}% ${50 + velPanY}%`,
                        backgroundRepeat: 'no-repeat',
                        backgroundColor: '#ffffff',
                      }}
                    />
                    <span className="absolute top-2 right-2 text-xs text-white font-mono bg-black/70 px-2 py-1 rounded z-10">
                      {prettyDate(VELOCITY_DATES[velIdx].split('_')[0])}
                    </span>
                    <span className="absolute top-2 left-2 text-xs text-white font-mono bg-black/70 px-2 py-1 rounded z-10">
                      {velIdx + 1} / {VELOCITY_DATES.length}
                    </span>

                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                      <button onClick={() => setVelZoom(z => z - 1)} className="w-6 h-6 text-white text-xs font-bold hover:bg-white/20 rounded-full cursor-pointer">−</button>
                      <button onClick={() => setVelZoom(z => z + 1)} className="w-6 h-6 text-white text-xs font-bold hover:bg-white/20 rounded-full cursor-pointer">+</button>
                      <div className="w-px h-4 bg-white/30 mx-1" />
                      <button onClick={() => setVelPanX(x => x - 2)} className="w-6 h-6 text-white text-xs font-bold hover:bg-white/20 rounded-full cursor-pointer">←</button>
                      <button onClick={() => setVelPanY(y => y - 2)} className="w-6 h-6 text-white text-xs font-bold hover:bg-white/20 rounded-full cursor-pointer">↑</button>
                      <button onClick={() => setVelPanY(y => y + 2)} className="w-6 h-6 text-white text-xs font-bold hover:bg-white/20 rounded-full cursor-pointer">↓</button>
                      <button onClick={() => setVelPanX(x => x + 2)} className="w-6 h-6 text-white text-xs font-bold hover:bg-white/20 rounded-full cursor-pointer">→</button>
                      <div className="w-px h-4 bg-white/30 mx-1" />
                      <button onClick={() => { setVelZoom(0); setVelPanX(0); setVelPanY(0); }} className="w-6 h-6 text-white text-[10px] font-bold hover:bg-white/20 rounded-full cursor-pointer">⟲</button>
                    </div>
                  </div>

                  <div className="flex gap-1.5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {VELOCITY_DATES.map((date, i) => (
                      <button
                        key={date}
                        onClick={() => { setVelPlaying(false); setVelIdx(i); }}
                        className={`flex-shrink-0 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          i === velIdx 
                            ? 'bg-blue-600 text-white shadow-lg scale-105' 
                            : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {prettyDate(date.split('_')[0]).replace(/,.*/, '')}
                      </button>
                    ))}
                  </div>

                  <p className="text-xs text-gray-400 mt-3 text-center">
                    <span className="text-yellow-400 font-bold">Yellow</span> = Fast glacier tongue (150 m/yr) | 
                    <span className="text-purple-400 font-bold"> Purple</span> = Slow ice creep (0-50 m/yr)
                  </p>


                </div>
              </div>

              {/* Physics Explanation */}
              <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border-l-4 border-cyan-500">
                <h3 className="text-lg font-bold text-cyan-400 mb-3 flex items-center gap-2">
                  <Layers className="w-5 h-5" /> Why 12-Day Repeat Matters
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                  While a GLOF unfolds in hours, the <strong className="text-cyan-300">precursors</strong> (rapid lake growth, dam deformation, accelerating ice motion) build up over weeks. 
                  NISAR's exact 12-day repeat cycle with consistent acquisition geometry is perfectly tuned to detect these critical warning signs through persistent mountain cloud cover.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Snowflake, ArrowLeft, Layers, Activity, Compass } from 'lucide-react';
import Link from 'next/link';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer 
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

const VELOCITY_DATA = [
  { subject: 'North', A: 120, fullMark: 150 },
  { subject: 'North-East', A: 98, fullMark: 150 },
  { subject: 'East', A: 86, fullMark: 150 },
  { subject: 'South-East', A: 99, fullMark: 150 },
  { subject: 'South', A: 85, fullMark: 150 },
  { subject: 'South-West', A: 65, fullMark: 150 },
  { subject: 'West', A: 110, fullMark: 150 },
  { subject: 'North-West', A: 130, fullMark: 150 },
];

const LAKE_YEARS = [
  { year: 2019, area: 12, intensity: 0.3 },
  { year: 2020, area: 18, intensity: 0.45 },
  { year: 2021, area: 25, intensity: 0.6 },
  { year: 2022, area: 38, intensity: 0.8 },
  { year: 2023, area: 45, intensity: 1.0 },
  { year: 2024, area: 41, intensity: 0.9 },
];

export default function HimalayasDataPage() {
  const [activeTab, setActiveTab] = useState<'frequency' | 'velocity'>('frequency');
  const [freqMode, setFreqMode] = useState<'L-Band' | 'S-Band'>('L-Band');
  const [activePhase, setActivePhase] = useState('before');
  const [selectedYear, setSelectedYear] = useState(2023);

  const currentPhase = GLOF_PHASES.find((p) => p.id === activePhase)!;
  const yearData = LAKE_YEARS.find((y) => y.year === selectedYear) || LAKE_YEARS[0];

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
                <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
                  <span className="bg-cyan-600 text-xs px-2 py-1 rounded text-white">LEVEL 1</span>
                  Wavelength Determines Penetration
                </h2>
                
                <div className="relative h-64 rounded-xl overflow-hidden border border-cyan-500/20 bg-black/40 mb-6">
                  <div className={`absolute inset-0 transition-all duration-700 ${freqMode === 'L-Band' ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/40 to-blue-950/80" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                      <Layers className="w-12 h-12 text-cyan-400 mx-auto mb-2" />
                      <p className="text-cyan-300 font-bold text-lg">L-Band (24 cm)</p>
                      <p className="text-sm text-gray-400 max-w-md mx-auto">Penetrates deep ice, revealing internal crevasses & structural changes.</p>
                    </div>
                  </div>
                  <div className={`absolute inset-0 transition-all duration-700 ${freqMode === 'S-Band' ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-200/20 to-slate-400/40" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                      <Activity className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-200 font-bold text-lg">S-Band (~10 cm)</p>
                      <p className="text-sm text-gray-400 max-w-md mx-auto">Reflects off the outer layer, mapping surface conditions & snow cover.</p>
                    </div>
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
                    ? "The 24 cm L-Band wavelength is long enough to penetrate deep into the ice and snowpack. This allows NISAR to reveal internal crevasses, measure glacier thickness, and track structural changes hidden from optical sensors."
                    : "The ~10 cm S-Band wavelength is shorter and primarily reflects off the outer surface layer. This makes it highly sensitive to surface roughness, fresh snow accumulation, and the immediate top layer of the glacier."}
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
                {/* Lake Expansion Heatmap */}
                <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-blue-500/20">
                  <h2 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5" /> Glacial Lake Expansion
                  </h2>
                  <div className="relative h-64 rounded-xl overflow-hidden border border-blue-500/20 bg-black/40 mb-4">
                    <div
                      className="absolute inset-0 transition-all duration-700"
                      style={{
                        opacity: yearData.intensity,
                        background: `radial-gradient(ellipse at 50% 50%, rgba(6,182,212,0.85) 0%, rgba(6,182,212,0.35) 35%, transparent 70%),
                                     radial-gradient(ellipse 40% 35% at 30% 70%, rgba(59,130,246,0.6) 0%, rgba(59,130,246,0.2) 40%, transparent 65%),
                                     linear-gradient(135deg, #0a0a0a 0%, #0a1a2a 100%)`,
                      }}
                    />
                    <span className="absolute bottom-2 left-3 text-xs text-gray-400 font-mono">
                      Himalayan Range • {selectedYear} • Max Area: {yearData.area} km²
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {LAKE_YEARS.map((y) => (
                      <button
                        key={y.year}
                        onClick={() => setSelectedYear(y.year)}
                        className={`flex-1 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          y.year === selectedYear ? 'bg-cyan-600 text-white shadow-lg' : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {y.year}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Velocity Radar Chart */}
                <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-blue-500/20 flex flex-col">
                  <h2 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                    <Compass className="w-5 h-5" /> Glacier Velocity Vectors (GOFF)
                  </h2>
                  <div className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={VELOCITY_DATA}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <Radar
                          name="Velocity (m/yr)"
                          dataKey="A"
                          stroke="#06b6d4"
                          strokeWidth={2}
                          fill="#06b6d4"
                          fillOpacity={0.4}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Angle = Direction of ice flow | Radius = Speed of movement
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
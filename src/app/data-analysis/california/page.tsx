'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Mountain, ArrowLeft, Layers, Activity } from 'lucide-react';
import Link from 'next/link';

import CompareSlider from '@/components/map/CompareSlider';
import { PolarizationChart, SubsidenceChart } from '@/components/charts/ChartWidget';

const FIRE_PHASES = [
  {
    id: 'before',
    label: 'Before',
    title: 'Preparedness & Baseline',
    color: 'bg-amber-600',
    points: [
      'L-band polarimetric backscatter maps forest structure & biomass — the "fuel load" of the fire.',
      'A dense 12-day time series builds the baseline needed for later before/after comparison.',
      'Identifies high-risk, drought-stressed zones prone to ignition BEFORE fires start.',
    ],
  },
  {
    id: 'during',
    label: 'During',
    title: 'Crisis Response',
    color: 'bg-red-600',
    points: [
      'Radar penetrates smoke & clouds, day or night, to map fire perimeters and spread direction.',
      'Revisit every 12 days (~6 when ascending + descending passes combine).',
      'Complements thermal active-fire sensors with smoke-free damage mapping.',
    ],
  },
  {
    id: 'after',
    label: 'After',
    title: 'Recovery & Secondary Hazards',
    color: 'bg-orange-600',
    points: [
      'Burn severity at 3–10 m from pre/post backscatter & coherence change detection.',
      'L-band responds to lost trunks/branches/biomass; altered soil hydrophobicity destabilizes slopes.',
      'Repeat passes track slope movement & vegetation regrowth ahead of the rainy season.',
    ],
  },
];

const SUBSIDICE_YEARS = [
  { year: 2019, maxMm: -12, intensity: 0.3 },
  { year: 2020, maxMm: -18, intensity: 0.45 },
  { year: 2021, maxMm: -25, intensity: 0.6 },
  { year: 2022, maxMm: -38, intensity: 0.8 },
  { year: 2023, maxMm: -45, intensity: 1.0 },
  { year: 2024, maxMm: -41, intensity: 0.9 },
];

export default function CaliforniaDataPage() {
  const [activeTab, setActiveTab] = useState<'wildfire' | 'subsidence'>('wildfire');
  const [polarizationMode, setPolarizationMode] = useState<'HH' | 'HV'>('HV');
  const [activePhase, setActivePhase] = useState('before');
  const [selectedYear, setSelectedYear] = useState(2023);

  const currentPhase = FIRE_PHASES.find((p) => p.id === activePhase)!;
  const yearData = SUBSIDICE_YEARS.find((y) => y.year === selectedYear) || SUBSIDICE_YEARS[0];

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
            <div className="w-14 h-14 bg-red-600/20 rounded-xl flex items-center justify-center border border-red-500/30">
              <Flame className="w-7 h-7 text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">California Data Analysis</h1>
              <p className="text-red-300/70">Wildfire Scars & Central Valley Subsidence</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-black/30 p-1 rounded-lg mb-8 border border-red-500/10">
          <button
            onClick={() => setActiveTab('wildfire')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'wildfire' ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4" /> Wildfire & Polarization
          </button>
          <button
            onClick={() => setActiveTab('subsidence')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'subsidence' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Mountain className="w-4 h-4" /> Land Subsidence
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'wildfire' ? (
            <motion.div
              key="wildfire"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Compare Slider */}
              <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-red-500/20">
                <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                  <span className="bg-red-600 text-xs px-2 py-1 rounded text-white">LEVEL 1</span>
                  Smoke Penetration: Optical vs NISAR
                </h2>
                <CompareSlider
                  beforeImage="https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=800&q=80"
                  afterImage="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80"
                  beforeLabel="Optical (Smoke)"
                  afterLabel="NISAR Radar"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Polarization */}
                <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-red-500/20">
                  <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                    <span className="bg-red-600 text-xs px-2 py-1 rounded text-white">LEVEL 2</span>
                    Polarization Physics
                  </h2>
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setPolarizationMode('HH')}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                        polarizationMode === 'HH' ? 'bg-red-600 text-white' : 'bg-black/30 text-gray-400 hover:bg-red-900/40'
                      }`}
                    >
                      HH Polarization
                    </button>
                    <button
                      onClick={() => setPolarizationMode('HV')}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                        polarizationMode === 'HV' ? 'bg-red-600 text-white' : 'bg-black/30 text-gray-400 hover:bg-red-900/40'
                      }`}
                    >
                      HV Polarization
                    </button>
                  </div>
                  <div className="bg-black/30 p-4 rounded-lg text-sm text-gray-200 leading-relaxed border-l-4 border-red-500">
                    {polarizationMode === 'HV' ? (
                      <p><strong className="text-red-400">Volume Scattering (HV):</strong> When forests burn and lose their leaves (Canopy Loss), internal radar scattering drops, causing the HV signal to decrease significantly.</p>
                    ) : (
                      <p><strong className="text-red-400">Double-Bounce (HH):</strong> The HH signal spikes due to direct reflection off charred tree trunks and bare ground — L-band (24 cm) penetrates the canopy and responds precisely to this structural change.</p>
                    )}
                  </div>
                </div>

                {/* Polarization Chart */}
                <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-red-500/20">
                  <PolarizationChart />
                </div>
              </div>

              {/* Fire Phases */}
              <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-red-500/20">
                <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5" /> Fire Event Lifecycle
                </h2>
                <div className="flex gap-2 mb-4">
                  {FIRE_PHASES.map((p) => (
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
                    className="bg-black/30 rounded-xl border border-red-500/20 p-4"
                  >
                    <h3 className="text-lg font-bold text-white mb-3">{currentPhase.title}</h3>
                    <ul className="space-y-2">
                      {currentPhase.points.map((pt, i) => (
                        <li key={i} className="text-sm text-gray-300 leading-relaxed flex gap-2">
                          <span className="text-red-400 shrink-0">▸</span>
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
                {/* Heatmap */}
                <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-orange-500/20">
                  <h2 className="text-xl font-bold text-orange-400 mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5" /> GUNW Subsidence Map
                  </h2>
                  <div className="relative h-64 rounded-xl overflow-hidden border border-orange-500/20 bg-black/40 mb-4">
                    <div
                      className="absolute inset-0 transition-all duration-700"
                      style={{
                        opacity: yearData.intensity,
                        background: `radial-gradient(ellipse at 30% 40%, rgba(239,68,68,0.85) 0%, rgba(239,68,68,0.35) 35%, transparent 70%),
                                     radial-gradient(ellipse 40% 35% at 70% 60%, rgba(249,115,22,0.6) 0%, rgba(249,115,22,0.2) 40%, transparent 65%),
                                     linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 100%)`,
                      }}
                    />
                    <span className="absolute bottom-2 left-3 text-xs text-gray-400 font-mono">
                      Central Valley, CA • {selectedYear} • Max: {yearData.maxMm} mm/yr
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {SUBSIDICE_YEARS.map((y) => (
                      <button
                        key={y.year}
                        onClick={() => setSelectedYear(y.year)}
                        className={`flex-1 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          y.year === selectedYear ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {y.year}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subsidence Chart */}
                <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-orange-500/20">
                  <SubsidenceChart />
                </div>
              </div>

              {/* Physics Explanation */}
              <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border-l-4 border-orange-500">
                <h3 className="text-lg font-bold text-orange-400 mb-3 flex items-center gap-2">
                  <Layers className="w-5 h-5" /> Why L-Band for Subsidence?
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                  L-band (24 cm) <strong className="text-orange-300">keeps coherence better than shorter wavelengths</strong> across 
                  multi-year InSAR stacks — which is exactly what makes tracking mm-scale sinking over years possible. 
                  The 12-day exact repeat with the same acquisition geometry keeps seasons directly comparable.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
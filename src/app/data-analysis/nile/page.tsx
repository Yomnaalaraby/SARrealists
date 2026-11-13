'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wheat, ArrowLeft, Layers, Activity, Droplets } from 'lucide-react';
import Link from 'next/link';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line
} from 'recharts';

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

const SOIL_MOISTURE_DATA = [
    { month: 'Nov', moisture: 15 },
    { month: 'Dec', moisture: 22 },
    { month: 'Jan', moisture: 35 },
    { month: 'Feb', moisture: 45 },
    { month: 'Mar', moisture: 60 },
    { month: 'Apr', moisture: 75 },
    { month: 'May', moisture: 80 },
    { month: 'Jun', moisture: 65 },
    { month: 'Jul', moisture: 40 },
    { month: 'Aug', moisture: 20 },
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
    const [selectedYear, setSelectedYear] = useState(2023);

    const currentPhase = AGRI_PHASES.find((p) => p.id === activePhase)!;
    const yearData = SUBSIDENCE_YEARS.find((y) => y.year === selectedYear) || SUBSIDENCE_YEARS[0];

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
                                        <Droplets className="w-5 h-5" /> Soil Moisture Time-Series
                                    </h2>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <AreaChart data={SOIL_MOISTURE_DATA}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                                            <YAxis stroke="#9CA3AF" fontSize={12} label={{ value: '%', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }} />
                                            <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
                                            <Area type="monotone" dataKey="moisture" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                    <p className="text-xs text-gray-400 text-center mt-2">
                                        Simulated 12-day revisit soil moisture cycle for a selected farm.
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
                                    <div className="relative h-64 rounded-xl overflow-hidden border border-emerald-500/20 bg-black/40 mb-4">
                                        <div
                                            className="absolute inset-0 transition-all duration-700"
                                            style={{
                                                opacity: yearData.intensity,
                                                background: `radial-gradient(ellipse at 40% 60%, rgba(16,185,129,0.85) 0%, rgba(16,185,129,0.35) 35%, transparent 70%),
                                     radial-gradient(ellipse 40% 35% at 70% 40%, rgba(245,158,11,0.6) 0%, rgba(245,158,11,0.2) 40%, transparent 65%),
                                     linear-gradient(135deg, #0a0a0a 0%, #0a1a10 100%)`,
                                            }}
                                        />
                                        <span className="absolute bottom-2 left-3 text-xs text-gray-400 font-mono">
                                            Nile Delta Coast • {selectedYear} • Max: {yearData.maxMm} mm/yr
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        {SUBSIDENCE_YEARS.map((y) => (
                                            <button
                                                key={y.year}
                                                onClick={() => setSelectedYear(y.year)}
                                                className={`flex-1 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${y.year === selectedYear ? 'bg-emerald-600 text-white shadow-lg' : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700'
                                                    }`}
                                            >
                                                {y.year}
                                            </button>
                                        ))}
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
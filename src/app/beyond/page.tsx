'use client';

import React from 'react';
import Link from 'next/link';
import { motion, Variants, type Variant } from 'framer-motion';
import { 
  ArrowLeft, 
  Satellite, 
  Zap, 
  Sprout, 
  TrendingDown, 
  CloudOff, 
  Activity 
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line,
  BarChart, Bar, Cell,
  ComposedChart, Scatter
} from 'recharts';

// --- 1. Mock Data for Predictive Cards ---

// Card 1: Global Carbon Budget (Confidence Bands shrinking post-2025)
const carbonData = [
  { year: '2023', estimate: 100, upper: 125, lower: 75 },
  { year: '2024', estimate: 98, upper: 120, lower: 76 },
  { year: '2025', estimate: 95, upper: 105, lower: 85 }, // NISAR Launch: Uncertainty shrinks
  { year: '2026', estimate: 92, upper: 98, lower: 86 },
  { year: '2027', estimate: 89, upper: 94, lower: 84 },
  { year: '2028', estimate: 85, upper: 89, lower: 81 },
];

// Card 2: Urgent Disaster Response (Timeline Comparison)
const disasterData = [
  { name: 'NISAR (All-Weather Radar)', days: 12, fill: '#d946ef' }, // Fuchsia for NISAR
  { name: 'Optical Satellites (Cloud-Dependent)', days: 35, fill: '#64748b' }, // Slate for Optical
];

// Card 3: Global Food Security (Scatter with Trendline)
const foodSecurityData = [
  { moisture: 12, yield: 2.1, trend: 2.5 },
  { moisture: 18, yield: 3.4, trend: 3.2 },
  { moisture: 22, yield: 4.0, trend: 3.8 },
  { moisture: 28, yield: 4.9, trend: 4.5 },
  { moisture: 32, yield: 5.8, trend: 5.1 },
  { moisture: 38, yield: 6.5, trend: 5.9 },
  { moisture: 42, yield: 7.2, trend: 6.6 },
];

// --- 2. Animation Variants ---
// --- 2. Animation Variants ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: 'spring', stiffness: 50, damping: 20 } 
  }
};

// --- 3. Main Page Component ---
export default function BeyondPage() {
  return (
    <div className="min-h-screen pt-10 bg-slate-950 text-slate-100 selection:bg-fuchsia-500/30">
      {/* Background Gradient Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6"
        >
          <div>
            <Link 
              href="/data-analysis" 
              className="inline-flex items-center gap-2 text-slate-400 hover:text-fuchsia-400 transition-colors mb-4 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-fuchsia-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Beyond 2026 Horizons
            </h1>
            <p className="mt-3 text-slate-400 max-w-2xl text-lg">
              Predictive analytics and future applications powered by NISAR's continuous L & S-Band radar observations.
            </p>
          </div>
          
          <div className="flex items-center gap-3 px-4 py-2 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-full">
            <Satellite className="w-5 h-5 text-fuchsia-400 animate-pulse" />
            <span className="text-sm font-medium text-fuchsia-300">NISAR Orbit: Active & Streaming</span>
          </div>
        </motion.div>

        {/* Predictive Cards Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          
          {/* Card 1: Global Carbon Budget */}
          <motion.div variants={itemVariants} className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 hover:border-fuchsia-500/30 transition-colors">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-emerald-400" />
                  Global Carbon Budget
                </h3>
                <p className="text-sm text-slate-400 mt-2">
                  Uncertainty in carbon tracking shrinks drastically post-2025.
                </p>
              </div>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={carbonData}>
                  <defs>
                    <linearGradient id="colorEstimate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d946ef" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#d946ef" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} unit=" Mg/ha" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                    itemStyle={{ color: '#d946ef' }}
                  />
                  {/* Confidence Band */}
                  <Line type="monotone" dataKey="upper" stroke="#d946ef" strokeDasharray="3 3" dot={false} strokeWidth={1} opacity={0.5} />
                  <Line type="monotone" dataKey="lower" stroke="#d946ef" strokeDasharray="3 3" dot={false} strokeWidth={1} opacity={0.5} />
                  {/* Main Estimate */}
                  <Area type="monotone" dataKey="estimate" stroke="#d946ef" strokeWidth={3} fillOpacity={1} fill="url(#colorEstimate)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <p className="text-xs text-emerald-300 flex items-start gap-2">
                <Activity className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  <strong>Key Insight:</strong> NISAR’s unique L-Band penetrates forests to measure low-density woody biomass (<strong>&lt;100 Mg/ha</strong>), drastically reducing error margins.
                </span>
              </p>
            </div>
          </motion.div>

          {/* Card 2: Urgent Disaster Response */}
          <motion.div variants={itemVariants} className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 hover:border-fuchsia-500/30 transition-colors">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  Urgent Disaster Response
                </h3>
                <p className="text-sm text-slate-400 mt-2">
                  Time to actionable damage assessment maps (in days).
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={disasterData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} unit=" days" />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={140} />
                  <Tooltip 
                    cursor={{ fill: '#1e293b' }}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                  />
                  <Bar dataKey="days" radius={[0, 6, 6, 0]} barSize={32}>
                    {disasterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-xs text-amber-300 flex items-start gap-2">
                <CloudOff className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  <strong>Key Insight:</strong> NISAR guarantees rapid <strong>12-day</strong> damage assessment maps for rescue teams, completely unhindered by cloud cover or smoke.
                </span>
              </p>
            </div>
          </motion.div>

          {/* Card 3: Global Food Security */}
          <motion.div variants={itemVariants} className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 hover:border-fuchsia-500/30 transition-colors">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-green-400" />
                  Global Food Security
                </h3>
                <p className="text-sm text-slate-400 mt-2">
                  Predictive correlation: Soil moisture vs. Crop yields.
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={foodSecurityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="moisture" 
                    type="number" 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    name="Soil Moisture" 
                    unit="%" 
                  />
                  <YAxis 
                    dataKey="yield" 
                    type="number" 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    name="Yield" 
                    unit=" t/ha" 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                    labelFormatter={(value) => `Moisture: ${value}%`}
                  />
                  <Scatter name="Field Observations" dataKey="yield" fill="#10b981" />
                  <Line 
                    name="Predictive Trendline" 
                    type="monotone" 
                    dataKey="trend" 
                    stroke="#f43f5e" 
                    strokeDasharray="5 5" 
                    strokeWidth={2} 
                    dot={false} 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-xs text-green-300 flex items-start gap-2">
                <Sprout className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  <strong>Key Insight:</strong> <strong>200m resolution</strong> soil moisture readings act as an early-warning system, correlating directly with forecasted national crop yields.
                </span>
              </p>
            </div>
          </motion.div>

        </motion.div>

        {/* Footer / Call to Action */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center border-t border-slate-800 pt-8"
        >
          
        </motion.div>
      </div>
    </div>
  );
}
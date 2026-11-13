'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Flame, Snowflake, Wheat, ArrowRight } from 'lucide-react';

const regions = [
  {
    id: 'california',
    title: 'California, USA',
    subtitle: 'Wildfires & Land Subsidence',
    description: 'Explore burn severity maps, polarization physics (HH/HV), and Central Valley subsidence data from GUNW InSAR.',
    icon: Flame,
    color: 'from-red-600 to-orange-600',
    borderColor: 'border-red-500/30',
    hoverColor: 'hover:border-red-500/60',
    shadowColor: 'shadow-red-600/20',
  },
  {
    id: 'himalayas',
    title: 'Himalayan Cryosphere',
    subtitle: 'Glacial Melt & GLOF Risk',
    description: 'Dual-frequency L/S-band analysis, glacier velocity vectors (GOFF), and moraine dam deformation tracking.',
    icon: Snowflake,
    color: 'from-cyan-600 to-blue-600',
    borderColor: 'border-cyan-500/30',
    hoverColor: 'hover:border-cyan-500/60',
    shadowColor: 'shadow-cyan-600/20',
  },
  {
    id: 'nile',
    title: 'Nile Delta, Egypt',
    subtitle: 'Food Security & Coastal Subsidence',
    description: 'Soil moisture (SME2), urban encroachment, crop phenology, and millimeter-scale coastal subsidence.',
    icon: Wheat,
    color: 'from-green-600 to-emerald-600',
    borderColor: 'border-green-500/30',
    hoverColor: 'hover:border-green-500/60',
    shadowColor: 'shadow-green-600/20',
  },
];

export default function DataAnalysisPage() {
  return (
    <div className="min-h-screen bg-black pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Data <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Analysis</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Deep-dive into NISAR SAR data across three critical global regions. 
            Explore backscatter, polarization, InSAR, and more.
          </p>
        </motion.div>

        {/* Region Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {regions.map((region, i) => {
            const Icon = region.icon;
            return (
              <motion.div
                key={region.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={`/data-analysis/${region.id}`}>
                  <div className={`group relative bg-black/40 backdrop-blur-md p-6 rounded-2xl border ${region.borderColor} ${region.hoverColor} hover:shadow-xl ${region.shadowColor} transition-all cursor-pointer h-full`}>
                    <div className={`w-14 h-14 bg-gradient-to-br ${region.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">{region.title}</h2>
                    <p className={`text-sm font-medium mb-3 bg-gradient-to-r ${region.color} bg-clip-text text-transparent`}>
                      {region.subtitle}
                    </p>
                    <p className="text-sm text-gray-400 leading-relaxed mb-4">
                      {region.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                      <span>Explore Data</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/20 rounded-xl p-6 text-center"
        >
          <p className="text-sm text-gray-300">
            <span className="font-bold text-blue-400">NISAR Specs:</span> L-Band 24cm • S-Band 10cm • 12-Day Repeat • 240km Swath • 3-10m Resolution
          </p>
        </motion.div>
      </div>
    </div>
  );
}
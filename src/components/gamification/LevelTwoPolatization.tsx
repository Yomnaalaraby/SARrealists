'use client';
import { useState } from 'react';

export default function LevelTwoPolarization() {
  const [mode, setMode] = useState<'HH' | 'HV'>('HV');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="bg-blue-600 text-[10px] font-bold px-2 py-0.5 rounded text-white">LEVEL 2</span>
        <h3 className="text-lg font-bold text-white">Mission: Decode the Physics</h3>
      </div>
      
      <div className="flex gap-2">
        <button 
          onClick={() => setMode('HH')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'HH' ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
        >
          HH Polarization
        </button>
        <button 
          onClick={() => setMode('HV')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'HV' ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
        >
          HV Polarization
        </button>
      </div>

      <div className="bg-black/40 p-4 rounded-lg text-sm text-gray-300 leading-relaxed border-l-4 border-blue-500 min-h-[80px]">
        {mode === 'HV' ? (
          <p><strong className="text-blue-400">Volume Scattering (HV):</strong> When forests burn and lose their leaves (Canopy Loss), internal radar scattering drops, causing the HV signal to decrease significantly.</p>
        ) : (
          <p><strong className="text-blue-400">Double-Bounce (HH):</strong> The HH signal spikes due to direct reflection off charred tree trunks and bare ground, acting like a corner reflector.</p>
        )}
      </div>
    </div>
  );
}
'use client';
import CompareSlider from '../map/CompareSlider';

export default function LevelOneSmoke() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="bg-blue-600 text-[10px] font-bold px-2 py-0.5 rounded text-white">LEVEL 1</span>
        <h3 className="text-lg font-bold text-white">Mission: See Through the Smoke</h3>
      </div>
      <p className="text-gray-400 text-sm leading-relaxed">
        Optical cameras are blinded by smoke. Drag the slider to activate NISAR's L-Band radar and reveal the burned forest scars beneath.
      </p>
      {/* Using Unsplash images as Mock Data */}
      <CompareSlider 
        beforeImage="https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=800&q=80" // Mock Smoke
        afterImage="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80" // Mock Radar/Space
        beforeLabel="Sentinel-2 (Optical)" 
        afterLabel="NISAR (L-Band Radar)" 
      />
    </div>
  );
}
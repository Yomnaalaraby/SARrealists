'use client';
import { useState, useRef, useCallback } from 'react';

interface CompareSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel: string;
  afterLabel: string;
}

export default function CompareSlider({ beforeImage, afterImage, beforeLabel, afterLabel }: CompareSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : (event as React.MouseEvent).clientX;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[300px] overflow-hidden rounded-xl border border-red-500/30 cursor-ew-resize select-none shadow-2xl group"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
    >
      {/* After Image (NISAR Radar) - Background */}
      <div className="absolute inset-0">
        <img src={afterImage} alt="NISAR Radar" className="w-full h-full object-cover" />
        {/* تم تغيير اللون هنا إلى الأحمر */}
        <span className="absolute top-4 right-4 bg-red-600/90 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm">
          {afterLabel}
        </span>
      </div>

      {/* Before Image (Optical Smoke) - Clipped */}
      <div 
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img src={beforeImage} alt="Optical Smoke" className="w-full h-full object-cover" />
        <span className="absolute top-4 left-4 bg-gray-800/90 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm">
          {beforeLabel}
        </span>
      </div>

      {/* Slider Handle - تم تغيير الحدود إلى الأحمر */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10 pointer-events-none transition-all duration-75"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl border-2 border-red-500 group-hover:scale-110 transition-transform">
          <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </div>
      </div>
    </div>
  );
}
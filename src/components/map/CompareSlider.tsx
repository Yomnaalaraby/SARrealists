'use client';
import { useState, useRef, useCallback } from 'react';

interface CompareSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel: string;
  afterLabel: string;
  beforeEffect?: boolean;
  afterFit?: 'contain' | 'cover';
  afterZoom?: number;       // ✅ للتحكم في نسبة التكبير
  afterPosition?: string;   // ✅ للتحكم في مركز الصورة (مثال: 'center' أو '30% center')
}

export default function CompareSlider({
  beforeImage,
  afterImage,
  beforeLabel,
  afterLabel,
  beforeEffect = false,
  afterFit = 'cover',
  afterZoom = 1.6,          // ✅ ديفولت 1.6 عشان تكون مكبرة وواضحة من أول ما تفتح
  afterPosition = 'center', // ✅ تركز على منتصف الصورة (ممكن تغيريها لو البيانات مائلة)
}: CompareSliderProps) {
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
      className="relative w-full max-w-3xl mx-auto aspect-[4/3] overflow-hidden rounded-xl border border-red-500/30 cursor-ew-resize select-none shadow-2xl group bg-black"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
    >
      {/* ✅ After (NISAR) — استخدمنا img مع transform عشان الزوم يكون ناعم ودقيق */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={afterImage}
          alt="NISAR Radar"
          className="w-full h-full transition-transform duration-500 ease-out"
          style={{
            objectFit: afterFit,
            objectPosition: afterPosition,
            transform: `scale(${afterZoom})`,
          }}
        />
        <span className="absolute top-4 right-4 bg-red-600/90 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-20 pointer-events-none">
          {afterLabel}
        </span>
      </div>

      {/* Before (Optical) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={beforeImage}
          alt="Optical Smoke"
          className="w-full h-full"
          style={{ 
            objectFit: 'cover', 
            filter: beforeEffect ? 'blur(2.5px) grayscale(0.75) brightness(0.7)' : 'none' 
          }}
        />
        {beforeEffect && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-300/75 via-gray-400/55 to-gray-200/75 pointer-events-none" />
        )}
        <span className="absolute top-4 left-4 bg-gray-800/90 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-20 pointer-events-none">
          {beforeLabel}
        </span>
      </div>

      {/* Handle (شريط السحب) */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-30 pointer-events-none" 
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
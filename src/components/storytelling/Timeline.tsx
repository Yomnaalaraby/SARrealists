'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface TimelineImage {
  month: string;
  label: string;
  imageUrl: string;
  description: string;
}

interface TimelineProps {
  title: string;
  images: TimelineImage[];
  theme: 'fire' | 'ice' | 'agriculture';
}

const themeColors = {
  fire: { accent: 'red', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
  ice: { accent: 'cyan', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400' },
  agriculture: { accent: 'green', bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
};

export default function Timeline({ title, images, theme }: TimelineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const colors = themeColors[theme];

  const prev = () => setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <div className={`${colors.bg} backdrop-blur-sm rounded-xl border ${colors.border} p-5`}>
      <div className="flex items-center gap-2 mb-4">
        <Calendar className={`w-4 h-4 ${colors.text}`} />
        <h3 className={`text-sm font-bold ${colors.text}`}>{title}</h3>
      </div>

      {/* 🖼️ الصورة كاملة بدون قص — الخلفية بيضاء عشان matplotlib */}
      <div className="relative h-72 rounded-lg overflow-hidden bg-white mb-3 border border-gray-200">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <img
              src={images[currentIndex].imageUrl}
              alt={images[currentIndex].label}
              className="w-full h-full object-contain p-2"
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows — ألوان تتناسب مع الخلفية البيضاء */}
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors z-10"
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors z-10"
        >
          <ChevronRight className="w-4 h-4 text-white" />
        </button>

        {/* Label Badge فوق الصورة */}
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-3 py-1 rounded-full z-10">
          {images[currentIndex].label}
        </div>
      </div>

      {/* 📝 الـ description تحت الصورة مش فوقها */}
      <p className="text-xs text-gray-300 leading-relaxed mb-3 px-1">
        {images[currentIndex].description}
      </p>

      {/* Thumbnails — نفس المنطق object-contain */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all bg-white ${
              i === currentIndex ? `${colors.border} scale-105` : 'border-gray-300 opacity-50 hover:opacity-80'
            }`}
          >
            <img
              src={img.imageUrl}
              alt={img.month}
              className="w-full h-full object-contain p-1"
            />
          </button>
        ))}
      </div>

      {/* Month Indicator */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-400 font-mono">{images[currentIndex].month}</span>
        <span className={`text-xs font-mono ${colors.text}`}>
          {currentIndex + 1} / {images.length}
        </span>
      </div>
    </div>
  );
}
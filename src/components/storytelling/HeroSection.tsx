'use client';

import { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { PlayButton } from '@/game/components/PlayButton';

// نفس ستايل الـ badges اللي في CaliforniaSection عشان التناسق
const HERO_SPECS = ['L-BAND 24 CM', 'S-BAND 10 CM', '12-DAY REPEAT', '240 KM SWATH'];

export default function HeroSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { amount: 0.5 });

  useEffect(() => {
    if (isInView) {
      const event = new CustomEvent('flyToLocation', { detail: 'hero' });
      window.dispatchEvent(event);
    }
  }, [isInView]);

  // دي الدالة اللي بتشتغل لما اليوزر يضغط على السهم — زي ما هي بالظبط
  const handleScrollClick = () => {
    const californiaElement = document.getElementById('california-section');
    if (californiaElement) {
      californiaElement.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    }
  };

  // متغيرات الظهور المتدرج
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.25, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' as const } },
  };

  return (
    <section
      ref={ref}
      className="h-screen w-full flex flex-col items-center justify-center relative z-10 pointer-events-none"
    >
      {/* توهج خفيف ورا العنوان — بيوصل الإحساس إن الأرض "بتنبض" */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      {/* النصوص اللي في النص */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center pointer-events-auto px-6 relative"
      >
        {/* 1. شارة المواصفات — نفس ستايل كاليفورنيا */}
        <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-2 mb-8">
          {HERO_SPECS.map((spec) => (
            <span
              key={spec}
              className="text-[10px] font-mono tracking-wider text-blue-300/80 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded backdrop-blur-sm"
            >
              {spec}
            </span>
          ))}
        </motion.div>

        {/* 2. العنوان — SAR بالتدرج + realists أبيض */}
        <motion.h1
          variants={itemVariants}
          className="text-6xl md:text-8xl font-black tracking-tight mb-8 drop-shadow-[0_0_30px_rgba(59,130,246,0.35)]"
        >
          <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
            SAR
          </span>
          <span className="text-white">realists</span>
        </motion.h1>

        {/* 3. السطر الأول — الكلمات المفتاحية متمايزة باللمعة */}
        <motion.p
          variants={itemVariants}
          className="text-lg md:text-2xl text-gray-400 mb-3 font-light"
        >
          The naked eye sees <span className="text-gray-200 font-normal">clouds</span>, and cameras see{' '}
          <span className="text-gray-200 font-normal">smoke</span>.
        </motion.p>

        {/* 4. السطر الثاني — نابض حرفياً عشان "pulse" */}
        <motion.p
          variants={itemVariants}
          className="text-lg md:text-2xl font-bold"
        >
          <motion.span
            animate={{ opacity: [0.75, 1, 0.75], textShadow: [
              '0 0 10px rgba(59,130,246,0.2)',
              '0 0 25px rgba(59,130,246,0.6)',
              '0 0 10px rgba(59,130,246,0.2)',
            ]}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' as const }}
            className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent"
          >
            But NISAR sees the Earth's pulse.
          </motion.span>
        </motion.p>

        <motion.div variants={itemVariants} className="mt-8">
          <PlayButton />
        </motion.div>
      </motion.div>

      {/* زرار السكرول — متسابك زي ما هو */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{ duration: 2, delay: 1.5, repeat: Infinity }}
        onClick={handleScrollClick}
        className="absolute bottom-10 z-10 flex flex-col items-center text-gray-400 pointer-events-auto cursor-pointer hover:text-white transition-colors"
      >
        <span className="text-sm mb-2 uppercase tracking-widest">Scroll to Explore</span>
        <ChevronDown size={32} className="text-blue-500" />
      </motion.div>
    </section>
  );
}

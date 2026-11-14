'use client';
import { useRef, useEffect, useState, useCallback } from 'react';
import { useInView, motion, AnimatePresence } from 'framer-motion';
import { Snowflake, ExternalLink } from 'lucide-react';
import Link from 'next/link';

import DialogueSystem, { DialogueLine } from './DialogueSystem';
import Timeline from './Timeline';
import { plotUrl, prettyDate } from '@/lib/nisarData';

const HIMALAYA_DIALOGUE: DialogueLine[] = [
  { speaker: 'resident', text: "The glaciers here are melting faster than ever. We worry about the lakes bursting and flooding our villages downstream." },
  { speaker: 'scientist', text: "That's a Glacial Lake Outburst Flood, or GLOF. NISAR's 12-day repeat cycle helps us track the slow expansion of these lakes." },
  { speaker: 'resident', text: "But the mountains are always covered in clouds. How do you see the ice?" },
  { speaker: 'scientist', text: "We use dual-frequency radar. L-band penetrates deep into the ice, while S-band maps the surface. Clouds are transparent to radar." },
  { speaker: 'scientist', text: "Let me show you the full ice velocity maps and risk assessments." },
];

// ===== GLOF Risk Timeline =====
const GLOF_TIMELINE = [
  { month: prettyDate('20251126'), label: 'Winter Baseline', imageUrl: plotUrl('himalayas', 'rgb_composite', '20251126'), description: '...' },
  { month: prettyDate('20260419'), label: 'Spring Melt', imageUrl: plotUrl('himalayas', 'hh_db', '20260419'), description: '...' },
  { month: prettyDate('20260724'), label: 'Peak Melt', imageUrl: plotUrl('himalayas', 'hv_db', '20260724'), description: '...' },
  { month: prettyDate('20261109'), label: 'Latest Pass', imageUrl: plotUrl('himalayas', 'rgb_composite', '20261109'), description: '...' },
];

const VELOCITY_TIMELINE = [
  { month: prettyDate('20251126'), label: 'Baseline Flow', imageUrl: plotUrl('himalayas', 'velocity_m_yr', '20251126_20251126'), description: '...' },
  { month: prettyDate('20260501'), label: 'Monsoon Flow', imageUrl: plotUrl('himalayas', 'velocity_m_yr', '20260501_20260501'), description: '...' },
  { month: prettyDate('20261004'), label: 'Post-Monsoon', imageUrl: plotUrl('himalayas', 'velocity_m_yr', '20261004_20261004'), description: '...' },
];
export default function HimalayaSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { amount: 0.5 });
  const [showDialogue, setShowDialogue] = useState(true);
  const [showTimelines, setShowTimelines] = useState(false);

  useEffect(() => {
    if (isInView) {
      window.dispatchEvent(new CustomEvent('flyToLocation', { detail: 'himalayas' }));
    }
  }, [isInView]);

  const handleDialogueComplete = useCallback(() => {
    setShowDialogue(false);
    setShowTimelines(true);
  }, []);

  return (
    <section
      id="himalayas-section"
      ref={ref}
      className="min-h-screen w-full flex items-center justify-center py-24 px-4 md:px-8 relative z-10 pointer-events-none"
    >
      <div className="bg-black/20 backdrop-blur-[2px] p-6 md:p-8 rounded-2xl border border-cyan-500/20 pointer-events-auto max-w-4xl w-full shadow-[0_0_60px_rgba(6,182,212,0.1)]">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-cyan-600/20 rounded-lg flex items-center justify-center border border-cyan-500/30">
            <Snowflake className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl text-white font-bold drop-shadow-lg">Himalayan Cryosphere</h2>
            <p className="text-sm text-cyan-300/90 drop-shadow-md">Glacial Melt & GLOF Risk</p>
          </div>
        </div>

        <AnimatePresence>
          {showDialogue && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DialogueSystem
                dialogueData={HIMALAYA_DIALOGUE}
                onComplete={handleDialogueComplete}
                theme="ice"
                residentName="Tenzing (Himalayan Guide)"
                residentType="guide"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {showTimelines && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* GLOF Risk Timeline */}
            <Timeline
              title="Glacial Lake Expansion Timeline"
              images={GLOF_TIMELINE}
              theme="ice"
            />

            {/* Ice Velocity Timeline */}
            <Timeline
              title="Ice Velocity Changes Timeline"
              images={VELOCITY_TIMELINE}
              theme="ice"
            />

            <Link href="/data-analysis/himalayas">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
              >
                <span>Explore Full Data Analysis</span>
                <ExternalLink className="w-5 h-5" />
              </motion.button>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
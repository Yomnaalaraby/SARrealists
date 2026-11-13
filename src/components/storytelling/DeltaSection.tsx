'use client';
import { useRef, useEffect, useState, useCallback } from 'react';
import { useInView, motion, AnimatePresence } from 'framer-motion';
import { Wheat, ExternalLink } from 'lucide-react';
import Link from 'next/link';

import DialogueSystem, { DialogueLine } from './DialogueSystem';
import Timeline from './Timeline';
import { plotUrl, prettyDate } from '@/lib/nisarData';

const DELTA_DIALOGUE: DialogueLine[] = [
  { speaker: 'resident', text: "The soil here used to be rich, but now we struggle with water scarcity and salt creeping in from the sea." },
  { speaker: 'scientist', text: "Ahmed, NISAR helps us monitor soil moisture every 12 days, so you can optimize irrigation even under cloud cover." },
  { speaker: 'resident', text: "And the city keeps expanding into our farmland. We're losing good soil every year." },
  { speaker: 'scientist', text: "We track that too - urban encroachment and coastal subsidence. L-band InSAR detects millimeter-scale sinking." },
  { speaker: 'scientist', text: "Let me show you the full agricultural and subsidence data." },
];

// ===== Agriculture Timeline =====
const AGRICULTURE_TIMELINE = [
  { month: prettyDate('20251216'), label: 'Winter Wheat', imageUrl: plotUrl('nile', 'hv_db', '20251216'), description: '...' },
  { month: prettyDate('20260626'), label: 'Summer Prep', imageUrl: plotUrl('nile', 'soil_moisture', '20260626'), description: '...' },
  { month: prettyDate('20260825'), label: 'Peak Irrigation', imageUrl: plotUrl('nile', 'soil_moisture', '20260825'), description: '...' },
  { month: prettyDate('20261024'), label: 'Harvest Season', imageUrl: plotUrl('nile', 'rgb_composite', '20261024'), description: '...' },
];

const COASTAL_SUBSIDENCE_TIMELINE = [
  { month: prettyDate('20260626'), label: 'Baseline', imageUrl: plotUrl('nile', 'vert_disp_mm', '20260626'), description: '...' },
  { month: prettyDate('20260708'), label: 'Early Sinking', imageUrl: plotUrl('nile', 'vert_disp_mm', '20260708'), description: '...' },
  { month: prettyDate('20260813'), label: 'Accelerating', imageUrl: plotUrl('nile', 'vert_disp_mm', '20260813'), description: '...' },
  { month: prettyDate('20260906'), label: 'Critical', imageUrl: plotUrl('nile', 'vert_disp_mm', '20260906'), description: '...' },
];

export default function DeltaSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { amount: 0.5 });
  const [showDialogue, setShowDialogue] = useState(true);
  const [showTimelines, setShowTimelines] = useState(false);

  useEffect(() => {
    if (isInView) {
      window.dispatchEvent(new CustomEvent('flyToLocation', { detail: 'delta' }));
    }
  }, [isInView]);

  const handleDialogueComplete = useCallback(() => {
    setShowDialogue(false);
    setShowTimelines(true);
  }, []);

  return (
    <section
      id="delta-section"
      ref={ref}
      className="min-h-screen w-full flex items-center justify-center py-24 px-4 md:px-8 relative z-10 pointer-events-none"
    >
      <div className="bg-black/20 backdrop-blur-[2px] p-6 md:p-8 rounded-2xl border border-green-500/20 pointer-events-auto max-w-4xl w-full shadow-[0_0_60px_rgba(34,197,94,0.1)]">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center border border-green-500/30">
            <Wheat className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl text-white font-bold drop-shadow-lg">Nile Delta, Egypt</h2>
            <p className="text-sm text-green-300/90 drop-shadow-md">Food Security & Coastal Subsidence</p>
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
                dialogueData={DELTA_DIALOGUE}
                onComplete={handleDialogueComplete}
                theme="agriculture"
                scientistName="Dr. Sarah (NISAR Scientist)"
                residentName="Ahmed (Egyptian Farmer)"
                residentType="farmer"
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
            {/* Agriculture Timeline */}
            <Timeline
              title="Agricultural Cycle Timeline"
              images={AGRICULTURE_TIMELINE}
              theme="agriculture"
            />

            {/* Coastal Subsidence Timeline */}
            <Timeline
              title="Coastal Subsidence Timeline"
              images={COASTAL_SUBSIDENCE_TIMELINE}
              theme="agriculture"
            />

            <Link href="/data-analysis/nile">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-600/30 transition-all cursor-pointer"
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
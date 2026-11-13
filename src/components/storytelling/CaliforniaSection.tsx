'use client';
import { useRef, useEffect, useState, useCallback } from 'react';
import { useInView, motion, AnimatePresence } from 'framer-motion';
import { Flame, Mountain, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { plotUrl, prettyDate, SITES } from '@/lib/nisarData';


import DialogueSystem, { DialogueLine } from './DialogueSystem';
import Timeline from './Timeline';

const CALIFORNIA_DIALOGUE: DialogueLine[] = [
  { speaker: 'resident', text: "The smoke was so thick last summer... we couldn't see anything. The optical satellites were useless." },
  { speaker: 'scientist', text: "That's exactly where NISAR comes in, Mike. Our L-band radar penetrates smoke and clouds - day or night." },
  { speaker: 'resident', text: "But what about the ground sinking in Central Valley? My farm is losing water fast." },
  { speaker: 'scientist', text: "We track that too - millimeter by millimeter using InSAR. L-band keeps coherence better than shorter wavelengths." },
  { speaker: 'scientist', text: "Want to see the full data analysis? You can explore burn scars, subsidence maps, and polarization physics." },
];

// ===== Wildfire Timeline =====

const WILDFIRE_TIMELINE = [
  {
    month: prettyDate('20251124'),
    label: 'Pre-Fire Baseline',
    imageUrl: plotUrl('california', 'hv_db', '20251124'),
    description: 'Healthy forest canopy - high HV backscatter from volume scattering.',
  },
  {
    month: prettyDate('20260228'),
    label: 'Eaton Fire Event',
    imageUrl: plotUrl('california', 'rgb_composite', '20260228'),
    description: 'Radar penetrates smoke to map the fire perimeter.',
  },
  {
    month: prettyDate('20260628'),
    label: 'Post-Fire Assessment',
    imageUrl: plotUrl('california', 'hv_db', '20260628'),
    description: 'Burn severity mapped via HV drop. HH spike from double-bounce.',
  },
  {
    month: 'Nov 24 → Oct 26',
    label: 'Burn Change Map',
    imageUrl: plotUrl('california', 'hv_db_change', '20251124_20261026'),  // 🔥 الأهم!
    description: 'RED = burned canopy loss. The definitive burn severity map.',
  },
];

// ===== Subsidence Timeline =====
// ===== Subsidence Timeline (حقيقي من NISAR) =====
const SUBSIDENCE_TIMELINE = [
  {
    month: prettyDate('20251124'),
    label: 'Baseline Measurement',
    imageUrl: plotUrl('california', 'los_disp_mm', '20251124'),
    description: 'Initial InSAR baseline established. Ground level stable.',
  },
  {
    month: prettyDate('20260312'),
    label: 'Early Subsidence',
    imageUrl: plotUrl('california', 'los_disp_mm', '20260312'),
    description: 'Groundwater extraction begins. Minor subsidence detected.',
  },
  {
    month: prettyDate('20260604'),
    label: 'Accelerated Sinking',
    imageUrl: plotUrl('california', 'los_disp_mm', '20260604'),
    description: 'Rapid subsidence during summer irrigation peak.',
  },
  {
    month: prettyDate('20260908'),
    label: 'Critical Level',
    imageUrl: plotUrl('california', 'los_disp_mm', '20260908'),
    description: 'Blue = sinking ground. Land deformation critical.',
  },
];

export default function CaliforniaSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { amount: 0.5 });
  const [showDialogue, setShowDialogue] = useState(true);
  const [showTimelines, setShowTimelines] = useState(false);

  useEffect(() => {
    if (isInView) {
      window.dispatchEvent(new CustomEvent('flyToLocation', { detail: 'california' }));
    }
  }, [isInView]);

  const handleDialogueComplete = useCallback(() => {
    setShowDialogue(false);
    setShowTimelines(true);
  }, []);

  return (
    <section
      id="california-section"
      ref={ref}
      className="min-h-screen w-full flex items-center justify-center py-24 px-4 md:px-8 relative z-10 pointer-events-none"
    >
      <div className="bg-black/20 backdrop-blur-[2px] p-6 md:p-8 rounded-2xl border border-red-500/20 pointer-events-auto max-w-4xl w-full shadow-[0_0_60px_rgba(220,38,38,0.1)]">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center border border-red-500/30">
            <Flame className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl text-white font-bold drop-shadow-lg">California, USA</h2>
            <p className="text-sm text-red-300/90 drop-shadow-md">Wildfire Scars & Sinking Valleys</p>
          </div>
        </div>

        {/* Dialogue */}
        <AnimatePresence>
          {showDialogue && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DialogueSystem
                dialogueData={CALIFORNIA_DIALOGUE}
                onComplete={handleDialogueComplete}
                theme="fire"
                residentName="Mike (California Resident)"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timelines */}
        {showTimelines && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Wildfire Timeline */}
            <Timeline
              title="Wildfire Event Timeline"
              images={WILDFIRE_TIMELINE}
              theme="fire"
            />

            {/* Subsidence Timeline */}
            <Timeline
              title="Land Subsidence Timeline"
              images={SUBSIDENCE_TIMELINE}
              theme="fire"
            />

            <Link href="/data-analysis/california">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
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
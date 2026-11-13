'use client';
import { useRef, useEffect, useState, useCallback } from 'react';
import { useInView, motion, AnimatePresence } from 'framer-motion';
import { Flame, Mountain, ExternalLink } from 'lucide-react';
import Link from 'next/link';

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
    month: 'January 2024',
    label: 'Pre-Fire Baseline',
    imageUrl: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80',
    description: 'Healthy forest canopy - high HV backscatter from volume scattering.',
  },
  {
    month: 'March 2024',
    label: 'Drought Stress',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
    description: 'Soil moisture drops, vegetation stress visible in L-band.',
  },
  {
    month: 'June 2024',
    label: 'Fire Event',
    imageUrl: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=600&q=80',
    description: 'Optical blinded by smoke. NISAR penetrates to map fire perimeter.',
  },
  {
    month: 'August 2024',
    label: 'Post-Fire Assessment',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
    description: 'Burn severity mapped via coherence change. HH spike from double-bounce.',
  },
];

// ===== Subsidence Timeline =====
const SUBSIDENCE_TIMELINE = [
  {
    month: 'January 2020',
    label: 'Baseline Measurement',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
    description: 'Initial InSAR baseline established. Ground level stable.',
  },
  {
    month: 'January 2021',
    label: 'Early Subsidence',
    imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=600&q=80',
    description: 'Groundwater extraction begins. Minor subsidence detected (-12mm).',
  },
  {
    month: 'January 2022',
    label: 'Accelerated Sinking',
    imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80',
    description: 'Rapid subsidence (-38mm). Infrastructure stress visible.',
  },
  {
    month: 'January 2023',
    label: 'Critical Level',
    imageUrl: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80',
    description: 'Peak subsidence (-45mm). Land deformation critical.',
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
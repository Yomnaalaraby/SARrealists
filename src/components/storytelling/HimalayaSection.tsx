'use client';
import { useRef, useEffect, useState, useCallback } from 'react';
import { useInView, motion, AnimatePresence } from 'framer-motion';
import { Snowflake, ExternalLink } from 'lucide-react';
import Link from 'next/link';

import DialogueSystem, { DialogueLine } from './DialogueSystem';
import Timeline from './Timeline';

const HIMALAYA_DIALOGUE: DialogueLine[] = [
  { speaker: 'resident', text: "The glaciers here are melting faster than ever. We worry about the lakes bursting and flooding our villages downstream." },
  { speaker: 'scientist', text: "That's a Glacial Lake Outburst Flood, or GLOF. NISAR's 12-day repeat cycle helps us track the slow expansion of these lakes." },
  { speaker: 'resident', text: "But the mountains are always covered in clouds. How do you see the ice?" },
  { speaker: 'scientist', text: "We use dual-frequency radar. L-band penetrates deep into the ice, while S-band maps the surface. Clouds are transparent to radar." },
  { speaker: 'scientist', text: "Let me show you the full ice velocity maps and risk assessments." },
];

// ===== GLOF Risk Timeline =====
const GLOF_TIMELINE = [
  {
    month: 'January 2024',
    label: 'Winter Accumulation',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80',
    description: 'Snow accumulation on glacier surface - S-band captures fresh snow.',
  },
  {
    month: 'April 2024',
    label: 'Spring Melt Begins',
    imageUrl: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=600&q=80',
    description: 'Meltwater lakes begin forming behind moraine dams.',
  },
  {
    month: 'July 2024',
    label: 'Peak Melt Season',
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80',
    description: 'Rapid lake expansion detected. InSAR measures accelerating ice motion.',
  },
  {
    month: 'October 2024',
    label: 'Post-Monsoon Assessment',
    imageUrl: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=600&q=80',
    description: 'Lake size mapped. Moraine dam stability assessed via deformation.',
  },
];

// ===== Ice Velocity Timeline =====
const VELOCITY_TIMELINE = [
  {
    month: 'January 2024',
    label: 'Baseline Velocity',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80',
    description: 'Normal ice flow velocity measured at 120m/year.',
  },
  {
    month: 'April 2024',
    label: 'Acceleration Detected',
    imageUrl: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=600&q=80',
    description: 'Ice velocity increases to 145m/year. Precursor to instability.',
  },
  {
    month: 'July 2024',
    label: 'Critical Acceleration',
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80',
    description: 'Velocity spikes to 180m/year. Moraine dam deformation detected.',
  },
  {
    month: 'October 2024',
    label: 'Post-Event Stabilization',
    imageUrl: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=600&q=80',
    description: 'Velocity returns to 130m/year. Residual instability monitored.',
  },
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
'use client';
import { useRef, useEffect, useState, useCallback } from 'react';
import { useInView, motion, AnimatePresence } from 'framer-motion';
import { Wheat, ExternalLink } from 'lucide-react';
import Link from 'next/link';

import DialogueSystem, { DialogueLine } from './DialogueSystem';
import Timeline from './Timeline';

const DELTA_DIALOGUE: DialogueLine[] = [
  { speaker: 'resident', text: "The soil here used to be rich, but now we struggle with water scarcity and salt creeping in from the sea." },
  { speaker: 'scientist', text: "Ahmed, NISAR helps us monitor soil moisture every 12 days, so you can optimize irrigation even under cloud cover." },
  { speaker: 'resident', text: "And the city keeps expanding into our farmland. We're losing good soil every year." },
  { speaker: 'scientist', text: "We track that too - urban encroachment and coastal subsidence. L-band InSAR detects millimeter-scale sinking." },
  { speaker: 'scientist', text: "Let me show you the full agricultural and subsidence data." },
];

// ===== Agriculture Timeline =====
const AGRICULTURE_TIMELINE = [
  {
    month: 'November 2023',
    label: 'Pre-Season Soil Prep',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
    description: 'Bare soil moisture mapped before planting. Irrigation planning.',
  },
  {
    month: 'February 2024',
    label: 'Crop Emergence',
    imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=600&q=80',
    description: 'Crop phenology tracked via HV polarization. Healthy vegetation signature.',
  },
  {
    month: 'May 2024',
    label: 'Peak Growing Season',
    imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80',
    description: 'Water stress detection. Flooded rice fields show distinctive signature.',
  },
  {
    month: 'August 2024',
    label: 'Harvest & Urban Sprawl',
    imageUrl: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80',
    description: 'Yield estimation. Agricultural land loss to urban expansion mapped.',
  },
];

// ===== Coastal Subsidence Timeline =====
const COASTAL_SUBSIDENCE_TIMELINE = [
  {
    month: 'January 2020',
    label: 'Baseline Measurement',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
    description: 'Initial coastal elevation baseline. No significant subsidence.',
  },
  {
    month: 'January 2021',
    label: 'Early Subsidence',
    imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=600&q=80',
    description: 'Groundwater extraction begins. Minor subsidence detected (-8mm).',
  },
  {
    month: 'January 2022',
    label: 'Accelerated Sinking',
    imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80',
    description: 'Rapid subsidence (-25mm). Saltwater intrusion risk increases.',
  },
  {
    month: 'January 2023',
    label: 'Critical Level',
    imageUrl: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80',
    description: 'Peak subsidence (-32mm). Coastal flooding risk critical.',
  },
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
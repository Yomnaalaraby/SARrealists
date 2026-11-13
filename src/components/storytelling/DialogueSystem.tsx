'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScientistAvatar, ResidentAvatar, GuideAvatar, FarmerAvatar } from './Characters';

export interface DialogueLine {
  speaker: 'scientist' | 'resident';
  text: string;
}

interface DialogueSystemProps {
  dialogueData: DialogueLine[];
  onComplete: () => void;
  theme?: 'fire' | 'ice' | 'agriculture';
  scientistName?: string;
  residentName?: string;
  residentType?: 'resident' | 'guide' | 'farmer'; // ✅ أضف farmer
}

export default function DialogueSystem({
  dialogueData,
  onComplete,
  theme = 'fire',
  scientistName = 'Dr. Sarah (NISAR Scientist)',   // ✅ default value
  residentName = 'Mike (California Resident)',
  residentType = 'resident'
}: DialogueSystemProps) {
  console.log('DialogueSystem residentType:', residentType);
  const [currentLine, setCurrentLine] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [completed, setCompleted] = useState(false);

  const line = dialogueData[currentLine];
  const isScientist = line?.speaker === 'scientist';
const accentColor = theme === 'ice' ? 'cyan' : theme === 'agriculture' ? 'green' : 'red';
  useEffect(() => {
    if (currentLine >= dialogueData.length && !completed) {
      setCompleted(true);
      const timer = setTimeout(() => {
        onComplete();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [currentLine, completed, onComplete, dialogueData.length]);

  useEffect(() => {
    if (currentLine >= dialogueData.length) return;

    setDisplayedText('');
    setIsTyping(true);
    let index = 0;
    const text = dialogueData[currentLine].text;

    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 30);

    return () => clearInterval(timer);
  }, [currentLine, dialogueData]);

  if (currentLine >= dialogueData.length) {
    return null;
  }

  const handleNext = () => {
    if (isTyping) {
      setDisplayedText(line.text);
      setIsTyping(false);
    } else {
      setCurrentLine((prev) => prev + 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-black/40 backdrop-blur-md rounded-2xl border border-${accentColor}-500/20 p-6 mb-6`}
    >
      <div className="flex justify-between items-end mb-6 px-4">
        <div className={`transition-all duration-300 ${isScientist ? 'scale-110' : 'scale-90 opacity-60'}`}>
          <ScientistAvatar isSpeaking={isScientist && isTyping} />
        </div>
        <div className={`transition-all duration-300 ${!isScientist ? 'scale-110' : 'scale-90 opacity-60'}`}>
          {residentType === 'guide' ? (
            <GuideAvatar isSpeaking={!isScientist && isTyping} />
          ) : residentType === 'farmer' ? (
            <FarmerAvatar isSpeaking={!isScientist && isTyping} />
          ) : (
            <ResidentAvatar isSpeaking={!isScientist && isTyping} />
          )}
        </div>
      </div>

      <div className={`relative ${isScientist ? 'ml-16' : 'mr-16'}`}>
        <div className={`p-4 rounded-xl border ${isScientist ? 'bg-blue-950/30 border-blue-500/30' : `bg-${accentColor}-950/30 border-${accentColor}-500/30`}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-bold ${isScientist ? 'text-blue-400' : `text-${accentColor}-400`}`}>
              {/* ✅ استخدم الـ props هنا */}
              {isScientist ? scientistName : residentName}
            </span>
            {isTyping && (
              <span className="flex gap-1">
                <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            )}
          </div>
          <p className="text-sm text-gray-200 leading-relaxed min-h-[60px]">
            {displayedText}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 px-4">
        <div className="flex gap-1">
          {dialogueData.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${i === currentLine ? `bg-${accentColor}-500 w-6` : i < currentLine ? `bg-${accentColor}-500/50 w-2` : 'bg-gray-600 w-2'
                }`}
            />
          ))}
        </div>
        <button
          onClick={handleNext}
          className={`px-4 py-2 bg-${accentColor}-600 hover:bg-${accentColor}-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-lg shadow-${accentColor}-600/30`}
        >
          {isTyping ? 'Skip' : currentLine === dialogueData.length - 1 ? 'Show Me the Data →' : 'Next →'}
        </button>
      </div>
    </motion.div>
  );
}
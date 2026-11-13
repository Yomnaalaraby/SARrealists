'use client';
import { motion } from 'framer-motion';

// عالمة NISAR
export function ScientistAvatar({ isSpeaking }: { isSpeaking: boolean }) {
  return (
    <motion.div
      animate={isSpeaking ? { y: [0, -3, 0] } : {}}
      transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
      className="relative"
    >
      <svg width="80" height="80" viewBox="0 0 80 80" className="drop-shadow-lg">
        {/* الجسم - Lab Coat */}
        <ellipse cx="40" cy="70" rx="25" ry="10" fill="#1e3a8a" opacity="0.3" />
        <path d="M 25 50 Q 40 45 55 50 L 58 75 L 22 75 Z" fill="#f8fafc" />
        <path d="M 35 50 L 40 60 L 45 50" fill="#e2e8f0" />
        
        {/* الرقبة */}
        <rect x="35" y="40" width="10" height="8" fill="#fcd34d" />
        
        {/* الرأس */}
        <circle cx="40" cy="30" r="15" fill="#fcd34d" />
        
        {/* الشعر */}
        <path d="M 25 30 Q 25 15 40 15 Q 55 15 55 30 Q 55 25 40 25 Q 25 25 25 30" fill="#78350f" />
        <path d="M 25 30 Q 22 35 25 40" fill="#78350f" />
        <path d="M 55 30 Q 58 35 55 40" fill="#78350f" />
        
        {/* النظارة */}
        <circle cx="34" cy="30" r="4" fill="none" stroke="#1e293b" strokeWidth="1.5" />
        <circle cx="46" cy="30" r="4" fill="none" stroke="#1e293b" strokeWidth="1.5" />
        <line x1="38" y1="30" x2="42" y2="30" stroke="#1e293b" strokeWidth="1.5" />
        
        {/* العيون */}
        <circle cx="34" cy="30" r="2" fill="#1e293b" />
        <circle cx="46" cy="30" r="2" fill="#1e293b" />
        
        {/* الابتسامة */}
        <path d="M 36 36 Q 40 38 44 36" fill="none" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
        
        {/* التابلت */}
        <rect x="50" y="55" width="18" height="12" rx="2" fill="#3b82f6" />
        <rect x="52" y="57" width="14" height="8" fill="#1e40af" />
        
        {/* شارة NISAR */}
        <circle cx="30" cy="55" r="4" fill="#ef4444" />
        <text x="30" y="57" fontSize="5" fill="white" textAnchor="middle" fontWeight="bold">N</text>
      </svg>
      
      {/* Label */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="text-[10px] font-bold text-blue-400 bg-blue-950/50 px-2 py-0.5 rounded">Dr. Sarah</span>
      </div>
    </motion.div>
  );
}

// مقيم كاليفورنيا
export function ResidentAvatar({ isSpeaking }: { isSpeaking: boolean }) {
  return (
    <motion.div
      animate={isSpeaking ? { y: [0, -3, 0] } : {}}
      transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
      className="relative"
    >
      <svg width="80" height="80" viewBox="0 0 80 80" className="drop-shadow-lg">
        {/* الجسم - Casual */}
        <ellipse cx="40" cy="70" rx="25" ry="10" fill="#1e3a8a" opacity="0.3" />
        <path d="M 25 50 Q 40 45 55 50 L 58 75 L 22 75 Z" fill="#64748b" />
        <path d="M 35 50 L 40 55 L 45 50" fill="#475569" />
        
        {/* الرقبة */}
        <rect x="35" y="40" width="10" height="8" fill="#fdba74" />
        
        {/* الرأس */}
        <circle cx="40" cy="30" r="15" fill="#fdba74" />
        
        {/* الشعر */}
        <path d="M 25 28 Q 28 18 40 18 Q 52 18 55 28 Q 52 22 40 22 Q 28 22 25 28" fill="#1e293b" />
        
        {/* العيون - قلقة */}
        <circle cx="34" cy="30" r="2" fill="#1e293b" />
        <circle cx="46" cy="30" r="2" fill="#1e293b" />
        <path d="M 32 27 L 36 28" stroke="#1e293b" strokeWidth="1" />
        <path d="M 48 27 L 44 28" stroke="#1e293b" strokeWidth="1" />
        
        {/* الفم - قلق */}
        <path d="M 36 37 Q 40 35 44 37" fill="none" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
        
        {/* اليد مرفوعة */}
        <path d="M 55 55 Q 60 50 62 45" fill="none" stroke="#fdba74" strokeWidth="4" strokeLinecap="round" />
        <circle cx="62" cy="45" r="3" fill="#fdba74" />
      </svg>
      
      {/* Label */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="text-[10px] font-bold text-orange-400 bg-orange-950/50 px-2 py-0.5 rounded">Mike</span>
      </div>
    </motion.div>
  );
}

// أضف هذا المكون الجديد في نفس الملف
export function GuideAvatar({ isSpeaking }: { isSpeaking: boolean }) {
  return (
    <motion.div
      animate={isSpeaking ? { y: [0, -3, 0] } : {}}
      transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
      className="relative"
    >
      <svg width="80" height="80" viewBox="0 0 80 80" className="drop-shadow-lg">
        {/* الجسم - ملابس جبلية */}
        <ellipse cx="40" cy="70" rx="25" ry="10" fill="#1e3a8a" opacity="0.3" />
        <path d="M 25 50 Q 40 45 55 50 L 58 75 L 22 75 Z" fill="#7c2d12" /> {/* جاكيت برتقالي/بني */}
        <path d="M 35 50 L 40 55 L 45 50" fill="#9a3412" />
        
        {/* الرقبة */}
        <rect x="35" y="40" width="10" height="8" fill="#fdba74" />
        
        {/* الرأس */}
        <circle cx="40" cy="30" r="15" fill="#fdba74" />
        
        {/* الشعر الداكن */}
        <path d="M 25 28 Q 28 18 40 18 Q 52 18 55 28 Q 52 22 40 22 Q 28 22 25 28" fill="#1e293b" />
        
        {/* العيون */}
        <circle cx="34" cy="30" r="2" fill="#1e293b" />
        <circle cx="46" cy="30" r="2" fill="#1e293b" />
        
        {/* الفم - قلق */}
        <path d="M 36 37 Q 40 35 44 37" fill="none" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
        
        {/* العصا الجبلية */}
        <line x1="60" y1="40" x2="65" y2="75" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
        <circle cx="65" cy="75" r="2" fill="#92400e" />
      </svg>
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded">Tenzing</span>
      </div>
    </motion.div>
  );
}

export function FarmerAvatar({ isSpeaking }: { isSpeaking: boolean }) {
  return (
    <motion.div
      animate={isSpeaking ? { y: [0, -3, 0] } : {}}
      transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
      className="relative"
    >
      <svg width="80" height="80" viewBox="0 0 80 80" className="drop-shadow-lg">
        {/* ظل الأرض */}
        <ellipse cx="40" cy="72" rx="22" ry="6" fill="#000" opacity="0.3" />
        
        {/* الجسم - قميص أخضر/بني بسيط */}
        <path d="M 28 48 Q 40 44 52 48 L 56 72 L 24 72 Z" fill="#4d7c0f" /> {/* أخضر زيتي */}
        <path d="M 36 48 L 40 56 L 44 48" fill="#3f6212" />
        
        {/* الرقبة */}
        <rect x="36" y="40" width="8" height="8" fill="#d97706" />
        
        {/* الرأس */}
        <circle cx="40" cy="32" r="14" fill="#d97706" />
        
        {/* اللحية الخفيفة (اختياري) */}
        <path d="M 32 36 Q 40 44 48 36" fill="none" stroke="#1e293b" strokeWidth="1.5" opacity="0.3" />
        
        {/* العيون */}
        <circle cx="35" cy="32" r="1.5" fill="#1e293b" />
        <circle cx="45" cy="32" r="1.5" fill="#1e293b" />
        
        {/* الابتسامة الودودة */}
        <path d="M 36 38 Q 40 40 44 38" fill="none" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
        
        {/* قبعة المزارع (Wide-brim hat) */}
        <ellipse cx="40" cy="24" rx="18" ry="4" fill="#92400e" />
        <path d="M 32 24 Q 32 12 40 12 Q 48 12 48 24 Z" fill="#b45309" />
        <path d="M 32 24 Q 40 26 48 24" fill="none" stroke="#78350f" strokeWidth="1" />
        
        {/* اليد تمسك بنبات صغير أو أداة */}
        <path d="M 52 55 Q 58 50 60 45" fill="none" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
        <circle cx="60" cy="45" r="2.5" fill="#d97706" />
        
        {/* نبتة صغيرة في اليد */}
        <path d="M 60 45 Q 58 40 62 38" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="62" cy="38" r="2" fill="#4ade80" />
      </svg>
      
      {/* Label */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="text-[10px] font-bold text-green-400 bg-green-950/60 px-2 py-0.5 rounded border border-green-500/30">Ahmed</span>
      </div>
    </motion.div>
  );
}
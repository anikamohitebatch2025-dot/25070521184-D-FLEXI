import React from 'react';
import { Flame, Zap, Dumbbell, Shield, Trophy, Activity, Sparkles } from 'lucide-react';

interface MovingBannerProps {
  reverse?: boolean;
  className?: string;
}

export const MovingBanner: React.FC<MovingBannerProps> = ({ reverse = false, className = '' }) => {
  const words = [
    { text: 'TRANSFORM YOUR BODY', icon: <Flame className="w-4 h-4 text-[#ff6a00] fill-[#ff6a00]" /> },
    { text: 'OLYMPIC LIFTING PLATFORMS', icon: <Dumbbell className="w-4 h-4 text-white" /> },
    { text: 'SCIENCE-BACKED HYPERTROPHY', icon: <Activity className="w-4 h-4 text-[#ff6a00]" /> },
    { text: '24/7 ALL-ACCESS KEYCARD', icon: <Shield className="w-4 h-4 text-white" /> },
    { text: 'INFRARED SAUNA & COLD PLUNGE', icon: <Sparkles className="w-4 h-4 text-[#ff6a00]" /> },
    { text: '1-ON-1 MASTER COACHING', icon: <Trophy className="w-4 h-4 text-white" /> },
    { text: 'INBODY 570 COMPOSITION ANALYSIS', icon: <Zap className="w-4 h-4 text-[#ff6a00] fill-[#ff6a00]" /> },
  ];

  return (
    <div className={`relative w-full overflow-hidden bg-gradient-to-r from-neutral-950 via-[#161618] to-neutral-950 py-3.5 border-y border-[#ff6a00]/30 select-none ${className}`}>
      {/* Edge gradient fades */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#0b0b0c] to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#0b0b0c] to-transparent z-10" />

      <div className={reverse ? 'animate-marquee-reverse' : 'animate-marquee'}>
        {/* Render twice for continuous loop */}
        {[...words, ...words].map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 px-6 shrink-0">
            {item.icon}
            <span className="font-heading text-base sm:text-lg font-black tracking-widest uppercase text-white whitespace-nowrap">
              {item.text}
            </span>
            <span className="text-[#ff6a00] text-xs font-bold">★</span>
          </div>
        ))}
      </div>
    </div>
  );
};

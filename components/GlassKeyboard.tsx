import React from 'react';
import { KeyboardLayoutRow } from '../types';

interface GlassKeyboardProps {
  activeKey: string | null;
  hoverKey: string | null;
  isShift: boolean;
}

const ROWS: KeyboardLayoutRow[] = [
  { keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'] },
  { keys: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'] },
  { keys: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'] },
  { keys: ['SHIFT', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL'] },
];

export const GlassKeyboard: React.FC<GlassKeyboardProps> = ({ activeKey, hoverKey, isShift }) => {
  
  const isSpaceActive = activeKey === 'SPACE' || activeKey === ' ';
  const isSpaceHover = hoverKey === 'SPACE' || hoverKey === ' ';

  return (
    <div className="w-full max-w-7xl mx-auto select-none pointer-events-none perspective-1000">
      <div className="flex flex-col gap-2 md:gap-4 items-center transform rotate-x-6 origin-bottom transition-transform duration-300">
        {ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1.5 md:gap-3 justify-center w-full">
            {row.keys.map((key) => {
              const isActive = activeKey === key;
              const isHover = hoverKey === key;
              
              // Visual rendering of the key label (handle case)
              let displayLabel = key;
              if (key.length === 1 && /[a-zA-Z]/.test(key)) {
                displayLabel = isShift ? key.toUpperCase() : key.toLowerCase();
              }

              // Special styling for functional keys
              const isSpecial = key === 'SHIFT' || key === 'DEL';
              const isShiftKey = key === 'SHIFT';
              const isDelKey = key === 'DEL';
              
              // Active state for SHIFT is either pressed OR locked on
              const isShiftActive = isShiftKey && isShift;

              return (
                <div
                  key={key}
                  id={`key-${key}`}
                  data-key={key}
                  className={`
                    key-base flex items-center justify-center
                    ${isSpecial ? 'w-20 sm:w-28 md:w-36 px-2' : 'w-12 h-14 sm:w-16 sm:h-20 md:w-24 md:h-28'}
                    ${isSpecial ? 'text-sm sm:text-lg md:text-xl' : 'text-xl sm:text-3xl md:text-5xl'}
                    rounded-xl md:rounded-2xl border 
                    font-bold 
                    shadow-lg transition-all duration-75
                    ${isActive 
                      ? 'bg-neon border-neon text-black scale-95 shadow-[0_0_30px_#00f3ff]' 
                      : isHover 
                        ? 'bg-white/20 border-neon/80 text-white scale-110 -translate-y-2 shadow-[0_0_20px_rgba(0,243,255,0.4)] z-10' 
                        : isShiftActive 
                            ? 'bg-neon/30 border-neon text-neon shadow-[0_0_15px_#00f3ff]'
                            : isDelKey 
                                ? 'glass-panel border-red-500/30 text-red-400/80' 
                                : 'glass-panel border-white/10 text-white/70'
                    }
                  `}
                >
                  {displayLabel}
                </div>
              );
            })}
          </div>
        ))}
        {/* Space Bar */}
        <div className="flex w-full justify-center mt-1 md:mt-4">
           <div
              id="key-SPACE"
              data-key="SPACE"
              className={`
                key-base flex items-center justify-center
                w-1/2 h-14 sm:h-20 md:h-24
                rounded-xl md:rounded-2xl border
                text-white font-bold text-lg md:text-2xl tracking-[0.5em]
                shadow-lg transition-all duration-75
                ${isSpaceActive 
                  ? 'bg-neon border-neon text-black scale-95 shadow-[0_0_30px_#00f3ff]' 
                  : isSpaceHover 
                    ? 'bg-white/20 border-neon/80 text-white scale-105 -translate-y-1 shadow-[0_0_20px_rgba(0,243,255,0.4)]' 
                    : 'glass-panel border-white/10 text-white/70'
                }
              `}
            >
              SPACE
            </div>
        </div>
      </div>
    </div>
  );
};
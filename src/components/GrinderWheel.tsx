
import React, { useRef, useState, useLayoutEffect } from 'react';
import { triggerHaptic } from '../utils/haptics';

interface GrinderWheelProps {
  value: number;
  onChange: (value: number) => void;
  labelStyle?: React.CSSProperties;
}

export const GrinderWheel: React.FC<GrinderWheelProps> = React.memo(({ value, onChange, labelStyle }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Ref to track the last value that triggered a vibration
  const lastVibratedVal = useRef<number>(value);
  
  // Ref to enforce a minimum time gap between vibrations (Rate Limiting)
  const lastVibrateTime = useRef<number>(0);

  const minVal = 1.0;
  const maxVal = 10.0;
  // CHANGED: Step to 0.25
  const renderStep = 0.25; 
  const itemWidth = 14; 

  const marks: number[] = [];
  const count = Math.round((maxVal - minVal) / renderStep);
  for (let i = 0; i <= count; i++) {
    marks.push(parseFloat((maxVal - i * renderStep).toFixed(2)));
  }

  const getScrollPosFromValue = (v: number) => {
    let safeVal = v;
    if (safeVal > maxVal) safeVal = maxVal;
    if (safeVal < minVal) safeVal = minVal;
    const diff = maxVal - safeVal;
    const steps = diff / renderStep;
    return steps * itemWidth;
  };

  useLayoutEffect(() => {
    if (scrollRef.current) {
        const target = getScrollPosFromValue(value);
        scrollRef.current.scrollLeft = target;
        lastVibratedVal.current = value;
        requestAnimationFrame(() => setIsInitialized(true));
    }
  }, []);

  useLayoutEffect(() => {
    if (isInitialized && !isScrolling && scrollRef.current) {
      const target = getScrollPosFromValue(value);
      if (Math.abs(scrollRef.current.scrollLeft - target) > 2) {
        scrollRef.current.scrollTo({ left: target, behavior: 'smooth' });
      }
      // Sync ref if updated externally
      lastVibratedVal.current = value;
    }
  }, [value, isScrolling, isInitialized]);

  const handleScroll = () => {
    if (!scrollRef.current || !isInitialized) return;
    setIsScrolling(true);
    const ratio = scrollRef.current.scrollLeft / itemWidth;
    let val = maxVal - (ratio * renderStep);
    if (val > maxVal) val = maxVal; 
    if (val < minVal) val = minVal;
    
    // CHANGED: Round to nearest 0.25
    val = Math.round(val * 4) / 4;
    
    // Check against local ref for instant feedback
    if (val !== lastVibratedVal.current) {
        onChange(val);
        lastVibratedVal.current = val;
        
        // Haptic Feedback with Rate Limiting via Utility
        const now = Date.now();
        if (now - lastVibrateTime.current > 40) {
            triggerHaptic(15);
            lastVibrateTime.current = now;
        }
    }

    if (scrollTimeoutRef.current !== null) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = window.setTimeout(() => {
      setIsScrolling(false);
      if (scrollRef.current) {
         const snapTarget = getScrollPosFromValue(val);
         scrollRef.current.scrollTo({ left: snapTarget, behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="w-full relative h-28 bg-surface-container rounded-2xl overflow-hidden flex flex-col pt-4 transition-colors shadow-md border border-white/5">
      <label className="text-[11px] font-bold text-[var(--color-box-label)] uppercase tracking-wider whitespace-nowrap w-full text-center shrink-0 mb-1 z-10 relative overflow-hidden text-ellipsis drop-shadow-sm" style={labelStyle}>
        SCALĂ RÂȘNIȚĂ
      </label>
      <div className="relative flex-1 w-full overflow-hidden shadow-inner bg-black/5">
          {/* Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)] z-30 ring-2 ring-red-500/30"></div>
          </div>
          
          <div 
            ref={scrollRef} 
            onScroll={handleScroll} 
            className={`w-full h-full overflow-x-auto flex items-end no-scrollbar pb-2 transition-opacity duration-300 ${isInitialized ? 'opacity-100' : 'opacity-0'}`} 
          >
            <div style={{ minWidth: `calc(50% - ${itemWidth / 2}px)` }} className="flex-shrink-0 h-full"></div>
            {marks.map(val => {
              const decimal = Math.round((val % 1) * 100); // 0, 25, 50, 75
              const isInt = decimal === 0;
              // Only draw tick marks for 0.5 steps or major 0.25 dots?
              // Standard ruler approach:
              // Integer: Big tick + Number
              // .50: Medium tick
              // .25 / .75: Small tick
              
              return (
                <div key={val} className="flex-shrink-0 relative h-full flex flex-col items-center justify-end" style={{ width: `${itemWidth}px` }}>
                  {isInt ? (
                    <>
                        <div className="w-[2px] h-6 bg-white/50 mb-1"></div>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 flex flex-col items-center justify-end pointer-events-none">
                            <span className="text-3xl font-normal text-white select-none tracking-tighter block leading-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">{Math.round(val)}</span>
                        </div>
                    </>
                  ) : decimal === 50 ? (
                        <div className="w-[2px] h-4 bg-white/40 mb-2"></div>
                  ) : (
                        <div className="w-[1px] h-2 bg-white/20 mb-3"></div>
                  )}
                </div>
              )
            })}
            <div style={{ minWidth: `calc(50% - ${itemWidth / 2}px)` }} className="flex-shrink-0 h-full"></div>
          </div>
      </div>
    </div>
  );
});

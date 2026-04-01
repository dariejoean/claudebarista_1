
import React, { useState, useEffect, useRef } from 'react';
import { PlayIcon, StopIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { triggerHaptic } from '../utils/haptics';

interface TimerProps {
  value?: number;
  onStart?: () => void;
  onStop: (time: number) => void;
  onTick?: (time: number) => void;
  onReset?: () => void;
  labelStyle?: React.CSSProperties;
}

export const Timer: React.FC<TimerProps> = React.memo(({ value, onStart, onStop, onTick, onReset, labelStyle }) => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Sync from external value when timer is not running
  useEffect(() => {
    if (!isActive && value !== undefined) {
      setSeconds(value);
    }
  }, [value, isActive]);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = window.setInterval(() => {
        setSeconds((prev) => {
          const newTime = prev + 1;
          if (onTick) onTick(newTime);
          return newTime;
        });
      }, 1000);
    } else {
       if(intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
       }
    }
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  // Haptic feedback logic for thresholds
  useEffect(() => {
    if (!isActive) return;
    
    if (seconds === 25) {
        triggerHaptic([30, 50, 30]); 
    } else if (seconds === 31) {
        triggerHaptic(200);
    }
  }, [seconds, isActive]);

  const toggle = () => {
    if (isActive) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsActive(false);
      onStop(seconds);
      triggerHaptic(20); // Stop feedback
    } else {
      setIsActive(true);
      if (onStart) onStart();
      triggerHaptic(20); // Start feedback
    }
  };

  const reset = () => {
    if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
    }
    setIsActive(false);
    setSeconds(0);
    if (onTick) onTick(0);
    if (onReset) onReset();
    triggerHaptic(10);
  };

  const getTimerStatusColor = () => {
    if (seconds < 25) return 'text-on-surface';
    if (seconds <= 30) return 'text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]';
    return 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]';
  };
  
  const getButtonColorClass = () => {
    if (isActive && seconds >= 25 && seconds <= 30) {
        return 'bg-green-600 text-white hover:brightness-110 shadow-[0_4px_14px_rgba(22,163,74,0.4)] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]';
    }
    if (isActive && seconds > 30) {
        return 'bg-red-500 text-white hover:brightness-110 shadow-[0_4px_14px_rgba(239,68,68,0.4)] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]';
    }
    return 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/30 active:shadow-inner border border-white/10';
  };

  const getPulseColor = () => {
      if (seconds >= 25 && seconds <= 30) return 'bg-green-600';
      if (seconds > 30) return 'bg-red-600';
      return 'bg-indigo-600'; 
  };

  return (
    <div className="w-full h-28 bg-surface-container rounded-2xl relative overflow-hidden flex flex-col justify-between p-5 transition-colors shadow-md border border-white/5">
       {isActive && (
          <div className={`absolute inset-0 animate-pulse pointer-events-none z-0 opacity-5 ${getPulseColor()}`}></div>
       )}
       
       <label className="text-[11px] font-bold text-on-surface uppercase tracking-widest w-full text-center shrink-0 z-10 mb-1 drop-shadow-sm" style={labelStyle}>
         CRONOMETRU (s)
       </label>

       <div className="flex-1 flex items-center justify-between w-full z-10">
           <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggle}
                className={`h-14 px-8 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 active:shadow-inner ${getButtonColorClass()}`}
              >
                {isActive ? <StopIcon className="w-6 h-6 drop-shadow-sm" /> : <PlayIcon className="w-6 h-6 drop-shadow-sm" />}
                <span className="font-bold text-sm tracking-wide uppercase drop-shadow-sm">{isActive ? 'Stop' : 'Start'}</span>
              </button>
              
              <button
                type="button"
                onClick={reset}
                disabled={isActive}
                className="w-14 h-14 bg-surface-container-high text-on-surface-variant rounded-2xl flex items-center justify-center hover:text-on-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm border border-white/5 active:shadow-inner"
              >
                <ArrowPathIcon className="w-6 h-6" />
              </button>
           </div>

           <div className={`text-4xl font-normal tracking-tighter transition-colors duration-300 flex items-center justify-center flex-1 ${getTimerStatusColor()}`}>
              {seconds}
           </div>
       </div>
    </div>
  );
});

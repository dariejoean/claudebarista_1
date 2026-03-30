
import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';
import { triggerHaptic } from '../utils/haptics';

interface EurekaDialProps {
    value: number;
    onChange: (value: number) => void;
    labelStyle?: React.CSSProperties;
}

export const EurekaDial: React.FC<EurekaDialProps> = React.memo(({ value, onChange, labelStyle }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeoutRef = useRef<number | null>(null);
    
    // CONFIGURARE SCALA
    const MAX_ROTATIONS = 6;
    const SCALE_PER_ROTATION = 20; // 0 to 19.75
    const MAX_VAL = MAX_ROTATIONS * SCALE_PER_ROTATION; 
    const STEP = 0.25; 
    
    // VISUAL CONFIG
    const PX_PER_STEP = 14; 
    const ITEM_WIDTH = PX_PER_STEP; 

    // Compute Derived Values
    const rotationNumber = Math.floor(value / SCALE_PER_ROTATION);
    // Display rotation clamped
    const displayRotation = Math.min(Math.max(rotationNumber, 0), MAX_ROTATIONS - 1);
    
    // Generate Marks Array DESCENDING (Max -> 0) to put 0 on the right
    const totalSteps = MAX_VAL / STEP;
    const marks = Array.from({ length: totalSteps + 1 }, (_, i) => MAX_VAL - (i * STEP));

    // --- SCROLL SYNC LOGIC (REVERSED) ---

    const getScrollPosFromValue = (v: number) => {
        // Value 0 is at the END of the array (Right side)
        // Distance from Left Start (Max Value) = (Max - v)
        return ((MAX_VAL - v) / STEP) * ITEM_WIDTH;
    };

    const getValueFromScrollPos = (scrollLeft: number) => {
        // Scroll Left 0 means we are at MAX_VAL
        let val = MAX_VAL - ((scrollLeft / ITEM_WIDTH) * STEP);
        
        if (val < 0) val = 0;
        if (val > MAX_VAL) val = MAX_VAL;
        
        // Snapping to 0.25 step
        const snapped = Math.round(val / STEP) * STEP;
        return parseFloat(snapped.toFixed(2));
    };

    useLayoutEffect(() => {
        if (scrollRef.current) {
            const target = getScrollPosFromValue(value);
            scrollRef.current.scrollLeft = target;
        }
    }, []);

    useEffect(() => {
        if (!isScrolling && scrollRef.current) {
            const target = getScrollPosFromValue(value);
            if (Math.abs(scrollRef.current.scrollLeft - target) > 5) {
                scrollRef.current.scrollTo({ left: target, behavior: 'auto' });
            }
        }
    }, [value, isScrolling]);

    const handleScroll = () => {
        if (!scrollRef.current) return;
        setIsScrolling(true);
        
        const newVal = getValueFromScrollPos(scrollRef.current.scrollLeft);
        
        if (newVal !== value) {
            onChange(newVal);
            
            // Haptics on EVERY tick change (0.25 step)
            // Just check if value changed numerically
            triggerHaptic(12); 
        }

        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = window.setTimeout(() => {
            setIsScrolling(false);
            if (scrollRef.current) {
                const target = getScrollPosFromValue(newVal);
                scrollRef.current.scrollTo({ left: target, behavior: 'smooth' });
            }
        }, 150);
    };

    return (
        <div className="w-full flex flex-col gap-2">
            {/* Centered Label Title */}
            <div className="flex justify-center items-center px-2">
                <label className="text-[11px] font-bold text-[var(--color-box-label)] uppercase tracking-widest drop-shadow-sm text-center w-full" style={labelStyle}>
                    SCALĂ EUREKA PRO
                </label>
            </div>

            <div className="w-full h-32 bg-[#1a1a1a] rounded-2xl flex items-center p-0 relative overflow-hidden shadow-inner border-2 border-white/10 select-none">
                
                {/* 1. ROTATION INDICATOR (Fixed Left) */}
                <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#1a1a1a] via-[#1a1a1a] to-transparent z-20 flex flex-col items-center justify-center pointer-events-none pl-2">
                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.5)] border-2 border-[#333] relative">
                        <span className="text-2xl font-black text-white leading-none pt-1">
                            {displayRotation}
                        </span>
                    </div>
                    <span className="text-[8px] font-bold text-gray-500 uppercase mt-1 tracking-widest">Rotații</span>
                </div>

                {/* 2. SCROLLABLE RULER */}
                <div className="flex-1 h-full relative overflow-hidden">
                    
                    {/* Central Red Cursor */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-0.5 bg-red-600 z-30 opacity-80 mix-blend-screen shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-red-500 z-30"></div>

                    {/* Scroll Container */}
                    <div 
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className="w-full h-full overflow-x-auto flex items-end no-scrollbar relative snap-x snap-mandatory"
                    >
                        {/* Spacer Left - Adjusted for Center Alignment of Items */}
                        <div style={{ minWidth: `calc(50% - ${ITEM_WIDTH / 2}px)` }} className="shrink-0 h-full"></div>

                        {/* Marks */}
                        {marks.map((absVal, i) => {
                            const displayNum = absVal % 20; 
                            const isInteger = Math.abs(absVal % 1) < 0.01;
                            const isHalf = Math.abs(absVal % 0.5) < 0.01 && !isInteger;
                            // isQuarter is implied for others

                            // ZERO ZONE LOGIC:
                            // Highlight entire range 0 to 17 (inclusive) for Rotation 0.
                            // We use absVal <= 17.001 to handle floating point precision and encompass 17.
                            const isZeroZone = absVal >= 0 && absVal <= 17.001;

                            return (
                                <div 
                                    key={i} 
                                    className="shrink-0 flex flex-col items-center justify-end relative h-full snap-center group"
                                    style={{ width: `${ITEM_WIDTH}px` }}
                                >
                                    {/* Tick Lines - MOVED DOWN to touch numbers + CENTERED */}
                                    <div 
                                        className={`w-[2px] absolute left-1/2 -translate-x-1/2 transition-all rounded-full
                                            ${isInteger 
                                                ? 'h-6 bottom-9 bg-white w-[3px]'  // Major tick
                                                : isHalf 
                                                    ? 'h-4 bottom-9 bg-white/60' 
                                                    : 'h-2 bottom-9 bg-white/30'
                                            }
                                            ${isZeroZone ? 'bg-red-500 w-[3px] h-7 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : ''}
                                        `}
                                    ></div>

                                    {/* Number - Bottom Aligned + CENTERED */}
                                    {isInteger && (
                                        isZeroZone ? (
                                            // Special ZERO ZONE Style (Red Text on White Circle)
                                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.4)] z-20">
                                                <span className="text-lg font-black text-red-600 tracking-tighter leading-none select-none">
                                                    {Math.round(displayNum)}
                                                </span>
                                            </div>
                                        ) : (
                                            // Standard Style
                                            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-2xl font-black text-white tracking-tighter leading-none select-none drop-shadow-md z-10">
                                                {Math.round(displayNum)}
                                            </span>
                                        )
                                    )}
                                </div>
                            );
                        })}

                        {/* Spacer Right - Adjusted for Center Alignment */}
                        <div style={{ minWidth: `calc(50% - ${ITEM_WIDTH / 2}px)` }} className="shrink-0 h-full"></div>
                    </div>
                    
                    {/* Fade Gradients */}
                    <div className="absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-[#1a1a1a] to-transparent pointer-events-none z-10"></div>
                    <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-[#1a1a1a] to-transparent pointer-events-none z-10"></div>
                </div>
            </div>
        </div>
    );
});

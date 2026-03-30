import React from 'react';

interface FlowControlDialProps {
    value: number;
    onChange: (val: number) => void;
}

export const FlowControlDial: React.FC<FlowControlDialProps> = ({ value, onChange }) => {
    // Calculate rotation for the visual handle (0-360 degrees)
    // We use the full value so rotation is cumulative (e.g. 1.75 -> 2.00 rotates forward)
    const rotationDegrees = value * 360;
    
    // Helper to format value
    const displayValue = value.toFixed(2);

    return (
        <div className="flex flex-wrap items-center justify-center sm:justify-between gap-x-4 gap-y-2 p-1 w-full">
            {/* Visual Dial - Clock Style */}
            <div className="relative w-24 h-24 shrink-0 bg-surface rounded-full shadow-inner border border-white/10 flex items-center justify-center">
                {/* Tick marks */}
                {[0, 90, 180, 270].map((deg) => (
                    <div 
                        key={deg} 
                        className="absolute w-1.5 h-2 bg-on-surface-variant/30 rounded-full"
                        style={{ 
                            top: deg === 0 ? '6px' : deg === 180 ? 'auto' : '50%',
                            bottom: deg === 180 ? '6px' : 'auto',
                            left: deg === 270 ? '6px' : deg === 90 ? 'auto' : '50%',
                            right: deg === 90 ? '6px' : 'auto',
                            transform: deg === 0 || deg === 180 ? 'translateX(-50%)' : 'translateY(-50%)'
                        }}
                    />
                ))}

                {/* Rotating Handle Container */}
                <div 
                    className="absolute inset-0 transition-transform duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)"
                    style={{ transform: `rotate(${rotationDegrees}deg)` }}
                >
                    {/* The Handle/Paddle - Clock Hand Style */}
                    {/* Main arm pointing UP */}
                    <div className="absolute left-1/2 bottom-1/2 -translate-x-1/2 w-1.5 h-[42%] bg-on-surface rounded-full shadow-md origin-bottom"></div>
                    
                    {/* Tapered Tip */}
                    <div className="absolute left-1/2 top-[8%] -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[12px] border-b-on-surface"></div>

                    {/* Counterweight (Tail) */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 w-1.5 h-[10%] bg-on-surface rounded-full origin-top opacity-80"></div>
                </div>
                
                {/* Center Cap (Pivot) */}
                <div className="absolute w-4 h-4 bg-on-surface rounded-full shadow-md z-10 flex items-center justify-center border border-surface">
                    <div className="w-1.5 h-1.5 bg-surface rounded-full"></div>
                </div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-3 flex-1 justify-center sm:justify-end min-w-[200px]">
                 <button 
                    onClick={() => onChange(Math.max(0, Number((value - 0.25).toFixed(2))))}
                    className="w-14 h-14 flex items-center justify-center rounded-2xl bg-surface-container hover:bg-white/10 active:scale-95 transition-all text-on-surface font-black text-3xl shadow-sm border border-white/5"
                >
                    -
                </button>
                
                <div className="flex flex-col items-center min-w-[70px]">
                    {/* Matching NUMERIC_INPUT_STYLE size */}
                    <span className="text-4xl font-normal text-on-surface tracking-tighter drop-shadow-sm tabular-nums leading-none">
                        {displayValue}
                    </span>
                </div>

                <button 
                    onClick={() => onChange(Number((value + 0.25).toFixed(2)))}
                    className="w-14 h-14 flex items-center justify-center rounded-2xl bg-surface-container hover:bg-white/10 active:scale-95 transition-all text-on-surface font-black text-3xl shadow-sm border border-white/5"
                >
                    +
                </button>
            </div>
        </div>
    );
};

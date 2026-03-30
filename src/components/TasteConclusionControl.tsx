
import React from 'react';
import { BOX_STYLE, LABEL_STYLE } from '../styles/common';
import { triggerHaptic } from '../utils/haptics';

interface TasteConclusionControlProps {
    value: number[]; // Array of selected IDs [1, 2, 3]
    onChange: (val: number[]) => void;
    labelStyle?: React.CSSProperties;
}

export const TasteConclusionControl: React.FC<TasteConclusionControlProps> = React.memo(({ value, onChange, labelStyle }) => {
    
    // Ensure value is always an array (compatibility with old state)
    const safeValue = Array.isArray(value) ? value : [];

    const handleSelect = (clickedVal: number) => {
        let newValue: number[] = [];

        if (clickedVal === 2) {
            newValue = [2];
        } else {
            newValue = safeValue.filter(v => v !== 2);
            if (newValue.includes(clickedVal)) {
                newValue = newValue.filter(v => v !== clickedVal);
            } else {
                newValue.push(clickedVal);
            }
            if (newValue.length === 0) {
                newValue = [2];
            }
        }

        onChange(newValue);
        triggerHaptic(20);
    };

    const getBtnStyle = (targetVal: number, activeColorClass: string, activeShadow: string, inactiveBorderClass: string, inactiveTextClass: string) => {
        const isSelected = safeValue.includes(targetVal);
        const baseStyle = "flex-1 h-14 rounded-xl flex items-center justify-center transition-all duration-300 font-black text-[10px] uppercase tracking-wider relative border leading-none";
        
        if (isSelected) {
            return `${baseStyle} ${activeColorClass} text-white ${activeShadow} scale-[1.05] z-10 border-transparent ring-2 ring-offset-2 ring-offset-surface-container ring-white/20`;
        } else {
            // Apply drop-shadow to text in inactive state to ensure visibility on light backgrounds
            return `${baseStyle} bg-transparent ${inactiveBorderClass} ${inactiveTextClass} hover:bg-white/5 active:scale-95 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]`;
        }
    };

    return (
        <div className={BOX_STYLE}>
            <div className="w-full flex justify-center mb-1">
                <label className={LABEL_STYLE} style={labelStyle}>CONCLUZIE GUST</label>
            </div>
            
            <div className="flex items-center justify-center gap-3 w-full h-full px-0.5">
                <button 
                    onClick={() => handleSelect(1)} 
                    className={getBtnStyle(
                        1, 
                        'bg-yellow-400 !text-black', 
                        'shadow-[0_0_20px_rgba(250,204,21,0.6)]',
                        'border-yellow-500/50', // Darker border
                        'text-yellow-600' // Darker yellow (Gold) for visibility on white
                    )}
                >
                    <div className="flex flex-col items-center gap-0.5">
                        <span>PREA</span>
                        <span>ACRU</span>
                    </div>
                </button>
                
                <button 
                    onClick={() => handleSelect(2)} 
                    className={getBtnStyle(
                        2, 
                        'bg-green-600', 
                        'shadow-[0_0_20px_rgba(22,163,74,0.6)]',
                        'border-green-600/50',
                        'text-green-600' // Darker green
                    )}
                >
                    ECHILIBRAT
                </button>
                
                <button 
                    onClick={() => handleSelect(3)} 
                    className={getBtnStyle(
                        3, 
                        'bg-[#5D4037]', 
                        'shadow-[0_0_20px_rgba(93,64,55,0.6)]',
                        'border-[#8D6E63]/50', 
                        'text-[#8D6E63]' // Medium Brown (Visible on white AND dark)
                    )}
                >
                    <div className="flex flex-col items-center gap-0.5">
                        <span>PREA</span>
                        <span>AMAR</span>
                    </div>
                </button>

            </div>
        </div>
    );
});

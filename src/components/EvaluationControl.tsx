
import React, { useMemo } from 'react';
import { TagIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/solid';
import { BOX_STYLE, LABEL_STYLE } from '../styles/common';
import { TAG_DATA_DEFAULT } from '../constants';
import { TagCategory } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface EvaluationControlProps {
    title: string;
    category: TagCategory; 
    value: number; // 1 = -, 3 = OK, 5 = +
    onChange: (val: number) => void;
    onOpenTags: () => void;
    selectedTags: string[]; 
}

export const EvaluationControl: React.FC<EvaluationControlProps> = React.memo(({ 
    title, 
    category,
    value, 
    onChange, 
    onOpenTags, 
    selectedTags 
}) => {
    
    // Calculate Tag Sentiment Color
    const tagStyle = useMemo(() => {
        const baseStyle = "h-12 px-4 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 border min-w-[70px]";
        
        if (selectedTags.length === 0) {
            return `${baseStyle} bg-transparent border-white/10 text-on-surface-variant/50 hover:bg-white/5`;
        }

        const posList = TAG_DATA_DEFAULT[category]?.positive || [];
        const negList = TAG_DATA_DEFAULT[category]?.negative || [];

        const normalize = (str: string) => str.replace(/_/g, ' ').toLowerCase().trim();

        const activePos = selectedTags.some(t => posList.some(p => normalize(p) === normalize(t)));
        const activeNeg = selectedTags.some(t => negList.some(n => normalize(n) === normalize(t)));

        if (activePos && activeNeg) {
            return `${baseStyle} bg-yellow-400 text-black border-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.5)]`;
        }
        if (activePos) {
            return `${baseStyle} bg-green-600 text-white border-green-500 shadow-[0_0_15px_rgba(22,163,74,0.3)]`;
        }
        if (activeNeg) {
            return `${baseStyle} bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]`;
        }
        
        return `${baseStyle} bg-blue-600 text-white border-blue-500`;

    }, [selectedTags, category]);

    const handleToggle = (targetVal: number) => {
        onChange(targetVal);
        triggerHaptic(20);
    };

    const getBtnStyle = (btnVal: number, colorBase: 'red' | 'yellow' | 'green') => {
        const isSelected = value === btnVal;
        
        const colors = {
            red: {
                active: 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.7)] ring-2 ring-red-400 scale-105 z-10 border-transparent',
                inactive: 'bg-red-500/5 text-red-500 border-2 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50 drop-shadow-sm'
            },
            yellow: {
                active: 'bg-yellow-400 text-black shadow-[0_0_20px_rgba(250,204,21,0.7)] ring-2 ring-yellow-300 scale-105 z-10 border-transparent',
                inactive: 'bg-yellow-400/5 text-yellow-600 border-2 border-yellow-500/30 hover:bg-yellow-400/10 hover:border-yellow-400/50 drop-shadow-sm'
            },
            green: {
                active: 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.7)] ring-2 ring-green-400 scale-105 z-10 border-transparent',
                inactive: 'bg-green-500/5 text-green-600 border-2 border-green-500/30 hover:bg-green-500/10 hover:border-green-500/50 drop-shadow-sm'
            }
        };

        const current = colors[colorBase];
        return `w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 font-black text-sm relative border ${isSelected ? current.active : current.inactive} active:scale-90`;
    };

    const getTagLabel = () => {
        const count = selectedTags.length;
        if (count === 0) return 'TAGURI';
        if (count === 1) return '1 TAG';
        return `${count} TAGURI`;
    };

    return (
        <div className={BOX_STYLE}>
            <div className="w-full flex justify-center mb-1">
                <label className={LABEL_STYLE} style={{ textAlign: 'center', width: '100%', marginBottom: 0 }}>{title}</label>
            </div>
            
            <div className="flex items-center justify-center gap-3 w-full h-full px-0.5">
                <div className="flex items-center gap-2">
                    <button onClick={() => handleToggle(1)} className={getBtnStyle(1, 'red')}>
                        <MinusIcon className="w-6 h-6" />
                    </button>
                    <button onClick={() => handleToggle(3)} className={getBtnStyle(3, 'yellow')}>
                        <span className="tracking-widest text-xs">OK</span>
                    </button>
                    <button onClick={() => handleToggle(5)} className={getBtnStyle(5, 'green')}>
                        <PlusIcon className="w-6 h-6" />
                    </button>
                </div>

                <button onClick={onOpenTags} className={tagStyle}>
                    <TagIcon className={`w-5 h-5 ${selectedTags.length > 0 ? '' : 'opacity-50'}`} />
                    <span className={`text-[9px] font-black uppercase tracking-wider ${selectedTags.length > 0 ? '' : 'opacity-50'}`}>
                        {getTagLabel()}
                    </span>
                </button>
            </div>
        </div>
    );
});

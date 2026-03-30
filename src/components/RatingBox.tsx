
import React from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { BOX_STYLE, LABEL_STYLE } from '../styles/common';

interface RatingBoxProps {
    title: string;
    value: number;
    onChange: (val: number) => void;
    labelStyle?: React.CSSProperties;
    isPremium?: boolean;
}

export const RatingBox: React.FC<RatingBoxProps> = React.memo(({ title, value, onChange, labelStyle, isPremium }) => {
    
    // Configurare dimensiuni
    // Standard: Stele mai mici (w-4) și spațiu mic (gap-1) pentru a nu ieși din casetă pe ecrane înguste
    // Premium: Stele foarte mari (w-9) pentru Nota Generală
    const starSize = isPremium ? "w-9 h-9" : "w-4 h-4";
    const containerGap = isPremium ? "gap-2" : "gap-1"; 

    const handleRate = (star: number) => {
        // Dacă este selectată doar prima stea și dăm click tot pe ea, resetăm la 0
        if (value === 1 && star === 1) {
            onChange(0);
        } else {
            onChange(star);
        }
    };
    
    const boxClassName = isPremium 
        ? `${BOX_STYLE} !border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.15)]`
        : BOX_STYLE;

    return (
        <div className={boxClassName}>
            <label className={LABEL_STYLE} style={labelStyle}>{title}</label>
            <div className={`flex-1 flex items-center justify-center w-full ${containerGap}`}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                        key={star} 
                        onClick={() => handleRate(star)}
                        className="active:scale-90 transition-transform focus:outline-none p-0.5 group" 
                    >
                        {star <= value ? (
                            // Use amber-500 (more orange/gold) instead of yellow-400 (neon) for visibility on white
                            <StarIcon className={`${starSize} text-amber-500 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]`} />
                        ) : (
                            <StarIcon className={`${starSize} text-on-surface-variant/20`} />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
});

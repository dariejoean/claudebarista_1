
import React from 'react';
import { CustomThemeColors } from '../types';
import { XMarkIcon, PaintBrushIcon } from '@heroicons/react/24/solid';

interface ThemeEditorProps {
    colors: CustomThemeColors;
    defaultColors: CustomThemeColors;
    themeName: string;
    onChange: (key: keyof CustomThemeColors, val: string) => void;
    onSave: () => void;
    onReset: () => void;
    onClose: () => void;
}

const LABELS: Record<keyof CustomThemeColors, string> = {
    surface: 'FUNDAL GENERAL',
    surfaceContainer: 'FUNDAL CASETE',
    sectionHeader: 'TITLURI SECȚIUNI',
    boxLabel: 'TITLURI CASETE'
};

export const ThemeEditorModal: React.FC<ThemeEditorProps> = ({ colors, defaultColors, themeName, onChange, onSave, onReset, onClose }) => {
    
    // Helper to render a row
    const renderRow = (key: keyof CustomThemeColors) => {
        const currentColor = colors[key];
        const suggestionColor = defaultColors[key];

        return (
            <div key={key} className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/5 shadow-sm">
                {/* Label Section */}
                <div className="flex-1 pr-2">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest opacity-90">
                        {LABELS[key]}
                    </label>
                </div>

                {/* Controls Section */}
                <div className="flex items-center gap-4">
                    
                    {/* Suggestion - Clickable to reset individual color */}
                    <div 
                        onClick={() => onChange(key, suggestionColor)}
                        className="flex flex-col items-center gap-1.5 opacity-60 hover:opacity-100 cursor-pointer transition-all group/suggestion"
                        title="Apasă pentru a reveni la culoarea implicită"
                    >
                        <div 
                            className="w-10 h-10 rounded-full shadow-sm border border-white/10 group-active/suggestion:scale-90 transition-transform" 
                            style={{ backgroundColor: suggestionColor }}
                        ></div>
                        <span className="text-[8px] font-bold text-on-surface-variant uppercase tracking-wider">SUGESTIE</span>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-10 bg-white/10"></div>

                    {/* Modification */}
                    <div className="flex flex-col items-center gap-1.5 relative group cursor-pointer">
                        <div 
                            className="w-10 h-10 rounded-full shadow-lg border-2 border-white ring-2 ring-white/10 transition-transform group-active:scale-95" 
                            style={{ backgroundColor: currentColor }}
                        ></div>
                        {/* Hidden Native Input overlaid on the circle */}
                        <input 
                            type="color" 
                            value={currentColor} 
                            onChange={(e) => onChange(key, e.target.value)} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <span className="text-[8px] font-bold text-blue-400 uppercase tracking-wider">MODIFICARE</span>
                    </div>

                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
             <div className="bg-[#2d323b] w-full max-w-sm rounded-[2rem] p-6 border border-white/10 shadow-2xl flex flex-col gap-5 text-white">
                 
                 {/* Header */}
                 <div className="flex justify-between items-start border-b border-white/10 pb-4">
                     <div className="flex items-center gap-2">
                        <PaintBrushIcon className="w-5 h-5 text-on-surface" />
                        <div>
                             <h2 className="text-sm font-black text-on-surface uppercase tracking-widest">PERSONALIZARE TEMĂ</h2>
                             <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-0.5 opacity-60">{themeName}</p>
                        </div>
                     </div>
                     <button onClick={onClose} className="text-on-surface-variant hover:text-white transition-colors">
                        <XMarkIcon className="w-6 h-6"/>
                     </button>
                 </div>
                 
                 {/* Body - Rows */}
                 <div className="flex flex-col gap-3">
                     {renderRow('surface')}
                     {renderRow('surfaceContainer')}
                     {renderRow('sectionHeader')}
                     {renderRow('boxLabel')}
                 </div>
                 
                 {/* Footer Actions */}
                 <div className="space-y-3 pt-2">
                     <div className="grid grid-cols-2 gap-3">
                         <button 
                            onClick={onClose} 
                            className="py-3.5 rounded-full bg-white/5 text-on-surface-variant font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
                         >
                            ANULEAZĂ
                         </button>
                         <button 
                            onClick={onSave} 
                            className="py-3.5 rounded-full bg-blue-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-colors"
                         >
                            SALVEAZĂ
                         </button>
                     </div>
                     
                     <button 
                        onClick={onReset} 
                        className="w-full py-3.5 rounded-full bg-green-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-green-500 shadow-lg shadow-green-900/20 transition-colors"
                     >
                        RESTABILIRE TEMĂ
                     </button>
                 </div>
             </div>
        </div>
    )
}

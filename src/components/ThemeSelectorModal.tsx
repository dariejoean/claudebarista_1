
import React from 'react';
import { AppTheme, CustomThemeColors } from '../types';
import { THEME_METADATA, THEMES_ORDER } from '../constants';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

interface ThemeSelectorModalProps {
    currentTheme: AppTheme;
    customizations: Record<string, CustomThemeColors>;
    onSelect: (theme: AppTheme) => void;
    onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({ currentTheme, customizations, onSelect, onClose }) => {
    
    const renderThemeCard = (themeKey: AppTheme) => {
        const meta = THEME_METADATA[themeKey];
        // Use customized colors if available (especially for Random themes), otherwise defaults
        const colors = customizations[themeKey] || meta.defaults;
        const isActive = currentTheme === themeKey;

        return (
            <button 
                key={themeKey}
                onClick={() => onSelect(themeKey)}
                className={`relative group flex flex-col items-center gap-2 p-1 transition-transform active:scale-95`}
            >
                {/* Visual Preview Card */}
                <div 
                    className={`w-full aspect-[4/3] rounded-2xl shadow-lg border-2 overflow-hidden relative transition-all ${isActive ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-white/10 group-hover:border-white/30'}`}
                    style={{ backgroundColor: colors.surface }}
                >
                    {/* Header Bar Simulation */}
                    <div className="h-3 w-full opacity-80" style={{ backgroundColor: colors.surfaceContainer }}></div>
                    
                    {/* Content Simulation */}
                    <div className="p-3 flex gap-2">
                        <div className="flex-1 h-12 rounded-lg opacity-90" style={{ backgroundColor: colors.surfaceContainer }}></div>
                        <div className="w-12 h-12 rounded-lg opacity-90" style={{ backgroundColor: colors.sectionHeader }}></div>
                    </div>

                    {/* Active Indicator Overlay */}
                    {isActive && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[1px]">
                            <div className="bg-blue-500 rounded-full p-1 shadow-lg">
                                <CheckCircleIcon className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Theme Name */}
                <span className={`text-xs font-bold uppercase tracking-widest ${isActive ? 'text-blue-400' : 'text-on-surface-variant'}`}>
                    {meta.name}
                </span>
            </button>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
             <div className="bg-[#2d323b] w-full max-w-sm rounded-[2rem] p-6 border border-white/10 shadow-2xl flex flex-col gap-5 max-h-[85vh]">
                 
                 {/* Header */}
                 <div className="flex justify-between items-center border-b border-white/10 pb-4 shrink-0">
                     <div>
                         <h2 className="text-sm font-black text-white uppercase tracking-widest">ALEGE O TEMĂ PREDEFINITĂ</h2>
                     </div>
                     <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <XMarkIcon className="w-6 h-6"/>
                     </button>
                 </div>
                 
                 {/* Grid of Themes */}
                 <div className="grid grid-cols-2 gap-4 overflow-y-auto pr-1 no-scrollbar">
                     {THEMES_ORDER.map(themeKey => renderThemeCard(themeKey))}
                 </div>
                 
                 {/* Footer Actions */}
                 <div className="pt-2 shrink-0">
                     <button 
                        onClick={onClose} 
                        className="w-full py-3.5 rounded-full bg-white/5 text-gray-300 font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
                     >
                        ÎNCHIDE
                     </button>
                 </div>
             </div>
        </div>
    )
}

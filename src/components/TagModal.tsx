
import React, { useState, useEffect } from 'react';
import { TagCategory } from '../constants';
import { getSetting } from '../services/db';
import { ListItem } from '../types';
import { XMarkIcon, HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/solid';

interface TagModalProps {
    category: TagCategory | null;
    selectedTags: string[];
    onClose: () => void;
    onToggleTag: (tag: string) => void;
}

export const TagModal: React.FC<TagModalProps> = ({ category, selectedTags, onClose, onToggleTag }) => {
    const [positiveTags, setPositiveTags] = useState<ListItem[]>([]);
    const [negativeTags, setNegativeTags] = useState<ListItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!category) return;

        const loadTags = async () => {
            setLoading(true);
            try {
                const pos = await getSetting(`tags_${category}_positive`);
                const neg = await getSetting(`tags_${category}_negative`);
                
                if (Array.isArray(pos)) setPositiveTags(pos.sort((a,b) => a.order - b.order));
                if (Array.isArray(neg)) setNegativeTags(neg.sort((a,b) => a.order - b.order));
            } catch (e) {
                console.error("Failed to load tags", e);
            } finally {
                setLoading(false);
            }
        };

        loadTags();
    }, [category]);

    if (!category) return null;

    // Hardcoded Dark Brown Background as requested
    const COFFEE_BG = "bg-[#2A1810]";

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 animate-fade-in">
            <div className={`bg-surface-container w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border-t sm:border border-white/10 max-h-[85vh] flex flex-col overflow-hidden`}>
                
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-white/5 bg-surface/50 backdrop-blur-md">
                    <h3 className="text-xl font-black text-on-surface uppercase tracking-widest">{category.toUpperCase()}</h3>
                    <button onClick={onClose} className="p-2 bg-surface-container-high rounded-full text-on-surface-variant hover:text-white transition-colors"><XMarkIcon className="w-6 h-6"/></button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-6">
                    {loading ? (
                        <div className="text-center py-10 opacity-50">Se încarcă tag-urile...</div>
                    ) : (
                        <>
                            {/* POSITIVE SECTION */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-green-400 opacity-90">
                                    <HandThumbUpIcon className="w-5 h-5" />
                                    <span className="text-xs font-bold uppercase tracking-widest">ASPECTE POZITIVE</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {positiveTags.map(tag => (
                                        <button 
                                            key={tag.id}
                                            onClick={() => onToggleTag(tag.label)}
                                            className={`px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-all border shadow-sm active:scale-95 text-left leading-tight
                                                ${selectedTags.includes(tag.label) 
                                                    ? 'bg-green-600 text-white border-green-400 shadow-[0_0_10px_rgba(22,163,74,0.4)]' 
                                                    : `${COFFEE_BG} text-green-400 border-white/5 hover:border-green-400/30`
                                                }
                                            `}
                                        >
                                            {tag.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* DIVIDER */}
                            <div className="w-full h-px bg-white/10 my-2"></div>

                            {/* NEGATIVE SECTION */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-red-400 opacity-90">
                                    <HandThumbDownIcon className="w-5 h-5" />
                                    <span className="text-xs font-bold uppercase tracking-widest">ASPECTE NEGATIVE</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {negativeTags.map(tag => (
                                        <button 
                                            key={tag.id}
                                            onClick={() => onToggleTag(tag.label)}
                                            className={`px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-all border shadow-sm active:scale-95 text-left leading-tight
                                                ${selectedTags.includes(tag.label) 
                                                    ? 'bg-red-600 text-white border-red-400 shadow-[0_0_10px_rgba(220,38,38,0.4)]' 
                                                    : `${COFFEE_BG} text-red-400 border-white/5 hover:border-red-400/30`
                                                }
                                            `}
                                        >
                                            {tag.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
                
                {/* Footer Safe Area */}
                <div className="pb-safe-bottom bg-surface/50 h-4"></div>
            </div>
        </div>
    );
};

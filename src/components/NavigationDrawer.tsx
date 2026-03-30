
import React, { useState } from 'react';
import { XMarkIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

interface MenuItem {
    id: 'new' | 'history' | 'maintenance' | 'settings';
    label: string;
    subItems?: { id: string; label: string }[];
}

// Updated structure
const MENU_STRUCTURE: MenuItem[] = [
    { 
        id: 'new', 
        label: 'EXTRACȚIE NOUĂ',
        subItems: [
            { id: 'section-new-setup', label: 'Pregătire' },
            { id: 'section-new-extraction', label: 'Extracție' },
            { id: 'section-new-evaluation', label: 'Evaluare' },
            { id: 'section-new-conclusion', label: 'Concluzie' }
        ]
    },
    { 
        id: 'history', 
        label: 'LISTA EXTRACȚII',
        subItems: [
            { id: 'section-history-analysis', label: 'Analize și Discuții' },
            { id: 'section-history-latest', label: 'Ultima Extracție' },
            { id: 'section-history-log', label: 'Jurnal Complet' }
        ]
    },
    { 
        id: 'maintenance', 
        label: 'JURNAL ÎNTREȚINERE',
        subItems: []
    },
    { 
        id: 'settings', 
        label: 'SETĂRI GENERALE',
        subItems: [
            { id: 'section-tehnica', label: 'Tehnică' },
            { id: 'section-materii-prime', label: 'Materii Prime' },
            { id: 'section-extractii', label: 'Date Extracții' },
            { id: 'section-interfata', label: 'Interfață' },
            { id: 'section-taguri', label: 'Taguri' },
            { id: 'section-engine', label: 'Engine' },
            { id: 'section-realizare', label: 'Realizare' }
        ]
    }
];

interface NavigationDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    activeTab: string;
    onNavigate: (tab: 'new' | 'history' | 'maintenance' | 'settings', sectionId?: string) => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({ isOpen, onClose, activeTab, onNavigate }) => {
    // Track which menu item is currently expanded
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Animation/Transition Logic
    const backdropClass = isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none";
    const drawerClass = isOpen ? "translate-x-0" : "translate-x-full";

    const handleMainItemClick = (item: MenuItem) => {
        if (item.subItems && item.subItems.length > 0) {
            // If it has sub-items, toggle expansion
            setExpandedId(expandedId === item.id ? null : item.id);
        } else {
            // If no sub-items, navigate directly
            onNavigate(item.id);
            onClose();
        }
    };

    const handleSubItemClick = (tabId: 'new' | 'history' | 'maintenance' | 'settings', sectionId: string) => {
        onNavigate(tabId, sectionId);
        onClose();
    };

    return (
        <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${backdropClass}`}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            
            {/* Drawer */}
            <div className={`absolute top-0 right-0 h-full w-72 bg-surface shadow-2xl transition-transform duration-300 ease-out border-l border-white/10 flex flex-col ${drawerClass}`}>
                
                {/* Header */}
                <div className="p-5 flex justify-between items-center border-b border-white/5 bg-surface/50">
                    <span className="text-xs font-black text-on-surface uppercase tracking-widest">MENIU</span>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-on-surface-variant transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto py-4">
                    {MENU_STRUCTURE.map((item) => {
                        // Check if this item is currently expanded
                        const isExpanded = expandedId === item.id;
                        // Check if this item corresponds to the currently active tab (for highlighting)
                        const isActiveTab = activeTab === item.id;
                        
                        return (
                            <div key={item.id} className="mb-2">
                                {/* Main Item Button */}
                                <button 
                                    onClick={() => handleMainItemClick(item)}
                                    className={`w-full flex justify-between items-center px-6 py-4 font-bold text-sm uppercase tracking-wider transition-all border-l-4 ${
                                        isActiveTab
                                        ? 'border-on-surface text-on-surface bg-white/5' 
                                        : 'border-transparent text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
                                    }`}
                                >
                                    <span>{item.label}</span>
                                    {item.subItems && item.subItems.length > 0 && (
                                        isExpanded 
                                            ? <ChevronDownIcon className="w-4 h-4 text-on-surface-variant" />
                                            : <ChevronRightIcon className="w-4 h-4 text-on-surface-variant/50" />
                                    )}
                                </button>

                                {/* Sub Items Container (Accordion) */}
                                {item.subItems && isExpanded && (
                                    <div className="flex flex-col bg-black/10 border-y border-white/5 animate-fade-in">
                                        {item.subItems.map(sub => (
                                            <button 
                                                key={sub.id}
                                                onClick={() => handleSubItemClick(item.id, sub.id)}
                                                className="w-full text-left pl-10 pr-6 py-3 text-xs font-bold uppercase text-on-surface-variant hover:text-white hover:bg-white/5 transition-colors relative flex items-center group border-l-[4px] border-transparent"
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/40 mr-3 group-hover:bg-crema-500 transition-colors"></span>
                                                {sub.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer Info */}
                <div className="p-6 border-t border-white/5 text-center flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                        <span className="text-[9px] font-black text-indigo-400 tracking-widest uppercase">EXPERT ENGINE ACTIVE</span>
                    </div>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest opacity-50">PHARMABARISTA - EXPERT v7</p>
                </div>
            </div>
        </div>
    );
};

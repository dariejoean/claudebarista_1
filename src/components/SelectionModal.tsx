
import React from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

interface SelectionModalProps {
    title: string;
    items: string[];
    selectedItem: string;
    onSelect: (item: string) => void;
    onClose: () => void;
    onAddNew?: () => void; // Optional: Link to add new item
}

export const SelectionModal: React.FC<SelectionModalProps> = ({ title, items, selectedItem, onSelect, onClose, onAddNew }) => {
    return (
        // CHANGED: 'items-end' to 'items-center', added 'p-4' to float it in center
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
            {/* CHANGED: Removed rounded-t-[2rem], added rounded-[2rem] for full rounded card look */}
            <div className="bg-surface-container w-full max-w-sm rounded-[2rem] shadow-2xl border border-white/10 max-h-[70vh] flex flex-col overflow-hidden animate-scale-in relative">
                
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-white/5 bg-surface/50 backdrop-blur-md shrink-0">
                    <h3 className="text-sm font-black text-on-surface uppercase tracking-widest">{title}</h3>
                    <button onClick={onClose} className="p-2 bg-surface-container-high rounded-full text-on-surface-variant hover:text-white transition-colors">
                        <XMarkIcon className="w-5 h-5"/>
                    </button>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2">
                    {items.length === 0 ? (
                        <div className="text-center py-10 opacity-50 text-sm font-medium text-on-surface-variant">
                            Lista este goală.
                        </div>
                    ) : (
                        items.map((item, index) => {
                            const isSelected = item === selectedItem;
                            return (
                                <button
                                    key={item}
                                    onClick={() => { onSelect(item); onClose(); }}
                                    className={`w-full text-left p-4 rounded-xl border transition-all active:scale-[0.98] flex items-center justify-between group animate-slide-up-fade ${
                                        isSelected 
                                        ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-900/20' 
                                        : 'bg-surface-container-high border-white/5 hover:bg-surface-container-high/80'
                                    }`}
                                    style={{ animationDelay: `${index * 0.03}s`, animationFillMode: 'both' }}
                                >
                                    <span className={`text-sm font-bold uppercase tracking-wide ${isSelected ? 'text-white' : 'text-on-surface'}`}>
                                        {item}
                                    </span>
                                    {isSelected && <CheckCircleIcon className="w-5 h-5 text-white" />}
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Footer / Add New */}
                {onAddNew && (
                    <div className="p-4 border-t border-white/5 bg-surface/50 shrink-0">
                        <button 
                            onClick={() => { onClose(); onAddNew(); }}
                            className="w-full py-3.5 bg-surface-container text-on-surface border border-white/10 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
                        >
                            + ADAUGĂ ELEMENT NOU
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

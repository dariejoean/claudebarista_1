
import React, { useState, useEffect } from 'react';
import { ListItem } from '../types';
import { getSetting, saveSetting } from '../services/db';
import { 
    ArrowLeftIcon, 
    PlusIcon, 
    TrashIcon, 
    ArrowUpIcon, 
    ArrowDownIcon, 
    CheckCircleIcon,
    PencilSquareIcon,
    BeakerIcon,
    XCircleIcon,
    ArrowDownCircleIcon
} from '@heroicons/react/24/solid';

// Reusing styles from ProductManager for consistency
const DEPTH_SHADOW = "shadow-md";
const GLASS_BORDER = "border border-white/5";
const BOX_STYLE = `bg-surface-container rounded-2xl p-4 relative ${DEPTH_SHADOW} ${GLASS_BORDER}`;
const INPUT_STYLE = "w-full bg-surface-container-high rounded-xl border border-white/5 p-4 text-on-surface outline-none focus:border-crema-500 focus:bg-surface-container transition-all font-medium text-sm text-center shadow-inner placeholder:text-on-surface/30";
const LABEL_STYLE = "text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 block w-full text-center opacity-70 drop-shadow-sm";

// Specific Red/Green Buttons
const BTN_BACK_STYLE = "px-4 py-2.5 rounded-full bg-red-600 text-xs font-bold text-white uppercase tracking-wider hover:bg-red-500 transition-colors shadow-md active:shadow-inner flex items-center gap-2 border border-white/10";
const BTN_ADD_STYLE = "px-4 py-2.5 rounded-full bg-green-600 text-xs font-bold text-white uppercase tracking-wider hover:bg-green-500 transition-colors shadow-md active:shadow-inner flex items-center gap-2 border border-white/10";

interface ListEditorProps {
    title: string;
    settingKey: string;
    onClose: () => void;
}

export const ListEditor: React.FC<ListEditorProps> = ({ title, settingKey, onClose }) => {
    const [items, setItems] = useState<ListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [displayLimit, setDisplayLimit] = useState(10);
    
    // View State: 'list' vs 'form' (add/edit)
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingItem, setEditingItem] = useState<ListItem | null>(null);
    const [inputValue, setInputValue] = useState('');

    // Load initial data
    useEffect(() => {
        const load = async () => {
            const data = await getSetting(settingKey);
            if (Array.isArray(data)) {
                setItems(data.sort((a: ListItem, b: ListItem) => a.order - b.order));
            }
            setLoading(false);
        };
        load();
    }, [settingKey]);

    const handleOpenAdd = () => {
        setEditingItem(null);
        setInputValue('');
        setView('form');
    };

    const handleOpenEdit = (item: ListItem) => {
        setEditingItem(item);
        setInputValue(item.label);
        setView('form');
    };

    const handleSave = async () => {
        if (!inputValue.trim()) return;
        
        let newItems = [...items];

        if (editingItem) {
            // Edit existing
            newItems = newItems.map(i => i.id === editingItem.id ? { ...i, label: inputValue.trim() } : i);
        } else {
            // Add new
            const newItem: ListItem = {
                id: crypto.randomUUID(),
                label: inputValue.trim(),
                order: items.length
            };
            newItems.push(newItem);
        }

        // Re-normalize order
        newItems.forEach((item, idx) => item.order = idx);

        setItems(newItems);
        await saveSetting(settingKey, newItems);
        setView('list');
    };

    const handleDeleteItem = async (id: string) => {
        if (!confirm("Ștergi acest element?")) return;
        const newItems = items.filter(i => i.id !== id);
        // Re-order
        newItems.forEach((item, idx) => item.order = idx);
        
        setItems(newItems);
        await saveSetting(settingKey, newItems);
    };

    const handleMove = async (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === items.length - 1) return;

        const newItems = [...items];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        
        // Swap
        [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
        
        // Update order property
        newItems.forEach((item, idx) => item.order = idx);
        
        setItems(newItems);
        await saveSetting(settingKey, newItems);
    };

    return (
        <div className="animate-fade-in flex flex-col h-full relative space-y-4">
            {/* Header Navigation */}
            <div className="flex flex-col gap-3 pb-2">
                <h2 className="text-on-surface font-bold uppercase tracking-widest text-sm drop-shadow-sm text-center w-full truncate px-4">
                    {title}
                </h2>
                <div className="flex justify-between items-center w-full">
                    <button 
                        onClick={() => view === 'form' ? setView('list') : onClose()} 
                        className={BTN_BACK_STYLE}
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Inapoi
                    </button>
                    {view === 'list' && (
                        <button onClick={handleOpenAdd} className={BTN_ADD_STYLE}>
                            <PlusIcon className="w-5 h-5" />
                            Adauga
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            {view === 'list' ? (
                <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pb-20 px-1">
                    {loading ? (
                         <div className="text-center py-10 opacity-50 text-sm">Se încarcă...</div>
                    ) : items.length === 0 ? (
                        <div className="text-center text-on-surface-variant text-sm py-10 opacity-60">Lista este goală.</div>
                    ) : (
                        <>
                            {items.slice(0, displayLimit).map((item, index) => (
                                <div key={item.id} className="flex flex-col p-4 rounded-2xl border border-white/5 bg-surface-container shadow-sm active:scale-[0.99] transition-all">
                                    {/* TOP ROW: INDEX & SORT */}
                                    <div className="w-full flex justify-between items-center border-b border-white/5 pb-2 mb-3">
                                        <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.15em] opacity-60">
                                            #{index + 1}
                                        </span>
                                        <div className="flex gap-1">
                                             <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className="p-1 hover:bg-white/10 rounded disabled:opacity-20"><ArrowUpIcon className="w-3 h-3 text-on-surface-variant"/></button>
                                             <button onClick={() => handleMove(index, 'down')} disabled={index === items.length - 1} className="p-1 hover:bg-white/10 rounded disabled:opacity-20"><ArrowDownIcon className="w-3 h-3 text-on-surface-variant"/></button>
                                        </div>
                                    </div>

                                    {/* MIDDLE: NAME */}
                                    <div className="flex flex-col items-center text-center gap-1 mb-4">
                                        <h3 className="text-sm font-black text-on-surface uppercase tracking-wide leading-tight">
                                            {item.label}
                                        </h3>
                                    </div>

                                    {/* BOTTOM: ACTIONS */}
                                    <div className="flex items-center justify-center gap-6 border-t border-white/5 pt-3">
                                        <button onClick={() => handleOpenEdit(item)} className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all border border-white/10 hover:bg-orange-400">
                                            <PencilSquareIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDeleteItem(item.id)} className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all border border-white/10 hover:bg-red-500">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {items.length > displayLimit && (
                                <button 
                                    onClick={() => setDisplayLimit(prev => prev + 10)}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-surface-container text-on-surface font-bold text-xs uppercase tracking-widest rounded-full border border-white/10 shadow-lg hover:bg-surface-container-high transition-all active:scale-95 mx-auto mt-2"
                                >
                                    <ArrowDownCircleIcon className="w-5 h-5 text-on-surface-variant" />
                                    MAI MULTE...
                                </button>
                            )}
                        </>
                    )}
                </div>
            ) : (
                // FORM VIEW
                <div className="flex flex-col gap-4 animate-fade-in pb-20 overflow-y-auto no-scrollbar pt-10">
                    <div className="bg-surface-container rounded-2xl p-6 border border-white/10 shadow-md">
                        <label className={LABEL_STYLE}>Denumire</label>
                        <input 
                            value={inputValue} 
                            onChange={(e) => setInputValue(e.target.value)} 
                            className={`${INPUT_STYLE} h-16 text-lg bg-surface`} 
                            placeholder="Introduceți numele..."
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-3 mt-4 pt-4 border-t border-white/5">
                        <button onClick={() => setView('list')} className="flex-1 py-4 bg-red-600 text-white rounded-full font-bold text-sm uppercase tracking-wider hover:bg-red-500 transition-all shadow-[0_8px_25px_rgba(220,38,38,0.4)] border-t border-white/20 active:scale-[0.98] flex items-center justify-center gap-2">
                            <XCircleIcon className="w-5 h-5" /> Anulează
                        </button>
                        <button onClick={handleSave} className="flex-1 py-4 bg-green-600 text-white rounded-full font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-green-500 transition-all shadow-[0_8px_25px_rgba(22,163,74,0.4)] border-t border-white/20 active:scale-[0.98]">
                            <CheckCircleIcon className="w-5 h-5" /> Salvează
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

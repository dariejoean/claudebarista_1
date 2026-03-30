
import React, { useState, useEffect } from 'react';
import { ListItem } from '../types';
import { getSetting, saveSetting } from '../services/db';
import { identifyEquipment } from '../services/geminiService';
import { 
    PlusIcon, 
    TrashIcon, 
    CheckCircleIcon,
    ArrowLeftIcon,
    PencilSquareIcon,
    XCircleIcon,
    MagnifyingGlassIcon,
    SparklesIcon,
    WrenchIcon,
    InformationCircleIcon,
    XMarkIcon
} from '@heroicons/react/24/solid';

// Reusing styles from TamperEditor
const DEPTH_SHADOW = "shadow-md";
const GLASS_BORDER = "border border-white/5";
const BOX_STYLE = `bg-surface-container rounded-2xl p-4 relative ${DEPTH_SHADOW} ${GLASS_BORDER}`;
const INPUT_STYLE = "w-full bg-surface-container-high rounded-xl border border-white/5 p-4 text-on-surface outline-none focus:border-crema-500 focus:bg-surface-container transition-all font-medium text-sm text-center shadow-inner placeholder:text-on-surface/30";
const LABEL_STYLE = "text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 block w-full text-center opacity-70 drop-shadow-sm";

const BTN_BACK_STYLE = "px-4 py-2.5 rounded-full bg-red-600 text-xs font-bold text-white uppercase tracking-wider hover:bg-red-500 transition-colors shadow-md active:shadow-inner flex items-center gap-2 border border-white/10";
const BTN_ADD_STYLE = "px-4 py-2.5 rounded-full bg-green-600 text-xs font-bold text-white uppercase tracking-wider hover:bg-green-500 transition-colors shadow-md active:shadow-inner flex items-center gap-2 border border-white/10";

interface MaintenanceEditorProps {
    onClose: () => void;
}

export const MaintenanceEditor: React.FC<MaintenanceEditorProps> = ({ onClose }) => {
    const [operations, setOperations] = useState<ListItem[]>([]);
    const [loading, setLoading] = useState(true);
    
    // View State
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingOp, setEditingOp] = useState<ListItem | null>(null);
    const [viewingOp, setViewingOp] = useState<ListItem | null>(null);

    // Inputs
    const [opName, setOpName] = useState('');
    const [frequency, setFrequency] = useState('');
    const [description, setDescription] = useState('');
    const [loadingExpert, setLoadingExpert] = useState(false);

    const SETTING_KEY = 'maintenance_types';

    // Load Data
    useEffect(() => {
        const load = async () => {
            const data = await getSetting(SETTING_KEY);
            if (Array.isArray(data)) {
                setOperations(data.sort((a: ListItem, b: ListItem) => a.order - b.order));
            }
            setLoading(false);
        };
        load();
    }, []);

    const handleOpenAdd = () => {
        setEditingOp(null);
        setOpName('');
        setFrequency('');
        setDescription('');
        setView('form');
    };

    const handleOpenEdit = (op: ListItem) => {
        setEditingOp(op);
        setOpName(op.label);
        setFrequency(op.frequency || '');
        setDescription(op.description || '');
        setView('form');
    };

    const handleIdentify = async () => {
        if (!opName) return; 
        setLoadingExpert(true);
        try {
            const result = await identifyEquipment(opName, 'maintenance');
            if (result.name && result.name !== opName) setOpName(result.name);
            if (result.description) setDescription(result.description);
            if (result.frequency) setFrequency(result.frequency);
        } catch (e) { 
            console.error(e);
            alert("Eroare identificare Expert."); 
        } finally { 
            setLoadingExpert(false); 
        }
    };

    const handleSave = async () => {
        if (!opName.trim()) return;

        let updatedList = [...operations];

        if (editingOp) {
            // Edit Existing
            const updatedItem: ListItem = { 
                ...editingOp, 
                label: opName.trim(),
                description,
                frequency
            };
            updatedList = updatedList.map(item => item.id === editingOp.id ? updatedItem : item);
        } else {
            // Add New
            const newItem: ListItem = {
                id: crypto.randomUUID(),
                label: opName.trim(),
                order: operations.length,
                description,
                frequency
            };
            updatedList.push(newItem);
        }

        updatedList.forEach((item, idx) => item.order = idx);
        setOperations(updatedList);
        await saveSetting(SETTING_KEY, updatedList);
        setView('list');
    };

    const handleDelete = async (id: string) => {
        if(!confirm("Ștergi această operațiune de întreținere?")) return;
        const updated = operations.filter(item => item.id !== id);
        updated.forEach((item, idx) => item.order = idx);
        setOperations(updated);
        await saveSetting(SETTING_KEY, updated);
    };

    return (
        <div className="animate-fade-in flex flex-col h-full relative space-y-4">
             {/* Header Navigation */}
             <div className="flex flex-col gap-3 pb-2">
                <h2 className="text-on-surface font-bold uppercase tracking-widest text-sm drop-shadow-sm text-center w-full">
                    OPERAȚIUNI ÎNTREȚINERE
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

            {/* LIST VIEW */}
            {view === 'list' ? (
                <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar pb-20">
                     {loading ? (
                         <div className="text-center py-10 opacity-50 text-sm">Se încarcă...</div>
                     ) : operations.length === 0 ? (
                        <div className="text-center text-on-surface-variant text-sm py-10 opacity-60">Nu ai adăugat nicio operațiune.</div>
                     ) : (
                        operations.map((op) => (
                            <div key={op.id} className={`${BOX_STYLE} flex justify-between items-center py-3 min-h-[70px] active:scale-[0.99] transition-transform`}>
                                <div className="flex-1 pr-2 flex items-center">
                                    <div>
                                        <h3 className="text-on-surface font-bold text-sm leading-tight drop-shadow-sm">{op.label}</h3>
                                        <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{op.frequency || 'Frecvență nesetată'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {/* INFO BUTTON */}
                                    <button onClick={() => setViewingOp(op)} className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 shadow-md transition-colors border border-white/10">
                                        <InformationCircleIcon className="w-5 h-5" />
                                    </button>
                                    
                                    <button onClick={() => handleOpenEdit(op)} className="p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 shadow-md transition-colors border border-white/10">
                                        <PencilSquareIcon className="w-5 h-5" />
                                    </button>
                                    
                                    <button onClick={() => handleDelete(op.id)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md transition-colors border border-white/10">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))
                     )}
                </div>
            ) : (
                // FORM VIEW
                <div className="flex flex-col gap-4 animate-fade-in pb-20 overflow-y-auto no-scrollbar pt-5">
                    
                    {/* Main Name Input + AI */}
                    <div className="bg-surface-container rounded-2xl p-5 border border-white/10 shadow-md">
                        <label className={LABEL_STYLE}>Denumire Operațiune</label>
                        <div className="relative">
                            <input 
                                value={opName} 
                                onChange={(e) => setOpName(e.target.value)} 
                                className={`${INPUT_STYLE} pr-14 h-14 text-lg bg-surface`} 
                                placeholder="Ex: Decalcifiere..."
                            />
                            <button type="button" onClick={handleIdentify} disabled={loadingExpert || !opName} className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full active:scale-95 transition-all group disabled:opacity-30 ${loadingExpert ? 'animate-pulse' : ''}`}>
                                <div className="relative w-8 h-8 flex items-center justify-center">
                                    <MagnifyingGlassIcon className="w-8 h-8 text-on-surface-variant group-hover:text-on-surface transition-colors" />
                                    {/* ADDED DROP SHADOW TO SPARKLES */}
                                    <SparklesIcon className="absolute top-[6px] left-[6px] w-3.5 h-3.5 text-yellow-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                                </div>
                            </button>
                        </div>
                        <p className={`text-[10px] text-center mt-2 transition-all ${loadingExpert ? 'animate-pulse text-crema-400 font-bold' : 'text-on-surface-variant opacity-60'}`}>{loadingExpert ? "...Expertul caută detaliile..." : "Apasă lupa pentru completare automată"}</p>
                    </div>

                    {/* Frequency */}
                    <div className="bg-surface-container rounded-2xl p-4 border border-white/10 shadow-md">
                        <label className={LABEL_STYLE}>Frecvența realizării</label>
                        <input 
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value)}
                            placeholder="Ex: Săptămânal, Lunar..."
                            className={`${INPUT_STYLE} h-12 text-center`} 
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className={LABEL_STYLE}>DESCRIERE</label>
                        <textarea 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            className={`${INPUT_STYLE} h-40 resize-none leading-relaxed text-left`} 
                            placeholder="Descrie pașii operațiunii..." 
                        />
                    </div>

                    {/* Save Actions */}
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

            {/* DETAIL MODAL (INFO) */}
            {viewingOp && (
                 <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
                    <div className="bg-surface-container rounded-[2rem] w-full max-w-sm p-6 shadow-2xl flex flex-col gap-4 border border-white/10 relative">
                        
                        {/* Header */}
                        <div className="flex justify-between items-start border-b border-white/5 pb-4">
                            <div className="pr-4">
                                <h3 className="text-on-surface font-bold text-xl leading-tight">{viewingOp.label}</h3>
                                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">Detalii Întreținere</p>
                            </div>
                            <button onClick={() => setViewingOp(null)} className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-white/5 transition-colors">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-1 no-scrollbar">
                             <div className="bg-surface-container-high p-4 rounded-xl shadow-inner border border-white/5 text-center">
                                <div className={LABEL_STYLE}>FRECVENȚĂ</div>
                                <div className="text-lg font-bold text-on-surface">{viewingOp.frequency || 'Nespecificată'}</div>
                             </div>
                             
                             <div>
                                <div className={LABEL_STYLE}>DESCRIERE</div>
                                <div className="bg-surface-container-high/50 p-4 rounded-xl border border-white/5">
                                    <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line text-left opacity-90">
                                        {viewingOp.description || "Nu există o descriere salvată pentru această operațiune."}
                                    </p>
                                </div>
                             </div>
                        </div>

                        {/* Footer Close Action */}
                        <button 
                            onClick={() => setViewingOp(null)}
                            className="w-full py-3 bg-surface-container-high text-on-surface rounded-full font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-colors border border-white/5 shadow-md mt-2"
                        >
                            ÎNCHIDE
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

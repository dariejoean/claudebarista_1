
import React, { useState, useEffect } from 'react';
import { ListItem } from '../types';
import { getSetting, saveSetting } from '../services/db';
import { identifyEquipment } from '../services/geminiService';
import { createThumbnail } from '../utils/imageUtils';
import { 
    ArrowLeftIcon, 
    PlusIcon, 
    TrashIcon, 
    CheckCircleIcon,
    PencilSquareIcon,
    XCircleIcon,
    MagnifyingGlassIcon,
    SparklesIcon,
    CameraIcon,
    PhotoIcon,
    InformationCircleIcon,
    XMarkIcon,
    ArrowDownCircleIcon
} from '@heroicons/react/24/solid';

// Styles
const DEPTH_SHADOW = "shadow-md";
const GLASS_BORDER = "border border-white/5";
const BOX_STYLE = `bg-surface-container rounded-2xl p-4 relative ${DEPTH_SHADOW} ${GLASS_BORDER}`;
const INPUT_STYLE = "w-full bg-surface-container-high rounded-xl border border-white/5 p-4 text-on-surface outline-none focus:border-crema-500 focus:bg-surface-container transition-all font-medium text-sm text-center shadow-inner placeholder:text-on-surface/30";
const LABEL_STYLE = "text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 block w-full text-center opacity-70 drop-shadow-sm";

const BTN_BACK_STYLE = "px-4 py-2.5 rounded-full bg-red-600 text-xs font-bold text-white uppercase tracking-wider hover:bg-red-500 transition-colors shadow-md active:shadow-inner flex items-center gap-2 border border-white/10";
const BTN_ADD_STYLE = "px-4 py-2.5 rounded-full bg-green-600 text-xs font-bold text-white uppercase tracking-wider hover:bg-green-500 transition-colors shadow-md active:shadow-inner flex items-center gap-2 border border-white/10";

interface WaterEditorProps {
    onClose: () => void;
    initialView?: 'list' | 'form';
}

export const WaterEditor: React.FC<WaterEditorProps> = ({ onClose, initialView = 'list' }) => {
    const [items, setItems] = useState<ListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'form'>(initialView);
    const [editingItem, setEditingItem] = useState<ListItem | null>(null);
    const [viewingItem, setViewingItem] = useState<ListItem | null>(null);
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
    const [displayLimit, setDisplayLimit] = useState(10);
    
    // Fields
    const [inputValue, setInputValue] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [thumbnails, setThumbnails] = useState<string[]>([]);
    const [loadingExpert, setLoadingExpert] = useState(false);

    const SETTING_KEY = 'water_list';

    useEffect(() => {
        const load = async () => {
            const data = await getSetting(SETTING_KEY);
            if (Array.isArray(data)) {
                setItems(data.sort((a: ListItem, b: ListItem) => a.order - b.order));
            }
            setLoading(false);
        };
        load();
    }, []);

    useEffect(() => {
        if(initialView === 'form' && !editingItem) handleOpenAdd();
    }, [initialView]);

    const handleOpenAdd = () => { 
        setEditingItem(null); 
        setInputValue(''); 
        setDescription('');
        setImages([]);
        setThumbnails([]);
        setView('form'); 
    };
    
    const handleOpenEdit = (item: ListItem) => { 
        setEditingItem(item); 
        setInputValue(item.label);
        setDescription(item.description || '');
        setImages(item.images || []);
        setThumbnails(item.thumbnails || []);
        setView('form'); 
    };

    const handleIdentify = async () => {
        if (!inputValue) return; 
        setLoadingExpert(true);
        try {
            const result = await identifyEquipment(inputValue, 'water', images);
            if (result.name && result.name !== inputValue) setInputValue(result.name);
            if (result.description) setDescription(result.description);
        } catch (e) { 
            console.error(e);
            alert("Eroare identificare Expert."); 
        } finally { 
            setLoadingExpert(false); 
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const remainingSlots = 5 - images.length; if (remainingSlots <= 0) return;
            const filesToProcess = Array.from(files).slice(0, remainingSlots) as File[];
            const newFull: string[] = [];
            const newThumb: string[] = [];

            for (const file of filesToProcess) {
                const reader = new FileReader();
                await new Promise<void>((resolve) => {
                    reader.onloadend = async () => {
                        if (reader.result) {
                            const full = reader.result as string;
                            const thumb = await createThumbnail(full, 150, 0.6);
                            newFull.push(full);
                            newThumb.push(thumb);
                        }
                        resolve();
                    };
                    reader.readAsDataURL(file);
                });
            }
            setImages(prev => [...prev, ...newFull]);
            setThumbnails(prev => [...prev, ...newThumb]);
            e.target.value = '';
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setThumbnails(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!inputValue.trim()) return;
        let newItems = [...items];
        
        if (editingItem) {
            newItems = newItems.map(i => i.id === editingItem.id ? { 
                ...i, 
                label: inputValue.trim(),
                description,
                images,
                thumbnails
            } : i);
        } else {
            const newItem: ListItem = { 
                id: crypto.randomUUID(), 
                label: inputValue.trim(), 
                order: items.length,
                description,
                images,
                thumbnails
            };
            newItems.push(newItem);
        }
        setItems(newItems);
        await saveSetting(SETTING_KEY, newItems);
        setView('list');
    };

    const handleDeleteItem = async (id: string) => {
        if (!confirm("Ștergi acest tip de apă?")) return;
        const newItems = items.filter(i => i.id !== id);
        setItems(newItems);
        await saveSetting(SETTING_KEY, newItems);
    };

    return (
        <div className="animate-fade-in flex flex-col h-full relative space-y-4">
            {fullScreenImage && (
                <div className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setFullScreenImage(null)}>
                    <img src={fullScreenImage} className="max-w-full max-h-full rounded-lg shadow-2xl object-contain border border-white/10" alt="Fullscreen" />
                    <button className="absolute top-6 right-6 p-2 bg-white/20 rounded-full text-white hover:bg-white/40">
                        <XMarkIcon className="w-8 h-8" />
                    </button>
                </div>
            )}

            <div className="flex flex-col gap-3 pb-2">
                <h2 className="text-on-surface font-bold uppercase tracking-widest text-sm drop-shadow-sm text-center w-full">
                    APĂ
                </h2>
                <div className="flex justify-between items-center w-full">
                    <button onClick={() => view === 'form' ? setView('list') : onClose()} className={BTN_BACK_STYLE}><ArrowLeftIcon className="w-4 h-4" /> Inapoi</button>
                    {view === 'list' && <button onClick={handleOpenAdd} className={BTN_ADD_STYLE}><PlusIcon className="w-5 h-5" /> Adauga</button>}
                </div>
            </div>

            {view === 'list' ? (
                <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pb-20 px-1">
                    {loading ? <div className="text-center py-10 opacity-50 text-sm">Se încarcă...</div> : items.length === 0 ? <div className="text-center text-on-surface-variant text-sm py-10 opacity-60">Lista este goală.</div> : (
                        <>
                            {items.slice(0, displayLimit).map((item, index) => (
                                <div key={item.id} className="flex flex-col p-4 rounded-2xl border border-white/5 bg-surface-container shadow-sm active:scale-[0.99] transition-all">
                                    {/* TOP ROW: INDEX */}
                                    <div className="w-full text-center border-b border-white/5 pb-2 mb-3">
                                        <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.15em] opacity-60">
                                            APĂ #{index + 1}
                                        </span>
                                    </div>

                                    {/* MIDDLE: NAME */}
                                    <div className="flex flex-col items-center text-center gap-1 mb-4">
                                        <h3 className="text-sm font-black text-on-surface uppercase tracking-wide leading-tight">
                                            {item.label}
                                        </h3>
                                    </div>

                                    {/* BOTTOM: ACTIONS */}
                                    <div className="flex items-center justify-center gap-6 border-t border-white/5 pt-3">
                                        <button onClick={() => setViewingItem(item)} className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all border border-white/10 hover:bg-blue-500">
                                            <InformationCircleIcon className="w-5 h-5" />
                                        </button>
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
                <div className="flex flex-col gap-4 animate-fade-in pb-20 overflow-y-auto no-scrollbar pt-10">
                    <div className="bg-surface-container rounded-2xl p-5 border border-white/10 shadow-md">
                        <label className={LABEL_STYLE}>Denumire</label>
                        <div className="relative">
                            <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} className={`${INPUT_STYLE} pr-14 h-14 text-lg bg-surface`} placeholder="Ex: Bucovina..." />
                            <button type="button" onClick={handleIdentify} disabled={loadingExpert || !inputValue} className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full active:scale-95 transition-all group disabled:opacity-30 ${loadingExpert ? 'animate-pulse' : ''}`}>
                                <div className="relative w-8 h-8 flex items-center justify-center">
                                    <MagnifyingGlassIcon className="w-8 h-8 text-on-surface-variant group-hover:text-on-surface transition-colors" />
                                    {/* ADDED DROP SHADOW TO SPARKLES */}
                                    <SparklesIcon className="absolute top-[6px] left-[6px] w-3.5 h-3.5 text-yellow-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                                </div>
                            </button>
                        </div>
                    </div>
                    {/* Photo Upload Block */}
                    <div className={`${BOX_STYLE} h-auto min-h-[140px] flex flex-col justify-between`}>
                       <span className={LABEL_STYLE}>FOTO APĂ</span>
                       <div className="flex-1 w-full flex items-center justify-center gap-3 pt-1 overflow-x-auto no-scrollbar mb-2">
                         {images.length === 0 ? <CameraIcon className="w-8 h-8 text-on-surface-variant opacity-30 drop-shadow-sm" /> : (
                            images.map((img, idx) => (
                                <div key={idx} className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden shadow-md border border-white/10">
                                   <img src={thumbnails[idx] || img} className="w-full h-full object-cover" alt={`Water ${idx}`} />
                                   <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeImage(idx); }} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><TrashIcon className="w-4 h-4 text-white" /></button>
                                </div>
                            ))
                         )}
                       </div>
                       {images.length < 5 && (
                           <div className="flex gap-3 justify-center w-full">
                                {/* GALLERY - LEFT */}
                                <label className="flex items-center justify-center gap-2 px-4 py-4 bg-surface-container-high hover:bg-blue-500 hover:text-white text-on-surface rounded-xl border border-white/10 shadow-sm active:scale-95 transition-all cursor-pointer flex-1">
                                    <PhotoIcon className="w-8 h-8" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Galerie</span>
                                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                                </label>

                                {/* CAMERA - RIGHT */}
                                <label className="flex items-center justify-center gap-2 px-4 py-4 bg-surface-container-high hover:bg-crema-500 hover:text-coffee-900 text-on-surface rounded-xl border border-white/10 shadow-sm active:scale-95 transition-all cursor-pointer flex-1">
                                    <CameraIcon className="w-8 h-8" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Cameră</span>
                                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                                </label>
                           </div>
                       )}
                    </div>
                    <div><label className={LABEL_STYLE}>DESCRIERE</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${INPUT_STYLE} h-32 resize-none leading-relaxed text-left`} /></div>
                    <div className="flex gap-3 mt-4 pt-4 border-t border-white/5">
                        <button onClick={() => setView('list')} className="flex-1 py-4 bg-red-600 text-white rounded-full font-bold text-sm uppercase tracking-wider hover:bg-red-500 transition-all active:scale-[0.98] flex items-center justify-center gap-2"><XCircleIcon className="w-5 h-5" /> Anulează</button>
                        <button onClick={handleSave} className="flex-1 py-4 bg-green-600 text-white rounded-full font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-green-500 transition-all active:scale-[0.98]"><CheckCircleIcon className="w-5 h-5" /> Salvează</button>
                    </div>
                </div>
            )}

            {/* INFO MODAL */}
            {viewingItem && (
                 <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
                    <div className="bg-surface-container rounded-[2rem] w-full max-w-sm p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh] border border-white/10">
                        <div className="flex justify-between items-start border-b border-white/5 pb-4">
                            <div><h3 className="text-on-surface font-bold text-xl leading-tight">{viewingItem.label}</h3></div>
                            <button onClick={() => setViewingItem(null)} className="text-on-surface-variant hover:text-on-surface"><XMarkIcon className="w-6 h-6" /></button>
                        </div>
                        <div className="overflow-y-auto space-y-4 pr-1 no-scrollbar pb-4">
                             {viewingItem.images && viewingItem.images.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">{viewingItem.images.map((img, i) => <img key={i} src={(viewingItem.thumbnails && viewingItem.thumbnails[i]) ? viewingItem.thumbnails[i] : img} onClick={() => setFullScreenImage(img)} className="w-full h-48 rounded-2xl object-cover shadow-lg border border-white/5 cursor-pointer" alt="Detail" />)}</div>
                            )}
                            <div><div className={LABEL_STYLE}>Descriere</div><p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line text-left">{viewingItem.description || "Nicio descriere."}</p></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

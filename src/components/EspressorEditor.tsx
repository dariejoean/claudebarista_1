
import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, saveProduct, deleteProduct } from '../services/db';
import { identifyEquipment } from '../services/geminiService';
import { ProductItem } from '../types';
import { createThumbnail } from '../utils/imageUtils';
import { 
    PlusIcon, 
    TrashIcon, 
    PencilSquareIcon, 
    MagnifyingGlassIcon,
    XMarkIcon,
    CheckCircleIcon,
    CameraIcon,
    SparklesIcon,
    ArrowLeftIcon,
    InformationCircleIcon,
    XCircleIcon,
    PhotoIcon,
    ArrowDownCircleIcon
} from '@heroicons/react/24/solid';

// Styles
const DEPTH_SHADOW = "shadow-md";
const GLASS_BORDER = "border border-white/5";
const BOX_STYLE = `bg-surface-container rounded-2xl p-4 relative ${DEPTH_SHADOW} ${GLASS_BORDER}`;
const INPUT_STYLE = "w-full bg-surface-container-high rounded-xl border border-white/5 p-4 text-on-surface outline-none focus:border-crema-500 focus:bg-surface-container transition-all font-medium text-sm text-center shadow-inner placeholder:text-on-surface/30";
const LABEL_STYLE = "text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 block w-full text-center opacity-70 drop-shadow-sm";

// Specific Button Styles
const BTN_BACK_STYLE = "px-4 py-2.5 rounded-full bg-red-600 text-xs font-bold text-white uppercase tracking-wider hover:bg-red-500 transition-colors shadow-md active:shadow-inner flex items-center gap-2 border border-white/10";
const BTN_ADD_STYLE = "px-4 py-2.5 rounded-full bg-green-600 text-xs font-bold text-white uppercase tracking-wider hover:bg-green-500 transition-colors shadow-md active:shadow-inner flex items-center gap-2 border border-white/10";

interface EspressorEditorProps {
    onClose: () => void;
    initialView?: 'list' | 'form';
}

export const EspressorEditor: React.FC<EspressorEditorProps> = ({ onClose, initialView = 'list' }) => {
    const [view, setView] = useState<'list' | 'form'>(initialView);
    const [editingItem, setEditingItem] = useState<ProductItem | null>(null);
    const [viewingItem, setViewingItem] = useState<ProductItem | null>(null);
    const [displayLimit, setDisplayLimit] = useState(10);
    
    // IMAGE STATE
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
    const [imageToDeleteIndex, setImageToDeleteIndex] = useState<number | null>(null);
    
    // Fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [thumbnails, setThumbnails] = useState<string[]>([]);
    
    // Machine Specific - Changed numbers to strings for better input handling
    const [boilerType, setBoilerType] = useState<string>('');
    const [groupType, setGroupType] = useState<string>('');
    const [hasPid, setHasPid] = useState<boolean>(false);
    const [targetTemp, setTargetTemp] = useState<string>('');
    const [pumpPressure, setPumpPressure] = useState<string>('');
    const [pumpType, setPumpType] = useState<string>('');
    const [hasPreinfusion, setHasPreinfusion] = useState<boolean>(false);
    const [hasFlowControl, setHasFlowControl] = useState<boolean>(false);
    const [portafilterSize, setPortafilterSize] = useState<string>('');
    const [basketType, setBasketType] = useState<string>('');
    
    const [loadingExpert, setLoadingExpert] = useState(false);

    const items = useLiveQuery(() => db.machines.orderBy('name').toArray()) || [];

    useEffect(() => {
        if(initialView === 'form' && !editingItem) handleAddNew();
    }, [initialView]);

    const handleEdit = (item: ProductItem) => {
        setEditingItem(item); 
        setName(item.name);
        setDescription(item.description || '');
        setImages(item.images || []);
        setThumbnails(item.thumbnails || []);
        
        setBoilerType(item.boilerType || '');
        setGroupType(item.groupType || '');
        setHasPid(!!item.hasPid);
        // Convert numbers to strings for inputs
        setTargetTemp(item.targetTemp !== undefined ? String(item.targetTemp) : '');
        setPumpPressure(item.pumpPressure !== undefined ? String(item.pumpPressure) : '');
        setPumpType(item.pumpType || '');
        setHasPreinfusion(!!item.hasPreinfusion);
        setHasFlowControl(!!item.hasFlowControl);
        setPortafilterSize(item.portafilterSize !== undefined ? String(item.portafilterSize) : '');
        setBasketType(item.basketType || '');

        setView('form');
    };

    const handleAddNew = () => { 
        setEditingItem(null); 
        setName(''); 
        setDescription(''); 
        setImages([]); 
        setThumbnails([]);
        setBoilerType('');
        setGroupType('');
        setHasPid(false);
        setTargetTemp('');
        setPumpPressure('');
        setPumpType('');
        setHasPreinfusion(false);
        setHasFlowControl(false);
        setPortafilterSize('');
        setBasketType('');
        setView('form'); 
    };

    const handleSave = async () => { 
        if (!name.trim()) {
            alert("Numele espressorului este obligatoriu.");
            return; 
        }
        
        try {
            const product: ProductItem = { 
                id: editingItem?.id, 
                name: name.trim(), 
                description, 
                images,
                thumbnails,
                boilerType,
                groupType,
                hasPid,
                // Parse strings back to numbers safely
                targetTemp: targetTemp ? parseFloat(targetTemp) : undefined,
                pumpPressure: pumpPressure ? parseFloat(pumpPressure) : undefined,
                pumpType,
                hasPreinfusion,
                hasFlowControl,
                portafilterSize: portafilterSize ? parseFloat(portafilterSize) : undefined,
                basketType
            };

            await saveProduct('machine', product); 
            setView('list'); 
        } catch (error) {
            console.error("Save failed:", error);
            alert("Eroare la salvarea în baza de date. Verifică consola pentru detalii.");
        }
    };

    const handleDelete = async (id?: number) => { if (!id) return; if (confirm("Sigur ștergi acest espressor?")) await deleteProduct('machine', id); };

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
        if (fullScreenImage === images[index]) {
            setFullScreenImage(null);
            setImageToDeleteIndex(null);
        }
    };

    const handleIdentify = async () => {
        if (!name) return; 
        setLoadingExpert(true);
        try {
            const result = await identifyEquipment(name, 'machine', images);
            if (result.name && result.name !== name) setName(result.name);
            if (result.description) setDescription(result.description);
            if(result.boilerType) setBoilerType(result.boilerType);
            if(result.groupType) setGroupType(result.groupType);
            if(result.hasPid !== undefined) setHasPid(result.hasPid);
            
            // Cast incoming numbers to string for inputs
            if(result.targetTemp) setTargetTemp(String(result.targetTemp));
            if(result.pumpPressure) setPumpPressure(String(result.pumpPressure));
            
            if(result.pumpType) setPumpType(result.pumpType);
            if(result.hasPreinfusion !== undefined) setHasPreinfusion(result.hasPreinfusion);
            if(result.hasFlowControl !== undefined) setHasFlowControl(result.hasFlowControl);
            
            if(result.portafilterSize) setPortafilterSize(String(result.portafilterSize));
            
            if(result.basketType) setBasketType(result.basketType);
        } catch (e) { 
            console.error(e);
            alert("Eroare identificare Expert."); 
        } finally { 
            setLoadingExpert(false); 
        }
    };

    return (
        <div className="animate-fade-in flex flex-col h-full relative space-y-4">
            
            {fullScreenImage && (
                <div className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => { setFullScreenImage(null); setImageToDeleteIndex(null); }}>
                    <img src={fullScreenImage} className="max-w-full max-h-full rounded-lg shadow-2xl object-contain border border-white/10" alt="Fullscreen" onClick={(e) => e.stopPropagation()}/>
                    
                    <button onClick={() => { setFullScreenImage(null); setImageToDeleteIndex(null); }} className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all border border-white/10">
                        <XMarkIcon className="w-6 h-6" />
                    </button>

                    {imageToDeleteIndex !== null && (
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 w-full px-6" onClick={(e) => e.stopPropagation()}>
                            <button 
                                onClick={() => { 
                                    if(confirm("Ștergi această fotografie?")) {
                                        removeImage(imageToDeleteIndex);
                                    }
                                }} 
                                className="px-6 py-3 bg-red-600/90 text-white rounded-full font-bold text-sm uppercase tracking-widest hover:bg-red-500 shadow-lg backdrop-blur-md flex items-center gap-2 border border-red-400/50"
                            >
                                <TrashIcon className="w-5 h-5" /> Șterge Fotografia
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="flex flex-col gap-3 pb-2">
                <h2 className="text-on-surface font-bold uppercase tracking-widest text-sm drop-shadow-sm text-center w-full">ESPRESSOR</h2>
                <div className="flex justify-between items-center w-full">
                    <button onClick={onClose} className={BTN_BACK_STYLE}><ArrowLeftIcon className="w-4 h-4" /> Inapoi</button>
                    {view === 'list' && (
                        <button onClick={handleAddNew} className={BTN_ADD_STYLE}><PlusIcon className="w-5 h-5" /> Adauga</button>
                    )}
                </div>
            </div>

            {view === 'list' ? (
                <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pb-20 px-1">
                    {items.length === 0 ? <div className="text-center text-on-surface-variant text-sm py-10 opacity-60">Nu ai adăugat niciun espressor.</div> : (
                        <>
                            {items.slice(0, displayLimit).map((item, index) => (
                                <div key={item.id} className="flex flex-col p-4 rounded-2xl border border-white/5 bg-surface-container shadow-sm active:scale-[0.99] transition-all">
                                    {/* TOP ROW: INDEX */}
                                    <div className="w-full text-center border-b border-white/5 pb-2 mb-3">
                                        <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.15em] opacity-60">
                                            ESPRESSOR #{index + 1}
                                        </span>
                                    </div>

                                    {/* MIDDLE: NAME & DETAILS */}
                                    <div className="flex flex-col items-center text-center gap-1 mb-4">
                                        <h3 className="text-sm font-black text-on-surface uppercase tracking-wide leading-tight">
                                            {item.name}
                                        </h3>
                                        <div className="flex gap-2 justify-center mt-1">
                                            {item.groupType && <span className="text-[9px] bg-surface-container-high px-2 py-0.5 rounded text-on-surface-variant font-bold uppercase border border-white/5">{item.groupType}</span>}
                                            {item.boilerType && <span className="text-[9px] bg-surface-container-high px-2 py-0.5 rounded text-on-surface-variant font-bold uppercase border border-white/5">{item.boilerType}</span>}
                                        </div>
                                    </div>

                                    {/* BOTTOM: ACTIONS */}
                                    <div className="flex items-center justify-center gap-6 border-t border-white/5 pt-3">
                                        <button onClick={() => setViewingItem(item)} className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all border border-white/10 hover:bg-blue-500">
                                            <InformationCircleIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleEdit(item)} className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all border border-white/10 hover:bg-orange-400">
                                            <PencilSquareIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all border border-white/10 hover:bg-red-500">
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
                <div className="flex flex-col gap-4 animate-fade-in pb-20 overflow-y-auto no-scrollbar pt-5">
                    {/* ... Form Inputs ... */}
                    <div className="bg-surface-container rounded-2xl p-5 border border-white/10 shadow-md">
                        <label className={LABEL_STYLE}>Nume Espressor</label>
                        <div className="relative">
                            <input value={name} onChange={(e) => setName(e.target.value)} className={`${INPUT_STYLE} pr-14 h-14 text-lg bg-surface`} placeholder="Ex: Gaggia Classic..." />
                            <button type="button" onClick={handleIdentify} disabled={loadingExpert || !name} className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full active:scale-95 transition-all group disabled:opacity-30 ${loadingExpert ? 'animate-pulse' : ''}`}>
                                <div className="relative w-8 h-8 flex items-center justify-center">
                                    <MagnifyingGlassIcon className="w-8 h-8 text-on-surface-variant group-hover:text-on-surface transition-colors" />
                                    {/* ADDED DROP SHADOW TO SPARKLES */}
                                    <SparklesIcon className="absolute top-[6px] left-[6px] w-3.5 h-3.5 text-yellow-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    {/* PHOTO SECTION */}
                    <div className={`${BOX_STYLE} h-auto min-h-[140px] flex flex-col justify-between`}>
                       <span className={LABEL_STYLE}>FOTO ESPRESSOR</span>
                       <div className="flex-1 w-full flex items-center justify-center gap-3 pt-1 overflow-x-auto no-scrollbar mb-2">
                         {images.length === 0 ? <CameraIcon className="w-8 h-8 text-on-surface-variant opacity-30 drop-shadow-sm" /> : (
                            images.map((img, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={(e) => { 
                                        e.preventDefault(); 
                                        setFullScreenImage(images[idx]); 
                                        setImageToDeleteIndex(idx); 
                                    }} 
                                    className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden shadow-md border border-white/10 cursor-pointer hover:opacity-80 transition-opacity"
                                >
                                   <img src={thumbnails[idx] || img} className="w-full h-full object-cover" alt={`Prod ${idx}`} />
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
                    {/* ... Rest of inputs ... */}
                    <div className="bg-surface-container rounded-2xl p-4 shadow-sm border border-white/5">
                        <label className={LABEL_STYLE}>Tip Boiler & Grup</label>
                        <div className="grid grid-cols-2 gap-4">
                            <select value={boilerType} onChange={(e) => setBoilerType(e.target.value)} className={INPUT_STYLE}><option value="">Boiler...</option><option value="Single Boiler">Single Boiler</option><option value="Dual Boiler">Dual Boiler</option><option value="Heat Exchanger">HX</option><option value="Thermoblock">Thermoblock</option></select>
                            <select value={groupType} onChange={(e) => setGroupType(e.target.value)} className={INPUT_STYLE}><option value="">Grup...</option><option value="E61">E61</option><option value="Saturation">Saturation</option><option value="Ring">Ring Group</option><option value="58mm Standard">58mm Std</option><option value="57mm Standard">57mm Std</option></select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className={LABEL_STYLE}>Tip Pompă</label><select value={pumpType} onChange={(e) => setPumpType(e.target.value)} className={INPUT_STYLE}><option value="">- Select -</option><option value="Vibration">Vibrație</option><option value="Rotary">Rotativă</option><option value="Manual Lever">Manuală</option></select></div>
                        <div><label className={LABEL_STYLE}>Presiune (Bar)</label><input type="number" value={pumpPressure} onChange={(e) => setPumpPressure(e.target.value)} className={INPUT_STYLE} placeholder="Ex: 9" /></div>
                    </div>
                    <div className="bg-surface-container rounded-2xl p-4 shadow-sm border border-white/5">
                        <label className={LABEL_STYLE}>Control</label>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {['PID', 'Pre-infuzie', 'Flow Control'].map((feat, i) => {
                                const val = i === 0 ? hasPid : i === 1 ? hasPreinfusion : hasFlowControl;
                                const setVal = i === 0 ? setHasPid : i === 1 ? setHasPreinfusion : setHasFlowControl;
                                return (<button key={feat} onClick={() => setVal(!val)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all border ${val ? 'bg-blue-600 border-blue-500 text-white' : 'bg-surface-container-high border-transparent text-on-surface-variant opacity-40'}`}>{feat}</button>);
                            })}
                        </div>
                        {hasPid && <div className="mt-3"><label className="text-[10px] text-on-surface-variant block text-center mb-1">Temp PID</label><input type="number" value={targetTemp} onChange={(e) => setTargetTemp(e.target.value)} className={`${INPUT_STYLE} text-center`} /></div>}
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div><label className={LABEL_STYLE}>Diametru (mm)</label><input type="number" value={portafilterSize} onChange={(e) => setPortafilterSize(e.target.value)} className={INPUT_STYLE} placeholder="Ex: 58" /></div>
                        <div><label className={LABEL_STYLE}>Tip Sită</label><input value={basketType} onChange={(e) => setBasketType(e.target.value)} className={INPUT_STYLE} /></div>
                    </div>
                    <div><label className={LABEL_STYLE}>DESCRIERE</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${INPUT_STYLE} h-32 resize-none leading-relaxed text-left`} placeholder="Descriere..." /></div>
                    <div className="flex gap-3 mt-4 pt-4 border-t border-white/5">
                        <button onClick={() => setView('list')} className="flex-1 py-4 bg-red-600 text-white rounded-full font-bold text-sm uppercase tracking-wider hover:bg-red-500 transition-all active:scale-[0.98] flex items-center justify-center gap-2"><XCircleIcon className="w-5 h-5" /> Anulează</button>
                        <button onClick={handleSave} className="flex-1 py-4 bg-green-600 text-white rounded-full font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-green-500 transition-all active:scale-[0.98]"><CheckCircleIcon className="w-5 h-5" /> Salvează</button>
                    </div>
                </div>
            )}

            {viewingItem && (
                 <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
                    <div className="bg-surface-container rounded-[2rem] w-full max-w-sm p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh] border border-white/10">
                        <div className="flex justify-between items-start border-b border-white/5 pb-4">
                            <div><h3 className="text-on-surface font-bold text-xl leading-tight">{viewingItem.name}</h3><p className="text-sm text-crema-400 font-bold uppercase tracking-wider mt-1">{viewingItem.boilerType}</p></div>
                            <button onClick={() => setViewingItem(null)} className="text-on-surface-variant hover:text-on-surface"><XMarkIcon className="w-6 h-6" /></button>
                        </div>
                        <div className="overflow-y-auto space-y-4 pr-1 no-scrollbar pb-4">
                             {viewingItem.images && viewingItem.images.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                    {viewingItem.images.map((img, i) => (
                                        <img 
                                            key={i} 
                                            src={(viewingItem.thumbnails && viewingItem.thumbnails[i]) ? viewingItem.thumbnails[i] : img} 
                                            onClick={() => { setFullScreenImage(img); setImageToDeleteIndex(null); }} 
                                            className="w-full h-48 rounded-2xl object-cover shadow-lg border border-white/5 cursor-pointer" 
                                            alt="Detail" 
                                        />
                                    ))}
                                </div>
                            )}
                             <div className="grid grid-cols-2 gap-3">
                                <div className="bg-surface-container-high p-3 rounded-xl shadow-inner border border-white/5"><div className={LABEL_STYLE}>Boiler</div><div className="text-sm font-bold text-on-surface text-center">{viewingItem.boilerType || '-'}</div></div>
                                <div className="bg-surface-container-high p-3 rounded-xl shadow-inner border border-white/5"><div className={LABEL_STYLE}>Grup</div><div className="text-sm font-bold text-on-surface text-center">{viewingItem.groupType || '-'}</div></div>
                                <div className="col-span-2 flex flex-wrap gap-2 justify-center mt-2">
                                    {viewingItem.hasPid && <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold uppercase shadow-md">PID</span>}
                                    {viewingItem.hasPreinfusion && <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold uppercase shadow-md">Pre-infuzie</span>}
                                    {viewingItem.hasFlowControl && <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold uppercase shadow-md">Flow Control</span>}
                                </div>
                            </div>
                            <div><div className={LABEL_STYLE}>Descriere</div><p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line text-left">{viewingItem.description || "Nicio descriere."}</p></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

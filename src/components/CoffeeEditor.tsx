
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

const BTN_BACK_STYLE = "px-4 py-2.5 rounded-full bg-red-600 text-xs font-bold text-white uppercase tracking-wider hover:bg-red-500 transition-colors shadow-md active:shadow-inner flex items-center gap-2 border border-white/10";
const BTN_ADD_STYLE = "px-4 py-2.5 rounded-full bg-green-600 text-xs font-bold text-white uppercase tracking-wider hover:bg-green-500 transition-colors shadow-md active:shadow-inner flex items-center gap-2 border border-white/10";

interface CoffeeEditorProps {
    onClose: () => void;
    initialView?: 'list' | 'form';
}

export const CoffeeEditor: React.FC<CoffeeEditorProps> = ({ onClose, initialView = 'list' }) => {
    const [view, setView] = useState<'list' | 'form'>(initialView);
    const [editingItem, setEditingItem] = useState<ProductItem | null>(null);
    const [viewingItem, setViewingItem] = useState<ProductItem | null>(null);
    const [displayLimit, setDisplayLimit] = useState(10);
    
    // IMAGE STATE
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
    const [imageToDeleteIndex, setImageToDeleteIndex] = useState<number | null>(null);
    
    // Core Fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [thumbnails, setThumbnails] = useState<string[]>([]);
    
    // Coffee Specific
    const [roaster, setRoaster] = useState('');
    const [origin, setOrigin] = useState('');
    const [process, setProcess] = useState('');
    const [roastLevel, setRoastLevel] = useState('');
    const [roastDate, setRoastDate] = useState('');
    const [altitude, setAltitude] = useState<number | ''>('');
    const [tastingNotes, setTastingNotes] = useState('');
    const [arabicaPercent, setArabicaPercent] = useState<number>(100);
    const [robustaPercent, setRobustaPercent] = useState<number>(0);
    
    const [loadingExpert, setLoadingExpert] = useState(false);

    const items = useLiveQuery(() => db.beans.orderBy('name').toArray()) || [];

    useEffect(() => {
        if(initialView === 'form' && !editingItem) handleAddNew();
    }, [initialView]);

    const handleEdit = (item: ProductItem) => {
        setEditingItem(item); 
        setName(item.name);
        setDescription(item.description || '');
        setImages(item.images || []);
        setThumbnails(item.thumbnails || []);
        
        setRoaster(item.roaster || '');
        setOrigin(item.origin || '');
        setProcess(item.process || '');
        setRoastLevel(item.roastLevel || '');
        setRoastDate(item.roastDate || '');
        setAltitude(item.altitude || '');
        setTastingNotes(item.tastingNotes ? item.tastingNotes.join(', ') : '');
        setArabicaPercent(item.compositionArabica !== undefined ? item.compositionArabica : 100);
        setRobustaPercent(item.compositionRobusta !== undefined ? item.compositionRobusta : 0);

        setView('form');
    };

    const handleAddNew = () => { 
        setEditingItem(null); 
        setName(''); 
        setDescription(''); 
        setImages([]); 
        setThumbnails([]);
        setRoaster('');
        setOrigin('');
        setProcess('');
        setRoastLevel('');
        setRoastDate('');
        setAltitude('');
        setTastingNotes('');
        setArabicaPercent(100);
        setRobustaPercent(0);
        setView('form'); 
    };

    const handleSave = async () => { 
        if (!name.trim()) return; 
        
        const product: ProductItem = { 
            id: editingItem?.id, 
            name, 
            description, 
            images,
            thumbnails,
            roaster,
            origin,
            process,
            roastLevel,
            roastDate,
            altitude: altitude === '' ? undefined : Number(altitude),
            tastingNotes: tastingNotes.split(',').map(n => n.trim()).filter(n => n),
            compositionArabica: arabicaPercent,
            compositionRobusta: robustaPercent
        };

        await saveProduct('bean', product); 
        setView('list'); 
    };

    const handleDelete = async (id?: number) => { if (!id) return; if (confirm("Sigur ștergi această cafea?")) await deleteProduct('bean', id); };

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
            const result = await identifyEquipment(name, 'coffee', images);
            if (result.name && result.name !== name) setName(result.name);
            if (result.description) setDescription(result.description);
            if(result.roaster) setRoaster(result.roaster);
            if(result.origin) setOrigin(result.origin);
            if(result.process) setProcess(result.process);
            if(result.roastLevel) setRoastLevel(result.roastLevel);
            if(result.roastDate) setRoastDate(result.roastDate);
            if(result.altitude) setAltitude(result.altitude);
            if(result.tastingNotes && Array.isArray(result.tastingNotes)) setTastingNotes(result.tastingNotes.join(', '));
            if (result.compositionArabica !== undefined) {
                setArabicaPercent(result.compositionArabica);
                setRobustaPercent(100 - result.compositionArabica);
            }
        } catch (e) { 
            console.error(e);
            alert("Eroare identificare Expert."); 
        } finally { 
            setLoadingExpert(false); 
        }
    };

    return (
        <div className="animate-fade-in flex flex-col h-full relative space-y-4">
            
            {/* FULL SCREEN IMAGE VIEWER */}
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
                <h2 className="text-on-surface font-bold uppercase tracking-widest text-sm drop-shadow-sm text-center w-full">CAFEA</h2>
                <div className="flex justify-between items-center w-full">
                    <button onClick={onClose} className={BTN_BACK_STYLE}><ArrowLeftIcon className="w-4 h-4" /> Inapoi</button>
                    {view === 'list' && (
                        <button onClick={handleAddNew} className={BTN_ADD_STYLE}><PlusIcon className="w-5 h-5" /> Adauga</button>
                    )}
                </div>
            </div>

            {view === 'list' ? (
                <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pb-20 px-1">
                    {items.length === 0 ? <div className="text-center text-on-surface-variant text-sm py-10 opacity-60">Nu ai adăugat nicio cafea.</div> : (
                        <>
                            {items.slice(0, displayLimit).map((item, index) => (
                                <div key={item.id} className="flex flex-col p-4 rounded-2xl border border-white/5 bg-surface-container shadow-sm active:scale-[0.99] transition-all">
                                    {/* TOP ROW: INDEX */}
                                    <div className="w-full text-center border-b border-white/5 pb-2 mb-3">
                                        <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.15em] opacity-60">
                                            CAFEA #{index + 1}
                                        </span>
                                    </div>

                                    {/* MIDDLE: NAME & DETAILS */}
                                    <div className="flex flex-col items-center text-center gap-1 mb-4">
                                        <h3 className="text-sm font-black text-on-surface uppercase tracking-wide leading-tight">
                                            {item.name}
                                        </h3>
                                        <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider opacity-70 truncate w-full">
                                            {item.roaster || 'Prăjitorie N/A'}
                                        </p>
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
                // FORM VIEW (Unchanged content, kept for context)
                <div className="flex flex-col gap-4 animate-fade-in pb-20 overflow-y-auto no-scrollbar pt-5">
                    {/* ... Form Inputs ... */}
                    <div className="bg-surface-container rounded-2xl p-5 border border-white/10 shadow-md">
                        <label className={LABEL_STYLE}>Nume Cafea</label>
                        <div className="relative">
                            <input value={name} onChange={(e) => setName(e.target.value)} className={`${INPUT_STYLE} pr-14 h-14 text-lg bg-surface`} placeholder="Ex: Ethiopia Yirgacheffe..." />
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
                       <span className={LABEL_STYLE}>FOTO CAFEA</span>
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

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className={LABEL_STYLE}>Prăjitorie</label><input value={roaster} onChange={(e) => setRoaster(e.target.value)} className={INPUT_STYLE} /></div>
                            <div><label className={LABEL_STYLE}>Origine</label><input value={origin} onChange={(e) => setOrigin(e.target.value)} className={INPUT_STYLE} /></div>
                        </div>
                        <div className="bg-surface-container rounded-2xl p-4 shadow-sm border border-white/5">
                            <label className={LABEL_STYLE}>Compoziție</label>
                            <div className="grid grid-cols-2 gap-4 items-center">
                                <div className="relative">
                                    <label className="text-[10px] font-bold text-crema-400 absolute top-2 left-0 w-full text-center z-10 drop-shadow-sm">ARABICA %</label>
                                    <input type="number" value={arabicaPercent} onChange={(e) => { const v = parseInt(e.target.value)||0; setArabicaPercent(v); setRobustaPercent(100-v); }} className={`${INPUT_STYLE} pt-6 pb-2 text-center text-lg font-bold`} />
                                </div>
                                <div className="relative">
                                    <label className="text-[10px] font-bold text-coffee-800 dark:text-coffee-100 absolute top-2 left-0 w-full text-center z-10 drop-shadow-sm">ROBUSTA %</label>
                                    <input type="number" value={robustaPercent} onChange={(e) => { const v = parseInt(e.target.value)||0; setRobustaPercent(v); setArabicaPercent(100-v); }} className={`${INPUT_STYLE} pt-6 pb-2 text-center text-lg font-bold bg-surface-container-high/50`} />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className={LABEL_STYLE}>Grad Prăjire</label><select value={roastLevel} onChange={(e) => setRoastLevel(e.target.value)} className={`${INPUT_STYLE} appearance-none`}><option value="">- Select -</option><option value="Light">Light</option><option value="Medium-Light">Medium-Light</option><option value="Medium">Medium</option><option value="Medium-Dark">Medium-Dark</option><option value="Dark">Dark</option></select></div>
                            <div><label className={LABEL_STYLE}>Data Prăjirii</label><input value={roastDate} onChange={(e) => setRoastDate(e.target.value)} className={`${INPUT_STYLE} text-center`} /></div>
                        </div>
                        <div><label className={LABEL_STYLE}>Note Degustare</label><input value={tastingNotes} onChange={(e) => setTastingNotes(e.target.value)} className={INPUT_STYLE} /></div>
                    </div>
                    <div><label className={LABEL_STYLE}>DESCRIERE</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${INPUT_STYLE} h-32 resize-none leading-relaxed text-left`} /></div>
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
                            <div><h3 className="text-on-surface font-bold text-xl leading-tight">{viewingItem.name}</h3><p className="text-sm text-crema-400 font-bold uppercase tracking-wider mt-1">{viewingItem.roaster}</p></div>
                            <button onClick={() => setViewingItem(null)} className="text-on-surface-variant hover:text-on-surface"><XMarkIcon className="w-6 h-6" /></button>
                        </div>
                        <div className="overflow-y-auto space-y-4 pr-1 no-scrollbar pb-4">
                             {viewingItem.images && viewingItem.images.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">{viewingItem.images.map((img, i) => <img key={i} src={(viewingItem.thumbnails && viewingItem.thumbnails[i]) ? viewingItem.thumbnails[i] : img} onClick={() => setFullScreenImage(img)} className="w-full h-48 rounded-2xl object-cover shadow-lg border border-white/5 cursor-pointer" alt="Detail" />)}</div>
                            )}
                             <div className="grid grid-cols-2 gap-3">
                                <div className="bg-surface-container-high p-3 rounded-xl shadow-inner border border-white/5"><div className={LABEL_STYLE}>Origine</div><div className="text-sm font-bold text-on-surface">{viewingItem.origin || '-'}</div></div>
                                <div className="bg-surface-container-high p-3 rounded-xl shadow-inner border border-white/5"><div className={LABEL_STYLE}>Procesare</div><div className="text-sm font-bold text-on-surface">{viewingItem.process || '-'}</div></div>
                            </div>
                            {(viewingItem.compositionArabica !== undefined) && (
                                <div className="bg-surface-container-high p-4 rounded-xl shadow-inner border border-white/5">
                                    <div className="flex justify-between items-center mb-2"><span className={LABEL_STYLE} style={{marginBottom: 0}}>COMPOZIȚIE</span></div>
                                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden flex mb-2 shadow-inner">
                                            <div className="h-full bg-crema-500 shadow-[1px_0_2px_rgba(0,0,0,0.3)]" style={{ width: `${viewingItem.compositionArabica || 100}%` }}></div>
                                            <div className="h-full bg-coffee-800" style={{ width: `${viewingItem.compositionRobusta || 0}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold text-on-surface"><span>{viewingItem.compositionArabica || 100}% Arabica</span><span className="opacity-60">{viewingItem.compositionRobusta || 0}% Robusta</span></div>
                                </div>
                            )}
                            <div><div className={LABEL_STYLE}>Note</div><div className="flex flex-wrap gap-2">{viewingItem.tastingNotes?.map((n,i)=><span key={i} className="px-3 py-1 bg-crema-500/10 text-crema-400 rounded-full text-xs font-bold uppercase shadow-sm border border-white/5">{n}</span>)}</div></div>
                            <div><div className={LABEL_STYLE}>Descriere</div><p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line text-left">{viewingItem.description || "Nicio descriere."}</p></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

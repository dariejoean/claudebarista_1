
import React, { useState, useEffect, useMemo } from 'react';
import { ListItem, ShotData } from '../types';
import { updateShot } from '../services/db';
import { SelectionModal } from './SelectionModal';
import { LiveExtractionChart } from './new-shot/LiveExtractionChart';
import { getReconstructedTimes } from '../utils/shotUtils';
import { 
    XMarkIcon, 
    DocumentTextIcon,
    PencilSquareIcon,
    CheckCircleIcon,
    SparklesIcon,
    TagIcon,
    StarIcon,
    PencilIcon,
    ShareIcon
} from '@heroicons/react/24/solid';
import { 
    DEPTH_SHADOW, 
    GLASS_BORDER, 
    getDynamicLabelStyle
} from '../styles/common';

interface ShotDetailModalProps {
    shot: ShotData;
    onClose: () => void;
    onViewImage: (img: string) => void;
    onShotUpdated?: (updatedShot: ShotData) => void;
    
    // Inventory props for editing
    uniqueMachines: string[];
    uniqueBeans: string[];
    waterList: ListItem[];
}

export const ShotDetailModal: React.FC<ShotDetailModalProps> = ({ shot, onClose, onViewImage, onShotUpdated, uniqueBeans, uniqueMachines, waterList }) => {
    const [notes, setNotes] = useState(shot.postExtractionNotes || '');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');
    const [localNotesSaved, setLocalNotesSaved] = useState(!!shot.postExtractionNotes);
    
    // Editing State
    const [editingField, setEditingField] = useState<'bean' | 'machine' | 'water' | null>(null);

    // Sync local state when shot prop changes (e.g. if parent updates it)
    const [localShot, setLocalShot] = useState<ShotData>(shot);
    
    useEffect(() => {
        setLocalShot(shot);
        setNotes(shot.postExtractionNotes || '');
        setLocalNotesSaved(!!shot.postExtractionNotes);
    }, [shot]);

    const activeTags = useMemo(() => {
        if (!localShot.tags) return [];
        return Object.values(localShot.tags).flat().filter((t): t is string => typeof t === 'string' && t.length > 0);
    }, [localShot.tags]);

    // Explicit format Y/10
    const expertScoreDisplay = useMemo(() => {
        if (localShot.structuredAnalysis?.score) {
            const scoreNum = localShot.structuredAnalysis.score.split('/')[0].trim();
            return `${scoreNum}/10`;
        } else if (localShot.expertAdvice && localShot.expertAdvice.includes('/10')) {
            const match = localShot.expertAdvice.match(/(\d+(\.\d)?)\/10/);
            if (match) return `${match[1]}/10`;
        }
        return "N/A";
    }, [localShot]);

    // Grind Display Formatting
    const grindDisplay = useMemo(() => {
        if (localShot.grindSetting !== undefined && localShot.grindSetting !== null) {
            if (localShot.grindScaleType === 'eureka') {
                const rotations = Math.floor(localShot.grindSetting / 20);
                const dial = localShot.grindSetting % 20;
                return `${rotations}R+${dial.toFixed(2)}`;
            } else {
                return localShot.grindSetting.toFixed(2);
            }
        }
        return "-";
    }, [localShot.grindSetting, localShot.grindScaleType]);

    const handleSaveNotes = async () => {
        setIsSaving(true);
        try {
            await updateShot(localShot.id, { postExtractionNotes: notes });
            setSaveStatus('success');
            setLocalNotesSaved(true); 
            // Update local snapshot
            const updated = { ...localShot, postExtractionNotes: notes };
            setLocalShot(updated);
            if(onShotUpdated) onShotUpdated(updated);
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (e) {
            console.error("Failed to save notes", e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateMetadata = async (value: string) => {
        if (!editingField) return;
        
        let updatePayload: Partial<ShotData> = {};
        if (editingField === 'bean') updatePayload = { beanName: value };
        if (editingField === 'machine') updatePayload = { machineName: value };
        if (editingField === 'water') updatePayload = { waterName: value };

        try {
            await updateShot(localShot.id, updatePayload);
            const updated = { ...localShot, ...updatePayload };
            setLocalShot(updated);
            if(onShotUpdated) onShotUpdated(updated);
        } catch (e) {
            console.error("Failed to update shot metadata", e);
            alert("Eroare la actualizarea datelor.");
        } finally {
            setEditingField(null);
        }
    };

    const handleShare = async () => {
        const d = new Date(localShot.date);
        const dateStr = d.toLocaleDateString('ro-RO');
        const timeStr = d.toLocaleTimeString('ro-RO', {hour: '2-digit', minute:'2-digit'});
        
        const ratio = localShot.doseIn > 0 ? (localShot.yieldOut / localShot.doseIn).toFixed(1) : "0.0";
        const diagnosis = localShot.structuredAnalysis?.diagnosis || "Nespecificat";

        const shareText = `☕ *Raport Extracție PharmaBarista* ☕
📅 ${dateStr} | ⏰ ${timeStr}

🌱 *${localShot.beanName}*
⚙️ ${localShot.machineName}

📊 *TELEMETRIE:*
• In: ${localShot.doseIn}g
• Out: ${localShot.yieldOut}g
• Timp: ${localShot.time}s
• Rație: 1:${ratio}
• Temp: ${localShot.temperature}°C
• Presiune: ${localShot.pressure} bar

🛠️ *TEHNIC:*
• Râșniță: ${localShot.grinderName || '-'}
• Măcinare: ${grindDisplay}
${localShot.flowControlSetting ? `• Flow Control: ${localShot.flowControlSetting} rot` : ''}
• Sită: ${localShot.basketName || '-'}

⭐ Notă: ${localShot.ratingOverall}/5
🧠 Scor Expert: ${expertScoreDisplay}

🤖 *Diagnostic:*
${diagnosis}

📝 *Note:*
${localShot.notes || '-'}
`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Raport Extracție PharmaBarista',
                    text: shareText,
                });
            } catch (err) {
                console.log('Share canceled or failed', err);
            }
        } else {
            // Fallback clipboard
            try {
                await navigator.clipboard.writeText(shareText);
                alert('Detaliile extracției au fost copiate în clipboard!');
            } catch (err) {
                console.error('Clipboard failed', err);
                alert('Nu s-a putut partaja.');
            }
        }
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('ro-RO') + ' ' + d.toLocaleTimeString('ro-RO', {hour: '2-digit', minute:'2-digit'});
    };

    const flowRate = localShot.time > 0 ? (localShot.yieldOut / localShot.time).toFixed(1) : "0.0";
    const times = getReconstructedTimes(localShot);
    
    // --- Detail Row Helper Component ---
    const DetailRow = ({ label, value, onClick, editable = false }: { label: string, value: string, onClick?: () => void, editable?: boolean }) => (
        <div 
            onClick={onClick} 
            className={`flex flex-col w-full border-b border-white/5 last:border-0 py-2.5 ${editable ? 'cursor-pointer group hover:bg-white/5 -mx-3 px-3 transition-colors rounded-lg' : ''}`}
        >
            <div className="flex justify-between items-center mb-0.5">
                <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60 text-left">{label}</span>
                {editable && <PencilIcon className="w-3 h-3 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />}
            </div>
            <span className="text-sm font-bold text-on-surface text-left truncate leading-tight">{value || '-'}</span>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            
            {/* SELECTION MODAL */}
            {editingField && (
                <div onClick={(e) => e.stopPropagation()} className="absolute inset-0 z-[110]">
                    <SelectionModal 
                        title={editingField === 'bean' ? "Schimbă Cafeaua" : editingField === 'machine' ? "Schimbă Espressorul" : "Schimbă Apa"}
                        items={editingField === 'bean' ? uniqueBeans : editingField === 'machine' ? uniqueMachines : waterList.map(w => w.label)}
                        selectedItem={editingField === 'bean' ? localShot.beanName : editingField === 'machine' ? localShot.machineName : (localShot.waterName || '')}
                        onSelect={handleUpdateMetadata}
                        onClose={() => setEditingField(null)}
                    />
                </div>
            )}

            <div className={`bg-surface w-full max-w-lg rounded-[2rem] shadow-2xl border border-white/10 flex flex-col max-h-[90vh] overflow-hidden`} onClick={e => e.stopPropagation()}>
                
                <div className="p-5 border-b border-white/5 flex justify-between items-start bg-surface-container/50">
                    <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 rounded-md bg-surface-container-high text-[10px] font-bold text-on-surface-variant border border-white/5">
                                {formatDate(localShot.date)}
                            </span>
                        </div>
                        
                        <h2 
                            onClick={() => setEditingField('bean')}
                            className="text-xl font-black text-on-surface uppercase tracking-wide leading-tight line-clamp-2 mb-1 cursor-pointer hover:text-blue-400 transition-colors flex items-center gap-2 group"
                        >
                            {localShot.beanName}
                            <PencilIcon className="w-4 h-4 text-on-surface-variant opacity-70 group-hover:opacity-100 group-hover:text-blue-400" />
                        </h2>
                        <p 
                            onClick={() => setEditingField('machine')}
                            className="text-xs font-bold text-on-surface-variant uppercase tracking-wider opacity-70 mb-3 cursor-pointer hover:text-white transition-colors flex items-center gap-2 group w-fit"
                        >
                            {localShot.machineName}
                            <PencilIcon className="w-3 h-3 text-on-surface-variant opacity-70 group-hover:opacity-100" />
                        </p>

                        <div className="flex gap-2">
                            {/* General Rating: Explicit X/5 */}
                            {localShot.ratingOverall && (
                                <div className="flex items-center gap-1.5 bg-amber-500 border border-amber-600 px-3 py-1.5 rounded-xl shadow-sm">
                                    <span className="text-[9px] font-bold text-white/90 uppercase tracking-widest mr-0.5">NOTA</span>
                                    <span className="text-xs font-black text-white drop-shadow-sm">{localShot.ratingOverall}/5</span>
                                    <StarIcon className="w-3.5 h-3.5 text-white drop-shadow-sm" />
                                </div>
                            )}
                            
                            {/* Expert Score: Explicit Y/10 */}
                            <div className="flex items-center gap-1.5 bg-violet-600 border border-violet-700 px-3 py-1.5 rounded-xl shadow-sm">
                                <span className="text-[9px] font-bold text-white/90 uppercase tracking-widest mr-0.5">EXPERT</span>
                                <span className="text-xs font-black text-white drop-shadow-sm">{expertScoreDisplay}</span>
                                <SparklesIcon className="w-3.5 h-3.5 text-white drop-shadow-sm" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* SHARE BUTTON */}
                        <button 
                            onClick={handleShare} 
                            className="p-2 rounded-full bg-surface-container-high text-on-surface-variant hover:text-white hover:bg-blue-600 transition-colors shadow-sm border border-white/5"
                            title="Partajează Extracția"
                        >
                            <ShareIcon className="w-5 h-5" />
                        </button>
                        
                        {/* CLOSE BUTTON */}
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-on-surface-variant hover:text-white transition-colors">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
                    
                    {localShot.images && localShot.images.length > 0 && (
                        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                            {localShot.images.map((img, i) => (
                                <img 
                                    key={i} 
                                    src={localShot.thumbnails?.[i] || img} 
                                    onClick={() => onViewImage(img)}
                                    className="h-24 w-24 object-cover rounded-xl border border-white/10 shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                                    alt="Shot" 
                                />
                            ))}
                        </div>
                    )}

                    {/* LIVE EXTRACTION CHART */}
                    {localShot.extractionProfile && localShot.extractionProfile.length > 0 && (
                        <div className="mt-2">
                            <LiveExtractionChart data={localShot.extractionProfile} />
                        </div>
                    )}

                    {/* All Extraction Data in Order from New Tab */}
                    <div className="flex flex-col bg-surface-container-high/30 rounded-xl p-4 border border-white/5 space-y-1">
                        <DetailRow label="Espressor" value={localShot.machineName || 'Nespecificat'} onClick={() => setEditingField('machine')} editable={true} />
                        <DetailRow label="Apă" value={localShot.waterName || 'Nespecificat'} onClick={() => setEditingField('water')} editable={true} />
                        <DetailRow label="Cafea" value={localShot.beanName || 'Nespecificat'} onClick={() => setEditingField('bean')} editable={true} />
                        <DetailRow label="Râșniță" value={localShot.grinderName || 'Nespecificat'} />
                        <DetailRow label="Sită (Basket)" value={localShot.basketName || 'Nespecificat'} />
                        <DetailRow label="Măcinare (Grad)" value={grindDisplay} />
                        <DetailRow label="Tamper" value={localShot.tamperName || 'Nespecificat'} />
                        <DetailRow label="Tampare (kgf)" value={localShot.tampLevel || 'Nespecificat'} />
                        {localShot.flowControlSetting !== undefined && (
                            <DetailRow label="Flow Control (Rotații)" value={`${localShot.flowControlSetting} rot`} />
                        )}
                        <DetailRow label="Doză Cafea (g)" value={`${localShot.doseIn.toFixed(1)} g`} />
                        <DetailRow label="Temperatură (°C)" value={`${localShot.temperature.toFixed(1)} °C`} />
                        <DetailRow label="Presiune Maximă (bar)" value={(localShot.maxPressure || localShot.pressure) !== undefined ? `${(localShot.maxPressure || localShot.pressure).toFixed(1)} bar` : '-'} />
                        <DetailRow label="Presiune Medie (bar)" value={localShot.avgPressure !== undefined ? `${localShot.avgPressure.toFixed(1)} bar` : '-'} />
                        <DetailRow label="Timp de Preinfuzie (s)" value={times.preinfusionTime !== undefined ? `${times.preinfusionTime.toFixed(1)} s` : '-'} />
                        <DetailRow label="Timp de Infuzie (s)" value={times.infusionTime !== undefined ? `${times.infusionTime.toFixed(1)} s` : '-'} />
                        <DetailRow label="Timp de Postinfuzie (s)" value={times.postinfusionTime !== undefined ? `${times.postinfusionTime.toFixed(1)} s` : '-'} />
                        <DetailRow label="Timp Efectiv de Extracție (s)" value={times.effectiveExtractionTime !== undefined ? `${times.effectiveExtractionTime.toFixed(1)} s` : '-'} />
                        <DetailRow label="Timp Total de Extracție (s)" value={`${localShot.time.toFixed(1)} s`} />
                        <DetailRow label="Cafea Extrasă (g)" value={`${localShot.yieldOut.toFixed(1)} g`} />
                        <DetailRow label="Raport Extracție (g/g)" value={`1:${localShot.doseIn > 0 ? (localShot.yieldOut / localShot.doseIn).toFixed(1) : "0.0"}`} />
                        <DetailRow label="Flux Lichid Extras (g/s)" value={flowRate !== "0.0" ? `${flowRate} g/s` : '-'} />
                    </div>

                    {localShot.structuredAnalysis && (
                        <div className="bg-surface-container rounded-2xl p-4 border border-white/5 shadow-md">
                            <div className="flex items-center gap-2 mb-3">
                                <SparklesIcon className="w-4 h-4 text-on-surface-variant" />
                                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest" style={getDynamicLabelStyle()}>ANALIZĂ EXPERT</span>
                            </div>
                            
                            <div className="flex flex-col gap-4">
                                <div>
                                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">Diagnostic Expert</span>
                                    <p className="text-sm font-medium text-on-surface leading-relaxed text-left">
                                        {localShot.structuredAnalysis.diagnosis}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">Recomandare Expert</span>
                                    <p className="text-sm font-normal text-on-surface leading-relaxed text-left opacity-90">
                                        "{localShot.structuredAnalysis.suggestion}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTags.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 pl-1">
                                <TagIcon className="w-4 h-4 text-on-surface-variant" />
                                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest" style={getDynamicLabelStyle()}>TAGURI</label>
                            </div>
                            <div className={`bg-surface-container rounded-2xl p-4 flex flex-wrap gap-2 ${DEPTH_SHADOW} ${GLASS_BORDER}`}>
                                {activeTags.map((t, i) => (
                                    <span key={i} className="px-3 py-1 bg-surface-container-high rounded-full text-[10px] font-bold uppercase text-on-surface-variant shadow-sm border border-white/5">{t}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <div className={`bg-surface-container rounded-2xl p-4 border border-white/5 shadow-md`}>
                            <div className="flex items-center gap-2 mb-2">
                                <DocumentTextIcon className="w-4 h-4 text-on-surface-variant" />
                                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block" style={getDynamicLabelStyle()}>OBSERVAȚII</label>
                            </div>
                            <p className="text-sm text-on-surface opacity-90 whitespace-pre-wrap">
                                {localShot.notes || <span className="opacity-40 italic">Fără observații notate.</span>}
                            </p>
                        </div>

                        <div className={`bg-surface-container rounded-2xl p-4 border border-white/5 shadow-md`}>
                            <div className="flex items-center gap-2 mb-2">
                                <PencilSquareIcon className="w-4 h-4 text-on-surface-variant" />
                                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block" style={getDynamicLabelStyle()}>
                                    NOTE POST-EXTRACȚIE
                                </label>
                            </div>
                            
                            <textarea 
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Adaugă impresii după degustare (ex: gustul după răcire, senzații persistente)..."
                                className="w-full bg-surface-container-high rounded-xl border border-white/5 p-3 text-sm text-on-surface placeholder:text-on-surface-variant/30 outline-none focus:border-crema-500 transition-all min-h-[80px] resize-none"
                            />
                            
                            <div className="mt-3 flex justify-end">
                                <button 
                                    onClick={handleSaveNotes}
                                    disabled={isSaving || notes === (localShot.postExtractionNotes || '')}
                                    className={`
                                        px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm border flex items-center gap-2
                                        ${saveStatus === 'success' ? 'bg-green-600 text-white border-green-500' : 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500'}
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                    `}
                                >
                                    {isSaving 
                                        ? 'Se salvează...' 
                                        : saveStatus === 'success' 
                                            ? 'Salvat!' 
                                            : (localNotesSaved ? 'Modifică' : 'Salvează')
                                    }
                                    {saveStatus === 'success' && <CheckCircleIcon className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="p-4 border-t border-white/5 bg-surface-container/50">
                    <button onClick={onClose} className="w-full py-3 bg-surface-container-high text-on-surface rounded-full font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-colors">
                        ÎNCHIDE
                    </button>
                </div>
            </div>
        </div>
    );
};

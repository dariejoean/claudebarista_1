
import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { ListItem, ShotData } from '../types';
import { TagCategory } from '../constants';
import { useEditorStore } from '../store/editorStore';
import { SelectionModal } from '../components/SelectionModal';
import { 
    CheckCircleIcon,
    XMarkIcon, 
    ExclamationTriangleIcon
} from '@heroicons/react/24/solid';
import { 
    SECTION_HEADER_STYLE, 
    getDynamicSectionHeaderStyle 
} from '../styles/common';

// Modular Sub-components
import { ShotSetup } from '../components/new-shot/ShotSetup';
import { ShotExtraction } from '../components/new-shot/ShotExtraction';
import { ShotEvaluation } from '../components/new-shot/ShotEvaluation';

interface NewShotViewProps {
    shots: ShotData[];
    waterList: ListItem[]; 
    accessoriesList: ListItem[];
    uniqueMachines: string[];
    uniqueBeans: string[];
    tampersList: ListItem[];
    loading: boolean;
    errorMsg: string;

    // Logic Controller Actions
    onAddMachine: () => void;
    onAddBean: () => void;
    onAddWater: () => void; 
    onManageTampers: () => void;
    onManageTampLevels: () => void;
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onViewImage: (img: string) => void;
    onOpenTagModal: (cat: TagCategory) => void;
    onSaveAndAnalyze: (extraData?: Partial<ShotData>) => void;
    onCancel: () => void;
    applySuggestion: (shot: ShotData) => void;
}

export const NewShotView: React.FC<NewShotViewProps> = React.memo((props) => {
    
    // Read directly from store for Validation logic only
    const machineName = useEditorStore(s => s.machineName);
    const beanName = useEditorStore(s => s.beanName);
    const doseIn = useEditorStore(s => s.doseIn);
    const temperature = useEditorStore(s => s.temperature);
    const time = useEditorStore(s => s.time);
    const yieldOut = useEditorStore(s => s.yieldOut);
    const ratingOverall = useEditorStore(s => s.ratingOverall);
    const tasteConclusion = useEditorStore(s => s.tasteConclusion);
    const ratingAspect = useEditorStore(s => s.ratingAspect);
    const ratingAroma = useEditorStore(s => s.ratingAroma);
    const ratingTaste = useEditorStore(s => s.ratingTaste);
    const ratingBody = useEditorStore(s => s.ratingBody);
    const setRatingAspect = useEditorStore(s => s.setRatingAspect);
    const setRatingAroma = useEditorStore(s => s.setRatingAroma);
    const setRatingTaste = useEditorStore(s => s.setRatingTaste);
    const setRatingBody = useEditorStore(s => s.setRatingBody);
    
    // Setters for Selection Modal
    const setMachineName = useEditorStore(s => s.setMachineName);
    const setBeanName = useEditorStore(s => s.setBeanName);
    const setWaterName = useEditorStore(s => s.setWaterName);
    const waterName = useEditorStore(s => s.waterName);
    
    // Grinder Logic
    const setGrinderName = useEditorStore(s => s.setGrinderName);
    const setGrindScaleType = useEditorStore(s => s.setGrindScaleType);
    const grinderName = useEditorStore(s => s.grinderName);
    
    // Basket Logic
    const setBasketName = useEditorStore(s => s.setBasketName);
    const basketName = useEditorStore(s => s.basketName);
    
    // Retrieve Grinders list for selection
    const grindersSetting = useLiveQuery(() => db.settings.get('grinders_list'));
    const grindersList: ListItem[] = (grindersSetting?.value as ListItem[]) || [];
    
    // Retrieve Baskets list for selection
    const basketsSetting = useLiveQuery(() => db.settings.get('baskets_list'));
    const basketsList: ListItem[] = (basketsSetting?.value as ListItem[]) || [];

    // Validation Modal State
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [missingFields, setMissingFields] = useState<string[]>([]);
    
    // Selection Modal State
    const [selectionType, setSelectionType] = useState<'machine' | 'bean' | 'water' | 'grinder' | 'basket' | null>(null);
    
    // Set default ratings to 3 (OK) on mount if they are 0
    useEffect(() => {
        if (ratingAspect === 0) setRatingAspect(3);
        if (ratingAroma === 0) setRatingAroma(3);
        if (ratingTaste === 0) setRatingTaste(3);
        if (ratingBody === 0) setRatingBody(3);
    }, []);

    // NOTE: Auto-suggestion logic removed to respect user's manual persistence of grind settings.
    // The app will now rely solely on 'lastGrindSetting' from global settings.

    const handleSaveWrapper = () => {
        const missing: string[] = [];
        if (!machineName) missing.push("Espressor");
        if (!beanName) missing.push("Cafea");
        if (doseIn <= 5) missing.push("Doză cafea (> 5g)");
        if (temperature < 88 || temperature > 98) missing.push("Temperatură (88-98°C)");
        if (time <= 10) missing.push("Timp extractie (> 10s)");
        if (yieldOut <= 10) missing.push("Cafea extrasa (> 10g)");
        if (ratingOverall < 1) missing.push("Nota generala");
        if (!tasteConclusion || tasteConclusion.length === 0) missing.push("Concluzie gust");

        if (missing.length > 0) {
            setMissingFields(missing);
            setShowValidationModal(true);
            return;
        }
        props.onSaveAndAnalyze();
    };

    // Handler for Grinder Selection + Auto-Switch Scale Type
    const handleGrinderSelect = (name: string) => {
        setGrinderName(name);
        const grinder = grindersList.find(g => g.label === name);
        if (grinder && grinder.scaleType) {
            setGrindScaleType(grinder.scaleType);
        }
    };

    return (
        <div className="flex flex-col gap-4 animate-fade-in pb-8">
            
            {/* SELECTION MODAL */}
            {selectionType === 'machine' && (
                <SelectionModal 
                    title="Alege Espressorul"
                    items={props.uniqueMachines}
                    selectedItem={machineName}
                    onSelect={setMachineName}
                    onClose={() => setSelectionType(null)}
                    onAddNew={props.onAddMachine}
                />
            )}
            {selectionType === 'bean' && (
                <SelectionModal 
                    title="Alege Cafeaua"
                    items={props.uniqueBeans}
                    selectedItem={beanName}
                    onSelect={setBeanName}
                    onClose={() => setSelectionType(null)}
                    onAddNew={props.onAddBean}
                />
            )}
            {selectionType === 'water' && (
                <SelectionModal 
                    title="Alege Apa"
                    items={props.waterList.map(w => w.label)}
                    selectedItem={waterName}
                    onSelect={setWaterName}
                    onClose={() => setSelectionType(null)}
                    onAddNew={props.onAddWater}
                />
            )}
            
            {/* Grinder Selection Modal */}
            {selectionType === 'grinder' && (
                <SelectionModal 
                    title="Alege Râșnița"
                    items={grindersList.map(g => g.label)}
                    selectedItem={grinderName}
                    onSelect={handleGrinderSelect}
                    onClose={() => setSelectionType(null)}
                />
            )}
            
            {/* Basket Selection Modal */}
            {selectionType === 'basket' && (
                <SelectionModal 
                    title="Alege Sita (Basket)"
                    items={basketsList.map(b => b.label)}
                    selectedItem={basketName}
                    onSelect={setBasketName}
                    onClose={() => setSelectionType(null)}
                />
            )}

            {/* VALIDATION MODAL */}
            {showValidationModal && (
                <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-scale-in">
                    <div className="bg-surface-container w-full max-w-sm rounded-[2rem] p-6 border border-red-500/30 shadow-2xl flex flex-col items-center text-center gap-4 relative">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-1 shadow-inner border border-red-500/20">
                            <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-lg font-black text-on-surface uppercase tracking-widest">DATE INCOMPLETE</h3>
                        <p className="text-sm text-on-surface-variant font-medium leading-relaxed px-2">Este necesară introducerea datelor importante ale extracției:</p>
                        <div className="bg-surface-container-high rounded-xl p-4 w-full border border-white/5 max-h-48 overflow-y-auto no-scrollbar">
                            <ul className="text-left list-disc pl-4 space-y-1.5">
                                {missingFields.map(field => (
                                    <li key={field} className="text-xs font-bold text-red-400 uppercase tracking-wide">{field}</li>
                                ))}
                            </ul>
                        </div>
                        <button onClick={() => setShowValidationModal(false)} className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-red-500 transition-all shadow-lg active:scale-95 mt-2 flex items-center justify-center gap-2">
                            <CheckCircleIcon className="w-5 h-5" /> AM ÎNȚELES
                        </button>
                    </div>
                </div>
            )}

            {/* --- MODULAR COMPONENTS (PROPS REDUCED) --- */}
            
            <div className="animate-slide-up-fade" style={{ animationDelay: '0s' }}>
                <ShotSetup 
                    uniqueMachines={props.uniqueMachines}
                    uniqueBeans={props.uniqueBeans}
                    waterList={props.waterList}
                    tampersList={props.tampersList}
                    accessoriesList={props.accessoriesList}
                    onAddMachine={props.onAddMachine}
                    onAddBean={props.onAddBean}
                    onAddWater={props.onAddWater}
                    onManageTampers={props.onManageTampers}
                    onManageTampLevels={props.onManageTampLevels}
                    // Selection Trigger Props
                    onSelectMachine={() => setSelectionType('machine')}
                    onSelectBean={() => setSelectionType('bean')}
                    onSelectWater={() => setSelectionType('water')}
                    onSelectGrinder={() => setSelectionType('grinder')}
                    onSelectBasket={() => setSelectionType('basket')}
                />
            </div>

            <div className="animate-slide-up-fade" style={{ animationDelay: '0.1s' }}>
                <ShotExtraction 
                    handleImageUpload={props.handleImageUpload}
                    onViewImage={props.onViewImage}
                />
            </div>

            <div className="animate-slide-up-fade" style={{ animationDelay: '0.2s' }}>
                <ShotEvaluation 
                    onOpenTagModal={props.onOpenTagModal}
                />
            </div>

            <div className="animate-slide-up-fade" style={{ animationDelay: '0.3s' }}>
                <div id="section-new-conclusion" className={`${SECTION_HEADER_STYLE} scroll-mt-24`} style={getDynamicSectionHeaderStyle()}>CONCLUZIE</div>

                <div className="flex flex-col gap-3">
                    <button 
                        onClick={handleSaveWrapper} 
                        disabled={props.loading}
                        className="w-full py-4 rounded-full font-bold text-sm uppercase tracking-widest transition-all active:scale-95 active:shadow-inner border border-white/10 flex items-center justify-center gap-2 disabled:opacity-70 disabled:grayscale group bg-green-600 text-white hover:bg-green-500 shadow-[0_8px_20px_rgba(22,163,74,0.4)]"
                    >
                        {props.loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></div>
                                <span>SE ANALIZEAZĂ...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircleIcon className="w-5 h-5 drop-shadow-sm" />
                                <span>SALVEAZĂ EXTRACȚIA</span>
                            </>
                        )}
                    </button>
                    
                    <button 
                        onClick={props.onCancel} 
                        className="w-full py-4 bg-red-600 text-white rounded-full font-bold text-sm uppercase tracking-widest hover:bg-red-500 transition-all shadow-[0_8px_20px_rgba(220,38,38,0.4)] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] active:scale-95 active:shadow-inner border border-white/10 flex items-center justify-center gap-2 group"
                    >
                        <XMarkIcon className="w-5 h-5 drop-shadow-md" /> ANULEAZĂ EXTRACȚIA
                    </button>
                </div>
                
                {props.errorMsg && <div className="p-4 bg-red-900/30 rounded-2xl border border-red-500/30 text-red-200 text-xs font-bold flex items-center gap-3 shadow-inner animate-pulse mt-4"><ExclamationTriangleIcon className="w-5 h-5 shrink-0" /> {props.errorMsg}</div>}
            </div>
          </div>
    );
});

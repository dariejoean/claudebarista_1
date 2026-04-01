
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { saveShot, getAllSettings, saveSetting, getSetting } from '../services/db';
import { analyzeShot } from '../services/geminiService';
import { evaluateShotLocally } from '../services/expertSystem';
import { createThumbnail } from '../utils/imageUtils';
import { ShotData, ExpertAnalysisResult, ProductItem, ListItem } from '../types';
import { useEditorStore } from '../store/editorStore';

export const useShotEditor = (
    savedMachines: ProductItem[], 
    savedBeans: ProductItem[],
    tampersList: ListItem[],
    engineMode: 'expert' | 'manual'
) => {
    // Access State via Store
    const store = useEditorStore();

    // Local UI State (Not persisted in store)
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [expertResult, setExpertResult] = useState<ExpertAnalysisResult | null>(null);
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    
    // Grinders & Baskets list (loaded from settings)
    const [savedGrinders, setSavedGrinders] = useState<ListItem[]>([]);
    const [savedBaskets, setSavedBaskets] = useState<ListItem[]>([]);

    const isMounted = useRef(true);
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    // 1. LOAD DEFAULTS & LISTS INTO STORE (Once)
    useEffect(() => {
        const loadDefaults = async () => {
            const settings = await getAllSettings();
            
            // Fetch grinders
            const grindersData = await getSetting('grinders_list');
            if (isMounted.current && Array.isArray(grindersData)) {
                setSavedGrinders(grindersData);
            }
            
            // Fetch baskets
            const basketsData = await getSetting('baskets_list');
            if (isMounted.current && Array.isArray(basketsData)) {
                setSavedBaskets(basketsData);
            }

            if (!isMounted.current) return;

            if (typeof settings.defaultMachine === 'string') store.setMachineName(settings.defaultMachine);
            if (typeof settings.defaultBean === 'string') store.setBeanName(settings.defaultBean);
            if (typeof settings.defaultWater === 'string') store.setWaterName(settings.defaultWater);
            
            // Load Default Grinder
            if (typeof settings.defaultGrinder === 'string') store.setGrinderName(settings.defaultGrinder);
            
            // Load Default Basket
            if (typeof settings.defaultBasket === 'string') store.setBasketName(settings.defaultBasket);
            
            if (settings.lastTampLevel && typeof settings.lastTampLevel === 'string') store.setTampLevel(settings.lastTampLevel);
            if (settings.lastTamper && typeof settings.lastTamper === 'string') store.setTamperName(settings.lastTamper);
            if (typeof settings.lastGrindSetting === 'string') store.setGrindSetting(settings.lastGrindSetting);
            if (typeof settings.lastTemperature === 'number') store.setTemperature(settings.lastTemperature);
            
            // NEW: Load persisted values for Shot Extraction parameters
            if (typeof settings.lastDoseIn === 'number') store.setDoseIn(settings.lastDoseIn);
            if (typeof settings.lastYieldOut === 'number') store.setYieldOut(settings.lastYieldOut);
            if (typeof settings.lastPressure === 'number') store.setPressure(settings.lastPressure);
            if (typeof settings.lastFlowControlSetting === 'number') store.setFlowControlSetting(settings.lastFlowControlSetting);
            if (typeof settings.lastTime === 'number') store.setTime(settings.lastTime);
            if (typeof settings.lastGrindScaleType === 'string') store.setGrindScaleType(settings.lastGrindScaleType as any);
            
            // Restore Manual Yield Toggle State
            if (typeof settings.isYieldManuallySet === 'boolean') store.setIsYieldManuallySet(settings.isYieldManuallySet);
            
            setSettingsLoaded(true);
        };
        loadDefaults();
    }, []);

    // 2. AUTO-SAVE DEFAULTS (Sync Store to DB) - Consolidated for performance
    useEffect(() => {
        if (!settingsLoaded) return;
        
        const syncSettings = async () => {
            if (store.machineName) await saveSetting('defaultMachine', store.machineName);
            if (store.beanName) await saveSetting('defaultBean', store.beanName);
            if (store.waterName) await saveSetting('defaultWater', store.waterName);
            if (store.grinderName) await saveSetting('defaultGrinder', store.grinderName);
            if (store.basketName) await saveSetting('defaultBasket', store.basketName);
            
            await saveSetting('lastTampLevel', store.tampLevel);
            if (store.tamperName) await saveSetting('lastTamper', store.tamperName);
            await saveSetting('lastGrindSetting', store.grindSetting);
            await saveSetting('lastTemperature', store.temperature);
            
            await saveSetting('lastDoseIn', store.doseIn);
            await saveSetting('lastYieldOut', store.yieldOut);
            await saveSetting('lastPressure', store.pressure);
            await saveSetting('lastFlowControlSetting', store.flowControlSetting);
            await saveSetting('lastTime', store.time);
            await saveSetting('lastGrindScaleType', store.grindScaleType);
            await saveSetting('isYieldManuallySet', store.isYieldManuallySet);
        };
        
        // Debounce sync slightly to avoid excessive DB writes during rapid changes
        const timer = setTimeout(syncSettings, 1000);
        return () => clearTimeout(timer);
    }, [
        settingsLoaded, 
        store.machineName, store.beanName, store.waterName, store.grinderName, store.basketName,
        store.tampLevel, store.tamperName, store.grindSetting, store.temperature,
        store.doseIn, store.yieldOut, store.pressure, store.flowControlSetting, store.time, store.grindScaleType, store.isYieldManuallySet
    ]);

    // 3. LOGIC HANDLERS (Business Logic)

    // Ensure valid selections
    const uniqueMachines = useMemo(() => savedMachines.map(m => m.name).sort(), [savedMachines]);
    const uniqueBeans = useMemo(() => savedBeans.map(b => b.name).sort(), [savedBeans]);
    
    useEffect(() => { 
        if (uniqueMachines.length > 0 && !uniqueMachines.includes(store.machineName)) store.setMachineName(uniqueMachines[0]); 
    }, [uniqueMachines, store.machineName, store]);
    
    useEffect(() => { 
        if (uniqueBeans.length > 0 && !uniqueBeans.includes(store.beanName)) store.setBeanName(uniqueBeans[0]); 
    }, [uniqueBeans, store.beanName, store]);

    // Image Upload Logic - Keeps logic here but updates Store
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const remainingSlots = 5 - store.images.length;
            if (remainingSlots <= 0) return;
            
            const filesToProcess = Array.from(files).slice(0, remainingSlots) as File[];

            try {
                for (const file of filesToProcess) {
                    const reader = new FileReader();
                    await new Promise<void>((resolve) => {
                        reader.onloadend = async () => {
                            if (reader.result) {
                                const fullRes = reader.result as string;
                                const optimizedFull = await createThumbnail(fullRes, 600, 0.7);
                                const thumb = await createThumbnail(fullRes, 180, 0.6);
                                store.addImage(optimizedFull, thumb);
                            }
                            resolve();
                        };
                        reader.readAsDataURL(file);
                    });
                }
            } catch (err) { console.error("Image upload processing failed", err); }
            e.target.value = '';
        }
    };

    // SAVE & ANALYZE ACTION
    const handleSaveAndAnalyze = async (extraData?: Partial<ShotData>, onSuccess?: (shot: ShotData) => void) => {
        setErrorMsg(''); 
        setLoading(true); 
        setExpertResult(null);
        
        const shotId = Date.now().toString();
        // Construct shot from STORE state
        const currentShot: ShotData = { 
            id: shotId, 
            date: new Date().toISOString(), 
            machineName: store.machineName, 
            beanName: store.beanName, 
            waterName: store.waterName,
            grinderName: store.grinderName,
            basketName: store.basketName,
            tampLevel: store.tampLevel,
            tamperName: store.tamperName,
            doseIn: store.doseIn, 
            yieldOut: store.yieldOut, 
            time: store.time, 
            preinfusionTime: store.preinfusionTime,
            infusionTime: store.infusionTime,
            postinfusionTime: store.postinfusionTime,
            effectiveExtractionTime: store.effectiveExtractionTime,
            temperature: store.temperature, 
            pressure: store.pressure, 
            avgPressure: store.avgPressure,
            maxPressure: store.maxPressure,
            flowControlSetting: store.flowControlSetting,
            otherAccessories: store.otherAccessories,
            grindSetting: store.grindSetting,
            grindScaleType: store.grindScaleType, 
            extractionProfile: store.extractionProfile,
            tags: store.tags, 
            ratingAspect: store.ratingAspect, 
            ratingAroma: store.ratingAroma, 
            ratingTaste: store.ratingTaste, 
            ratingBody: store.ratingBody, 
            ratingOverall: store.ratingOverall, 
            notes: store.notes, 
            images: store.images, 
            thumbnails: store.thumbnails,
            tasteConclusion: store.tasteConclusion,
            ...extraData 
        };
        
        const selectedMachine = savedMachines.find(m => m.name === store.machineName);
        const selectedBean = savedBeans.find(b => b.name === store.beanName);

        try {
            let result: ExpertAnalysisResult | string;

            if (engineMode === 'expert') {
                await new Promise(r => setTimeout(r, 800)); 
                result = evaluateShotLocally(currentShot);
            } else {
                // Manual mode - no automatic analysis
                result = {
                    score: "N/A",
                    diagnosis: "Mod Manual - Nu s-a efectuat analiza automată.",
                    suggestion: "Ajustează parametrii conform propriilor observații."
                };
            }

            if (!isMounted.current) return;
            
            const finalShot = { ...currentShot };
            
            setExpertResult(result); 
            finalShot.structuredAnalysis = result; 
            finalShot.expertAdvice = result.suggestion;
            await saveShot(finalShot); 
            if (onSuccess) onSuccess(finalShot);
            store.resetForm(false);

        } catch (e) { 
            if (isMounted.current) { 
                setErrorMsg("Eroare neașteptată la salvare."); 
                console.error(e); 
            } 
        } finally { 
            if (isMounted.current) setLoading(false); 
        }
    };

    return {
        // Expose logic state
        loading, errorMsg, expertResult,
        
        // Computed
        uniqueMachines,
        uniqueBeans,
        savedGrinders,
        savedBaskets,

        // Actions
        handleImageUpload,
        resetForm: store.resetForm,
        handleSaveAndAnalyze,
        applySuggestion: store.applySuggestion
    };
};

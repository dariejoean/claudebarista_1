
import { create } from 'zustand';
import { ShotTags, TampLevel, ShotData, ChartDataPoint } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface EditorState {
    // --- FORM DATA ---
    machineName: string;
    beanName: string;
    waterName: string;
    
    // NEW
    basketName: string;

    tamperName: string;
    tampLevel: string;
    
    // NEW: Selected Grinder Name
    grinderName: string;
    
    grindSetting: number;
    // Toggle between linear and dial scale
    grindScaleType: 'linear' | 'eureka'; 
    temperature: number;
    doseIn: number;
    isDoseLocked: boolean;
    yieldOut: number;
    isYieldManuallySet: boolean;
    time: number;
    preinfusionTime: number;
    infusionTime: number;
    postinfusionTime: number;
    effectiveExtractionTime: number;
    pressure: number;
    avgPressure: number;
    maxPressure: number;
    flowControlSetting: number;
    otherAccessories: string[];
    
    // NEW: Live extraction profile data
    extractionProfile: ChartDataPoint[];
    isExtracting: boolean;
    
    // Ratings
    ratingAspect: number;
    ratingAroma: number;
    ratingTaste: number;
    ratingBody: number;
    ratingOverall: number;
    tags: ShotTags;
    notes: string;
    tasteConclusion: number[];

    // Media
    images: string[];
    thumbnails: string[];

    // --- ACTIONS ---
    setMachineName: (val: string) => void;
    setBeanName: (val: string) => void;
    setWaterName: (val: string) => void;
    setBasketName: (val: string) => void;
    
    setTamperName: (val: string) => void;
    setTampLevel: (val: string) => void;
    
    setGrinderName: (val: string) => void;
    
    setGrindSetting: (val: number) => void;
    setGrindScaleType: (val: 'linear' | 'eureka') => void;
    setTemperature: (val: number) => void;
    setDoseIn: (val: number) => void;
    setIsDoseLocked: (val: boolean) => void;
    setYieldOut: (val: number) => void;
    setIsYieldManuallySet: (val: boolean) => void;
    setTime: (val: number) => void;
    setPreinfusionTime: (val: number) => void;
    setInfusionTime: (val: number) => void;
    setPostinfusionTime: (val: number) => void;
    setEffectiveExtractionTime: (val: number) => void;
    setPressure: (val: number) => void;
    setAvgPressure: (val: number) => void;
    setMaxPressure: (val: number) => void;
    setFlowControlSetting: (val: number) => void;
    setOtherAccessories: (val: string[]) => void;
    setExtractionProfile: (val: ChartDataPoint[]) => void;
    setIsExtracting: (val: boolean) => void;
    
    setRatingAspect: (val: number) => void;
    setRatingAroma: (val: number) => void;
    setRatingTaste: (val: number) => void;
    setRatingBody: (val: number) => void;
    setRatingOverall: (val: number) => void;
    
    setTags: (updater: (prev: ShotTags) => ShotTags) => void;
    
    setNotes: (val: string) => void;
    setTasteConclusion: (val: number[]) => void;

    // Media Actions
    addImage: (full: string, thumb: string) => void;
    removeImage: (index: number) => void;
    resetImages: () => void;

    // Utility
    resetForm: (fullReset: boolean) => void;
    applySuggestion: (shot: ShotData) => void;
}

const INITIAL_TAGS: ShotTags = { aspect: [], aroma: [], body: [], taste: [] };

export const useEditorStore = create<EditorState>((set) => ({
    // Defaults
    machineName: 'Lelit Anita PL042TEMD',
    beanName: 'Ethiopia Yirgacheffe',
    waterName: '',
    basketName: '',
    tamperName: 'Standard',
    tampLevel: TampLevel.MEDIUM,
    
    grinderName: '', 
    
    grindSetting: 3.5,
    grindScaleType: 'eureka', // Changed default to Eureka per user request
    temperature: 93,
    doseIn: 18.0,
    isDoseLocked: false,
    yieldOut: 0,
    isYieldManuallySet: true, // Default true to allow 0 value and manual entry
    time: 0,
    preinfusionTime: 0,
    infusionTime: 0,
    postinfusionTime: 0,
    effectiveExtractionTime: 0,
    pressure: 1,
    avgPressure: 0,
    maxPressure: 0,
    flowControlSetting: 1.25,
    otherAccessories: [],
    extractionProfile: [],
    isExtracting: false,
    
    ratingAspect: 0,
    ratingAroma: 0,
    ratingTaste: 0,
    ratingBody: 0,
    ratingOverall: 0,
    tags: INITIAL_TAGS,
    notes: '',
    tasteConclusion: [2], // Balanced default

    images: [],
    thumbnails: [],

    // Setters
    setMachineName: (val) => set({ machineName: val }),
    setBeanName: (val) => set({ beanName: val }),
    setWaterName: (val) => set({ waterName: val }),
    setBasketName: (val) => set({ basketName: val }),
    setTamperName: (val) => set({ tamperName: val }),
    setTampLevel: (val) => set({ tampLevel: val }),
    
    setGrinderName: (val) => set({ grinderName: val }),
    
    setGrindSetting: (val) => set({ grindSetting: val }),
    setGrindScaleType: (val) => set({ grindScaleType: val }),
    setTemperature: (val) => set({ temperature: val }),
    setDoseIn: (val) => set((state) => ({ 
        doseIn: val,
        yieldOut: state.isYieldManuallySet ? state.yieldOut : Math.round(val * 2) // Auto-calc ratio only if enabled (manual set false)
    })),
    setIsDoseLocked: (val) => set({ isDoseLocked: val }),
    setYieldOut: (val) => set({ yieldOut: val }),
    setIsYieldManuallySet: (val) => set({ isYieldManuallySet: val }),
    setTime: (val) => set({ time: val }),
    setPreinfusionTime: (val) => set({ preinfusionTime: val }),
    setInfusionTime: (val) => set({ infusionTime: val }),
    setPostinfusionTime: (val) => set({ postinfusionTime: val }),
    setEffectiveExtractionTime: (val) => set({ effectiveExtractionTime: val }),
    setPressure: (val) => set({ pressure: val }),
    setAvgPressure: (val) => set({ avgPressure: val }),
    setMaxPressure: (val) => set({ maxPressure: val }),
    setFlowControlSetting: (val) => set({ flowControlSetting: val }),
    setOtherAccessories: (val) => set({ otherAccessories: val }),
    setExtractionProfile: (val) => set({ extractionProfile: val }),
    setIsExtracting: (val) => set({ isExtracting: val }),

    setRatingAspect: (val) => set({ ratingAspect: val }),
    setRatingAroma: (val) => set({ ratingAroma: val }),
    setRatingTaste: (val) => set({ ratingTaste: val }),
    setRatingBody: (val) => set({ ratingBody: val }),
    setRatingOverall: (val) => set({ ratingOverall: val }),
    
    setTags: (updater) => set((state) => ({ tags: updater(state.tags) })),
    
    setNotes: (val) => set({ notes: val }),
    setTasteConclusion: (val) => set({ tasteConclusion: val }),

    addImage: (full, thumb) => set((state) => ({ 
        images: [...state.images, full], 
        thumbnails: [...state.thumbnails, thumb] 
    })),
    removeImage: (index) => set((state) => ({
        images: state.images.filter((_, i) => i !== index),
        thumbnails: state.thumbnails.filter((_, i) => i !== index)
    })),
    resetImages: () => set({ images: [], thumbnails: [] }),

    resetForm: (fullReset) => set((state) => ({
        time: 0,
        preinfusionTime: 0,
        infusionTime: 0,
        postinfusionTime: 0,
        effectiveExtractionTime: 0,
        isYieldManuallySet: true, // Reset to manual mode (0)
        yieldOut: 0, 
        pressure: 0,
        avgPressure: 0,
        maxPressure: 0,
        otherAccessories: [],
        extractionProfile: [],
        isExtracting: false,
        images: [],
        thumbnails: [],
        tags: INITIAL_TAGS,
        ratingAspect: 0,
        ratingAroma: 0,
        ratingTaste: 0,
        ratingBody: 0,
        ratingOverall: 0,
        notes: '',
        tasteConclusion: [2],
        // If full reset, reset params too
        doseIn: fullReset ? 18.0 : state.doseIn,
        isDoseLocked: false,
        // We typically KEEP machine/bean/grinder names between shots for workflow speed
    })),

    applySuggestion: (shot) => set((state) => ({
        // PROTECTIVE LOGIC: Only apply grind setting if it exists and is > 0. Otherwise keep current state.
        grindSetting: (shot.grindSetting && shot.grindSetting > 0) ? shot.grindSetting : state.grindSetting,
        
        // Apply saved scale type if exists, else keep current
        grindScaleType: (shot.grindScaleType as 'linear' | 'eureka') || state.grindScaleType,
        
        temperature: shot.temperature || state.temperature,
        time: shot.time || state.time,
        doseIn: shot.doseIn || state.doseIn,
        yieldOut: shot.yieldOut || state.yieldOut,
        isYieldManuallySet: !!shot.yieldOut,
        infusionTime: shot.infusionTime || 0,
        postinfusionTime: shot.postinfusionTime || 0,
        effectiveExtractionTime: shot.effectiveExtractionTime || 0,
        otherAccessories: shot.otherAccessories || []
    }))
}));

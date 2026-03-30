
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { db, saveSetting, getAllSettings } from '../services/db';
import { AppTheme, CustomThemeColors } from '../types';
import { THEME_METADATA, THEMES_ORDER, PRESET_DARK, PRESET_LIGHT, PRESET_FANTASY } from '../constants';

export const useTheme = () => {
    const [theme, setTheme] = useState<AppTheme>('blue-navy-dark');
    const [allCustomizations, setAllCustomizations] = useState<Record<string, CustomThemeColors>>({});
    const [activeColors, setActiveColors] = useState<CustomThemeColors>(THEME_METADATA['blue-navy-dark'].defaults);
    const [isRandomizing, setIsRandomizing] = useState<boolean>(false);
    const [showThemeEditor, setShowThemeEditor] = useState<boolean>(false);
    const [showThemeSelector, setShowThemeSelector] = useState<boolean>(false);
    const [settingsLoaded, setSettingsLoaded] = useState<boolean>(false);
    
    // Mounted ref to prevent state updates on unmounted components (safety)
    const isMounted = useRef(true);
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    // 1. Load Settings on Mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await getAllSettings();
                if (!isMounted.current) return;

                if (settings.appTheme && typeof settings.appTheme === 'string') {
                    if (THEMES_ORDER.includes(settings.appTheme as AppTheme)) {
                        setTheme(settings.appTheme as AppTheme);
                    }
                }
                if (settings.themeCustomizations) {
                    setAllCustomizations(settings.themeCustomizations);
                }
            } catch (e) {
                console.error("Error loading theme settings:", e);
            } finally {
                if (isMounted.current) setSettingsLoaded(true);
            }
        };
        loadSettings();
    }, []);

    // 2. Apply Theme & Colors to DOM
    useEffect(() => {
        const defaults = THEME_METADATA[theme].defaults;
        const custom = allCustomizations[theme];
        const colors = custom || defaults;
        
        setActiveColors(colors);
        document.body.setAttribute('data-theme', theme); 
        
        // CSS Variables Injection
        document.body.style.setProperty('--md-sys-color-surface', colors.surface);
        document.body.style.setProperty('--md-sys-color-surface-container', colors.surfaceContainer);
        document.body.style.setProperty('--color-section-header', colors.sectionHeader);
        document.body.style.setProperty('--color-box-label', colors.boxLabel);

        // Contrast Calculation for Text
        const hex = colors.surface.replace('#', '');
        const r = parseInt(hex.substring(0,2), 16);
        const g = parseInt(hex.substring(2,4), 16);
        const b = parseInt(hex.substring(4,6), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        
        if (brightness > 128) {
            document.body.style.setProperty('--md-sys-color-on-surface', '#111111');
            document.body.style.setProperty('--header-title-color', '#000000'); 
        } else {
            document.body.style.setProperty('--md-sys-color-on-surface', '#FFFFFF'); 
            document.body.style.setProperty('--header-title-color', '#FACC15'); 
        }

        if (settingsLoaded) saveSetting('appTheme', theme); 

    }, [theme, allCustomizations, settingsLoaded]);

    // 3. Actions
    const handleCycleTheme = useCallback(() => {
        const currentIndex = THEMES_ORDER.indexOf(theme);
        if (currentIndex === -1) { setTheme(THEMES_ORDER[0]); return; }
        const nextIndex = (currentIndex + 1) % THEMES_ORDER.length;
        setTheme(THEMES_ORDER[nextIndex]);
    }, [theme]);

    const handleColorChange = useCallback((key: keyof CustomThemeColors, val: string) => { 
        const newColors = { ...activeColors, [key]: val }; 
        setActiveColors(newColors); 
    }, [activeColors]);

    const handleSaveTheme = useCallback(async () => { 
        const newCustomizations = { ...allCustomizations, [theme]: activeColors }; 
        setAllCustomizations(newCustomizations); 
        await saveSetting('themeCustomizations', newCustomizations); 
        setShowThemeEditor(false); 
    }, [allCustomizations, theme, activeColors]);

    const handleResetTheme = useCallback(async () => { 
        const defaults = THEME_METADATA[theme].defaults; 
        setActiveColors(defaults); 
        const newCustomizations = { ...allCustomizations }; 
        delete newCustomizations[theme]; 
        setAllCustomizations(newCustomizations); 
        await saveSetting('themeCustomizations', newCustomizations); 
        setShowThemeEditor(false); 
    }, [theme, allCustomizations]);

    const handleGenerateRandomTheme = useCallback(async (slot: AppTheme) => {
        setIsRandomizing(true);
        setTimeout(async () => {
            try {
                let list: CustomThemeColors[] = [];
                if (slot === 'custom-dark') list = PRESET_DARK;
                else if (slot === 'custom-light') list = PRESET_LIGHT;
                else list = PRESET_FANTASY;
                
                const randomIndex = Math.floor(Math.random() * list.length);
                const randomColors = list[randomIndex];
                const newCustomizations = { ...allCustomizations, [slot]: randomColors };
                
                setAllCustomizations(newCustomizations);
                await saveSetting('themeCustomizations', newCustomizations);
                setTheme(slot);
            } catch (e) { 
                console.error("Theme generation failed", e); 
            } finally { 
                setIsRandomizing(false); 
            }
        }, 1500);
    }, [allCustomizations]);

    const handleSelectTheme = useCallback((selectedTheme: AppTheme) => {
        setTheme(selectedTheme);
        setShowThemeSelector(false);
    }, []);

    // 4. Computed Data for UI
    const nextThemeData = useMemo(() => {
        let currentIndex = THEMES_ORDER.indexOf(theme);
        if (currentIndex === -1) currentIndex = 0; 
        const nextIndex = (currentIndex + 1) % THEMES_ORDER.length;
        const nextThemeKey = THEMES_ORDER[nextIndex];
        const nextMeta = THEME_METADATA[nextThemeKey];
        const nextColors = allCustomizations[nextThemeKey] || nextMeta.defaults;
        
        // Calculate brightness for icon
        const hex = nextColors.surface.replace('#', '');
        const r = parseInt(hex.substring(0,2), 16);
        const g = parseInt(hex.substring(2,4), 16);
        const b = parseInt(hex.substring(4,6), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        
        return { bgColor: nextColors.surface, isLight: brightness > 128 };
    }, [theme, allCustomizations]);

    return {
        theme,
        setTheme,
        activeColors,
        allCustomizations,
        isRandomizing,
        showThemeEditor,
        setShowThemeEditor,
        showThemeSelector,
        setShowThemeSelector,
        nextThemeData,
        handleCycleTheme,
        handleColorChange,
        handleSaveTheme,
        handleResetTheme,
        handleGenerateRandomTheme,
        handleSelectTheme,
        settingsLoaded
    };
};

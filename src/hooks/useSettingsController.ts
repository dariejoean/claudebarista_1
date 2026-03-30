
import { useState, useEffect } from 'react';
import { isHapticsEnabled, setHapticsEnabled } from '../utils/haptics';

export const useSettingsController = () => {
    const [editorConfig, setEditorConfig] = useState<{ title: string; key: string } | null>(null);
    const [showTamperEditor, setShowTamperEditor] = useState(false);
    const [showMaintenanceEditor, setShowMaintenanceEditor] = useState(false);
    const [showWaterEditor, setShowWaterEditor] = useState(false); 
    const [isSecure, setIsSecure] = useState(true);
    const [isStandalone, setIsStandalone] = useState(false);
    
    // Haptics State
    const [hapticsOn, setHapticsOn] = useState(isHapticsEnabled());

    useEffect(() => {
        const secure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        setIsSecure(secure);
        const inStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
        setIsStandalone(inStandalone);
    }, []);

    const toggleHaptics = () => {
        const newVal = !hapticsOn;
        setHapticsOn(newVal);
        setHapticsEnabled(newVal);
    };

    return {
        editorConfig, setEditorConfig,
        showTamperEditor, setShowTamperEditor,
        showMaintenanceEditor, setShowMaintenanceEditor,
        showWaterEditor, setShowWaterEditor,
        isSecure,
        isStandalone,
        hapticsOn,
        toggleHaptics
    };
};

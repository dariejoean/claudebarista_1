
export const HAPTIC_KEY = 'pharmabarista_haptics_enabled';

export const isHapticsEnabled = (): boolean => {
    // Default to true if not set
    return localStorage.getItem(HAPTIC_KEY) !== 'false';
};

export const setHapticsEnabled = (enabled: boolean) => {
    localStorage.setItem(HAPTIC_KEY, String(enabled));
};

export const triggerHaptic = (pattern: number | number[]) => {
    if (isHapticsEnabled() && typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
            navigator.vibrate(pattern);
        } catch (e) {
            // Ignore errors on devices that don't support it or block it
        }
    }
};


// MD3 3D STYLES
// Depth: Matches the "Settings" buttons style (Clean shadow + subtle border)
export const DEPTH_SHADOW = "shadow-md";
export const PRESSED_SHADOW = "active:shadow-inner active:translate-y-[1px] active:shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.1)]";
export const GLASS_BORDER = "border border-white/5";

// Updated to rounded-2xl to match the "elegant" settings buttons
export const BOX_STYLE = `bg-surface-container rounded-2xl p-4 transition-all duration-300 relative overflow-hidden h-28 flex flex-col justify-between ${DEPTH_SHADOW} ${GLASS_BORDER} ${PRESSED_SHADOW}`;
export const DYNAMIC_BOX_STYLE = `bg-surface-container rounded-2xl p-5 overflow-hidden flex flex-col transition-all duration-300 ${DEPTH_SHADOW} ${GLASS_BORDER}`;

// Standard Single Line Label - Updated for High Contrast and Themed Colors
export const LABEL_STYLE = "text-[11px] font-bold text-[var(--color-box-label)] uppercase tracking-wider w-full text-center mb-1 drop-shadow-sm leading-tight line-clamp-2";
// Multiline Label for Units - Updated for High Contrast and Themed Colors
export const MULTILINE_LABEL_STYLE = "text-[11px] font-bold text-[var(--color-box-label)] uppercase tracking-wider w-full text-center mb-1 leading-tight drop-shadow-sm line-clamp-2";

export const VALUE_WRAPPER_STYLE = "flex-1 flex items-center justify-center w-full";

// Unified Large Font Style - text-4xl with subtle shadow
export const UNIFIED_VALUE_STYLE = "text-4xl font-normal text-on-surface tracking-tighter drop-shadow-sm";

// STRICT CENTERING
export const NUMERIC_INPUT_STYLE = `${UNIFIED_VALUE_STYLE} outline-none bg-transparent p-0 m-0 text-center focus:ring-0 appearance-none w-full placeholder:text-on-surface/20`; 

// Updated Header Style
export const SECTION_HEADER_STYLE = "text-crema-400 text-base font-black uppercase tracking-[0.2em] text-center w-full flex items-center justify-center py-1 drop-shadow-sm opacity-90";

// Helper styles for dynamic theme
export const getDynamicSectionHeaderStyle = () => {
    return { color: 'var(--color-section-header)' };
};
export const getDynamicLabelStyle = () => {
    return { color: 'var(--color-box-label)' };
};

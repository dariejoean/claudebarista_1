
import { AppTheme, CustomThemeColors, TagCategory } from "./types";

export type { AppTheme, TagCategory };

// Updated Order: Navy -> Forest -> Coffee -> Custom Dark -> Custom Light -> Custom Random
export const THEMES_ORDER: AppTheme[] = [
    'blue-navy-dark', 
    'blue-navy-light', 
    'green-forest-dark', 
    'green-forest-light', 
    'brown-coffee-dark', 
    'brown-coffee-light', 
    'custom-dark',
    'custom-light',
    'custom-random'
];

export const THEME_METADATA: Record<AppTheme, { name: string; defaults: CustomThemeColors }> = {
    // Custom Slots
    'custom-dark': { name: 'Custom Dark', defaults: { surface: '#1E1E1E', surfaceContainer: '#323232', sectionHeader: '#E5E5E5', boxLabel: '#FACC15' } },
    'custom-light': { name: 'Custom Light', defaults: { surface: '#E0E0E0', surfaceContainer: '#FFFFFF', sectionHeader: '#171717', boxLabel: '#0284C7' } },
    'custom-random': { name: 'Custom Random', defaults: { surface: '#262626', surfaceContainer: '#404040', sectionHeader: '#A3A3A3', boxLabel: '#FACC15' } },
    
    // Updated defaults to match index.html
    'green-forest-light': { name: 'Forest Light', defaults: { surface: '#95A89E', surfaceContainer: '#BDCCC4', sectionHeader: '#064E3B', boxLabel: '#047857' } },
    'green-forest-dark': { name: 'Forest Dark', defaults: { surface: '#3B4D44', surfaceContainer: '#4A5C53', sectionHeader: '#D1FAE5', boxLabel: '#FACC15' } },
    'blue-navy-light': { name: 'Navy Light', defaults: { surface: '#95A2B0', surfaceContainer: '#BFC9D1', sectionHeader: '#172554', boxLabel: '#1D4ED8' } },
    'blue-navy-dark': { name: 'Navy Dark', defaults: { surface: '#3B4557', surfaceContainer: '#485263', sectionHeader: '#DBEAFE', boxLabel: '#FACC15' } },
    'brown-coffee-light': { name: 'Latte Light', defaults: { surface: '#A69E96', surfaceContainer: '#CEC6C0', sectionHeader: '#451A03', boxLabel: '#78350F' } },
    'brown-coffee-dark': { name: 'Espresso Dark', defaults: { surface: '#4F423E', surfaceContainer: '#5E514D', sectionHeader: '#FEF3C7', boxLabel: '#FACC15' } },
};

// --- PRESET THEMES LISTS ---
// RULES APPLIED:
// Dark Themes: Box Label ALWAYS #FACC15 (Yellow 400). Section Header: Light Pastel/White tint.
// Light Themes: Box Label ALWAYS Colorful (Saturated 600/700). Section Header: Dark Saturated (900/950).

export const PRESET_DARK: CustomThemeColors[] = [
    { surface: '#1E293B', surfaceContainer: '#334155', sectionHeader: '#E2E8F0', boxLabel: '#FACC15' }, // Slate Lighter
    { surface: '#27272A', surfaceContainer: '#3F3F46', sectionHeader: '#F4F4F5', boxLabel: '#FACC15' }, // Zinc Lighter
    { surface: '#262626', surfaceContainer: '#404040', sectionHeader: '#FAFAFA', boxLabel: '#FACC15' }, // Neutral Lighter
    { surface: '#172033', surfaceContainer: '#2D3B55', sectionHeader: '#E0F2FE', boxLabel: '#FACC15' }, // Midnight Lighter
    { surface: '#202B36', surfaceContainer: '#344252', sectionHeader: '#D1E5F5', boxLabel: '#FACC15' }, // Deep Blue Grey Lighter
    { surface: '#2C2522', surfaceContainer: '#453A35', sectionHeader: '#F5E6E0', boxLabel: '#FACC15' }, // Espresso Roast Lighter
    { surface: '#1C1917', surfaceContainer: '#352F2B', sectionHeader: '#E7E5E4', boxLabel: '#FACC15' }, // Stone Lighter
    { surface: '#1F2937', surfaceContainer: '#374151', sectionHeader: '#F3F4F6', boxLabel: '#FACC15' }, // Gray Lighter
    { surface: '#1E2229', surfaceContainer: '#2E3542', sectionHeader: '#E2E8F0', boxLabel: '#FACC15' }, // Gunmetal Lighter
    { surface: '#261A1F', surfaceContainer: '#402B33', sectionHeader: '#FCE7F3', boxLabel: '#FACC15' }  // Dark Berry Lighter
];

export const PRESET_LIGHT: CustomThemeColors[] = [
    { surface: '#E2E8F0', surfaceContainer: '#FFFFFF', sectionHeader: '#0F172A', boxLabel: '#334155' }, // Slate Darker
    { surface: '#E4E4E7', surfaceContainer: '#FFFFFF', sectionHeader: '#18181B', boxLabel: '#3F3F46' }, // Zinc Darker
    { surface: '#E5E5E5', surfaceContainer: '#FFFFFF', sectionHeader: '#171717', boxLabel: '#404040' }, // Neutral Darker
    { surface: '#FDE68A', surfaceContainer: '#FFFBEB', sectionHeader: '#451A03', boxLabel: '#B45309' }, // Cream/Amber Darker
    { surface: '#BAE6FD', surfaceContainer: '#F0F9FF', sectionHeader: '#0C4A6E', boxLabel: '#0369A1' }, // Sky Darker
    { surface: '#E9D5FF', surfaceContainer: '#FAF5FF', sectionHeader: '#581C87', boxLabel: '#7E22CE' }, // Lavender Darker
    { surface: '#A7F3D0', surfaceContainer: '#ECFDF5', sectionHeader: '#064E3B', boxLabel: '#047857' }, // Mint Darker
    { surface: '#FECDD3', surfaceContainer: '#FFF1F2', sectionHeader: '#881337', boxLabel: '#BE123C' }, // Rose Darker
    { surface: '#FBD38D', surfaceContainer: '#FFFAF0', sectionHeader: '#7C2D12', boxLabel: '#C05621' }, // Floral White Darker
    { surface: '#E5E7EB', surfaceContainer: '#FFFFFF', sectionHeader: '#111827', boxLabel: '#374151' }  // Cool Gray Darker
];

export const PRESET_FANTASY: CustomThemeColors[] = [
    { surface: '#16232E', surfaceContainer: '#223849', sectionHeader: '#CFFAFE', boxLabel: '#FACC15' }, // Cyberpunk Cyan Modified
    { surface: '#2E1065', surfaceContainer: '#5B21B6', sectionHeader: '#FAE8FF', boxLabel: '#FACC15' }, // Vaporwave Purple
    { surface: '#064E3B', surfaceContainer: '#065F46', sectionHeader: '#D1FAE5', boxLabel: '#FACC15' }, // Matrix Green Modified
    { surface: '#450A0A', surfaceContainer: '#7F1D1D', sectionHeader: '#FEE2E2', boxLabel: '#FACC15' }, // Dracula Red
    { surface: '#172554', surfaceContainer: '#1E40AF', sectionHeader: '#DBEAFE', boxLabel: '#FACC15' }, // Deep Ocean
    { surface: '#312E81', surfaceContainer: '#4338CA', sectionHeader: '#E0E7FF', boxLabel: '#FACC15' }, // Indigo Night
    { surface: '#3F6212', surfaceContainer: '#4D7C0F', sectionHeader: '#FEF9C3', boxLabel: '#FACC15' }, // Forest Gold Modified
    { surface: '#701A75', surfaceContainer: '#A21CAF', sectionHeader: '#FAE8FF', boxLabel: '#FACC15' }, // Fuchsia Fantasy Modified
    { surface: '#334155', surfaceContainer: '#475569', sectionHeader: '#FFEDD5', boxLabel: '#FACC15' }, // Slate Orange Modified
    { surface: '#365314', surfaceContainer: '#4D7C0F', sectionHeader: '#ECFCCB', boxLabel: '#FACC15' }  // Lime Dark Modified
];

// Updated Structure based on user JSON
export const TAG_DATA_DEFAULT = {
    aspect: {
        name: 'Aspect',
        positive: ["crema_densa", "tigrat_pronuntat", "culoarea_alunei", "persistenta_mare", "textura_elastica", "omogenitate", "micro_bule"],
        negative: ["crema_inexistenta", "bule_mari", "culoare_palida", "disipare_rapida", "pete_albe", "urme_arsura", "inconsistent"]
    },
    aroma: {
        name: 'Aromă',
        positive: ["note_florale", "fructe_coapte", "ciocolatiu", "condimentat", "nuci_prajite", "dulceata_aromatica", "intensitate_ridicata"],
        negative: ["miros_arsura", "pamantiu", "chimic_medicinal", "ranced", "ierbos", "mucegait", "lipsa_aroma"]
    },
    taste: {
        name: 'Gust',
        positive: ["echilibrat", "dulceata_naturala", "aciditate_vibranta", "note_citrice", "caramelizat", "complexitate", "final_curat"],
        negative: ["amar_excesiv", "acru_taios", "metalic", "sarat", "aspru", "astringent", "plat"]
    },
    body: {
        name: 'Corp',
        positive: ["corp_plin", "catifelat", "cremos", "uleios", "rotund", "textura_siropoasa", "postgust_lung"],
        negative: ["apatos", "corp_subtire", "zgrunturos", "nisipos", "scurt", "dezechilibrat", "postgust_neplacut"]
    }
};

// Legacy export for compatibility if needed, though we primarily use defaults for seeding DB
export const TAG_DATA = TAG_DATA_DEFAULT;

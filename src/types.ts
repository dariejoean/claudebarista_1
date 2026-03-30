
export enum TampLevel {
  WEAK = 'Tampare Slabă',
  MEDIUM = 'Tampare Medie',
  STRONG = 'Tampare Puternică'
}

export type TagCategory = 'aspect' | 'aroma' | 'taste' | 'body';

export type AppTheme = 
  | 'green-forest-light' 
  | 'green-forest-dark' 
  | 'blue-navy-light' 
  | 'blue-navy-dark' 
  | 'brown-coffee-light' 
  | 'brown-coffee-dark' 
  | 'custom-dark' 
  | 'custom-light' 
  | 'custom-random';

// --- NEW DYNAMIC LIST TYPE ---
export interface ListItem {
    id: string;
    label: string;
    order: number;
    // New optional field for nested characteristics (e.g. Tamper levels)
    levels?: string[]; 
    
    // Extended fields for rich items (Tamper, Milk, Maintenance)
    description?: string;
    images?: string[];
    thumbnails?: string[];
    frequency?: string; // New field for Maintenance Operations
    
    // New field for Grinders
    scaleType?: 'linear' | 'eureka';
}
// -----------------------------

// --- MAINTENANCE LOG ENTRY ---
export interface MaintenanceLogEntry {
    id: string;
    operationId: string; // Links to ListItem.id in maintenance_types
    operationLabel: string; // Snapshot of name
    dueDate: string; // ISO Date YYYY-MM-DD
    completedDate?: string;
    status: 'pending' | 'completed';
}
// -----------------------------

// --- PWA INSTALL EVENT ---
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}
// -------------------------

export interface EquipmentDetails {
    name: string;
    description: string;
    features: string;
    // Optional fields for extended coffee data when returned from AI
    roaster?: string;
    roastDate?: string;
    roastLevel?: string;
    process?: string;
    origin?: string;
    altitude?: number;
    tastingNotes?: string[];
    compositionArabica?: number;
    compositionRobusta?: number;
}

export interface ProductItem {
    id?: number;
    name: string;
    description?: string; 
    features?: string; 
    images?: string[]; 
    thumbnails?: string[]; // New field for low-res previews
    
    // Extended Coffee Data
    roaster?: string;
    roastDate?: string;
    roastLevel?: string;
    beanType?: 'arabica' | 'robusta' | 'blend'; // New field for bean type
    process?: string;
    origin?: string;
    altitude?: number;
    tastingNotes?: string[];
    compositionArabica?: number;
    compositionRobusta?: number;

    // Extended Machine Data
    boilerType?: string; // Single / Dual / HX / Thermoblock
    groupType?: string; // E61 / Saturation / etc
    hasPid?: boolean;
    targetTemp?: number;
    pumpPressure?: number;
    pumpType?: string; // Vibration / Rotary
    hasPreinfusion?: boolean;
    hasFlowControl?: boolean;
    portafilterSize?: number; // mm
    basketType?: string; // Standard / Precision

    // Extended Grinder Data
    scaleType?: 'linear' | 'eureka'; // New field for scale type
}

export interface ExpertAnalysisResult {
  score: string;      
  diagnosis: string;  
  suggestion: string; 
  
  issue?: string;
  fix?: string;
  details?: string;
}

export interface ShotTags {
  aspect: string[];
  aroma: string[];
  taste: string[];
  body: string[];
}

export interface ChartDataPoint {
  time: number;
  weight: number;
  flow: number;
  pressure: number;
}

export interface ShotData {
  id: string;
  date: string;
  machineName: string;
  beanName: string;
  waterName?: string; 
  
  // NEW: Store the basket used
  basketName?: string;

  // Changed from restricted Enum to string to support custom tamper levels
  tampLevel: string;
  tamperName?: string;
  
  // NEW: Store the grinder used
  grinderName?: string;

  doseIn: number; // grams
  yieldOut: number; // grams
  time: number; // seconds
  preinfusionTime?: number; // seconds
  infusionTime?: number; // seconds
  postinfusionTime?: number; // seconds
  effectiveExtractionTime?: number; // seconds
  temperature: number; // Celsius
  pressure: number; // Bar
  avgPressure?: number;
  maxPressure?: number;
  flowControlSetting?: number; // Rotations
  otherAccessories?: string[]; // NEW: Store accessories used
  grindSetting?: number;
  beanType?: 'arabica' | 'robusta' | 'blend'; // New field for bean type
  // NEW: Store the type of scale used for this specific shot
  grindScaleType?: 'linear' | 'eureka';
  
  tags: ShotTags;

  ratingAspect?: number;
  ratingAroma?: number;
  ratingTaste?: number;
  ratingBody?: number;
  ratingDescription?: number;
  
  // UPDATED FIELD: Array of numbers to support combinations (e.g. [1, 3] for Sour + Bitter)
  // 1=Sour, 2=Balanced, 3=Bitter
  tasteConclusion?: number[]; 

  ratingOverall?: number; 

  notes: string;
  // NEW FIELD: Post-extraction notes
  postExtractionNotes?: string;

  expertAdvice?: string; 
  structuredAnalysis?: ExpertAnalysisResult;
  images?: string[]; 
  thumbnails?: string[]; // New field for low-res previews
  
  // Legacy support for older records if needed (optional)
  roastLevel?: string;

  // NEW: Store the live extraction profile (time, weight, flow, pressure)
  extractionProfile?: ChartDataPoint[];
}

export interface SavedAnalysis {
    id?: number;
    date: string;
    period: string; 
    averageScore: number;
    trend: 'up' | 'down' | 'flat';
    expertReport: string;
}

export interface CustomThemeColors {
    surface: string;
    surfaceContainer: string;
    sectionHeader: string;
    boxLabel: string;
}

export type SettingsValue = 
    | string 
    | number 
    | boolean 
    | ListItem[] 
    | Record<string, CustomThemeColors> 
    | CustomThemeColors
    | EquipmentDetails
    | undefined;

export interface UserSettings {
  appTheme?: AppTheme;
  defaultMachine?: string;
  defaultBean?: string;
  defaultWater?: string; 
  defaultGrinder?: string;
  // NEW: Default Basket
  defaultBasket?: string;

  machineDetails?: EquipmentDetails;
  beanDetails?: EquipmentDetails;
  
  // Updated setting key to allow strings
  lastTampLevel?: string;
  lastTamper?: string; 
  lastBasket?: string; // New field for persistence
  
  lastGrindSetting?: number;
  lastTemperature?: number;
  
  // Map of customizations per theme key
  themeCustomizations?: Record<string, CustomThemeColors>;
  
  // Legacy cleanup (optional)
  customThemeColors?: CustomThemeColors;
  
  // Dynamic list storage keys
  [key: string]: SettingsValue;
}

export interface AnalysisRequest {
  shot: ShotData;
  image?: string;
}

export interface ExpertResponse {
  analysis: string;
  recommendation: string;
}

export interface AnalysisMeta {
    id: string;
    title: string;
    description: string;
}

// Added new sorting options
export type SortOption = 
    | 'date_desc' 
    | 'date_asc' 
    | 'rating_desc' 
    | 'rating_asc'
    | 'expert_score_desc'
    | 'expert_score_asc'
    | 'ratio_desc'
    | 'ratio_asc'
    | 'time_desc'
    | 'time_asc'
    | 'temp_desc'
    | 'temp_asc'
    | 'grind_desc'
    | 'grind_asc';

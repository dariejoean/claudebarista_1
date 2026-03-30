
import Dexie, { type EntityTable } from 'dexie';
import { ShotData, UserSettings, ProductItem, SavedAnalysis, ListItem, TampLevel, SettingsValue, MaintenanceLogEntry } from '../types';
import { TAG_DATA_DEFAULT } from '../constants';
import { getReconstructedTimes } from '../utils/shotUtils';

// Enterprise-grade: Define strongly typed Database Class extending Dexie
class PharmaBaristaDB extends Dexie {
  shots!: EntityTable<ShotData, 'id'>;
  settings!: EntityTable<{ key: string; value: SettingsValue }, 'key'>;
  machines!: EntityTable<ProductItem, 'id'>;
  beans!: EntityTable<ProductItem, 'id'>;
  analyses!: EntityTable<SavedAnalysis, 'id'>;
  maintenanceLog!: EntityTable<MaintenanceLogEntry, 'id'>;

  constructor() {
    super('PharmaBaristaDB');

    // Schema definition versioning
    // V5: Consistent with App Version
    this.version(5).stores({
      shots: 'id, date, machineName, beanName',
      settings: 'key',
      machines: '++id, &name', // &name = unique index
      beans: '++id, &name',
      analyses: '++id, date',
      maintenanceLog: 'id, dueDate, status' // Index for querying
    });
  }
}

// Singleton instance initialization
export const db = new PharmaBaristaDB();

// Global DB Error Handler for Stability
db.on('versionchange', (event: IDBVersionChangeEvent) => {
    (event.target as IDBDatabase)?.close();
    console.warn("Database version changed in another tab. Reloading...");
    window.location.reload();
});

db.on('blocked', () => {
    console.error("Database upgrade blocked. Please close other tabs of this app.");
    alert("Actualizare bază de date blocată. Te rugăm să închizi celelalte tab-uri ale aplicației și să reîncarci pagina.");
});

// --- EMERGENCY RECOVERY ---
export const hardResetDatabase = async (): Promise<void> => {
    try {
        console.warn("INITIATING HARD RESET...");
        await db.delete();
        localStorage.clear();
        console.log("Database and LocalStorage cleared.");
    } catch (e) {
        console.error("Hard reset failed:", e);
        // Fallback: try to clear localStorage at least
        localStorage.clear();
    }
};

// --- SEEDING / MIGRATION LOGIC ---
export const ensureDefaultSettings = async (): Promise<void> => {
    
    const categories = ['aspect', 'aroma', 'taste', 'body'] as const;

    try {
        // Loop through categories and seed Positive/Negative lists
        for (const cat of categories) {
            // Positive
            const keyPos = `tags_${cat}_positive`;
            const hasPos = await db.settings.get(keyPos);
            if (!hasPos) {
                const items: ListItem[] = TAG_DATA_DEFAULT[cat].positive.map((t, i) => ({ 
                    id: crypto.randomUUID(), 
                    label: t.replace(/_/g, ' '), // Beautify label (remove underscores)
                    order: i 
                }));
                await db.settings.put({ key: keyPos, value: items });
            }

            // Negative
            const keyNeg = `tags_${cat}_negative`;
            const hasNeg = await db.settings.get(keyNeg);
            if (!hasNeg) {
                const items: ListItem[] = TAG_DATA_DEFAULT[cat].negative.map((t, i) => ({ 
                    id: crypto.randomUUID(), 
                    label: t.replace(/_/g, ' '), 
                    order: i 
                }));
                await db.settings.put({ key: keyNeg, value: items });
            }
        }

        // Check for Tamp Levels
        const hasTamp = await db.settings.get('tamp_levels');
        if (!hasTamp) {
            // Use the Enum values as defaults
            const defaults = [TampLevel.WEAK, TampLevel.MEDIUM, TampLevel.STRONG];
            const items: ListItem[] = defaults.map((t, i) => ({ id: crypto.randomUUID(), label: t, order: i }));
            await db.settings.put({ key: 'tamp_levels', value: items });
        }
    } catch (error) {
        console.error("Failed to ensure default settings:", error);
        // Non-fatal, app can still run
    }
};

// --- SHOT METHODS ---

export const migrateShotTimes = async (): Promise<void> => {
    try {
        const shots = await db.shots.toArray();
        console.log(`Starting migration for ${shots.length} shots.`);
        for (const shot of shots) {
            const newTimes = getReconstructedTimes(shot, true); // Force recalculation
            console.log(`Migrating shot ${shot.id}: old preinfusion=${shot.preinfusionTime}, new=${newTimes.preinfusionTime}`);
            await db.shots.update(shot.id, {
                preinfusionTime: newTimes.preinfusionTime,
                infusionTime: newTimes.infusionTime,
                postinfusionTime: newTimes.postinfusionTime,
                effectiveExtractionTime: newTimes.effectiveExtractionTime
            });
        }
        console.log("Migration completed successfully.");
    } catch (error) {
        console.error("Migration failed:", error);
    }
};

export const saveShot = async (shot: ShotData): Promise<void> => {
  try {
    // Put handles both insert and update (upsert)
    await db.shots.put(shot);
  } catch (error: unknown) {
    console.error("Failed to save shot:", error);
    throw error;
  }
};

export const updateShot = async (id: string, changes: Partial<ShotData>): Promise<void> => {
    try {
        await db.shots.update(id, changes);
    } catch (error) {
        console.error("Failed to update shot:", error);
        throw error;
    }
};

export const deleteShot = async (id: string): Promise<void> => {
  try {
    await db.shots.delete(id);
  } catch (error) {
    console.error("Failed to delete shot:", error);
    throw error;
  }
};

export const clearAllShots = async (): Promise<void> => {
  try {
    await db.shots.clear();
  } catch (error) {
    console.error("Failed to clear shots:", error);
    throw error;
  }
};

// --- PRODUCT METHODS (Machines & Beans) ---

export const saveProduct = async (type: 'machine' | 'bean', product: ProductItem): Promise<void> => {
    const table = type === 'machine' ? db.machines : db.beans;
    try {
        const existing = await table.where('name').equals(product.name).first();
        if (existing && existing.id) {
            product.id = existing.id;
        }
        await table.put(product);
    } catch (error) {
        console.error(`Failed to save product (${type}):`, error);
        throw error;
    }
};

export const deleteProduct = async (type: 'machine' | 'bean', id: number): Promise<void> => {
    const table = type === 'machine' ? db.machines : db.beans;
    try {
        await table.delete(id);
    } catch (error) {
        console.error(`Failed to delete product (${type}):`, error);
        throw error;
    }
};

export const getAllProducts = async (type: 'machine' | 'bean'): Promise<ProductItem[]> => {
    const table = type === 'machine' ? db.machines : db.beans;
    return await table.orderBy('name').toArray();
};

export const clearAllProducts = async (): Promise<void> => {
    try {
        await db.machines.clear();
        await db.beans.clear();
    } catch (error) {
        console.error("Failed to clear products:", error);
        throw error;
    }
};

// --- ANALYSIS METHODS ---

export const saveAnalysis = async (analysis: SavedAnalysis): Promise<void> => {
    await db.analyses.add(analysis);
};

export const getAnalyses = async (): Promise<SavedAnalysis[]> => {
    return await db.analyses.orderBy('date').reverse().toArray();
};

export const deleteAnalysis = async (id: number): Promise<void> => {
    await db.analyses.delete(id);
};

// --- MAINTENANCE LOG METHODS ---

export const getMaintenanceTasks = async (): Promise<MaintenanceLogEntry[]> => {
    return await db.maintenanceLog.orderBy('dueDate').toArray();
};

export const addMaintenanceTask = async (task: MaintenanceLogEntry): Promise<void> => {
    await db.maintenanceLog.put(task);
};

export const deleteMaintenanceTask = async (id: string): Promise<void> => {
    await db.maintenanceLog.delete(id);
};

// --- SETTINGS METHODS ---

export const saveSetting = async (key: string, value: SettingsValue): Promise<void> => {
  try {
    await db.settings.put({ key, value });
  } catch (error) {
    console.error(`Failed to save setting ${key}:`, error);
  }
};

export const getSetting = async (key: string): Promise<SettingsValue | undefined> => {
  try {
    const result = await db.settings.get(key);
    return result ? result.value : undefined;
  } catch (error) {
    console.error(`Failed to get setting ${key}:`, error);
    return undefined;
  }
};

export const getAllSettings = async (): Promise<UserSettings> => {
  try {
    const allParams = await db.settings.toArray();
    const settingsObj: Record<string, SettingsValue> = {};
    allParams.forEach(item => {
      settingsObj[item.key] = item.value;
    });
    return settingsObj as UserSettings;
  } catch (error) {
    console.error("Failed to get all settings:", error);
    return {};
  }
};

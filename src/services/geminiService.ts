import { ShotData, ExpertAnalysisResult, ProductItem } from "../types";
import { evaluateShotLocally, getBaristaAdvice, generateLocalTrendReport, identifyEquipmentLocally } from "./expertSystem";

/**
 * Identifies equipment or coffee details locally.
 */
export const identifyEquipment = async (query: string, type: 'machine' | 'coffee' | 'tamper' | 'milk' | 'water' | 'grinder' | 'basket' | 'accessory' | 'maintenance', _images?: string[]): Promise<Partial<ProductItem> & { frequency?: string }> => {
  // We use the local mock identification
  const result = identifyEquipmentLocally(query, type);
  return result as Partial<ProductItem> & { frequency?: string };
};

/**
 * Analyzes a shot using the local expert system.
 */
export const analyzeShot = async (shot: ShotData, machineDetails?: ProductItem, beanDetails?: ProductItem): Promise<ExpertAnalysisResult | string> => {
  try {
    const result = evaluateShotLocally(shot, machineDetails, beanDetails);
    return result;
  } catch (error: unknown) {
    console.error("Local Analysis Error:", error instanceof Error ? error.message : error);
    return "Eroare la analiza locală.";
  }
};

/**
 * Chat with a rule-based local barista.
 */
export const chatWithBarista = async (message: string, contextShots: ShotData[] = []): Promise<string> => {
    try {
        return getBaristaAdvice(message, contextShots);
    } catch (e: unknown) {
        console.error("Local Chat Error:", e);
        return "Eroare de conexiune cu asistentul local.";
    }
};

/**
 * Generates a trend report locally.
 */
export const generateTrendReport = async (shots: ShotData[]): Promise<string> => {
    try {
        return generateLocalTrendReport(shots);
    } catch (e: unknown) {
        console.error("Local Trend Report Error:", e);
        return "Eroare la generarea raportului local.";
    }
};

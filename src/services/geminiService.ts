import { ShotData, ExpertAnalysisResult, ProductItem } from "../types";
import {
  evaluateShotLocally,
  getBaristaAdvice,
  generateLocalTrendReport,
  identifyEquipmentLocally
} from "./expertSystem";

// ── HELPER: Apel la proxy-ul AI din server ────────────────────────────────
// Cheia API nu ajunge niciodata la client — ramane pe server.
async function callServerAI(contents: object[], model = 'gemini-2.0-flash'): Promise<string> {
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, contents })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'HTTP ' + response.status }));
    throw new Error(err.error || 'Server error: ' + response.status);
  }

  const data = await response.json();
  // Extrage textul din raspunsul Gemini
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || data?.text || '';
}

// ── HELPER: Construieste prompt-ul pentru analiza unui shot ───────────────
function buildShotPrompt(
  shot: ShotData,
  machineDetails?: ProductItem,
  beanDetails?: ProductItem
): string {
  const lines = [
    "Esti un Q-Grader expert in espresso. Analizeaza urmatoarea extractie si ofera un diagnostic detaliat in romana:",
    "",
    "## Date Extractie",
    "- Masina: " + (shot.machineName || 'Necunoscuta'),
    "- Cafea: " + (shot.beanName || 'Necunoscuta'),
    "- Doza: " + (shot.dose ?? '?') + "g IN -> " + (shot.yield ?? '?') + "g OUT",
    "- Timp total extractie: " + (shot.extractionTime ?? '?') + "s",
    "- Timp preinfuzie: " + (shot.preinfusionTime ?? 0) + "s",
    "- Temperatura: " + (shot.temperature ?? '?') + "C",
    "- Presiune: " + (shot.pressure ?? '?') + " bar",
    "- Macinare: " + (shot.grinderSetting ?? '?'),
  ];

  if (shot.flowRate) lines.push("- Flow Rate: " + shot.flowRate + " g/s");
  if (shot.tags) {
    const allTags = [...(shot.tags.taste || []), ...(shot.tags.aroma || []), ...(shot.tags.aspect || [])];
    if (allTags.length > 0) lines.push("- Note senzoriale: " + allTags.join(', '));
  }
  if (machineDetails?.boilerType) lines.push("", "## Echipament", "- Tip boiler: " + machineDetails.boilerType);
  if (beanDetails) {
    lines.push("", "## Cafea");
    if (beanDetails.process) lines.push("- Procesare: " + beanDetails.process);
    if (beanDetails.altitude) lines.push("- Altitudine: " + beanDetails.altitude + "m");
    if (beanDetails.roastLevel) lines.push("- Prajire: " + beanDetails.roastLevel);
  }
  lines.push(
    "", "## Cerinta",
    "Ofera: 1) Diagnostic, 2) Cauza principala, 3) Recomandari concrete, 4) Scor estimat 0-100 (SCA).",
    "Fii concis si practic. Limba: romana."
  );
  return lines.join('\n');
}

// ── EXPORTS ───────────────────────────────────────────────────────────────

/** Identifica echipament — ramane local */
export const identifyEquipment = async (
  query: string,
  type: 'machine' | 'coffee' | 'tamper' | 'milk' | 'water' | 'grinder' | 'basket' | 'accessory' | 'maintenance',
  _images?: string[]
): Promise<Partial<ProductItem> & { frequency?: string }> => {
  return identifyEquipmentLocally(query, type) as Partial<ProductItem> & { frequency?: string };
};

/**
 * Analizeaza un shot.
 * - mode 'offline': Expert System local (rapid, fara internet)
 * - mode 'online': Gemini prin proxy server (analiza avansata Q-Grader)
 * Cu fallback automat la local daca serverul nu raspunde.
 */
export const analyzeShot = async (
  shot: ShotData,
  machineDetails?: ProductItem,
  beanDetails?: ProductItem,
  mode: 'online' | 'offline' = 'offline'
): Promise<ExpertAnalysisResult | string> => {

  if (mode === 'offline') {
    try {
      return evaluateShotLocally(shot, machineDetails, beanDetails);
    } catch (error: unknown) {
      console.error("Local Analysis Error:", error instanceof Error ? error.message : error);
      return "Eroare la analiza locala.";
    }
  }

  // Modul Online — Gemini prin proxy server
  try {
    const prompt = buildShotPrompt(shot, machineDetails, beanDetails);
    const text = await callServerAI([{ role: 'user', parts: [{ text: prompt }] }]);
    if (!text) throw new Error("Raspuns gol de la server.");
    return text;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('[geminiService] Online analysis failed (' + msg + '), falling back to local.');
    try {
      return evaluateShotLocally(shot, machineDetails, beanDetails);
    } catch {
      return 'Analiza online a esuat: ' + msg;
    }
  }
};

/** Chat cu barista — offline sau online cu fallback */
export const chatWithBarista = async (
  message: string,
  contextShots: ShotData[] = [],
  mode: 'online' | 'offline' = 'offline'
): Promise<string> => {

  if (mode === 'offline') {
    try { return getBaristaAdvice(message, contextShots); }
    catch (e: unknown) { return "Eroare de conexiune cu asistentul local."; }
  }

  try {
    const ctx = contextShots.length > 0 ? 'Context: ultimele ' + contextShots.length + ' shot-uri. ' : '';
    const text = await callServerAI([{
      role: 'user',
      parts: [{ text: 'Esti PharmaBarista, expert barista AI. ' + ctx + 'Intrebare: ' + message }]
    }]);
    return text || "Nu am putut genera un raspuns.";
  } catch (e: unknown) {
    return getBaristaAdvice(message, contextShots);
  }
};

/** Genereaza raport de trend — offline sau online cu fallback */
export const generateTrendReport = async (
  shots: ShotData[],
  mode: 'online' | 'offline' = 'offline'
): Promise<string> => {

  if (mode === 'offline') {
    try { return generateLocalTrendReport(shots); }
    catch (e: unknown) { return "Eroare la generarea raportului local."; }
  }

  try {
    const summary = shots.slice(0, 20).map((s, i) =>
      'Shot ' + (i+1) + ': ' + s.dose + 'g->' + s.yield + 'g, ' + s.extractionTime + 's'
    ).join('\n');
    const text = await callServerAI([{
      role: 'user',
      parts: [{ text: 'Analizeaza aceste ' + shots.length + ' extractii si identifica trenduri:\n\n' + summary + '\n\nRaport in romana:' }]
    }]);
    return text || generateLocalTrendReport(shots);
  } catch (e: unknown) {
    return generateLocalTrendReport(shots);
  }
};

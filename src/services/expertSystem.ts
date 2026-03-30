
import { ShotData, ExpertAnalysisResult, ProductItem } from "../types";

// --- SCA STANDARDS & COFFEE PHYSICS CONSTANTS ---
const IDEAL_RATIO_MIN = 1.8;
const IDEAL_RATIO_MAX = 2.2;
const IDEAL_TIME_MIN = 24;
const IDEAL_TIME_MAX = 32;

/**
 * THE ADVANCED CORRECTION ENGINE (Local Expert System)
 * Interprets all variables and their effects on extraction.
 */
export const evaluateShotLocally = (shot: ShotData, machineDetails?: ProductItem, beanDetails?: ProductItem): ExpertAnalysisResult => {
    
    // 1. INPUT DATA & DERIVED METRICS
    const ratio = shot.doseIn > 0 ? shot.yieldOut / shot.doseIn : 0;
    const time = shot.time;
    const temp = shot.temperature;
    const pressure = shot.pressure;
    const flowRate = time > 0 ? shot.yieldOut / time : 0;
    
    const roastLevel = (beanDetails?.roastLevel || shot.roastLevel || "Medium").toLowerCase();
    const beanType = (beanDetails?.beanType || shot.beanType || "Arabica").toLowerCase();
    
    // Taste Conclusions
    let tasteConclusion: number[] = [];
    if (Array.isArray(shot.tasteConclusion)) {
        tasteConclusion = shot.tasteConclusion;
    } else if (typeof shot.tasteConclusion === 'number') {
        tasteConclusion = [shot.tasteConclusion];
    }
    
    const rTaste = shot.ratingTaste || 3;
    const rBody = shot.ratingBody || 3;
    const rAspect = shot.ratingAspect || 3;
    const rAroma = shot.ratingAroma || 3;

    const tags = shot.tags || { aspect: [], aroma: [], taste: [], body: [] };
    
    // --- DETECTION LOGIC ---
    const isSour = tasteConclusion.includes(1) || tags.taste.some(t => /acru|sarat|lamaie|otet|crud/i.test(t));
    const isBitter = tasteConclusion.includes(3) || tags.taste.some(t => /amar|cenusa|medicinal|arsura|tabac/i.test(t));
    const isBalanced = tasteConclusion.includes(2) || tags.taste.some(t => /echilibrat|dulce|fructat/i.test(t));
    const isWatery = rBody === 1 || tags.body.some(t => /apatos|subtire|gol/i.test(t));
    const isAstringent = tags.taste.some(t => /astringent|uscat|aspru|metalic/i.test(t));
    
    // Advanced Channeling Detection
    const hasChanneling = (isSour && isBitter) || 
                         (time < 20 && isBitter) || 
                         (isWatery && isAstringent) ||
                         (flowRate > 2.5 && pressure < 7);

    // 2. DIAGNOSTIC & ADVICE ENGINE
    let diagnosis = "";
    let suggestion = "";
    let nextShotFix = "";
    let technicalPenalty = 0;

    // --- A. CHANNELING ---
    if (hasChanneling) {
        diagnosis = "Channeling (Extracție Neuniformă)";
        suggestion = "Apa a găsit căi de rezistență minimă în puc. Rezultatul este o combinație neplăcută de sub-extracție (acru) și supra-extracție (amar/astringent).";
        nextShotFix = "Îmbunătățește distribuția cafelei folosind un instrument WDT. Asigură-te că tamparea este perfect orizontală. Nu lovi portafiltrul după tampare. Verifică dacă sita este potrivită pentru doză.";
        technicalPenalty += 3.0;
    }
    // --- B. SUB-EXTRACTION (Too Sour / Too Fast) ---
    else if (isSour || time < IDEAL_TIME_MIN || flowRate > 2.0) {
        diagnosis = time < 18 ? "Sub-extracție Severă (Gushing)" : "Sub-extracție";
        
        if (time < 22) {
            suggestion = "Timpul de contact este prea scurt pentru a extrage zaharurile, lăsând doar acizii dominanți.";
            nextShotFix = "Râșnește MAI FIN (ex: -0.5 unități). Dacă doza este mică pentru sită, crește doza cu 0.5g - 1g.";
        } else if (roastLevel.includes("light") || roastLevel.includes("ușoară")) {
            suggestion = "Cafeaua prăjită light este densă și greu de extras. Are nevoie de mai multă energie (temp) și timp.";
            nextShotFix = `Crește temperatura la 94-96°C. Încearcă o rație mai lungă (1:2.2 - 1:2.5). Râșnește mai fin.`;
            if (temp < 92) technicalPenalty += 1.0;
        } else if (beanType.includes("robusta")) {
            suggestion = "Robusta are nevoie de o extracție mai controlată pentru a evita asprimea.";
            nextShotFix = "Scade temperatura la 90-91°C și asigură o rație de 1:1.8.";
        } else {
            suggestion = "Extracția este incompletă, aromele dulci nu au fost atinse.";
            nextShotFix = "Râșnește puțin mai fin sau crește temperatura cu 1-2°C.";
        }
        technicalPenalty += 1.5;
    }
    // --- C. OVER-EXTRACTION (Too Bitter / Too Slow) ---
    else if (isBitter || time > IDEAL_TIME_MAX || flowRate < 0.8) {
        diagnosis = time > 45 ? "Supra-extracție Severă (Choking)" : "Supra-extracție";
        
        if (time > 35) {
            suggestion = "Apa a stat prea mult în contact cu cafeaua, extrăgând compuși amari, lemnoși și tanini.";
            nextShotFix = "Râșnește MAI GROS (ex: +0.5 unități). Verifică dacă nu cumva ai pus prea multă cafea în sită.";
        } else if (roastLevel.includes("dark") || roastLevel.includes("intensă")) {
            suggestion = "Cafeaua dark se extrage foarte ușor; temperatura mare sau timpul lung accentuează amăreala de prăjire.";
            nextShotFix = "Scade temperatura la 88-90°C. Redu rația la 1:1.5 sau 1:1.8. Râșnește mai gros.";
            if (temp > 93) technicalPenalty += 1.0;
        } else {
            suggestion = "Extracția a mers prea departe, depășind punctul de echilibru.";
            nextShotFix = "Râșnește puțin mai gros sau scade temperatura cu 1-2°C.";
        }
        technicalPenalty += 1.5;
    }
    // --- D. BALANCED / IDEAL ---
    else if (isBalanced || (time >= IDEAL_TIME_MIN && time <= IDEAL_TIME_MAX)) {
        diagnosis = rTaste >= 4 ? "Extracție Excelentă (God Shot)" : "Extracție Echilibrată";
        suggestion = "Ești în zona ideală de extracție. Balanța între aciditate, dulceață și amăreală este corectă.";
        nextShotFix = "Păstrează parametrii. Poți experimenta cu mici variații de temperatură (+/- 0.5°C) pentru a evidenția note specifice.";
        technicalPenalty = -1.0; // Bonus
    }
    // --- E. DEFAULT ---
    else {
        diagnosis = "Extracție în Parametri";
        suggestion = "Rezultatul pare corect din punct de vedere tehnic, dar gustul poate fi îmbunătățit.";
        nextShotFix = "Ajustează fin pe baza preferințelor personale. Dacă e prea intens, crește rația. Dacă e prea slab, scade rația.";
    }

    // --- 3. SPECIAL EQUIPMENT CHECKS ---
    if (shot.machineName?.includes("Torre Pierino") && shot.flowControlSetting !== undefined) {
        if (shot.flowControlSetting < 0.5 && time > 35) {
            nextShotFix += " Flow Control-ul este prea închis; deschide-l spre 0.75 - 1.0 rotații.";
        }
    }

    if (shot.grinderName?.includes("Eureka") && shot.grindSetting < 1.0) {
        nextShotFix += " Atenție: Ești foarte aproape de punctul de zero al râșniței.";
    }

    // --- 4. SCORING SYSTEM ---
    const mapScore = (val: number) => {
        if (val <= 1) return 2;
        if (val === 2) return 4;
        if (val === 3) return 7;
        if (val === 4) return 9;
        if (val >= 5) return 10;
        return 5;
    };

    const pTaste = mapScore(rTaste);
    const pBody = mapScore(rBody);
    const pAroma = mapScore(rAroma);
    const pAspect = mapScore(rAspect);

    let finalScore = (pTaste * 0.50) + (pBody * 0.20) + (pAroma * 0.20) + (pAspect * 0.10);
    finalScore -= technicalPenalty;
    
    // Adjust score based on ratio
    if (ratio < 1.5 || ratio > 3.0) finalScore -= 1.0;
    
    finalScore = Math.max(1, Math.min(10, finalScore));

    return {
        score: `${finalScore.toFixed(1)}/10`,
        diagnosis: diagnosis,
        suggestion: suggestion,
        issue: hasChanneling ? "Channeling" : isSour ? "Acru" : isBitter ? "Amar" : "N/A",
        fix: nextShotFix
    };
};

/**
 * Local Barista Advice (Rule-based Chat)
 */
export const getBaristaAdvice = (message: string, contextShots: ShotData[] = []): string => {
    const msg = message.toLowerCase();
    
    // 1. GUST (Taste)
    if (msg.includes("acru") || msg.includes("sour") || msg.includes("acid")) {
        return "Dacă espresso-ul este acru sau prea acid, înseamnă că este sub-extras. \n\n" +
               "Soluții recomandate:\n" +
               "1. Râșnește MAI FIN (crește rezistența).\n" +
               "2. Crește TEMPERATURA (apa fierbinte extrage mai mult).\n" +
               "3. Crește RAȚIA (ex: de la 1:2 la 1:2.5) pentru a extrage mai multe zaharuri.\n" +
               "4. Crește DOZA (dacă e loc în sită).";
    }
    if (msg.includes("amar") || msg.includes("bitter") || msg.includes("ars")) {
        return "Gustul amar sau de ars indică supra-extracție. \n\n" +
               "Soluții recomandate:\n" +
               "1. Râșnește MAI GROS (scade timpul de contact).\n" +
               "2. Scade TEMPERATURA (mai ales pentru prăjiri dark).\n" +
               "3. Scade RAȚIA (oprește extracția mai devreme).\n" +
               "4. Verifică dacă sita nu este supra-încărcată.";
    }
    if (msg.includes("astringent") || msg.includes("uscat") || msg.includes("metalic")) {
        return "Astringența (senzația de uscat pe limbă) este adesea un semn de channeling sever sau supra-extracție localizată.\n\n" +
               "Încearcă:\n" +
               "- WDT riguros pentru a elimina cocoloașele.\n" +
               "- O râșnire ușor mai groasă.\n" +
               "- Verifică dacă apa nu este prea dură.";
    }

    // 2. TEHNICĂ (Technique)
    if (msg.includes("channeling") || msg.includes("stropi") || msg.includes("neuniform")) {
        return "Channeling-ul apare când apa alege calea celei mai mici rezistențe. \n\n" +
               "Sfaturi Expert:\n" +
               "- Folosește un instrument WDT (ace fine) pentru a omogeniza cafeaua în sită.\n" +
               "- Tamprează perfect orizontal (folosește un tamper cu auto-nivelare dacă e posibil).\n" +
               "- Nu lovi portafiltrul după ce ai tampat.\n" +
               "- Asigură-te că sita este perfect uscată înainte de a pune cafeaua.";
    }
    if (msg.includes("wdt") || msg.includes("distributie")) {
        return "WDT (Weiss Distribution Technique) este esențială pentru espresso modern. Folosește ace de 0.3-0.4mm pentru a sparge cocoloașele și a crea un pat de cafea uniform. Acest lucru reduce dramatic riscul de channeling.";
    }
    if (msg.includes("tampare") || msg.includes("tamping")) {
        return "Tamparea trebuie să fie fermă și, cel mai important, ORIZONTALĂ. Nu e nevoie de o forță excesivă (15kg e suficient), deoarece apa va exercita o presiune mult mai mare (9 bar). Odată ce cafeaua e comprimată, mai multă presiune nu ajută.";
    }

    // 3. VARIABILE (Variables)
    if (msg.includes("prajire") || msg.includes("roast") || msg.includes("light") || msg.includes("dark")) {
        return "Strategii în funcție de prăjire:\n" +
               "- LIGHT ROAST: Temp mare (94-96°C), rație lungă (1:2.5), râșnire foarte fină.\n" +
               "- MEDIUM ROAST: Temp medie (92-93°C), rație standard (1:2), râșnire medie.\n" +
               "- DARK ROAST: Temp mică (88-91°C), rație scurtă (1:1.5 - 1:1.8), râșnire mai groasă.";
    }
    if (msg.includes("temperatura") || msg.includes("grade")) {
        return "Temperatura influențează viteza de extracție. Apa mai fierbinte extrage mai repede și mai mult (inclusiv compuși amari). Dacă espresso-ul e acru, crește temp. Dacă e amar, scade-o.";
    }
    if (msg.includes("ratie") || msg.includes("ratio")) {
        return "Rația (Doză : Yield) controlează concentrația și gradul de extracție. O rație mai lungă (ex 1:3) va fi mai puțin concentrată dar mai extrasă (mai dulce/amăruie). O rație scurtă (1:1.5) va fi foarte intensă și acidă.";
    }

    // 4. GENERAL
    if (msg.includes("salut") || msg.includes("buna") || msg.includes("hey") || msg.includes("hi")) {
        return "Salut! Sunt asistentul tău expert în espresso. Sunt gata să analizăm împreună extracțiile tale și să găsim setările ideale. Cu ce te pot ajuta?";
    }
    if (msg.includes("multumesc") || msg.includes("mersi") || msg.includes("thanks")) {
        return "Cu mare plăcere! Să ai extracții reușite și un espresso delicios!";
    }

    // 5. CONTEXTUAL (Based on last shot)
    if (contextShots.length > 0 && (msg.includes("ultima") || msg.includes("shot") || msg.includes("parere"))) {
        const lastShot = contextShots[0];
        const analysis = evaluateShotLocally(lastShot);
        return `Analizând ultima ta extracție (${lastShot.beanName} pe ${lastShot.machineName}):\n\n` +
               `DIAGNOSTIC: ${analysis.diagnosis}\n` +
               `SCOR: ${analysis.score}\n` +
               `SFAT: ${analysis.suggestion}\n\n` +
               `PENTRU URMĂTORUL SHOT: ${analysis.fix}`;
    }

    return "Sunt aici să te ajut să obții espresso-ul perfect. Poți să mă întrebi despre gust (acru/amar), tehnici de distribuție sau cum să ajustezi parametrii pentru diferite tipuri de prăjire.";
};

/**
 * Local Trend Report
 */
export const generateLocalTrendReport = (shots: ShotData[]): string => {
    if (shots.length === 0) return "Nu există date pentru a genera un raport.";
    
    const recent = shots.slice(0, 10);
    const avgScore = recent.reduce((acc, s) => acc + (s.ratingOverall || 0), 0) / recent.length;
    
    const issues = recent.map(s => {
        const analysis = evaluateShotLocally(s);
        return analysis.issue;
    }).filter(i => i !== "N/A");
    
    const mostCommonIssue = issues.length > 0 
        ? issues.sort((a,b) => issues.filter(v => v===a).length - issues.filter(v => v===b).length).pop()
        : "Nicio problemă majoră detectată";

    return `### Raport de Tendințe (Local)
- **Scor Mediu Recent:** ${avgScore.toFixed(1)}/5
- **Tendință Dominantă:** ${mostCommonIssue}
- **Observație:** Ai efectuat ${recent.length} extracții în ultima perioadă. 
- **Plan de Acțiune:** ${mostCommonIssue === "Acru" ? "Concentrează-te pe creșterea temperaturii sau râșnire mai fină." : mostCommonIssue === "Amar" ? "Încearcă să reduci temperatura sau să râșnești mai gros." : "Ești pe drumul cel bun, menține consistența în pregătirea pucului."}`;
};

/**
 * Local Equipment Identification (Mock Database)
 */
export const identifyEquipmentLocally = (query: string, type: string): Partial<ProductItem> => {
    const q = query.toLowerCase();
    
    if (type === 'machine') {
        if (q.includes("lelit") && q.includes("bianca")) {
            return { name: "Lelit Bianca", description: "Dual Boiler cu Flow Control și PID. Standardul pentru entuziaști.", groupType: "E61", portafilterSize: 58, hasFlowControl: true, hasPid: true };
        }
        if (q.includes("lelit") && q.includes("mara")) {
            return { name: "Lelit MaraX", description: "Heat Exchanger compact cu management inteligent al temperaturii.", groupType: "E61", portafilterSize: 58, hasPid: true };
        }
        if (q.includes("gaggia") && q.includes("classic")) {
            return { name: "Gaggia Classic Pro", description: "Single Boiler iconic, bază excelentă pentru modding.", groupType: "58mm Standard", portafilterSize: 58, hasPid: false };
        }
        if (q.includes("torre") && q.includes("pierino")) {
            return { name: "Torre Pierino", description: "Lever machine compactă cu grup saturat și control manual al presiunii.", groupType: "Saturat", portafilterSize: 58, hasFlowControl: true };
        }
        if (q.includes("ecm") && q.includes("synchronika")) {
            return { name: "ECM Synchronika", description: "Dual Boiler premium cu grup E61 și finisaje de lux.", groupType: "E61", portafilterSize: 58, hasPid: true };
        }
        if (q.includes("rocket") && q.includes("apartamento")) {
            return { name: "Rocket Apartamento", description: "HX compact cu design iconic Rocket.", groupType: "E61", portafilterSize: 58 };
        }
        if (q.includes("la marzocco") && q.includes("linea mini")) {
            return { name: "La Marzocco Linea Mini", description: "Dual Boiler profesional adaptat pentru acasă.", groupType: "Saturat", portafilterSize: 58, hasPid: true };
        }
        if (q.includes("flair") && q.includes("58")) {
            return { name: "Flair 58", description: "Lever manual cu grup de 58mm și încălzire electrică.", groupType: "Lever", portafilterSize: 58 };
        }
    }
    
    if (type === 'grinder') {
        if (q.includes("eureka") && q.includes("mignon") && q.includes("specialita")) {
            return { name: "Eureka Mignon Specialita", description: "Râșniță silențioasă cu cuțite plate de 55mm și timer digital.", scaleType: "eureka" };
        }
        if (q.includes("eureka") && q.includes("mignon") && q.includes("single dose")) {
            return { name: "Eureka Mignon Single Dose", description: "Optimizată pentru zero retention, cuțite de 65mm.", scaleType: "eureka" };
        }
        if (q.includes("niche") && q.includes("zero")) {
            return { name: "Niche Zero", description: "Râșniță conică de 63mm, celebră pentru workflow-ul single dose.", scaleType: "linear" };
        }
        if (q.includes("df64")) {
            return { name: "DF64", description: "Râșniță flat burr de 64mm, foarte populară pentru versatilitate.", scaleType: "linear" };
        }
        if (q.includes("baratza") && q.includes("sette")) {
            return { name: "Baratza Sette 270", description: "Râșniță conică rapidă cu retenție minimă.", scaleType: "linear" };
        }
        if (q.includes("comandante")) {
            return { name: "Comandante C40", description: "Standardul de aur pentru râșnițe manuale.", scaleType: "linear" };
        }
    }

    if (type === 'basket') {
        if (q.includes("vst")) {
            return { name: "VST Precision Basket", description: "Sită de înaltă precizie, necesită o râșnire mai fină." };
        }
        if (q.includes("ims")) {
            return { name: "IMS Precision Basket", description: "Sită de precizie cu perforații uniforme." };
        }
        if (q.includes("pullman")) {
            return { name: "Pullman 876", description: "Sită de precizie optimizată pentru tamperul BigStep." };
        }
    }

    return { name: query, description: "Identificat local (bază de date expert)." };
};

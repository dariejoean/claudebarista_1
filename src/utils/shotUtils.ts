import { ChartDataPoint, ShotData } from "../types";

/**
 * Reconstructs extraction phase times from the extraction profile if they are missing.
 */
export function getReconstructedTimes(shot: ShotData, forceRecalculate: boolean = false) {
    const profile = shot.extractionProfile;
    
    // If we already have the values and not forcing recalculation, return them
    if (!forceRecalculate && shot.preinfusionTime !== undefined && shot.infusionTime !== undefined) {
        return {
            preinfusionTime: shot.preinfusionTime,
            infusionTime: shot.infusionTime,
            postinfusionTime: shot.postinfusionTime || 0,
            effectiveExtractionTime: shot.effectiveExtractionTime || (shot.infusionTime + (shot.postinfusionTime || 0))
        };
    }

    // Fallback: calculate from profile
    if (!profile || profile.length === 0) {
        return {
            preinfusionTime: shot.preinfusionTime || 0,
            infusionTime: shot.infusionTime || 0,
            postinfusionTime: shot.postinfusionTime || 0,
            effectiveExtractionTime: shot.effectiveExtractionTime || 0
        };
    }

    let pre = 0;
    let inf = 0;
    let post = 0;
    let hasStartedInfusion = false;

    // Profile points are usually every 100ms
    for (let i = 0; i < profile.length; i++) {
        const p = profile[i];
        const isPre = p.pressure < 0.1 && !hasStartedInfusion;
        const isInf = p.pressure >= 0.1;
        const isPost = p.pressure < 0.1 && hasStartedInfusion;

        if (isInf) hasStartedInfusion = true;

        if (isPre) pre += 0.1;
        else if (isInf) inf += 0.1;
        else if (isPost) post += 0.1;
    }

    return {
        preinfusionTime: parseFloat(pre.toFixed(1)),
        infusionTime: parseFloat(inf.toFixed(1)),
        postinfusionTime: parseFloat(post.toFixed(1)),
        effectiveExtractionTime: parseFloat((inf + post).toFixed(1))
    };
}


import { ShotData } from '../types';

// TEXTS WITHOUT DIACRITICS FOR PDF SAFE RENDERING
export const ANALYSES_METADATA = [
    { id: 'correlations', title: "Corelatii Simple", description: "Relatia directa dintre un singur parametru (ex: Rasnita) si rezultat." },
    { id: 'multifactorial', title: "Impact Multifactorial", description: "Descopera care factor (Temp vs Rasnita vs Doza) conteaza cel mai mult." },
    // Future analyses placeholders
    { id: 'consistency', title: "Index Consistenta", description: "Analiza stabilitatii tehnicii tale (Puck Prep)." }
];

// --- MATH UTILS ---

/**
 * Calculates Pearson Correlation Coefficient (r)
 */
export const calculatePearsonCorrelation = (x: number[], y: number[]): number | null => {
    const n = x.length;
    if (n !== y.length || n === 0) return null;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = (n * sumXY) - (sumX * sumY);
    const denominator = Math.sqrt(((n * sumX2) - (sumX * sumX)) * ((n * sumY2) - (sumY * sumY)));

    if (denominator === 0) return 0;
    return numerator / denominator;
};

/**
 * Calculates Linear Regression (y = mx + b) for trend lines
 */
export const calculateLinearRegression = (x: number[], y: number[]) => {
    const n = x.length;
    if (n !== y.length || n === 0) return null;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
};

// --- MULTIPLE REGRESSION UTILS (MATRIX MATH) ---

const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
const stdDev = (arr: number[]) => {
    const m = mean(arr);
    return Math.sqrt(arr.reduce((a, b) => a + Math.pow(b - m, 2), 0) / arr.length);
};

// Z-Score Normalization to compare different units (Temp vs Grams)
const standardize = (arr: number[]) => {
    const m = mean(arr);
    const s = stdDev(arr);
    return s === 0 ? arr.map(() => 0) : arr.map(v => (v - m) / s);
};

// Matrix Transpose
const transpose = (matrix: number[][]): number[][] => {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
};

// Matrix Multiplication
const multiply = (A: number[][], B: number[][]): number[][] => {
    const result = Array(A.length).fill(0).map(() => Array(B[0].length).fill(0));
    for (let i = 0; i < A.length; i++) {
        for (let j = 0; j < B[0].length; j++) {
            for (let k = 0; k < A[0].length; k++) {
                result[i][j] += A[i][k] * B[k][j];
            }
        }
    }
    return result;
};

// Gaussian Elimination for Matrix Inversion (Simplified)
const invert = (M: number[][]): number[][] | null => {
    // Basic check for square matrix
    if(M.length !== M[0].length) return null;
    
    const n = M.length;
    // Create augmented matrix [M | I]
    const A = M.map((row, i) => [...row, ...Array(n).fill(0).map((_, j) => i === j ? 1 : 0)]);

    for (let i = 0; i < n; i++) {
        // Find pivot
        let pivot = A[i][i];
        if (Math.abs(pivot) < 1e-10) return null; // Singular matrix

        // Scale row
        for (let j = 0; j < 2 * n; j++) A[i][j] /= pivot;

        // Eliminate other rows
        for (let k = 0; k < n; k++) {
            if (k !== i) {
                const factor = A[k][i];
                for (let j = 0; j < 2 * n; j++) A[k][j] -= factor * A[i][j];
            }
        }
    }

    // Extract inverse
    return A.map(row => row.slice(n));
};

/**
 * Calculates Standardized Beta Coefficients for Multiple Regression
 * Returns an array of weights corresponding to the input order.
 * If inputs are [Grind, Temp], returns [Beta_Grind, Beta_Temp]
 */
export const calculateMultifactorialImpact = (inputs: number[][], output: number[]): number[] | null => {
    try {
        const n = output.length;
        if (n < inputs.length + 2) return null; // Not enough data points

        // 1. Standardize all data (Z-Scores)
        const stdInputs = inputs.map(col => standardize(col));
        const stdOutput = standardize(output);

        // 2. Construct Design Matrix X (Rows are samples, Cols are features)
        // Transpose inputs because they came as columns
        const X = Array(n).fill(0).map((_, i) => stdInputs.map(col => col[i]));
        const Y = stdOutput.map(v => [v]); // Column vector

        // 3. Solve Beta = (X'X)^-1 X'Y
        const Xt = transpose(X);
        const XtX = multiply(Xt, X);
        const XtX_inv = invert(XtX);

        if (!XtX_inv) return null; // Matrix singular (collinearity)

        const XtY = multiply(Xt, Y);
        const Beta = multiply(XtX_inv, XtY);

        return Beta.map(row => row[0]);
    } catch (e) {
        console.error("Regression error", e);
        return null;
    }
};

// --- DATA EXTRACTORS ---

export const getStatsForCoffee = (shots: ShotData[], beanName: string) => {
    const beanShots = shots.filter(s => s.beanName === beanName);
    const goodShots = beanShots.filter(s => (s.ratingOverall || 0) >= 4);
    const targetShots = goodShots.length > 0 ? goodShots : beanShots.sort((a,b) => (b.ratingOverall||0) - (a.ratingOverall||0)).slice(0, 3);
    
    if (targetShots.length === 0) return null;

    const parseGrind = (g: string | undefined): number => { if (!g || g === '') return 0; const pts = g.split('+'); return pts.length === 2 ? (parseFloat(pts[0]) || 0) * 20 + (parseFloat(pts[1]) || 0) : parseFloat(g) || 0; };
  const avgGrind = targetShots.reduce((a,b) => a + parseGrind(b.grindSetting), 0) / targetShots.length;
    const avgTime = targetShots.reduce((a,b) => a + b.time, 0) / targetShots.length;
    const avgDose = targetShots.reduce((a,b) => a + b.doseIn, 0) / targetShots.length;
    const avgYield = targetShots.reduce((a,b) => a + b.yieldOut, 0) / targetShots.length;
    const avgTemp = targetShots.reduce((a,b) => a + b.temperature, 0) / targetShots.length;
    const maxScore = Math.max(...targetShots.map(s => s.ratingOverall || 0));

    return {
        name: beanName,
        count: beanShots.length,
        goodCount: goodShots.length,
        grind: avgGrind,
        time: avgTime,
        dose: avgDose,
        yield: avgYield,
        temp: avgTemp,
        maxScore,
        ratio: avgDose > 0 ? (avgYield / avgDose) : 2
    };
};


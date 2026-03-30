
import React, { useState, useMemo } from 'react';
import { ShotData } from '../types';
import { calculatePearsonCorrelation, calculateLinearRegression, calculateMultifactorialImpact } from '../services/analytics';
import { 
    XMarkIcon, 
    ArrowLeftIcon, 
    ChartBarIcon, 
    VariableIcon,
    FunnelIcon,
    ArrowTrendingUpIcon,
    BeakerIcon,
    SquaresPlusIcon,
    CheckBadgeIcon,
    GlobeEuropeAfricaIcon
} from '@heroicons/react/24/solid';

interface AnalysisDashboardProps {
    shots: ShotData[];
    onClose: () => void;
}

// --- TYPES ---
// Removed 'select_bean' from steps
type AnalysisStep = 'menu' | 'configure_vars' | 'result';
type AnalysisType = 'correlations' | 'multifactorial';

type InputFactor = 'grindSetting' | 'temperature' | 'doseIn' | 'time' | 'preinfusionTime' | 'infusionTime' | 'postinfusionTime' | 'effectiveExtractionTime';
type OutputFactor = 'ratingOverall' | 'expertScore' | 'ratio' | 'flowRate';

const INPUT_LABELS: Record<InputFactor, string> = {
    grindSetting: 'MĂCINARE (GRAD)',
    temperature: 'TEMPERATURĂ (°C)',
    doseIn: 'DOZĂ CAFEA (g)',
    time: 'TIMP TOTAL DE EXTRACȚIE (s)',
    preinfusionTime: 'TIMP DE PREINFUZIE (s)',
    infusionTime: 'TIMP DE INFUZIE (s)',
    postinfusionTime: 'TIMP DE POSTINFUZIE (s)',
    effectiveExtractionTime: 'TIMP EFECTIV DE EXTRACȚIE (s)'
};

const OUTPUT_LABELS: Record<OutputFactor, string> = {
    ratingOverall: 'NOTA GENERALĂ',
    expertScore: 'NOTA EXPERT',
    ratio: 'RAPORT EXTRACȚIE (g/g)',
    flowRate: 'Flux lichid extras (g/s)'
};

// --- STYLES ---
const MENU_BTN_STYLE = "bg-surface-container w-full rounded-2xl p-5 text-left transition-all shadow-md hover:shadow-lg border border-white/5 active:scale-[0.99] hover:bg-surface-container-high flex flex-col gap-1 group relative overflow-hidden";
const OPTION_BTN_STYLE = "px-4 py-3 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center text-center h-14 relative overflow-hidden";

// --- CHART COMPONENT ---
const ScatterChart: React.FC<{ 
    data: { x: number, y: number }[], 
    xLabel: string, 
    yLabel: string,
    trendLine: { slope: number, intercept: number } | null
}> = ({ data, xLabel, yLabel, trendLine }) => {
    
    if (data.length < 2) return <div className="h-64 flex items-center justify-center text-on-surface-variant opacity-50 text-xs">Date insuficiente pentru grafic</div>;

    const padding = 40;
    const width = 350;
    const height = 300;

    const xValues = data.map(d => d.x);
    const yValues = data.map(d => d.y);
    
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);

    // Add buffer
    const xRange = maxX - minX || 1;
    const yRange = maxY - minY || 1;
    const domainMinX = minX - (xRange * 0.1);
    const domainMaxX = maxX + (xRange * 0.1);
    const domainMinY = Math.max(0, minY - (yRange * 0.1)); // Don't go below 0 usually
    const domainMaxY = maxY + (yRange * 0.1);

    const scaleX = (val: number) => padding + ((val - domainMinX) / (domainMaxX - domainMinX)) * (width - padding * 2);
    const scaleY = (val: number) => height - padding - ((val - domainMinY) / (domainMaxY - domainMinY)) * (height - padding * 2);

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full drop-shadow-xl">
            {/* Grid & Axes */}
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--md-sys-color-on-surface)" strokeOpacity="0.3" strokeWidth="1" />
            <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="var(--md-sys-color-on-surface)" strokeOpacity="0.3" strokeWidth="1" />
            
            {/* Labels */}
            <text x={width / 2} y={height - 10} fill="var(--md-sys-color-on-surface-variant)" fontSize="10" textAnchor="middle" fontWeight="bold">{xLabel}</text>
            <text x={10} y={height / 2} fill="var(--md-sys-color-on-surface-variant)" fontSize="10" textAnchor="middle" fontWeight="bold" transform={`rotate(-90, 10, ${height / 2})`}>{yLabel}</text>

            {/* Min/Max values on axes */}
            <text x={padding} y={height - 25} fill="var(--md-sys-color-on-surface-variant)" fontSize="8" textAnchor="middle">{domainMinX.toFixed(1)}</text>
            <text x={width - padding} y={height - 25} fill="var(--md-sys-color-on-surface-variant)" fontSize="8" textAnchor="middle">{domainMaxX.toFixed(1)}</text>
            <text x={30} y={height - padding} fill="var(--md-sys-color-on-surface-variant)" fontSize="8" textAnchor="end">{domainMinY.toFixed(1)}</text>
            <text x={30} y={padding + 5} fill="var(--md-sys-color-on-surface-variant)" fontSize="8" textAnchor="end">{domainMaxY.toFixed(1)}</text>

            {/* Trend Line */}
            {trendLine && (
                <line 
                    x1={scaleX(domainMinX)} 
                    y1={scaleY(trendLine.slope * domainMinX + trendLine.intercept)} 
                    x2={scaleX(domainMaxX)} 
                    y2={scaleY(trendLine.slope * domainMaxX + trendLine.intercept)} 
                    stroke="var(--color-box-label)" 
                    strokeWidth="2" 
                    strokeDasharray="4,4" 
                    opacity="0.6" 
                />
            )}

            {/* Data Points */}
            {data.map((d, i) => (
                <circle 
                    key={i} 
                    cx={scaleX(d.x)} 
                    cy={scaleY(d.y)} 
                    r="4" 
                    fill="var(--md-sys-color-primary-container)" 
                    stroke="white" 
                    strokeWidth="1.5" 
                    className="transition-all hover:r-6"
                />
            ))}
        </svg>
    );
};

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ shots, onClose }) => {
    const [step, setStep] = useState<AnalysisStep>('menu');
    const [analysisType, setAnalysisType] = useState<AnalysisType | null>(null);
    
    // Configuration State
    const [selectedInput, setSelectedInput] = useState<InputFactor>('grindSetting'); // Single
    const [multiInputs, setMultiInputs] = useState<InputFactor[]>(['grindSetting', 'temperature']); // Multi
    const [selectedOutput, setSelectedOutput] = useState<OutputFactor>('ratingOverall');

    // Derived Dataset for Analysis - NOW GLOBAL (No filtering by bean)
    const analysisData = useMemo(() => {
        // Use ALL shots
        return shots.map(s => {
            // Safe extraction of metrics
            const expertScoreVal = s.structuredAnalysis?.score 
                ? parseFloat(s.structuredAnalysis.score.split('/')[0]) 
                : 0;
            
            const ratioVal = s.doseIn > 0 ? s.yieldOut / s.doseIn : 0;
            const flowVal = s.time > 0 ? s.yieldOut / s.time : 0;

            return {
                id: s.id,
                grindSetting: s.grindSetting || 0,
                temperature: s.temperature || 0,
                doseIn: s.doseIn || 0,
                time: s.time || 0,
                preinfusionTime: s.preinfusionTime || 0,
                infusionTime: s.infusionTime || 0,
                postinfusionTime: s.postinfusionTime || 0,
                effectiveExtractionTime: s.effectiveExtractionTime || 0,
                ratingOverall: s.ratingOverall || 0,
                expertScore: expertScoreVal,
                ratio: ratioVal,
                flowRate: flowVal
            };
        }).filter(item => 
            item.grindSetting > 0 && 
            item.time > 0 && 
            item.temperature > 0 &&
            (item.ratingOverall > 0 || item.expertScore > 0)
        );
    }, [shots]);

    // 1. SIMPLE CORRELATION CALC
    const correlationStats = useMemo(() => {
        if (analysisData.length < 3 || analysisType !== 'correlations') return null;

        const x = analysisData.map(d => d[selectedInput]);
        const y = analysisData.map(d => d[selectedOutput]);

        const r = calculatePearsonCorrelation(x, y);
        const regression = calculateLinearRegression(x, y);

        // Interpretation
        let interpretation = "Neutră";
        if (r !== null) {
            const absR = Math.abs(r);
            if (absR > 0.7) interpretation = "Foarte Puternică";
            else if (absR > 0.5) interpretation = "Puternică";
            else if (absR > 0.3) interpretation = "Moderată";
            else interpretation = "Slabă / Inexistentă";
        }

        return { r, regression, interpretation, chartData: x.map((xi, i) => ({ x: xi, y: y[i] })) };
    }, [analysisData, selectedInput, selectedOutput, analysisType]);

    // 2. MULTIFACTORIAL CALC
    const multiStats = useMemo(() => {
        if (analysisData.length < 4 || analysisType !== 'multifactorial') return null;
        if (multiInputs.length < 2) return null;

        // Prepare matrices
        const inputMatrix = multiInputs.map(key => analysisData.map(row => row[key]));
        const outputVector = analysisData.map(row => row[selectedOutput]);

        const betas = calculateMultifactorialImpact(inputMatrix, outputVector);

        if (!betas) return null;

        // Combine Beta with Labels and sort by absolute impact
        const impacts = multiInputs.map((key, i) => ({
            key,
            label: INPUT_LABELS[key],
            beta: betas[i],
            absBeta: Math.abs(betas[i])
        })).sort((a, b) => b.absBeta - a.absBeta);

        return impacts;

    }, [analysisData, multiInputs, selectedOutput, analysisType]);


    // --- HANDLERS ---
    const handleSelectAnalysis = (type: AnalysisType) => {
        setAnalysisType(type);
        setStep('configure_vars'); // SKIPS BEAN SELECTION
    };

    const toggleMultiInput = (key: InputFactor) => {
        setMultiInputs(prev => {
            if (prev.includes(key)) {
                if (prev.length <= 2) return prev; // Keep at least 2 for multi
                return prev.filter(k => k !== key);
            }
            if (prev.length >= 3) return prev; // Max 3 for stability
            return [...prev, key];
        });
    };

    const handleGenerate = () => {
        setStep('result');
    };

    // --- RENDERERS ---

    const renderMenu = () => (
        <div className="p-6 space-y-4">
            <h2 className="text-xl font-black text-on-surface uppercase tracking-widest text-center mb-6">Analize Disponibile</h2>
            <button onClick={() => handleSelectAnalysis('correlations')} className={MENU_BTN_STYLE}>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shrink-0">
                        <ArrowTrendingUpIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-on-surface uppercase tracking-wide">Corelații Simple</h3>
                        <p className="text-[10px] text-on-surface-variant font-medium opacity-80">Cum influențează UN parametru rezultatul?</p>
                    </div>
                </div>
            </button>
            <button onClick={() => handleSelectAnalysis('multifactorial')} className={MENU_BTN_STYLE}>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white shadow-lg shrink-0">
                        <SquaresPlusIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-on-surface uppercase tracking-wide">Impact Multifactorial</h3>
                        <p className="text-[10px] text-on-surface-variant font-medium opacity-80">Clasamentul factorilor: Ce contează cel mai mult?</p>
                    </div>
                </div>
            </button>
        </div>
    );

    const renderConfig = () => (
        <div className="p-6 flex flex-col h-full overflow-y-auto no-scrollbar">
            <h2 className="text-lg font-black text-on-surface uppercase tracking-widest text-center mb-1">Configurare Analiză</h2>
            <div className="flex items-center justify-center gap-2 mb-6 text-on-surface-variant opacity-70">
                <GlobeEuropeAfricaIcon className="w-4 h-4" />
                <p className="text-xs font-bold text-center">Analiză Globală (Toate Cafelele)</p>
            </div>

            <div className="space-y-6 flex-1">
                {/* Inputs */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                        <FunnelIcon className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                            {analysisType === 'correlations' ? 'FACTOR DE INTRARE (AXA X)' : 'FACTORI DE INFLUENȚĂ (ALEGE 2-3)'}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {(Object.keys(INPUT_LABELS) as InputFactor[]).map(key => {
                            const isSelected = analysisType === 'correlations' 
                                ? selectedInput === key 
                                : multiInputs.includes(key);
                            
                            return (
                                <button 
                                    key={key}
                                    onClick={() => analysisType === 'correlations' ? setSelectedInput(key) : toggleMultiInput(key)}
                                    className={`${OPTION_BTN_STYLE} ${isSelected ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-surface-container border-white/5 text-on-surface-variant'}`}
                                >
                                    {INPUT_LABELS[key]}
                                    {isSelected && analysisType === 'multifactorial' && <CheckBadgeIcon className="w-4 h-4 absolute top-1 right-1 text-white/50" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Outputs */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                        <ChartBarIcon className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">REZULTAT (TINTA)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {(Object.keys(OUTPUT_LABELS) as OutputFactor[]).map(key => (
                            <button 
                                key={key}
                                onClick={() => setSelectedOutput(key)}
                                className={`${OPTION_BTN_STYLE} ${selectedOutput === key ? 'bg-amber-600 border-amber-500 text-white shadow-lg' : 'bg-surface-container border-white/5 text-on-surface-variant'}`}
                            >
                                {OUTPUT_LABELS[key]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <button onClick={handleGenerate} className="mt-6 w-full py-4 bg-green-600 text-white rounded-full font-black text-sm uppercase tracking-widest hover:bg-green-500 transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2">
                GENEREAZĂ ANALIZA
            </button>
        </div>
    );

    const renderResult = () => {
        // --- MULTIFACTORIAL RENDER ---
        if (analysisType === 'multifactorial') {
            if (!multiStats) return <div className="p-10 text-center opacity-50 flex flex-col items-center gap-2"><p>Date insuficiente pentru analiză statistică avansată.</p><span className="text-xs">Sunt necesare minim 4 extracții complete (cu toți parametrii completați).</span></div>;

            return (
                <div className="p-6 flex flex-col h-full overflow-y-auto no-scrollbar">
                    <div className="text-center mb-6">
                        <h2 className="text-sm font-black text-on-surface uppercase tracking-widest mb-1">CLASAMENT INFLUENȚĂ</h2>
                        <p className="text-[10px] text-on-surface-variant">Ce parametru determină cel mai mult <span className="text-amber-500 font-bold">{OUTPUT_LABELS[selectedOutput]}</span>?</p>
                        <p className="text-[9px] text-on-surface-variant/50 uppercase mt-1 tracking-widest">Set de date: {analysisData.length} extracții</p>
                    </div>

                    <div className="space-y-4 mb-6">
                        {multiStats.map((stat, idx) => {
                            const isPos = stat.beta > 0;
                            // Scale bar relative to the strongest factor (which is at index 0)
                            const maxBeta = multiStats[0].absBeta;
                            const percentage = (stat.absBeta / maxBeta) * 100;
                            
                            return (
                                <div key={stat.key} className="bg-surface-container rounded-xl p-4 border border-white/5 relative overflow-hidden">
                                    <div className="flex justify-between items-center mb-2 relative z-10">
                                        <span className="text-xs font-black text-on-surface uppercase tracking-wide">{stat.label}</span>
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${isPos ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {isPos ? 'DIRECT PROPORȚIONAL' : 'INVERS PROPORȚIONAL'}
                                        </span>
                                    </div>
                                    
                                    {/* Bar Chart */}
                                    <div className="h-4 w-full bg-black/20 rounded-full overflow-hidden relative z-10">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${isPos ? 'bg-green-500' : 'bg-red-500'}`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    
                                    <p className="text-[10px] text-on-surface-variant mt-2 relative z-10">
                                        {isPos 
                                            ? `Creșterea ${stat.label.toLowerCase()} duce la creșterea ${OUTPUT_LABELS[selectedOutput].toLowerCase()}.`
                                            : `Creșterea ${stat.label.toLowerCase()} scade ${OUTPUT_LABELS[selectedOutput].toLowerCase()}.`
                                        }
                                        <br/>Impact relativ: <strong>{percentage.toFixed(0)}%</strong>
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="bg-blue-900/20 border border-blue-500/20 p-4 rounded-xl">
                        <h3 className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1 flex items-center gap-2">
                            <VariableIcon className="w-4 h-4" /> CONCLUZIE MATEMATICĂ
                        </h3>
                        <p className="text-xs text-blue-100 leading-relaxed opacity-90">
                            Factorul dominant este <strong>{multiStats[0].label}</strong>. Pentru a controla <strong>{OUTPUT_LABELS[selectedOutput]}</strong>, concentrează-te prioritar pe ajustarea acestui parametru.
                        </p>
                    </div>
                </div>
            );
        }

        // --- SIMPLE CORRELATION RENDER (EXISTING) ---
        if (!correlationStats) return <div className="p-10 text-center opacity-50">Date insuficiente pentru analiză.</div>;

        const { r, regression, interpretation, chartData } = correlationStats;
        const rVal = r ? r.toFixed(3) : "N/A";
        const isPositive = r && r > 0;

        return (
            <div className="p-6 flex flex-col h-full overflow-y-auto no-scrollbar">
                <div className="text-center mb-4">
                    <h2 className="text-sm font-black text-on-surface uppercase tracking-widest">COEFICIENT CORELATIE</h2>
                    <div className={`text-4xl font-black my-1 drop-shadow-md ${Math.abs(r || 0) > 0.5 ? (isPositive ? 'text-green-400' : 'text-blue-400') : 'text-on-surface-variant'}`}>
                        {rVal}
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-on-surface">
                        LEGĂTURĂ {interpretation.toUpperCase()}
                    </span>
                    <p className="text-[9px] text-on-surface-variant/50 uppercase mt-2 tracking-widest">Analiză pe {analysisData.length} extracții</p>
                </div>

                <div className="bg-surface-container rounded-2xl p-4 border border-white/5 shadow-inner mb-4 relative aspect-square">
                    <ScatterChart 
                        data={chartData} 
                        xLabel={INPUT_LABELS[selectedInput]} 
                        yLabel={OUTPUT_LABELS[selectedOutput]} 
                        trendLine={regression}
                    />
                </div>

                <div className="bg-blue-900/20 border border-blue-500/20 p-4 rounded-xl">
                    <h3 className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <VariableIcon className="w-4 h-4" /> INTERPRETARE RAPIDĂ
                    </h3>
                    <p className="text-xs text-blue-100 leading-relaxed opacity-90">
                        {Math.abs(r || 0) < 0.2 
                            ? `Nu pare să existe o legătură clară între ${INPUT_LABELS[selectedInput]} și ${OUTPUT_LABELS[selectedOutput]} în setul curent de date.` 
                            : isPositive 
                                ? `Când ${INPUT_LABELS[selectedInput]} CREȘTE, ${OUTPUT_LABELS[selectedOutput]} tinde să CREASCĂ.` 
                                : `Când ${INPUT_LABELS[selectedInput]} CREȘTE, ${OUTPUT_LABELS[selectedOutput]} tinde să SCADĂ.`
                        }
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[80] bg-surface flex flex-col animate-fade-in overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 flex justify-between items-center bg-surface border-b border-white/5 shrink-0 shadow-sm z-20">
                <div className="flex items-center gap-3">
                    {step !== 'menu' && (
                        <button onClick={() => {
                            if (step === 'result') setStep('configure_vars');
                            else setStep('menu');
                        }} className="p-2 -ml-2 rounded-full hover:bg-white/10 text-on-surface-variant">
                            <ArrowLeftIcon className="w-5 h-5" />
                        </button>
                    )}
                    <div>
                        <h2 className="text-on-surface font-bold text-lg leading-tight drop-shadow-sm">DATA LAB</h2>
                        <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest drop-shadow-sm">
                            {step === 'menu' ? 'Selectare Analiză' : analysisType === 'correlations' ? 'Corelații Simple' : 'Analiză Multi'}
                        </span>
                    </div>
                </div>
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors shadow-md active:shadow-inner border border-white/5">
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-surface relative overflow-hidden">
                {step === 'menu' && renderMenu()}
                {step === 'configure_vars' && renderConfig()}
                {step === 'result' && renderResult()}
            </div>
        </div>
    );
};

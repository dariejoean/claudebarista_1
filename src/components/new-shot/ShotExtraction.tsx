
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Timer } from '../Timer';
import { ArrowPathIcon, CameraIcon, PhotoIcon, TrashIcon, SignalIcon } from '@heroicons/react/24/solid';
import { useEditorStore } from '../../store/editorStore';
import { useBluetoothStore } from '../../services/bluetoothService';
import { LiveExtractionChart } from './LiveExtractionChart';
import { ChartDataPoint } from '../../types';
import { 
    BOX_STYLE, 
    VALUE_WRAPPER_STYLE, 
    NUMERIC_INPUT_STYLE, 
    UNIFIED_VALUE_STYLE,
    MULTILINE_LABEL_STYLE, 
    LABEL_STYLE,
    SECTION_HEADER_STYLE,
    getDynamicSectionHeaderStyle
} from '../../styles/common';

interface ShotExtractionProps {
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onViewImage: (img: string) => void;
}

export const ShotExtraction: React.FC<ShotExtractionProps> = React.memo((props) => {
    // Store
    const time = useEditorStore(s => s.time);
    const setTime = useEditorStore(s => s.setTime);
    const preinfusionTimeStore = useEditorStore(s => s.preinfusionTime);
    const setPreinfusionTimeStore = useEditorStore(s => s.setPreinfusionTime);
    const infusionTimeStore = useEditorStore(s => s.infusionTime);
    const setInfusionTimeStore = useEditorStore(s => s.setInfusionTime);
    const postinfusionTimeStore = useEditorStore(s => s.postinfusionTime);
    const setPostinfusionTimeStore = useEditorStore(s => s.setPostinfusionTime);
    const effectiveExtractionTimeStore = useEditorStore(s => s.effectiveExtractionTime);
    const setEffectiveExtractionTimeStore = useEditorStore(s => s.setEffectiveExtractionTime);
    const yieldOut = useEditorStore(s => s.yieldOut);
    const setYieldOut = useEditorStore(s => s.setYieldOut);
    const doseIn = useEditorStore(s => s.doseIn);
    const pressure = useEditorStore(s => s.pressure);
    const setPressure = useEditorStore(s => s.setPressure);
    const setAvgPressureStore = useEditorStore(s => s.setAvgPressure);
    const setMaxPressureStore = useEditorStore(s => s.setMaxPressure);
    const setExtractionProfile = useEditorStore(s => s.setExtractionProfile);
    const isYieldManuallySet = useEditorStore(s => s.isYieldManuallySet);
    const setIsYieldManuallySet = useEditorStore(s => s.setIsYieldManuallySet);
    const images = useEditorStore(s => s.images);
    const thumbnails = useEditorStore(s => s.thumbnails);
    const removeImage = useEditorStore(s => s.removeImage);

    // Bluetooth
    const currentWeight = useBluetoothStore(s => s.currentWeight);
    const currentPressure = useBluetoothStore(s => s.currentPressure);
    const connectedScale = useBluetoothStore(s => s.connectedScale);
    const connectedPressureSensor = useBluetoothStore(s => s.connectedPressureSensor);

    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const isExtracting = useEditorStore(s => s.isExtracting);
    const setIsExtracting = useEditorStore(s => s.setIsExtracting);
    const avgPressureStore = useEditorStore(s => s.avgPressure);
    const extractionProfile = useEditorStore(s => s.extractionProfile);

    // Sync chartData with store's extractionProfile for existing shots
    useEffect(() => {
        if (!isExtracting) {
            setChartData(extractionProfile || []);
        }
    }, [extractionProfile, isExtracting]);
    const startTimeRef = useRef<number>(0);
    const lastWeightRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);
    const flowRef = useRef<number>(0);
    const pressureRef = useRef<number>(0);
    const maxPressureRef = useRef<number>(0);
    const pressureSumRef = useRef<number>(0);
    const pressureCountRef = useRef<number>(0);

    // 100ms Polling for real-time scale data
    useEffect(() => {
        let interval: number;
        if (isExtracting) {
            useBluetoothStore.getState().addLog('Interval de extracție pornit...');
            console.log('Extraction Interval Started');
            
            interval = window.setInterval(() => {
                const now = Date.now();
                const elapsed = (now - startTimeRef.current) / 1000;
                
                // Get latest values directly from stores to avoid closure stale state
                const weight = useBluetoothStore.getState().currentWeight;
                const rawPressure = useBluetoothStore.getState().currentPressure;
                
                // Debug log every 2 seconds
                if (Math.floor(elapsed * 10) % 20 === 0) {
                    console.log(`[Polling] Time: ${elapsed.toFixed(1)}s, Weight: ${weight}g, Pressure: ${rawPressure}bar`);
                }
                
                const dt = elapsed - lastTimeRef.current;
                const dw = weight - lastWeightRef.current;
                
                let rawFlow = 0;
                if (dt > 0) {
                    rawFlow = Math.max(0, dw / dt);
                }
                
                // Exponential Moving Average to smooth the flow and pressure lines
                flowRef.current = flowRef.current * 0.8 + rawFlow * 0.2;
                pressureRef.current = pressureRef.current * 0.8 + rawPressure * 0.2;
                
                const smoothedPressure = parseFloat(pressureRef.current.toFixed(1));
                
                // Track max pressure - ensure we only update if it's strictly higher
                if (smoothedPressure > maxPressureRef.current) {
                    maxPressureRef.current = smoothedPressure;
                    setPressure(maxPressureRef.current);
                    setMaxPressureStore(maxPressureRef.current);
                    console.log(`[Max Pressure Update] New Max: ${maxPressureRef.current} bar`);
                }

                // Track average pressure (from > 0.1 until it returns to 0)
                if (smoothedPressure > 0.1) {
                    pressureSumRef.current += smoothedPressure;
                    pressureCountRef.current += 1;
                }
                
                lastWeightRef.current = weight;
                lastTimeRef.current = elapsed;

                // Update store yield
                setYieldOut(parseFloat(weight.toFixed(1)));
                
                // Real-time update of extraction phases
                const currentPressure = smoothedPressure;
                const infusionStarted = (useEditorStore.getState().infusionTime || 0) > 0;
                
                const isPreinfusing = currentPressure < 0.1 && !infusionStarted;
                const isInfusing = currentPressure >= 0.1;
                const isPostinfusing = currentPressure < 0.1 && infusionStarted;

                if (isPreinfusing) {
                    const current = useEditorStore.getState().preinfusionTime || 0;
                    setPreinfusionTimeStore(parseFloat((current + 0.1).toFixed(1)));
                }
                if (isInfusing) {
                    const current = useEditorStore.getState().infusionTime || 0;
                    setInfusionTimeStore(parseFloat((current + 0.1).toFixed(1)));
                }
                if (isPostinfusing) {
                    const current = useEditorStore.getState().postinfusionTime || 0;
                    setPostinfusionTimeStore(parseFloat((current + 0.1).toFixed(1)));
                }

                // Effective extraction time is infusion + postinfusion
                const inf = useEditorStore.getState().infusionTime || 0;
                const post = useEditorStore.getState().postinfusionTime || 0;
                setEffectiveExtractionTimeStore(parseFloat((inf + post).toFixed(1)));

                // Update local chart data
                setChartData(prev => {
                    const newPoint = { 
                        time: parseFloat(elapsed.toFixed(1)), 
                        weight: parseFloat(weight.toFixed(1)),
                        flow: parseFloat(flowRef.current.toFixed(1)),
                        pressure: smoothedPressure
                    };
                    return [...prev, newPoint];
                });

                // Periodic debug log to confirm polling is active
                if (Math.random() < 0.05) {
                    console.log(`Polling: ${elapsed.toFixed(1)}s, W:${weight}g, P:${smoothedPressure}bar`);
                    useBluetoothStore.getState().addLog(`Polling: ${elapsed.toFixed(1)}s, W:${weight.toFixed(2)}g, P:${smoothedPressure}bar`);
                }
            }, 100);
        }
        return () => {
            if (interval) {
                console.log('Extraction Interval Stopped');
                useBluetoothStore.getState().addLog('Interval de extracție oprit.');
                clearInterval(interval);
            }
        };
    }, [isExtracting]); // Only depend on isExtracting to keep interval stable

    // Calculated Metrics
    // Flow = Yield / Time (g/s)
    const flowRate = (time > 0 && yieldOut > 0) ? (yieldOut / time).toFixed(1) : "0.0";
    
    // Ratio = 1 : (Yield / Dose)
    const rawRatio = (doseIn > 0 && yieldOut > 0) ? (yieldOut / doseIn) : 0;
    const ratioDisplay = rawRatio > 0 ? `1:${parseFloat(rawRatio.toFixed(2))}` : "1:0";
    
    // Point B: Pressure starts increasing (> 0.1)
    const pointB = useMemo(() => {
        return chartData.find(p => p.pressure > 0.1);
    }, [chartData]);

    // Point C: Weight starts increasing (> 0.1)
    const pointC = useMemo(() => {
        return chartData.find(p => p.weight > 0.1);
    }, [chartData]);

    // Point D: Pressure drops back to 0 (last point with pressure > 0.1)
    const pointD = useMemo(() => {
        if (!pointB) return null;
        const reversed = [...chartData].reverse();
        return reversed.find(p => p.pressure > 0.1);
    }, [chartData, pointB]);

    // Point E: Weight stabilizes (no increase for at least 2 seconds) OR timer stop
    const pointE = useMemo(() => {
        if (chartData.length < 2) return null;
        
        // Find stabilization: no increase (> 0.05g) for at least 2 seconds
        for (let i = 0; i < chartData.length; i++) {
            const currentPoint = chartData[i];
            // We only look for stabilization AFTER Point C (when weight started increasing)
            if (pointC && currentPoint.time < pointC.time) continue;

            const futurePoints = chartData.slice(i + 1).filter(p => p.time <= currentPoint.time + 2);
            
            // If we have at least 2 seconds of data ahead in the recorded chart
            if (futurePoints.length > 0 && futurePoints[futurePoints.length - 1].time >= currentPoint.time + 1.9) {
                const maxWeightInFuture = Math.max(...futurePoints.map(p => p.weight));
                // If weight didn't grow by more than 0.05g in these 2 seconds
                if (maxWeightInFuture <= currentPoint.weight + 0.05) {
                    return currentPoint;
                }
            }
        }
        
        // If no stabilization found yet, use the last point (timer stop)
        return chartData[chartData.length - 1];
    }, [chartData, pointC]);

    // Derived Metrics based on Points A, B, C, D, E
    // Preinfusion: A to C
    const preinfusionTime = pointC ? pointC.time : 0;
    
    // Infusion: C to D
    const infusionTime = (pointC && pointD && pointD.time > pointC.time) ? (pointD.time - pointC.time) : 0;
    
    // Postinfusion: D to E
    const postinfusionTime = (pointD && pointE && pointE.time > pointD.time) ? (pointE.time - pointD.time) : 0;
    
    // Effective Extraction: C to E
    const effectiveExtractionTime = (pointC && pointE && pointE.time > pointC.time) ? (pointE.time - pointC.time) : 0;
    
    // Total Extraction: A to E
    const totalExtractionTimeCalculated = pointE ? pointE.time : 0;

    // Average Pressure from B to D
    const avgPressureCalculated = useMemo(() => {
        if (!pointB || !pointD) return 0;
        const pointsInRange = chartData.filter(p => p.time >= pointB.time && p.time <= pointD.time);
        if (pointsInRange.length === 0) return 0;
        const sum = pointsInRange.reduce((acc, p) => acc + p.pressure, 0);
        return parseFloat((sum / pointsInRange.length).toFixed(1));
    }, [chartData, pointB, pointD]);

    return (
        <div className="flex flex-col gap-4">
            <div id="section-new-extraction" className={`${SECTION_HEADER_STYLE} scroll-mt-24`} style={getDynamicSectionHeaderStyle()}>EXTRACȚIE</div>
            
            <Timer 
                onStart={() => {
                    setIsExtracting(true);
                    startTimeRef.current = Date.now();
                    lastWeightRef.current = 0;
                    lastTimeRef.current = 0;
                    flowRef.current = 0;
                    pressureRef.current = 0;
                    maxPressureRef.current = 0;
                    pressureSumRef.current = 0;
                    pressureCountRef.current = 0;
                    setAvgPressureStore(0);
                    setChartData([]);
                }}
                onStop={(t) => {
                    setIsExtracting(false);
                    // Set time to the moment Point E was reached if available, otherwise use timer value
                    const finalTime = totalExtractionTimeCalculated > 0 ? totalExtractionTimeCalculated : t;
                    setTime(finalTime);
                    setPreinfusionTimeStore(preinfusionTime);
                    setInfusionTimeStore(infusionTime);
                    setPostinfusionTimeStore(postinfusionTime);
                    setEffectiveExtractionTimeStore(effectiveExtractionTime);
                    setAvgPressureStore(avgPressureCalculated);
                    setExtractionProfile(chartData);
                }} 
                onTick={(t) => {
                    // Update metrics in real-time
                    setTime(t);
                    setPreinfusionTimeStore(preinfusionTime);
                    setInfusionTimeStore(infusionTime);
                    setPostinfusionTimeStore(postinfusionTime);
                    setEffectiveExtractionTimeStore(effectiveExtractionTime);
                    setAvgPressureStore(avgPressureCalculated);
                }}
                onReset={() => {
                    setIsExtracting(false);
                    setChartData([]);
                    setExtractionProfile([]);
                    setYieldOut(0);
                    setTime(0);
                    setPreinfusionTimeStore(0);
                    setInfusionTimeStore(0);
                    setPostinfusionTimeStore(0);
                    setEffectiveExtractionTimeStore(0);
                    setPressure(0);
                    lastWeightRef.current = 0;
                    lastTimeRef.current = 0;
                    flowRef.current = 0;
                    pressureRef.current = 0;
                    maxPressureRef.current = 0;
                    pressureSumRef.current = 0;
                    pressureCountRef.current = 0;
                    setAvgPressureStore(0);
                }}
            />

            {/* Bluetooth Live Status Bar */}
            {(connectedScale || connectedPressureSensor) && (
                <div className="flex gap-2 p-2 bg-surface-container-high rounded-xl border border-white/5 animate-pulse">
                    {connectedScale && (
                        <div className="flex-1 flex items-center justify-center gap-2 text-[10px] font-black text-green-400 uppercase tracking-widest">
                            <SignalIcon className="w-3 h-3" />
                            Cântar: {currentWeight.toFixed(2)}g
                        </div>
                    )}
                    {connectedPressureSensor && (
                        <div className="flex-1 flex items-center justify-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest border-l border-white/10">
                            <SignalIcon className="w-3 h-3" />
                            Presiune: {currentPressure.toFixed(1)} bar
                        </div>
                    )}
                </div>
            )}
            
            <LiveExtractionChart data={chartData} />

            {/* LIVE PRESSURE ROW: CURENTĂ & MEDIE */}
            <div className="grid grid-cols-2 gap-4">
                <div className={BOX_STYLE}>
                   <label className={MULTILINE_LABEL_STYLE}>PRESIUNE <span className="block leading-tight">CURENTĂ</span> <span className="block leading-tight">(bar)</span></label>
                   <div className={VALUE_WRAPPER_STYLE}>
                       <div className="flex items-center justify-center w-full">
                           <span className={`${UNIFIED_VALUE_STYLE} ${currentPressure >= 0.1 ? 'text-blue-400' : 'text-on-surface'}`}>
                               {currentPressure.toFixed(1)}
                           </span>
                       </div>
                   </div>
                </div>
                <div className={BOX_STYLE}>
                   <label className={MULTILINE_LABEL_STYLE}>PRESIUNE <span className="block leading-tight">MEDIE</span> <span className="block leading-tight">(bar)</span></label>
                   <div className={VALUE_WRAPPER_STYLE}>
                       <div className="flex items-center justify-center w-full">
                           <span className={UNIFIED_VALUE_STYLE}>{avgPressureStore.toFixed(1)}</span>
                       </div>
                   </div>
                </div>
            </div>

            {/* MAX PRESSURE ROW (FULL WIDTH) */}
            <div className={`${BOX_STYLE} w-full`}>
               <label className={MULTILINE_LABEL_STYLE}>PRESIUNE <span className="block leading-tight">MAXIMĂ</span> <span className="block leading-tight">(bar)</span></label>
               <div className={VALUE_WRAPPER_STYLE}>
                   <div className="flex items-center justify-center w-full">
                       <span className={UNIFIED_VALUE_STYLE}>{pressure.toFixed(1)}</span>
                   </div>
               </div>
            </div>

            {/* PREINFUSION & INFUZION ROW */}
            <div className="grid grid-cols-2 gap-4">
                <div className={BOX_STYLE}>
                   <label className={MULTILINE_LABEL_STYLE}>TIMP DE <span className="block leading-tight">PREINFUZIE (s)</span></label>
                   <div className={VALUE_WRAPPER_STYLE}><div className="flex items-center justify-center w-full"><input type="number" step="0.1" value={preinfusionTimeStore.toFixed(1)} onChange={e => setPreinfusionTimeStore(parseFloat(e.target.value))} className={`${NUMERIC_INPUT_STYLE}`} /></div></div>
                </div>
                <div className={BOX_STYLE}>
                   <label className={MULTILINE_LABEL_STYLE}>TIMP DE <span className="block leading-tight">INFUZIE (s)</span></label>
                   <div className={VALUE_WRAPPER_STYLE}><div className="flex items-center justify-center w-full"><input type="number" step="0.1" value={infusionTimeStore.toFixed(1)} onChange={e => setInfusionTimeStore(parseFloat(e.target.value))} className={`${NUMERIC_INPUT_STYLE}`} /></div></div>
                </div>
            </div>

            {/* POSTINFUSION & EFFECTIVE EXTRACTION ROW */}
            <div className="grid grid-cols-2 gap-4">
                <div className={BOX_STYLE}>
                   <label className={MULTILINE_LABEL_STYLE}>TIMP DE <span className="block leading-tight">POSTINFUZIE (s)</span></label>
                   <div className={VALUE_WRAPPER_STYLE}><div className="flex items-center justify-center w-full"><input type="number" step="0.1" value={postinfusionTimeStore.toFixed(1)} onChange={e => setPostinfusionTimeStore(parseFloat(e.target.value))} className={`${NUMERIC_INPUT_STYLE}`} /></div></div>
                </div>
                <div className={BOX_STYLE}>
                   <label className={MULTILINE_LABEL_STYLE}>TIMP EFECTIV DE <span className="block leading-tight">EXTRACȚIE (s)</span></label>
                   <div className={VALUE_WRAPPER_STYLE}><div className="flex items-center justify-center w-full"><input type="number" step="0.1" value={effectiveExtractionTimeStore.toFixed(1)} onChange={e => setEffectiveExtractionTimeStore(parseFloat(e.target.value))} className={`${NUMERIC_INPUT_STYLE}`} /></div></div>
                </div>
            </div>

            {/* TOTAL TIME ROW (FULL WIDTH) */}
            <div className={`${BOX_STYLE} w-full`}>
               <label className={MULTILINE_LABEL_STYLE}>TIMP TOTAL DE <span className="block leading-tight">EXTRACȚIE (s)</span></label>
               <div className={VALUE_WRAPPER_STYLE}><div className="flex items-center justify-center w-full"><input type="number" step="0.1" value={time.toFixed(1)} onChange={e => setTime(parseFloat(e.target.value))} className={`${NUMERIC_INPUT_STYLE}`} /></div></div>
            </div>

            {/* YIELD ROW (FULL WIDTH) */}
            <div className={`${BOX_STYLE} w-full ${isYieldManuallySet ? 'ring-1 ring-crema-500' : ''}`}>
               {isYieldManuallySet && <button onClick={() => { setIsYieldManuallySet(false); setYieldOut(parseFloat((doseIn * 2).toFixed(1))); }} className="absolute top-2 right-2 text-crema-500 hover:scale-110 transition-transform"><ArrowPathIcon className="w-4 h-4 drop-shadow-sm" /></button>}
               <label className={MULTILINE_LABEL_STYLE}>CAFEA EXTRASĂ <span className="block leading-tight">(g)</span></label>
               <div className={VALUE_WRAPPER_STYLE}><div className="flex items-center justify-center w-full"><input type="number" step="0.1" value={yieldOut.toFixed(1)} onChange={e => { setYieldOut(parseFloat(e.target.value)); setIsYieldManuallySet(true); }} className={`${NUMERIC_INPUT_STYLE}`} /></div></div>
            </div>

            {/* RATIO & FLOW ROW */}
            <div className="grid grid-cols-2 gap-4">
                <div className={BOX_STYLE}>
                   <label className={MULTILINE_LABEL_STYLE}>RAPORT <span className="block leading-tight">EXTRACȚIE</span> <span className="block leading-tight">(g/g)</span></label>
                   <div className={VALUE_WRAPPER_STYLE}>
                       <div className="flex items-center justify-center w-full">
                           <span className={UNIFIED_VALUE_STYLE}>{ratioDisplay}</span>
                       </div>
                   </div>
                </div>
                <div className={BOX_STYLE}>
                   <label className={MULTILINE_LABEL_STYLE}>
                       Flux lichid 
                       <span className="block leading-tight">extras</span> 
                       <span className="block leading-tight">(g/s)</span>
                   </label>
                   <div className={VALUE_WRAPPER_STYLE}>
                       <div className="flex items-center justify-center w-full">
                           <span className={UNIFIED_VALUE_STYLE}>{flowRate}</span>
                       </div>
                   </div>
                </div>
            </div>

            {/* FOTO */}
            <div className={`${BOX_STYLE} h-auto min-h-[140px] group hover:bg-surface-container/80 pb-6`}>
               <span className={LABEL_STYLE}>FOTOGRAFII SHOT</span>
               
               {/* Images Display */}
               <div className="flex-1 w-full flex items-center justify-center gap-3 pt-2 overflow-x-auto no-scrollbar mb-4">
                 {images.length === 0 ? <CameraIcon className="w-8 h-8 text-on-surface-variant/30 drop-shadow-sm" /> : (
                    images.map((img, idx) => (
                    <div key={idx} onClick={(e) => { e.preventDefault(); props.onViewImage(images[idx]); }} className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden shadow-md border border-white/10">
                        <img src={thumbnails[idx] || img} className="w-full h-full object-cover" alt={`Shot ${idx}`} />
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeImage(idx); }} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><TrashIcon className="w-4 h-4 text-white" /></button>
                    </div>
                    ))
                 )}
               </div>

               {/* Split Action Buttons using LABELS for native trigger */}
               {images.length < 5 && (
                   <div className="flex gap-3 justify-center">
                        {/* GALLERY BUTTON - LEFT */}
                        <label className="flex items-center justify-center gap-2 px-6 py-4 bg-surface-container-high hover:bg-blue-500 hover:text-white text-on-surface rounded-2xl border border-white/10 shadow-md active:scale-95 transition-all cursor-pointer flex-1">
                            <PhotoIcon className="w-8 h-8" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Galerie</span>
                            <input 
                                type="file" 
                                accept="image/*" 
                                multiple 
                                className="hidden" 
                                onChange={props.handleImageUpload} 
                            />
                        </label>

                        {/* CAMERA BUTTON - RIGHT */}
                        <label className="flex items-center justify-center gap-2 px-6 py-4 bg-surface-container-high hover:bg-crema-500 hover:text-coffee-900 text-on-surface rounded-2xl border border-white/10 shadow-md active:scale-95 transition-all cursor-pointer flex-1">
                            <CameraIcon className="w-8 h-8" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Cameră</span>
                            <input 
                                type="file" 
                                accept="image/*" 
                                capture="environment"
                                className="hidden" 
                                onChange={props.handleImageUpload} 
                            />
                        </label>
                   </div>
               )}
            </div>
        </div>
    );
});

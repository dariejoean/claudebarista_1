
import React from 'react';
import { 
    SECTION_HEADER_STYLE, 
    getDynamicSectionHeaderStyle,
    DEPTH_SHADOW
} from '../styles/common';
import { ShotData } from '../types';
import { HistoryList } from '../components/HistoryList';
import { BaristaChat } from '../components/BaristaChat';
import { useHistoryLogic } from '../hooks/useHistoryLogic';
import { getReconstructedTimes } from '../utils/shotUtils';
import { 
    ChartPieIcon,
    SparklesIcon,
    XMarkIcon,
    StarIcon,
    ArrowRightIcon,
    ArrowDownCircleIcon,
    ArrowPathIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    FunnelIcon,
    TrashIcon
} from '@heroicons/react/24/solid';

interface HistoryViewProps {
    shots: ShotData[];
    onDeleteShot: (id: string) => void;
    onViewShot: (id: string) => void;
    onOpenAnalysis: () => void;
}

const SORT_CONFIG = [
    { key: 'date', label: 'Dată / Recent' },
    { key: 'rating', label: 'Scor General' },
    { key: 'expert_score', label: 'Nota Expert' },
    { key: 'ratio', label: 'Rație' },
    { key: 'time', label: 'Timp' },
    { key: 'temp', label: 'Temperatură' },
    { key: 'grind', label: 'Măcinare' },
];

export const HistoryView: React.FC<HistoryViewProps> = React.memo(({ shots, onDeleteShot, onViewShot, onOpenAnalysis }) => {
    
    const logic = useHistoryLogic(shots);

    // Helpers
    const formatDate = (isoString: string) => {
        const d = new Date(isoString);
        return {
            date: d.toLocaleDateString('ro-RO', {day: '2-digit', month: '2-digit', year: 'numeric'}),
            time: d.toLocaleTimeString('ro-RO', {hour: '2-digit', minute: '2-digit'})
        };
    };

    const latestExpertScoreDisplay = () => {
        if (!logic.latestShot) return "N/A";
        if (logic.latestShot.structuredAnalysis?.score) {
            const scoreNum = logic.latestShot.structuredAnalysis.score.split('/')[0].trim();
            return `${scoreNum}/10`;
        } else if (logic.latestShot.expertAdvice && logic.latestShot.expertAdvice.includes('/10')) {
            const match = logic.latestShot.expertAdvice.match(/(\d+(\.\d)?)\/10/);
            if (match) return `${match[1]}/10`;
        }
        return "N/A";
    };

    // Calculate Grind Display for Latest Shot
    let latestGrindDisplay = "-";
    if (logic.latestShot && logic.latestShot.grindSetting !== undefined && logic.latestShot.grindSetting !== null) {
        if (logic.latestShot.grindScaleType === 'eureka') {
            const rotations = Math.floor(logic.latestShot.grindSetting / 20);
            const dial = logic.latestShot.grindSetting % 20;
            latestGrindDisplay = `${rotations}R + ${dial.toFixed(2)}`;
        } else {
            latestGrindDisplay = logic.latestShot.grindSetting.toFixed(2);
        }
    }

    const calculatePressureTime = (shot: ShotData) => {
        if (!shot.extractionProfile || shot.extractionProfile.length < 2) return 0;
        const points = shot.extractionProfile.filter(p => p.pressure > 0.1);
        if (points.length < 2) return 0;
        return Math.max(0, points[points.length - 1].time - points[0].time);
    };

    const LatestMetric = ({ label, val }: { label: string, val: string | number }) => (
        <div className="bg-black/10 backdrop-blur-sm rounded-xl p-2 text-center border border-white/10 shadow-sm flex flex-col justify-center h-full min-h-[50px]">
            <div className="text-[9px] font-bold text-on-surface-variant uppercase opacity-90 drop-shadow-sm mb-0.5 line-clamp-1">{label}</div>
            <div className="text-sm font-black text-on-surface drop-shadow-md leading-tight break-all line-clamp-1">{val}</div>
        </div>
    );

    const latestTimes = logic.latestShot ? getReconstructedTimes(logic.latestShot) : null;

    const DetailRow = ({ label, value }: { label: string, value: string }) => (
        <div className="flex flex-col w-full border-b border-white/10 last:border-0 py-2">
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60 text-left mb-0.5">{label}</span>
            <span className="text-sm font-bold text-on-surface text-left truncate">{value || '-'}</span>
        </div>
    );

    const isFilterActive = logic.activeFilterCount > 0;

    return (
        <div className="animate-fade-in space-y-5 pb-10">
            {logic.activeModal === 'chat' && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-surface-container w-full max-w-lg rounded-[2rem] p-0 overflow-hidden shadow-2xl border border-white/10 flex flex-col h-[600px] max-h-[85vh]">
                        <div className="p-4 border-b border-white/5 bg-surface flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center border border-white/5">
                                    <SparklesIcon className="w-6 h-6 text-yellow-400 drop-shadow-md" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-on-surface uppercase tracking-widest">Expert Barista</h2>
                                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider opacity-60">Asistent Virtual</p>
                                </div>
                            </div>
                            <button onClick={() => logic.setActiveModal('none')} className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-white transition-colors border border-white/5">
                                <XMarkIcon className="w-6 h-6"/>
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden bg-surface-container p-4">
                             <BaristaChat shots={shots} />
                        </div>
                    </div>
                </div>
            )}

            {logic.activeModal === 'filter_dashboard' && (
                <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-end sm:items-center justify-center animate-fade-in sm:p-4">
                    <div className="bg-surface-container w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] flex flex-col max-h-[90vh] shadow-2xl border-t sm:border border-white/10 overflow-hidden relative">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-surface/50 backdrop-blur-xl shrink-0">
                            <h2 className="text-sm font-black text-on-surface uppercase tracking-widest">FILTRARE AVANSATĂ</h2>
                            <button onClick={() => logic.setActiveModal('none')} className="p-2 text-on-surface-variant hover:text-white transition-colors"><XMarkIcon className="w-6 h-6" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-safe-bottom">
                            <div className="space-y-4">
                                <div>
                                    <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60 block mb-2">PERIOADĂ</span>
                                    <div className="flex gap-2">
                                        {[
                                            { id: 'all', label: 'TOT' },
                                            { id: 'week', label: '7 ZILE' },
                                            { id: 'month', label: '30 ZILE' }
                                        ].map(opt => (
                                            <button 
                                                key={opt.id} 
                                                onClick={() => logic.setFilters(prev => ({...prev, dateRange: opt.id as any}))}
                                                className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${logic.filters.dateRange === opt.id ? 'bg-blue-600 text-white border-blue-500' : 'bg-surface-container-high text-on-surface border-white/5'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60 block mb-2">SCOR MINIM</span>
                                    <div className="flex gap-2">
                                        {[
                                            { id: null, label: 'ORICE' },
                                            { id: 3, label: '3+ STELE' },
                                            { id: 4, label: '4+ STELE' },
                                            { id: 5, label: '5 STELE' }
                                        ].map(opt => (
                                            <button 
                                                key={String(opt.id)} 
                                                onClick={() => logic.setFilters(prev => ({...prev, minRating: opt.id}))}
                                                className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${logic.filters.minRating === opt.id ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-surface-container-high text-on-surface border-white/5'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">ESPRESSOR</span>
                                    {logic.filters.machine && <button onClick={() => logic.setFilters(prev => ({...prev, machine: null}))} className="text-[9px] font-bold text-red-400 uppercase"><TrashIcon className="w-3 h-3 inline mr-1"/>Șterge</button>}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {logic.uniqueMachines.map(m => (
                                        <button 
                                            key={m}
                                            onClick={() => logic.setFilters(prev => ({ ...prev, machine: prev.machine === m ? null : m }))}
                                            className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${logic.filters.machine === m ? 'bg-on-surface text-surface border-transparent' : 'bg-surface-container-high border-white/5 text-on-surface-variant'}`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">TIP CAFEA</span>
                                    {logic.filters.bean && <button onClick={() => logic.setFilters(prev => ({...prev, bean: null}))} className="text-[9px] font-bold text-red-400 uppercase"><TrashIcon className="w-3 h-3 inline mr-1"/>Șterge</button>}
                                </div>
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto no-scrollbar">
                                    {logic.uniqueBeans.map(bean => (
                                        <button 
                                            key={bean}
                                            onClick={() => logic.setFilters(prev => ({ ...prev, bean: prev.bean === bean ? null : bean }))}
                                            className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${logic.filters.bean === bean ? 'bg-on-surface text-surface border-transparent' : 'bg-surface-container-high border-white/5 text-on-surface-variant'}`}
                                        >
                                            {bean}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60 block mb-3">ORDONARE</span>
                                <div className="grid grid-cols-2 gap-2">
                                    {SORT_CONFIG.map(opt => {
                                        const isSelected = logic.filters.sort.startsWith(opt.key);
                                        const isAsc = logic.filters.sort.endsWith('_asc');
                                        return (
                                            <button 
                                                key={opt.key}
                                                onClick={() => logic.toggleSort(opt.key)}
                                                className={`h-12 rounded-xl flex items-center justify-between px-4 transition-all active:scale-95 border
                                                    ${isSelected ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-surface-container-high border-white/5 text-on-surface hover:bg-surface-container-high/80'}
                                                `}
                                            >
                                                <span className="text-[10px] font-bold uppercase tracking-wider">{opt.label}</span>
                                                {isSelected && (isAsc ? <ArrowUpIcon className="w-3.5 h-3.5" /> : <ArrowDownIcon className="w-3.5 h-3.5" />)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-white/10 bg-surface/90 backdrop-blur-xl flex gap-3">
                            <button onClick={() => logic.setFilters(logic.DEFAULT_FILTERS)} className="w-14 h-14 rounded-xl bg-surface-container-high text-on-surface-variant flex items-center justify-center hover:bg-surface-container transition-colors active:scale-95 border border-white/5">
                                <ArrowPathIcon className="w-5 h-5" />
                            </button>
                            <button onClick={() => logic.setActiveModal('none')} className="flex-1 h-14 bg-on-surface text-surface rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity active:scale-95 flex items-center justify-center gap-2">
                                APLICĂ FILTRE ({logic.processedShots.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <div id="section-history-analysis" className={`${SECTION_HEADER_STYLE} scroll-mt-24`} style={getDynamicSectionHeaderStyle()}>ANALIZE ȘI DISCUȚII</div>
            <div className="space-y-3">
                <button onClick={onOpenAnalysis} className="w-full py-4 bg-indigo-600 text-white rounded-full font-bold text-sm uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-[0_8px_20px_rgba(79,70,229,0.4)] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] active:scale-95 active:shadow-inner border border-white/10 flex items-center justify-center gap-2 group">
                    <ChartPieIcon className="w-5 h-5 drop-shadow-md group-hover:scale-110 transition-transform" /> <span>ANALIZE EXTRACȚII</span>
                </button>
                <button onClick={() => logic.setActiveModal('chat')} className="w-full py-4 bg-amber-600 text-white rounded-full font-bold text-sm uppercase tracking-widest hover:bg-amber-500 transition-all shadow-[0_8px_20px_rgba(217,119,6,0.4)] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] active:scale-95 active:shadow-inner border border-white/10 flex items-center justify-center gap-2 group">
                    <SparklesIcon className="w-5 h-5 drop-shadow-md group-hover:scale-110 transition-transform group-hover:rotate-12" /> <span>DISCUȚII DESPRE CAFEA</span>
                </button>
            </div>

            {logic.latestShot && !isFilterActive && (
                <>
                    <div id="section-history-latest" className={`${SECTION_HEADER_STYLE} scroll-mt-24`} style={getDynamicSectionHeaderStyle()}>EXTRACȚIA ANTERIOARĂ</div>
                    <div onClick={() => onViewShot(logic.latestShot!.id)} className={`bg-surface-container rounded-3xl p-5 relative overflow-hidden group cursor-pointer transition-all active:scale-[0.99] border border-white/10 ${DEPTH_SHADOW}`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-crema-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="flex items-center gap-2 self-center">
                                <span className="px-2 py-1 rounded-md bg-black/10 backdrop-blur-sm text-[10px] font-bold text-on-surface-variant border border-white/10 shadow-sm drop-shadow-sm">{formatDate(logic.latestShot!.date).date}</span>
                                <span className="px-2 py-1 rounded-md bg-black/10 backdrop-blur-sm text-[10px] font-bold text-on-surface-variant border border-white/10 shadow-sm drop-shadow-sm">{formatDate(logic.latestShot!.date).time}</span>
                            </div>
                            
                            <div className="flex flex-col gap-1.5 items-end">
                                {/* General Rating: X/5 */}
                                <div className="flex items-center gap-1.5 bg-amber-500 border border-amber-600 px-3 py-1 rounded-xl shadow-sm">
                                    <span className="text-[9px] font-bold text-white/90 uppercase tracking-widest mr-0.5">NOTA</span>
                                    <span className="text-xs font-black text-white drop-shadow-sm">{logic.latestShot!.ratingOverall || 0}/5</span>
                                    <StarIcon className="w-3.5 h-3.5 text-white drop-shadow-sm" />
                                </div>
                                {/* AI Score: Y/10 */}
                                <div className="flex items-center gap-1.5 bg-violet-600 border border-violet-700 px-3 py-1 rounded-xl shadow-sm">
                                    <span className="text-[9px] font-bold text-white/90 uppercase tracking-widest mr-0.5">EXPERT</span>
                                    <span className="text-xs font-black text-white drop-shadow-sm">{latestExpertScoreDisplay()}</span>
                                    <SparklesIcon className="w-3.5 h-3.5 text-white drop-shadow-sm" />
                                </div>
                            </div>
                        </div>
                        <div className="relative z-10 mb-5 pr-12">
                            <h3 className="text-base font-black text-on-surface uppercase tracking-wide drop-shadow-md leading-tight line-clamp-2">{logic.latestShot!.beanName}</h3>
                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider opacity-80 mt-1 truncate drop-shadow-sm">{logic.latestShot!.machineName}</p>
                        </div>
                        
                        {/* Numeric Strip - Compact Grid 3 cols */}
                        <div className="grid grid-cols-3 gap-2 mb-4 relative z-10">
                             <LatestMetric label="In" val={`${logic.latestShot!.doseIn}g`} />
                             <LatestMetric label="Out" val={`${logic.latestShot!.yieldOut}g`} />
                             <LatestMetric label="Timp" val={`${logic.latestShot!.time}s`} />
                             
                             <LatestMetric label="Presiune" val={`${logic.latestShot!.pressure}b`} />
                             <LatestMetric label="Ratio" val={`1:${(logic.latestShot!.yieldOut/logic.latestShot!.doseIn).toFixed(1)}`} />
                             <LatestMetric label="Temp" val={`${logic.latestShot!.temperature}°`} />
                        </div>

                        {/* Technical Details - Vertical List */}
                        <div className="flex flex-col bg-black/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 mb-4 relative z-10 shadow-sm">
                            <DetailRow label="Râșniță" value={logic.latestShot!.grinderName || 'Nespecificat'} />
                            <DetailRow label="Sită (Basket)" value={logic.latestShot!.basketName || 'Nespecificat'} />
                            <DetailRow label="Măcinare" value={latestGrindDisplay} />
                            <DetailRow label="Apă" value={logic.latestShot!.waterName || 'Nespecificat'} />
                            <DetailRow label="Tamper" value={logic.latestShot!.tamperName || 'Nespecificat'} />
                            <DetailRow label="Tampare (kgf)" value={logic.latestShot!.tampLevel || 'Nespecificat'} />
                            {logic.latestShot!.flowControlSetting !== undefined && (
                                <DetailRow label="Flow Control (Rotații)" value={`${logic.latestShot!.flowControlSetting} rot`} />
                            )}
                            <DetailRow label="Doză Cafea (g)" value={`${logic.latestShot!.doseIn.toFixed(1)} g`} />
                            <DetailRow label="Temperatură (°C)" value={`${logic.latestShot!.temperature.toFixed(1)} °C`} />
                            <DetailRow label="Presiune Maximă (bar)" value={logic.latestShot!.maxPressure !== undefined ? `${logic.latestShot!.maxPressure.toFixed(1)} bar` : `${logic.latestShot!.pressure.toFixed(1)} bar`} />
                            <DetailRow label="Presiune Medie (bar)" value={logic.latestShot!.avgPressure !== undefined ? `${logic.latestShot!.avgPressure.toFixed(1)} bar` : '-'} />
                            <DetailRow label="Timp de Preinfuzie (s)" value={latestTimes?.preinfusionTime !== undefined ? `${latestTimes.preinfusionTime.toFixed(1)} s` : '-'} />
                            <DetailRow label="Timp de Infuzie (s)" value={latestTimes?.infusionTime !== undefined ? `${latestTimes.infusionTime.toFixed(1)} s` : '-'} />
                            <DetailRow label="Timp de Postinfuzie (s)" value={latestTimes?.postinfusionTime !== undefined ? `${latestTimes.postinfusionTime.toFixed(1)} s` : '-'} />
                            <DetailRow label="Timp Efectiv de Extracție (s)" value={latestTimes?.effectiveExtractionTime !== undefined ? `${latestTimes.effectiveExtractionTime.toFixed(1)} s` : '-'} />
                            <DetailRow label="Flux Lichid Extras (g/s)" value={logic.latestShot ? `${(logic.latestShot.yieldOut / logic.latestShot.time).toFixed(1)} g/s` : '-'} />
                        </div>

                        {logic.latestShot!.notes && (
                            <div className="bg-black/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 relative z-10 mb-2 shadow-sm">
                                <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1 drop-shadow-sm opacity-80">OBSERVAȚII</span>
                                <p className="text-xs font-medium text-on-surface leading-relaxed drop-shadow-sm line-clamp-2">{logic.latestShot!.notes}</p>
                            </div>
                        )}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-surface-container-high/90 backdrop-blur-md border border-white/20 rounded-full shadow-xl group-hover:bg-crema-500 group-hover:text-coffee-900 transition-all duration-300 group-hover:scale-110">
                             <ArrowRightIcon className="w-6 h-6 text-on-surface" />
                        </div>
                    </div>
                </>
            )}
            
            <div id="section-history-log" className={`${SECTION_HEADER_STYLE} scroll-mt-24`} style={getDynamicSectionHeaderStyle()}>
                {isFilterActive ? `REZULTATE FILTRATE (${logic.processedShots.length})` : 'JURNAL COMPLET'}
            </div>
            
            <button 
                onClick={() => logic.setActiveModal('filter_dashboard')}
                className={`w-full h-14 rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-[0.98] border font-black text-xs uppercase tracking-widest gap-2
                    ${isFilterActive 
                        ? 'bg-blue-600 text-white border-blue-500 shadow-blue-900/20' 
                        : 'bg-surface-container text-on-surface border-white/5 hover:bg-surface-container-high'
                    }
                `}
            >
                {isFilterActive ? <FunnelIcon className="w-4 h-4"/> : null}
                {isFilterActive ? `Filtre Active (${logic.activeFilterCount})` : 'Filtrare Extractii'}
            </button>

            <HistoryList shots={logic.visibleShots} onDelete={onDeleteShot} onView={onViewShot} />

            {logic.hasMore && (
                <div className="flex justify-center pt-2 pb-8">
                    <button onClick={logic.handleLoadMore} className="flex items-center gap-2 px-8 py-3 bg-surface-container text-on-surface font-bold text-xs uppercase tracking-widest rounded-full border border-white/10 shadow-lg hover:bg-surface-container-high transition-all active:scale-95">
                        <ArrowDownCircleIcon className="w-5 h-5 text-on-surface-variant" />
                        Vezi mai multe ({logic.processedShots.length - logic.displayLimit})
                    </button>
                </div>
            )}
        </div>
    );
});

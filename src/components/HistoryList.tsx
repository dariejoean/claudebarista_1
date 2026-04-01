
import React from 'react';
import { ShotData } from '../types';
import { StarIcon, TrashIcon, SparklesIcon, PencilSquareIcon } from '@heroicons/react/24/solid';
import { LiveExtractionChart } from './new-shot/LiveExtractionChart';
import { getReconstructedTimes } from '../utils/shotUtils';

interface HistoryListProps {
  shots: ShotData[];
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

const formatDateTime = (isoString: string) => {
    const d = new Date(isoString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');

    return {
        date: `${day}.${month}.${year}`,
        time: `${hours}:${minutes}`
    };
};

const NumericMetric = ({ label, value, unit }: { label: string, value: string | number, unit?: string }) => (
    <div className="flex flex-col items-center justify-center">
        <span className="text-[9px] font-bold text-on-surface-variant/70 uppercase tracking-wider mb-0.5">{label}</span>
        <span className="text-xs font-black text-on-surface leading-none">
            {value}{unit && <span className="text-[9px] font-medium opacity-70 ml-0.5">{unit}</span>}
        </span>
    </div>
);

const DetailRow = ({ label, value }: { label: string, value: string }) => (
    <div className="flex flex-col w-full border-b border-white/5 last:border-0 py-1.5">
        <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60 text-left mb-0.5">{label}</span>
        <span className="text-xs font-bold text-on-surface text-left truncate">{value || '-'}</span>
    </div>
);

export const HistoryList: React.FC<HistoryListProps> = React.memo(({ shots, onDelete, onView }) => {
  
  if (shots.length === 0) {
    return (
      <div className="text-center text-on-surface-variant py-10 flex flex-col items-center opacity-60 text-sm">
        <p>Nu există înregistrări care să corespundă criteriilor.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-20">
       {shots.map((shot, index) => {
            const { date, time } = formatDateTime(shot.date);
            const isBest = (shot.ratingOverall || 0) >= 4.5;
            const ratio = shot.doseIn > 0 ? (shot.yieldOut / shot.doseIn).toFixed(1) : "0.0";
            const flowRate = shot.time > 0 ? (shot.yieldOut / shot.time).toFixed(1) : "0.0";
            const times = getReconstructedTimes(shot);
            
            // Expert Score Logic
            let expertScoreDisplay = "N/A";
            if (shot.structuredAnalysis?.score) {
                const scoreNum = shot.structuredAnalysis.score.split('/')[0].trim();
                expertScoreDisplay = `${scoreNum}/10`;
            } else if (shot.expertAdvice && shot.expertAdvice.includes('/10')) {
                const match = shot.expertAdvice.match(/(\d+(\.\d)?)\/10/);
                if (match) expertScoreDisplay = `${match[1]}/10`;
            }

            // Grind Display Logic
            let grindDisplay = "-";
            if (shot.grindSetting && shot.grindSetting !== '') {
                grindDisplay = shot.grindSetting;
            } else {
                    grindDisplay = shot.grindSetting.toFixed(2);
                }
            }

            // Pressure Time Logic (Legacy fallback)
            let legacyPressureTime = 0;
            if (shot.extractionProfile && shot.extractionProfile.length >= 2) {
                const points = shot.extractionProfile.filter(p => p.pressure > 0.1);
                if (points.length >= 2) {
                    legacyPressureTime = Math.max(0, points[points.length - 1].time - points[0].time);
                }
            }

            const infusionTime = shot.infusionTime !== undefined ? shot.infusionTime : legacyPressureTime;
            const effectiveExtractionTime = shot.effectiveExtractionTime !== undefined ? shot.effectiveExtractionTime : (infusionTime + (shot.postinfusionTime || 0));

            return (
              <div 
                key={shot.id} 
                className={`flex flex-col p-4 rounded-2xl border shadow-sm transition-all active:scale-[0.99] relative overflow-hidden cursor-pointer animate-slide-up-fade
                    ${isBest 
                        ? 'bg-surface-container border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)]' 
                        : 'bg-surface-container border-black/5 dark:border-white/5'
                    }
                `}
                style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s`, animationFillMode: 'both' }}
                onClick={() => onView(shot.id)}
              >
                {/* Header Row */}
                <div className="flex justify-between items-start mb-3 relative z-10">
                    <div className="flex flex-col pr-4 overflow-hidden">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-1.5 py-0.5 rounded-md bg-surface-container-high text-[9px] font-bold text-on-surface-variant border border-white/5 shadow-sm">{date}</span>
                            <span className="text-[9px] font-bold text-on-surface-variant opacity-60">{time}</span>
                        </div>
                        <h3 className={`text-sm font-black uppercase tracking-wide leading-tight line-clamp-2 drop-shadow-sm mt-1 ${isBest ? 'text-yellow-600 dark:text-yellow-400' : 'text-on-surface'}`}>
                            {shot.beanName}
                        </h3>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70 truncate">
                            {shot.machineName}
                        </p>
                    </div>
                    
                    <div className="flex gap-2 shrink-0">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onView(shot.id); }}
                            className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors shadow-sm border border-black/5"
                        >
                            <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(shot.id); }}
                            className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors shadow-sm border border-black/5"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* LIVE EXTRACTION CHART */}
                {shot.extractionProfile && shot.extractionProfile.length > 0 && (
                    <div className="mb-3 relative z-10">
                        <LiveExtractionChart data={shot.extractionProfile} compact={true} />
                    </div>
                )}

                {/* All Extraction Data in Order from New Tab */}
                <div className="flex flex-col bg-surface-container-high/30 rounded-xl p-3 border border-white/5 mb-3 relative z-10">
                    <DetailRow label="Espressor" value={shot.machineName || 'Nespecificat'} />
                    <DetailRow label="Apă" value={shot.waterName || 'Nespecificat'} />
                    <DetailRow label="Cafea" value={shot.beanName || 'Nespecificat'} />
                    <DetailRow label="Râșniță" value={shot.grinderName || 'Nespecificat'} />
                    <DetailRow label="Sită (Basket)" value={shot.basketName || 'Nespecificat'} />
                    <DetailRow label="Măcinare (Grad)" value={grindDisplay} />
                    <DetailRow label="Tamper" value={shot.tamperName || 'Nespecificat'} />
                    <DetailRow label="Tampare (kgf)" value={shot.tampLevel || 'Nespecificat'} />
                    {shot.flowControlSetting !== undefined && (
                        <DetailRow label="Flow Control (Rotații)" value={`${shot.flowControlSetting} rot`} />
                    )}
                    <DetailRow label="Doză Cafea (g)" value={`${shot.doseIn.toFixed(1)} g`} />
                    <DetailRow label="Temperatură (°C)" value={`${shot.temperature.toFixed(1)} °C`} />
                    <DetailRow label="Presiune Maximă (bar)" value={(shot.maxPressure || shot.pressure) !== undefined ? `${(shot.maxPressure || shot.pressure).toFixed(1)} bar` : '-'} />
                    <DetailRow label="Presiune Medie (bar)" value={shot.avgPressure !== undefined ? `${shot.avgPressure.toFixed(1)} bar` : '-'} />
                    <DetailRow label="Timp de Preinfuzie (s)" value={times.preinfusionTime !== undefined ? `${times.preinfusionTime.toFixed(1)} s` : '-'} />
                    <DetailRow label="Timp de Infuzie (s)" value={times.infusionTime !== undefined ? `${times.infusionTime.toFixed(1)} s` : '-'} />
                    <DetailRow label="Timp de Postinfuzie (s)" value={times.postinfusionTime !== undefined ? `${times.postinfusionTime.toFixed(1)} s` : '-'} />
                    <DetailRow label="Timp Efectiv de Extracție (s)" value={times.effectiveExtractionTime !== undefined ? `${times.effectiveExtractionTime.toFixed(1)} s` : '-'} />
                    <DetailRow label="Timp Total de Extracție (s)" value={`${shot.time.toFixed(1)} s`} />
                    <DetailRow label="Cafea Extrasă (g)" value={`${shot.yieldOut.toFixed(1)} g`} />
                    <DetailRow label="Raport Extracție (g/g)" value={`1:${ratio}`} />
                    <DetailRow label="Flux Lichid Extras (g/s)" value={flowRate !== "0.0" ? `${flowRate} g/s` : '-'} />
                </div>

                {/* Footer Ratings */}
                <div className="flex flex-col gap-2 relative z-10">
                    <div className="flex gap-2">
                        <div className="flex-1 flex justify-between items-center bg-amber-500 border border-amber-600 px-3 py-2 rounded-xl shadow-sm">
                            <span className="text-[9px] font-bold text-white/90 uppercase tracking-widest">SCOR</span>
                            <div className="flex items-center gap-1">
                                <span className="text-sm font-black text-white drop-shadow-sm">{shot.ratingOverall || 0}/5</span>
                                <StarIcon className="w-3.5 h-3.5 text-white drop-shadow-sm" />
                            </div>
                        </div>

                        <div className="flex-1 flex justify-between items-center bg-violet-600 border border-violet-700 px-3 py-2 rounded-xl shadow-sm">
                            <span className="text-[9px] font-bold text-white/90 uppercase tracking-widest">EXPERT</span>
                            <div className="flex items-center gap-1">
                                <span className="text-sm font-black text-white drop-shadow-sm">{expertScoreDisplay}</span>
                                <SparklesIcon className="w-3.5 h-3.5 text-white drop-shadow-sm" />
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            );
       })}
    </div>
  );
});

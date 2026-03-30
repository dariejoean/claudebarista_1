
import React from 'react';
import { useMaintenance } from '../hooks/useMaintenance';
import { MaintenanceLogEntry } from '../types';
import { 
    WrenchIcon, 
    CalendarDaysIcon, 
    ExclamationTriangleIcon,
    CheckCircleIcon,
    InformationCircleIcon,
    TrashIcon,
    XMarkIcon,
    PlusIcon,
    ListBulletIcon,
    ArrowDownTrayIcon
} from '@heroicons/react/24/solid';
import { 
    SECTION_HEADER_STYLE, 
    getDynamicSectionHeaderStyle, 
    BOX_STYLE,
    DEPTH_SHADOW 
} from '../styles/common';

export const MaintenanceView: React.FC = () => {
    const {
        overdueTasks,
        currentTasks,
        futureTasks,
        fullListTasks,
        schedulableDefinitions,
        currentYear,
        todayStr,
        showScheduler, setShowScheduler,
        showFullList, setShowFullList,
        viewingTask, setViewingTask,
        selectedOpId, setSelectedOpId,
        selectedDate, setSelectedDate,
        handleAddTask,
        handleToggleStatus,
        handleResetList,
        handleExportExcel,
        handleInfo,
        handleDeleteTask
    } = useMaintenance();

    // Helper formatter
    const formatDate = (iso: string) => {
        if(!iso) return '';
        const parts = iso.split('-');
        if(parts.length !== 3) return iso;
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
    };

    // --- RENDERERS ---
    const TaskRow: React.FC<{ task: MaintenanceLogEntry, isOverdue?: boolean }> = ({ task, isOverdue = false }) => (
        <div className={`flex flex-col p-4 rounded-2xl border mb-3 shadow-sm w-full shrink-0 ${isOverdue ? 'bg-red-900/20 border-red-500/30' : 'bg-surface-container-high border-white/5'}`}>
            
            {/* ROW 1: Date */}
            <div className="w-full text-center mb-1">
                <span className={`text-lg font-black uppercase tracking-[0.15em] ${isOverdue ? 'text-red-300' : 'text-blue-300'}`}>
                    {formatDate(task.dueDate)}
                </span>
            </div>

            {/* ROW 2: Name */}
            <div className="w-full text-center mb-4 px-1">
                <span className="text-base font-bold text-on-surface leading-tight drop-shadow-sm block">{task.operationLabel}</span>
            </div>
            
            {/* ROW 3: Buttons */}
            <div className="w-full flex items-center justify-center gap-6">
                <button onClick={() => handleInfo(task)} className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all border-2 border-on-surface/20">
                    <InformationCircleIcon className="w-6 h-6" />
                </button>
                <button onClick={() => handleToggleStatus(task)} className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all border-2 border-on-surface/20">
                    <CheckCircleIcon className="w-6 h-6" />
                </button>
                <button onClick={() => handleDeleteTask(task.id)} className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all border-2 border-on-surface/20">
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-24 relative min-h-screen">
            
            {/* MAIN DASHBOARD */}
            <div className="flex flex-col gap-4 mt-2">
                <div className={`${SECTION_HEADER_STYLE}`} style={getDynamicSectionHeaderStyle()}>JURNAL ÎNTREȚINERE</div>
                
                {/* 1. RESTANTE */}
                <div className={`relative overflow-hidden rounded-2xl ${DEPTH_SHADOW} border !border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] flex flex-col !bg-red-500/5`}>
                    <div className="bg-red-900/40 p-3 flex flex-col items-center justify-center gap-1 border-b border-red-500/20 shrink-0">
                        <div className="flex items-center gap-2">
                            <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                            <span className="text-xs font-black text-red-100 uppercase tracking-widest">OPERAȚIUNI RESTANTE</span>
                        </div>
                    </div>
                    <div className="bg-surface-container/50 p-2 max-h-[220px] overflow-y-auto no-scrollbar flex flex-col gap-1 min-h-[100px]">
                        {overdueTasks.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-on-surface-variant/50 text-xs italic py-8">Nicio operațiune restantă. Felicitări!</div>
                        ) : (
                            overdueTasks.map(t => <TaskRow key={t.id} task={t} isOverdue={true} />)
                        )}
                    </div>
                </div>

                {/* 2. CURENTE */}
                <div className={`${BOX_STYLE} p-0 overflow-hidden flex flex-col h-auto !border-green-500 !bg-green-500/5 shadow-[0_0_15px_rgba(34,197,94,0.1)]`}>
                    <div className="!bg-green-900/30 p-3 flex flex-col items-center justify-center gap-1 border-b border-green-500/20 shrink-0">
                        <div className="flex items-center gap-2">
                            <WrenchIcon className="w-4 h-4 text-green-400" />
                            <span className="text-xs font-black text-green-100 uppercase tracking-widest">OPERAȚIUNI CURENTE</span>
                        </div>
                        <span className="text-[10px] font-bold text-green-200/80 uppercase tracking-wider">{formatDate(todayStr)}</span>
                    </div>
                    <div className="p-2 min-h-[150px] flex-1">
                        {currentTasks.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-on-surface-variant/50 text-xs italic">Nimic programat pentru astăzi.</div>
                        ) : (
                            currentTasks.map(t => <TaskRow key={t.id} task={t} />)
                        )}
                    </div>
                </div>

                {/* 3. VIITOARE */}
                <div className={`${BOX_STYLE} p-0 overflow-hidden flex flex-col h-auto !border-blue-500 !bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.1)]`}>
                    <div className="!bg-blue-900/30 p-3 flex flex-col items-center justify-center gap-1 border-b border-blue-500/20 shrink-0">
                        <div className="flex items-center gap-2">
                            <CalendarDaysIcon className="w-4 h-4 text-blue-400" />
                            <span className="text-xs font-black text-blue-100 uppercase tracking-widest">OPERAȚIUNI VIITOARE</span>
                        </div>
                    </div>
                    <div className="p-2 min-h-[150px] flex-1">
                        {futureTasks.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-on-surface-variant/50 text-xs italic">Nicio operațiune în următoarele 30 de zile.</div>
                        ) : (
                            futureTasks.slice(0, 3).map(t => <TaskRow key={t.id} task={t} />)
                        )}
                        {futureTasks.length > 3 && (
                            <button 
                                onClick={() => setShowFullList(true)}
                                className="w-full text-center text-xs font-bold text-blue-400 uppercase tracking-widest hover:bg-white/5 py-3 rounded-xl transition-colors mt-1 active:scale-95 border border-transparent hover:border-blue-500/20"
                            >
                                + {futureTasks.length - 3} ALTE OPERAȚIUNI (VEZI TOT)
                            </button>
                        )}
                    </div>
                </div>

                {/* SECTION: PROGRAMARE */}
                <div className={`${SECTION_HEADER_STYLE} mt-2`} style={getDynamicSectionHeaderStyle()}>PROGRAMARE OPERAȚIUNI</div>

                <button onClick={() => setShowScheduler(true)} className="mx-auto w-full max-w-sm py-4 bg-blue-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-blue-500 transition-all flex items-center justify-center gap-2 active:scale-[0.98] border border-white/10">
                    <PlusIcon className="w-4 h-4" /> Programează Operațiune
                </button>

                <button onClick={() => setShowFullList(true)} className="mx-auto w-full max-w-sm py-3 bg-surface-container-high text-on-surface rounded-2xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-surface-container transition-all flex items-center justify-center gap-2 active:scale-[0.98] border border-white/5">
                    <ListBulletIcon className="w-4 h-4" /> Lista Operațiuni {currentYear}
                </button>
                
                <button onClick={handleExportExcel} className="mx-auto w-full max-w-sm py-3 bg-emerald-700/80 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 active:scale-[0.98] border border-white/10">
                    <ArrowDownTrayIcon className="w-4 h-4" /> Export Excel Lista Operatiuni
                </button>

                <button onClick={handleResetList} className="mx-auto w-full max-w-sm py-3 bg-red-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-red-500 transition-all flex items-center justify-center gap-2 active:scale-[0.98] border border-white/10">
                    <TrashIcon className="w-4 h-4" /> Resetare Lista Operatiuni
                </button>
            </div>

            {/* --- MODALS --- */}

            {/* 1. FULL LIST MODAL */}
            {showFullList && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col animate-fade-in">
                    <div className="p-5 border-b border-white/10 flex justify-between items-center bg-surface shrink-0 pt-safe-top">
                        <div>
                            <h2 className="text-lg font-black text-on-surface uppercase tracking-widest">LISTA OPERAȚIUNI {currentYear}</h2>
                            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                                {fullListTasks.filter(t => t.status === 'completed').length} / {fullListTasks.length} REALIZATE
                            </p>
                        </div>
                        <button onClick={() => setShowFullList(false)} className="p-2 bg-surface-container rounded-full text-on-surface-variant hover:text-white"><XMarkIcon className="w-6 h-6"/></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                        {fullListTasks.length === 0 ? (
                            <div className="text-center py-20 opacity-50 text-sm">Lista este goală.</div>
                        ) : (
                            fullListTasks.map(t => {
                                const isDone = t.status === 'completed';
                                return (
                                    <div key={t.id} onClick={() => handleToggleStatus(t)} className={`flex items-center p-4 rounded-2xl border transition-all cursor-pointer ${isDone ? 'bg-green-900/10 border-green-500/20 opacity-70' : 'bg-surface-container border-white/5'}`}>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 transition-colors shrink-0 ${isDone ? 'bg-green-500 border-green-500' : 'border-on-surface-variant/30'}`}>
                                            {isDone && <CheckCircleIcon className="w-4 h-4 text-white" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${isDone ? 'text-green-400' : 'text-blue-400'}`}>{formatDate(t.dueDate)}</span>
                                                {isDone && <span className="text-[9px] font-bold bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full uppercase">REALIZAT</span>}
                                            </div>
                                            <div className={`text-sm font-bold text-on-surface ${isDone ? 'line-through opacity-50' : ''}`}>{t.operationLabel}</div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            )}

            {/* 2. SCHEDULER MODAL */}
            {showScheduler && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-surface-container w-full max-w-sm rounded-3xl p-6 border border-white/10 shadow-2xl space-y-5">
                        <div className="text-center">
                            <h3 className="text-lg font-black text-on-surface uppercase tracking-widest mb-1">PROGRAMARE</h3>
                            <p className="text-xs text-on-surface-variant">Adaugă o sarcină în calendar</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 block ml-2">Operațiune</label>
                                {schedulableDefinitions.length > 0 ? (
                                    <select 
                                        value={selectedOpId}
                                        onChange={(e) => setSelectedOpId(e.target.value)}
                                        className="w-full bg-surface-container-high rounded-xl p-4 text-sm text-on-surface outline-none border border-white/5 appearance-none"
                                    >
                                        <option value="">-- Alege --</option>
                                        {schedulableDefinitions.map(d => <option key={d.id} value={d.id}>{d.label} {d.frequency ? `(${d.frequency})` : ''}</option>)}
                                    </select>
                                ) : (
                                    <div className="text-red-400 text-xs text-center border border-red-500/30 p-2 rounded-lg bg-red-900/10">
                                        Nu există operațiuni programabile (Săptămânale, Lunare, etc).<br/>Cele zilnice sunt ascunse.
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 block ml-2">Data Scadenței</label>
                                <input 
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full bg-surface-container-high rounded-xl p-4 text-sm text-on-surface outline-none border border-white/5 text-center uppercase tracking-widest font-bold"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button onClick={() => setShowScheduler(false)} className="py-3 bg-red-600/10 border border-red-500/50 text-red-400 rounded-xl font-bold text-xs uppercase tracking-widest">Anulează</button>
                            <button onClick={handleAddTask} disabled={!selectedOpId || !selectedDate} className="py-3 bg-green-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest disabled:opacity-50 disabled:grayscale hover:bg-green-500 transition-colors">Salvează</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. INFO MODAL */}
            {viewingTask && (
                 <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
                    <div className="bg-surface-container rounded-[2rem] w-full max-w-sm p-6 shadow-2xl flex flex-col gap-4 border border-white/10 relative">
                        <div className="flex justify-between items-start border-b border-white/5 pb-4">
                            <div className="pr-4">
                                <h3 className="text-on-surface font-bold text-xl leading-tight">{viewingTask.label}</h3>
                                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">Detalii Operațiune</p>
                            </div>
                            <button onClick={() => setViewingTask(null)} className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-white/5 transition-colors">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-1 no-scrollbar">
                             <div className="bg-surface-container-high p-4 rounded-xl shadow-inner border border-white/5 text-center">
                                <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">FRECVENȚĂ</div>
                                <div className="text-lg font-bold text-on-surface">{viewingTask.frequency || 'Nespecificată'}</div>
                             </div>
                             <div>
                                <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-2">DESCRIERE</div>
                                <div className="bg-surface-container-high/50 p-4 rounded-xl border border-white/5">
                                    <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line text-left opacity-90">
                                        {viewingTask.description || "Fără descriere."}
                                    </p>
                                </div>
                             </div>
                        </div>
                        <button onClick={() => setViewingTask(null)} className="w-full py-3 bg-surface-container-high text-on-surface rounded-full font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-colors border border-white/5 shadow-md mt-2">ÎNCHIDE</button>
                    </div>
                </div>
            )}
        </div>
    );
};

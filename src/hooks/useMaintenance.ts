
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, deleteMaintenanceTask, getSetting } from '../services/db';
import { MaintenanceLogEntry, ListItem } from '../types';
import * as XLSX from 'xlsx';

export const useMaintenance = () => {
    const [tasks, setTasks] = useState<MaintenanceLogEntry[]>([]);
    const [definitions, setDefinitions] = useState<ListItem[]>([]);
    const [showScheduler, setShowScheduler] = useState(false);
    const [showFullList, setShowFullList] = useState(false);
    const [viewingTask, setViewingTask] = useState<ListItem | null>(null);

    // Scheduler Form State
    const [selectedOpId, setSelectedOpId] = useState('');
    const [selectedDate, setSelectedDate] = useState('');

    // Live Query from DB
    const liveTasks = useLiveQuery(() => db.maintenanceLog.orderBy('dueDate').toArray());

    useEffect(() => {
        if (liveTasks) setTasks(liveTasks);
    }, [liveTasks]);

    useEffect(() => {
        const loadDefs = async () => {
            const data = await getSetting('maintenance_types');
            if (Array.isArray(data)) setDefinitions(data);
        };
        loadDefs();
    }, []);

    // --- RECURRENCE HELPERS ---
    const getIntervalDays = useCallback((freq: string): number => {
        const f = freq.toLowerCase();
        if (f.includes('zilnic')) return 1;
        if (f.includes('saptamanal') || f.includes('săptămânal')) return 7;
        if (f.includes('lunar')) return 28;
        if (f.includes('trimestrial')) return 84;
        if (f.includes('semestrial')) return 168;
        if (f.includes('anual')) return 364;
        return 0; 
    }, []);

    const setToNextSaturday = useCallback((date: Date): Date => {
        const d = new Date(date);
        const day = d.getDay(); 
        const dist = 6 - day; 
        if (dist === 0) return d; 
        d.setDate(d.getDate() + dist);
        return d;
    }, []);

    // --- FILTERING LOGIC ---
    const schedulableDefinitions = useMemo(() => {
        return definitions.filter(d => getIntervalDays(d.frequency || '') !== 1);
    }, [definitions, getIntervalDays]);

    const visibleTasks = useMemo(() => {
        return tasks.filter(t => {
            const def = definitions.find(d => d.id === t.operationId);
            if (def) return getIntervalDays(def.frequency || '') !== 1;
            return true; 
        });
    }, [tasks, definitions, getIntervalDays]);

    // --- DATE LOGIC ---
    const now = new Date();
    const currentYear = now.getFullYear();
    
    const toLocalISO = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const todayStr = toLocalISO(now);
    const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = toLocalISO(tomorrow);
    const futureLimit = new Date(now); futureLimit.setDate(futureLimit.getDate() + 30);
    const futureLimitStr = toLocalISO(futureLimit);

    const overdueTasks = useMemo(() => visibleTasks.filter(t => t.status === 'pending' && t.dueDate < todayStr), [visibleTasks, todayStr]);
    const currentTasks = useMemo(() => visibleTasks.filter(t => t.status === 'pending' && t.dueDate === todayStr), [visibleTasks, todayStr]);
    const futureTasks = useMemo(() => visibleTasks.filter(t => t.status === 'pending' && t.dueDate >= tomorrowStr && t.dueDate <= futureLimitStr), [visibleTasks, tomorrowStr, futureLimitStr]);

    const fullListTasks = useMemo(() => {
        return visibleTasks.filter(t => {
            const d = new Date(t.dueDate);
            return d.getFullYear() === currentYear; 
        }).sort((a,b) => a.dueDate.localeCompare(b.dueDate));
    }, [visibleTasks, currentYear]);

    // --- ACTIONS ---
    const handleAddTask = async () => {
        if (!selectedOpId || !selectedDate) return;
        const def = definitions.find(d => d.id === selectedOpId);
        if (!def) return;

        const interval = def.frequency ? getIntervalDays(def.frequency) : 0;

        if (interval === 1) {
            alert("Operațiunile zilnice sunt subînțelese și nu se afișează în jurnal.");
            return;
        }

        const tasksToAdd: MaintenanceLogEntry[] = [];
        
        const initialTask: MaintenanceLogEntry = {
            id: crypto.randomUUID(),
            operationId: def.id,
            operationLabel: def.label,
            dueDate: selectedDate,
            status: 'pending'
        };
        tasksToAdd.push(initialTask);

        if (interval > 0) {
            if (confirm(`Această operațiune are frecvența: "${def.frequency}".\nDorești să o programezi automat până la sfârșitul anului?`)) {
                let cursorDate = new Date(selectedDate);
                const endOfYear = new Date(currentYear, 11, 31); 

                while (true) {
                    cursorDate.setDate(cursorDate.getDate() + interval);
                    if (interval >= 7) cursorDate = setToNextSaturday(cursorDate);
                    if (cursorDate > endOfYear) break;

                    tasksToAdd.push({
                        id: crypto.randomUUID(),
                        operationId: def.id,
                        operationLabel: def.label,
                        dueDate: toLocalISO(cursorDate),
                        status: 'pending'
                    });
                }
            }
        }

        await db.maintenanceLog.bulkAdd(tasksToAdd);
        setShowScheduler(false);
        setSelectedOpId('');
        setSelectedDate('');
    };

    const handleToggleStatus = async (task: MaintenanceLogEntry) => {
        const newStatus = task.status === 'pending' ? 'completed' : 'pending';
        const updates: Partial<MaintenanceLogEntry> = {
            status: newStatus,
            completedDate: newStatus === 'completed' ? new Date().toISOString() : undefined
        };
        await db.maintenanceLog.update(task.id, updates);
    };

    const handleResetList = async () => {
        if (confirm("ATENȚIE: Sigur dorești să ștergi TOATĂ lista de operațiuni? Această acțiune este ireversibilă.")) {
            await db.maintenanceLog.clear();
        }
    };

    const handleExportExcel = () => {
        try {
            const data = fullListTasks.map(t => ({
                Data_Programata: t.dueDate, // Already simplified ISO
                Operatiune: t.operationLabel,
                Status: t.status === 'completed' ? 'REALIZAT' : 'NEEFECTUAT',
                Data_Finalizarii: t.completedDate ? new Date(t.completedDate).toLocaleString('ro-RO') : '-'
            }));

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, "Jurnal Operatiuni");
            XLSX.writeFile(wb, `Lista_Operatiuni_${currentYear}.xlsx`);
        } catch (e) {
            alert("Eroare la exportul Excel.");
            console.error(e);
        }
    };

    const handleInfo = (task: MaintenanceLogEntry) => {
        const def = definitions.find(d => d.id === task.operationId);
        if (def) setViewingTask(def);
        else setViewingTask({ id: '0', label: task.operationLabel, order: 0, description: "Definiția originală a fost ștearsă.", frequency: "N/A" });
    };

    const handleDeleteTask = async (id: string) => {
        await deleteMaintenanceTask(id);
    };

    return {
        // Data
        overdueTasks,
        currentTasks,
        futureTasks,
        fullListTasks,
        schedulableDefinitions,
        currentYear,
        todayStr,
        
        // UI State
        showScheduler, setShowScheduler,
        showFullList, setShowFullList,
        viewingTask, setViewingTask,
        selectedOpId, setSelectedOpId,
        selectedDate, setSelectedDate,

        // Actions
        handleAddTask,
        handleToggleStatus,
        handleResetList,
        handleExportExcel,
        handleInfo,
        handleDeleteTask
    };
};

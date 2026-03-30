
import React, { useState } from 'react';
import { db, getAllSettings, saveSetting, clearAllShots } from '../services/db';
import { ShotData, ListItem } from '../types';
import * as XLSX from 'xlsx';

export const useDataManagement = (shots: ShotData[]) => {
    const [isExporting, setIsExporting] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    // --- HELPER: Filename Generator ---
    const getFormattedFilename = (prefix: string, ext: string) => {
        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const y = now.getFullYear();
        const h = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        return `${prefix}_pharmabarista_${d}.${m}.${y}_${h}.${min}.${ext}`;
    };

    // --- HELPER: Force Download ---
    const forceDownload = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // --- EXPORT EXCEL ---
    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            const machines = await db.machines.toArray();
            const beans = await db.beans.toArray();
            const settings = await getAllSettings();
            
            // Sheet 1: Extractii
            const shotsData = shots.map(s => ({
                ID: s.id,
                Data: new Date(s.date).toLocaleDateString('ro-RO'),
                Ora: new Date(s.date).toLocaleTimeString('ro-RO'),
                Cafea: s.beanName,
                Espressor: s.machineName,
                Apa: s.waterName || '', 
                Doza_In: s.doseIn,
                Lichid_Out: s.yieldOut,
                Timp_Sec: s.time,
                Temp_C: s.temperature,
                Rasnita: s.grindSetting,
                Tamper: s.tamperName,
                Presiune_Tamper: s.tampLevel,
                Presiune_Pompa: s.pressure,
                Flow_Control: s.flowControlSetting || '',
                Scor_General: s.ratingOverall,
                Note_Senzoriale: JSON.stringify(s.tags), 
                Notite: s.notes,
                Diagnostic_AI: s.structuredAnalysis?.diagnosis || ''
            }));

            // Sheet 2: Cafea
            const coffeeData = beans.map(b => ({
                Nume: b.name,
                Prajitorie: b.roaster,
                Origine: b.origin,
                Procesare: b.process,
                Grad_Prajire: b.roastLevel,
                Arabica_Pct: b.compositionArabica,
                Robusta_Pct: b.compositionRobusta,
                Note: b.tastingNotes?.join(", "),
                Descriere: b.description
            }));

            // Sheet 3: Espressor
            const machineData = machines.map(m => ({
                Nume: m.name,
                Boiler: m.boilerType,
                Grup: m.groupType,
                Pompa: m.pumpType,
                PID: m.hasPid ? 'Da' : 'Nu',
                Presiune_Setata: m.pumpPressure,
                Descriere: m.description
            }));

            // Sheet 4: Tampere
            const tampers = (settings.tampers_list as ListItem[]) || [];
            const tamperData = tampers.map(t => ({
                Nume: t.label,
                Nivele: t.levels?.join(", "),
                Descriere: t.description
            }));

            // Sheet 5: Rasnite
            const grinders = (settings.grinders_list as ListItem[]) || [];
            const grinderData = grinders.map(g => ({
                Nume: g.label,
                Descriere: g.description
            }));

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(shotsData), "Extractii");
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(coffeeData), "Cafea");
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(machineData), "Espressor");
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tamperData), "Tampere");
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(grinderData), "Rasnite");

            const fileName = getFormattedFilename("export", "xlsx");
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            
            const file = new File([wbout], fileName, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'Export Excel Pharmabarista',
                        text: 'Alege unde dorești să salvezi fișierul Excel.'
                    });
                } catch (e) { console.log("Share cancelled, downloading instead."); forceDownload(file, fileName); }
            } else {
                forceDownload(file, fileName);
            }

        } catch (e) {
            console.error("Excel Export Error", e);
            alert("Eroare la generarea fișierului Excel.");
        } finally {
            setIsExporting(false);
        }
    };

    // --- BACKUP LOCAL ---
    const handleBackupLocal = async () => {
        try {
            const machines = await db.machines.toArray();
            const beans = await db.beans.toArray();
            const maintenance = await db.maintenanceLog.toArray();
            
            const exportData = {
                meta: { version: "3.2", date: new Date().toISOString(), app: "Pharmabarista AI" },
                shots: shots,
                machines: machines,
                beans: beans,
                maintenance: maintenance, 
                settings: await getAllSettings()
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const fileName = getFormattedFilename("backup", "json");
            const blob = new Blob([dataStr], { type: 'application/json' });
            
            forceDownload(blob, fileName);

        } catch (error) { 
            console.error("Local Backup error:", error); 
            alert("Eroare backup local."); 
        }
    };

    // --- BACKUP CLOUD ---
    const handleBackupCloud = async () => {
        try {
            const machines = await db.machines.toArray();
            const beans = await db.beans.toArray();
            const maintenance = await db.maintenanceLog.toArray();

            const exportData = {
                meta: { version: "3.2", date: new Date().toISOString(), app: "Pharmabarista AI" },
                shots: shots,
                machines: machines,
                beans: beans,
                maintenance: maintenance,
                settings: await getAllSettings()
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const originalName = getFormattedFilename("backup", "json");
            const shareName = originalName + ".txt"; 
            
            const file = new File([dataStr], shareName, { type: 'text/plain' });
            
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'Backup Pharmabarista',
                        text: 'Salvează fișierul de backup (Format compatibil .txt)'
                    });
                } catch (shareError: any) {
                    if (shareError.name !== 'AbortError') {
                        console.error("Share failed, falling back:", shareError);
                        alert("Partajarea a eșuat. Se descarcă local.");
                        const blob = new Blob([dataStr], { type: 'application/json' });
                        forceDownload(blob, originalName);
                    }
                }
            } else {
                alert("Acest browser nu suportă partajarea directă. Backup-ul se va descărca local.");
                const blob = new Blob([dataStr], { type: 'application/json' });
                forceDownload(blob, originalName);
            }

        } catch (error) { 
            console.error("Cloud Backup generation error:", error); 
            alert("A apărut o eroare la generarea backup-ului.");
        }
    };

    // --- RESTORE ---
    const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsRestoring(true);
        
        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const content = ev.target?.result as string;
                let imported: any;
                
                try {
                    imported = JSON.parse(content);
                } catch (e) {
                    alert("Fișierul nu este un JSON valid.");
                    return;
                }
                
                // SECURITY CHECK: Validate Structure
                if (!imported || typeof imported !== 'object') {
                    alert("Structură fișier invalidă.");
                    return;
                }

                // Check Meta signature
                if (!imported.meta || imported.meta.app !== "Pharmabarista AI") {
                    alert("Fișierul nu provine din aplicația PharmaBarista AI (Semnătură lipsă).");
                    return;
                }

                // Validate Key Arrays to prevent poisoning with non-array data
                if (imported.shots && !Array.isArray(imported.shots)) throw new Error("Format invalid: shots trebuie să fie array.");
                if (imported.machines && !Array.isArray(imported.machines)) throw new Error("Format invalid: machines trebuie să fie array.");
                if (imported.beans && !Array.isArray(imported.beans)) throw new Error("Format invalid: beans trebuie să fie array.");

                if (confirm(`Backup valid din data ${new Date(imported.meta.date).toLocaleDateString()}.\n\nSigur dorești să imporți datele? Această acțiune va actualiza baza de date curentă.`)) {
                    try {
                        // Bulk imports wrapped in try-catch
                        if (imported.shots) await db.shots.bulkPut(imported.shots);
                        
                        if (imported.machines) {
                            const cleanMachines = imported.machines.map((m: any) => { const { id, ...rest } = m; return rest; });
                            await db.machines.bulkPut(cleanMachines);
                        }
                        
                        if (imported.beans) {
                            const cleanBeans = imported.beans.map((b: any) => { const { id, ...rest } = b; return rest; });
                            await db.beans.bulkPut(cleanBeans);
                        }
                        
                        if (imported.maintenance && Array.isArray(imported.maintenance)) await db.maintenanceLog.bulkPut(imported.maintenance);
                        
                        if (imported.settings) {
                            for (const key of Object.keys(imported.settings)) {
                                await db.settings.put({ key: key, value: imported.settings[key] });
                            }
                        }
                        
                        // Legacy Migration
                        if (imported.water && Array.isArray(imported.water)) {
                            const waterAsListItems = imported.water.map((w: any, idx: number) => ({
                                id: crypto.randomUUID(),
                                label: w.name || w.label || "Apa Importata",
                                description: w.description || "",
                                order: idx
                            }));
                            await saveSetting('water_list', waterAsListItems);
                        }

                        alert("Restaurare realizată cu succes!");
                        window.location.reload();
                    } catch (importErr) {
                        console.error("Import logic failed:", importErr);
                        alert("Eroare la scrierea datelor în baza de date. Verificați integritatea fișierului.");
                    }
                }
            } catch (err) { 
                console.error(err);
                alert(`Eroare critică la import: ${err}`); 
            } finally {
                setIsRestoring(false);
                e.target.value = ''; // Reset input
            }
        };
        reader.readAsText(file);
    };

    const handleSync = async () => {
        try {
            const data = {
                shots: await db.shots.toArray(),
                settings: await getAllSettings(),
                machines: await db.machines.toArray(),
                beans: await db.beans.toArray(),
                analyses: await db.analyses.toArray(),
                maintenanceLog: await db.maintenanceLog.toArray(),
            };
            
            const res = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (!res.ok) {
                throw new Error('Eroare la sincronizare.');
            }
            alert('Sincronizare reușită!');
        } catch (e) {
            console.error(e);
            alert('Eroare la sincronizare.');
        }
    };

    const handleClearAllData = async () => {
        if(confirm("Sigur ștergi tot istoricul extracțiilor? Această acțiune este ireversibilă.")) {
            await clearAllShots();
        }
    };

    return {
        isExporting,
        isRestoring,
        handleExportExcel,
        handleBackupLocal,
        handleBackupCloud,
        handleRestore,
        handleClearAllData,
        handleSync
    };
};

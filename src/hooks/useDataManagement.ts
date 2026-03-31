import React, { useState } from 'react';
import { db, getAllSettings, saveSetting, clearAllShots } from '../services/db';
import { ShotData, ListItem } from '../types';
import * as XLSX from 'xlsx';

export const useDataManagement = (shots: ShotData[]) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const getFormattedFilename = (prefix: string, ext: string) => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return prefix + '_pharmabarista_' + d + '.' + m + '.' + y + '_' + h + '.' + min + '.' + ext;
  };

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

  const shareOrDownload = async (file: File, fallbackBlob: Blob, fallbackName: string) => {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: file.name });
        return;
      } catch (e: any) {
        if (e.name === 'AbortError') return;
        console.log("Share failed, falling back:", e);
      }
    }
    forceDownload(fallbackBlob, fallbackName);
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const machines = await db.machines.toArray();
      const beans = await db.beans.toArray();
      const settings = await getAllSettings();

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

      const coffeeData = beans.map(b => ({
        Nume: b.name, Prajitorie: b.roaster, Origine: b.origin,
        Procesare: b.process, Grad_Prajire: b.roastLevel,
        Arabica_Pct: b.compositionArabica, Robusta_Pct: b.compositionRobusta,
        Note: b.tastingNotes?.join(", "), Descriere: b.description
      }));

      const machineData = machines.map(m => ({
        Nume: m.name, Boiler: m.boilerType, Grup: m.groupType,
        Pompa: m.pumpType, PID: m.hasPid ? 'Da' : 'Nu',
        Presiune_Setata: m.pumpPressure, Descriere: m.description
      }));

      const tampers = (settings.tampers_list as ListItem[]) || [];
      const tamperData = tampers.map(t => ({ Nume: t.label, Nivele: t.levels?.join(", "), Descriere: t.description }));
      const grinders = (settings.grinders_list as ListItem[]) || [];
      const grinderData = grinders.map(g => ({ Nume: g.label, Descriere: g.description }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(shotsData), "Extractii");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(coffeeData), "Cafea");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(machineData), "Espressor");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tamperData), "Tampere");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(grinderData), "Rasnite");

      const fileName = getFormattedFilename("export", "xlsx");
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const file = new File([blob], fileName, { type: blob.type });
      await shareOrDownload(file, blob, fileName);
    } catch (e) {
      console.error("Excel Export Error", e);
      alert("Eroare la generarea fisierului Excel.");
    } finally { setIsExporting(false); }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const shotsData = shots.map(s => ({
        ID: s.id,
        Data: new Date(s.date).toLocaleDateString('ro-RO'),
        Ora: new Date(s.date).toLocaleTimeString('ro-RO'),
        Cafea: s.beanName, Espressor: s.machineName, Apa: s.waterName || '',
        Doza_In: s.doseIn, Lichid_Out: s.yieldOut, Timp_Sec: s.time,
        Temp_C: s.temperature, Rasnita: s.grindSetting, Tamper: s.tamperName,
        Presiune_Tamper: s.tampLevel, Presiune_Pompa: s.pressure,
        Flow_Control: s.flowControlSetting || '', Scor_General: s.ratingOverall,
        Notite: s.notes || '', Diagnostic_AI: s.structuredAnalysis?.diagnosis || ''
      }));
      const ws = XLSX.utils.json_to_sheet(shotsData);
      const csv = XLSX.utils.sheet_to_csv(ws);
      const csvWithBOM = '﻿' + csv;
      const fileName = getFormattedFilename("extractii", "csv");
      const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
      const file = new File([blob], fileName, { type: 'text/csv' });
      await shareOrDownload(file, blob, fileName);
    } catch (e) {
      console.error("CSV Export Error", e);
      alert("Eroare la generarea fisierului CSV.");
    } finally { setIsExporting(false); }
  };

  const handleBackupLocal = async () => {
    try {
      const machines = await db.machines.toArray();
      const beans = await db.beans.toArray();
      const maintenance = await db.maintenanceLog.toArray();
      const exportData = {
        meta: { version: "3.2", date: new Date().toISOString(), app: "Pharmabarista AI" },
        shots, machines, beans, maintenance, settings: await getAllSettings()
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      forceDownload(blob, getFormattedFilename("backup", "json"));
    } catch (error) { console.error("Local Backup error:", error); alert("Eroare backup local."); }
  };

  const handleBackupCloud = async () => {
    try {
      const machines = await db.machines.toArray();
      const beans = await db.beans.toArray();
      const maintenance = await db.maintenanceLog.toArray();
      const exportData = {
        meta: { version: "3.2", date: new Date().toISOString(), app: "Pharmabarista AI" },
        shots, machines, beans, maintenance, settings: await getAllSettings()
      };
      const dataStr = JSON.stringify(exportData, null, 2);
      const originalName = getFormattedFilename("backup", "json");
      const blob = new Blob([dataStr], { type: 'text/plain' });
      const file = new File([blob], originalName + ".txt", { type: 'text/plain' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Backup Pharmabarista' });
          return;
        } catch (e: any) {
          if (e.name === 'AbortError') return;
        }
      }
      alert("Acest browser nu suporta partajarea directa. Backup-ul se va descarca local.");
      forceDownload(new Blob([dataStr], { type: 'application/json' }), originalName);
    } catch (error) { console.error("Cloud Backup error:", error); alert("Eroare la generarea backup-ului."); }
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsRestoring(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const content = ev.target?.result as string;
        let imported: any;
        try { imported = JSON.parse(content); } catch { alert("Fisierul nu este un JSON valid."); return; }
        if (!imported || typeof imported !== 'object') { alert("Structura fisier invalida."); return; }
        if (!imported.meta || imported.meta.app !== "Pharmabarista AI") {
          alert("Fisierul nu provine din aplicatia PharmaBarista AI."); return;
        }
        if (imported.shots && !Array.isArray(imported.shots)) throw new Error("shots trebuie sa fie array.");
        if (imported.machines && !Array.isArray(imported.machines)) throw new Error("machines trebuie sa fie array.");
        if (imported.beans && !Array.isArray(imported.beans)) throw new Error("beans trebuie sa fie array.");
        if (confirm('Backup valid din data ' + new Date(imported.meta.date).toLocaleDateString() + '.\n\nSigur doresti sa importi datele?')) {
          try {
            if (imported.shots) await db.shots.bulkPut(imported.shots);
            if (imported.machines) {
              await db.machines.bulkPut(imported.machines.map((m: any) => { const { id, ...r } = m; return r; }));
            }
            if (imported.beans) {
              await db.beans.bulkPut(imported.beans.map((b: any) => { const { id, ...r } = b; return r; }));
            }
            if (imported.maintenance && Array.isArray(imported.maintenance)) await db.maintenanceLog.bulkPut(imported.maintenance);
            if (imported.settings) {
              for (const key of Object.keys(imported.settings)) {
                await db.settings.put({ key, value: imported.settings[key] });
              }
            }
            if (imported.water && Array.isArray(imported.water)) {
              const waterItems = imported.water.map((w: any, idx: number) => ({
                id: crypto.randomUUID(), label: w.name || w.label || "Apa Importata",
                description: w.description || "", order: idx
              }));
              await saveSetting('water_list', waterItems);
            }
            alert("Restaurare realizata cu succes!");
            window.location.reload();
          } catch (err) { console.error("Import failed:", err); alert("Eroare la scrierea datelor in baza de date."); }
        }
      } catch (err) { console.error(err); alert('Eroare critica la import: ' + err); }
      finally { setIsRestoring(false); e.target.value = ''; }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = async () => {
    if (confirm("Sigur stergi tot istoricul extractiilor? Aceasta actiune este ireversibila.")) {
      await clearAllShots();
    }
  };

  return { isExporting, isRestoring, handleExportExcel, handleExportCSV, handleBackupLocal, handleBackupCloud, handleRestore, handleClearAllData };
};

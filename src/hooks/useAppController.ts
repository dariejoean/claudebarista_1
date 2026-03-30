
import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, deleteShot, clearAllShots } from '../services/db';
import { useTheme } from './useTheme';
import { useShotEditor } from './useShotEditor';
import { useEditorStore } from '../store/editorStore';
import { ShotData, BeforeInstallPromptEvent, ListItem, TagCategory } from '../types';

export const useAppController = () => {
  // --- CORE UI STATE ---
  const [activeTab, setActiveTab] = useState<'new' | 'history' | 'maintenance' | 'settings'>('new');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [showAbout, setShowAbout] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // --- ENGINE & SETTINGS STATE ---
  const [engineMode, setEngineMode] = useState<'expert' | 'manual'>('expert');
  const [settingsManagerType, setSettingsManagerType] = useState<'machine' | 'bean' | 'tamper' | 'grinder' | 'basket' | 'accessory' | 'water' | null>(null);
  const [initialManagerView, setInitialManagerView] = useState<'list' | 'form'>('list');

  // --- MODAL STATES ---
  const [selectedShot, setSelectedShot] = useState<ShotData | null>(null);
  const [showAnalysis, setShowAnalysis] = useState<boolean>(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [activeTagCategory, setActiveTagCategory] = useState<TagCategory | null>(null);

  // --- INSTALL PROMPT ---
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // --- DATA QUERIES (Dexie) ---
  const shots = useLiveQuery(() => db.shots.orderBy('date').reverse().toArray()) || [];
  const savedMachines = useLiveQuery(() => db.machines.orderBy('name').toArray()) || [];
  const savedBeans = useLiveQuery(() => db.beans.orderBy('name').toArray()) || [];
  
  const tampersSetting = useLiveQuery(() => db.settings.get('tampers_list'));
  const tampersList = (tampersSetting?.value as ListItem[]) || [];

  const waterSetting = useLiveQuery(() => db.settings.get('water_list'));
  const waterList = (waterSetting?.value as ListItem[]) || [];

  const accessoriesSetting = useLiveQuery(() => db.settings.get('accessories_list'));
  const accessoriesList = (accessoriesSetting?.value as ListItem[]) || [];

  // --- CUSTOM HOOKS INTEGRATION ---
  const theme = useTheme();
  // Editor Hook logic
  const editorLogic = useShotEditor(savedMachines, savedBeans, tampersList, engineMode);
  
  // Store actions
  const setTags = useEditorStore(s => s.setTags);
  const machineName = useEditorStore(s => s.machineName);
  const beanName = useEditorStore(s => s.beanName);

  // --- CLOCK ---
  useEffect(() => {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
  }, []);

  // --- PWA INSTALL ---
  useEffect(() => {
      const handleInstallPrompt = (e: Event) => {
          e.preventDefault();
          setInstallPrompt(e as BeforeInstallPromptEvent);
          console.log("PWA Install Prompt Captured");
      };
      window.addEventListener('beforeinstallprompt', handleInstallPrompt);
      return () => { window.removeEventListener('beforeinstallprompt', handleInstallPrompt); };
  }, []);

  const handleInstallApp = async () => {
      if (!installPrompt) return;
      try {
          await installPrompt.prompt();
          await installPrompt.userChoice;
          setInstallPrompt(null);
      } catch (e) { console.error("Install prompt failed", e); }
  };

  // --- HISTORY API ---
  useEffect(() => {
    window.history.replaceState({ page: 'home' }, '', '');
    const handlePopState = () => {
        let handled = false;
        if (selectedShot) { setSelectedShot(null); handled = true; }
        else if (theme.showThemeEditor) { theme.setShowThemeEditor(false); handled = true; }
        else if (theme.showThemeSelector) { theme.setShowThemeSelector(false); handled = true; }
        else if (showAnalysis) { setShowAnalysis(false); handled = true; }
        else if (showAbout) { setShowAbout(false); handled = true; }
        else if (fullScreenImage) { setFullScreenImage(null); handled = true; }
        else if (activeTagCategory) { setActiveTagCategory(null); handled = true; }
        else if (isMenuOpen) { setIsMenuOpen(false); handled = true; }
        else if (activeTab === 'settings' && settingsManagerType) { setSettingsManagerType(null); handled = true; }
        else if (activeTab !== 'new') { setActiveTab('new'); handled = true; }

        if (handled) { window.history.pushState({ page: 'app_active' }, '', ''); }
    };
    window.addEventListener('popstate', handlePopState);
    return () => { window.removeEventListener('popstate', handlePopState); };
  }, [activeTab, theme.showThemeEditor, theme.showThemeSelector, showAnalysis, fullScreenImage, activeTagCategory, isMenuOpen, settingsManagerType, selectedShot, showAbout]);

  const pushHistoryState = () => { window.history.pushState({ page: 'nested' }, '', ''); };

  // --- ACTIONS ---

  const handleToggleTag = useCallback((tag: string) => {
    if (!activeTagCategory) return;
    setTags(prev => {
      const currentList = prev[activeTagCategory];
      if (currentList.includes(tag)) return { ...prev, [activeTagCategory]: currentList.filter(t => t !== tag) };
      return { ...prev, [activeTagCategory]: [...currentList, tag] };
    });
  }, [activeTagCategory, setTags]);

  const handleDeleteShot = useCallback(async (id: string) => {
    if (confirm("Sigur ștergi această înregistrare?")) {
        try {
            await deleteShot(id);
            if (selectedShot?.id === id) setSelectedShot(null);
        } catch (e) { console.error("Delete failed", e); alert("Eroare la ștergerea înregistrării."); }
    }
  }, [selectedShot]);

  const handleViewHistoryShot = useCallback((id: string) => {
    const s = shots.find(item => item.id === id);
    if (s) { setSelectedShot(s); pushHistoryState(); }
  }, [shots]);

  const handleShotUpdated = useCallback((updatedShot: ShotData) => {
      setSelectedShot(updatedShot);
  }, []);

  const clearAllData = useCallback(async () => {
    try { await clearAllShots(); setSelectedShot(null); } catch (e) { console.error("Clear data failed", e); }
  }, []);

  const handleSaveWrapper = useCallback((extraData?: Partial<ShotData>) => {
      editorLogic.handleSaveAndAnalyze(extraData, (savedShot) => {
          setSelectedShot(savedShot);
          pushHistoryState();
      });
  }, [editorLogic]);

  const handleTabChange = useCallback((tab: 'new' | 'history' | 'maintenance' | 'settings') => { 
      if (tab === 'new') editorLogic.resetForm(false);
      setSelectedShot(null);
      setActiveTab(tab); 
      if (tab !== 'new') pushHistoryState();
      if (tab === 'history') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }
  }, [editorLogic]);

  const handleNavigateToSection = useCallback((tab: 'new' | 'history' | 'maintenance' | 'settings', sectionId?: string) => {
      setIsMenuOpen(false);
      if (activeTab !== tab) handleTabChange(tab);
      if (sectionId) {
          setTimeout(() => {
              const el = document.getElementById(sectionId);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 150);
      }
  }, [activeTab, handleTabChange]);

  const openManager = (type: 'machine' | 'bean' | 'tamper' | 'water' | 'basket') => {
      setSettingsManagerType(type);
      setInitialManagerView('form');
      setActiveTab('settings');
      pushHistoryState();
  };

  return {
    // State
    activeTab, setActiveTab,
    isMenuOpen, setIsMenuOpen,
    showAbout, setShowAbout,
    currentTime,
    engineMode, setEngineMode,
    settingsManagerType, setSettingsManagerType,
    initialManagerView, setInitialManagerView,
    selectedShot, setSelectedShot,
    showAnalysis, setShowAnalysis,
    fullScreenImage, setFullScreenImage,
    activeTagCategory, setActiveTagCategory,
    installPrompt,
    
    // Data
    shots,
    savedMachines,
    savedBeans,
    tampersList,
    waterList,
    accessoriesList,
    machineName,
    beanName,

    // Sub-Logics
    theme,
    editorLogic,

    // Actions
    handleInstallApp,
    pushHistoryState,
    handleToggleTag,
    handleDeleteShot,
    handleViewHistoryShot,
    handleShotUpdated,
    clearAllData,
    handleSaveWrapper,
    handleTabChange,
    handleNavigateToSection,
    openManager
  };
};

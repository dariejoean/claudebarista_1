
import React from 'react';
import { useAppController } from './hooks/useAppController';
import { useEditorStore } from './store/editorStore';
import { migrateShotTimes, getSetting, saveSetting } from './services/db';

// Modular Components & Views
import { PharmaCoffeeIcon } from './components/PharmaCoffeeIcon';
import { TagModal } from './components/TagModal';
import { ThemeEditorModal } from './components/ThemeEditorModal';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import { NavigationDrawer } from './components/NavigationDrawer';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { SettingsView } from './components/SettingsView';
import { ShotDetailModal } from './components/ShotDetailModal';

// New Views
import { NewShotView } from './views/NewShotView';
import { MaintenanceView } from './views/MaintenanceView';
import { HistoryView } from './views/HistoryView';

// Constants
import { THEME_METADATA } from './constants';

// Icons
import { Bars3Icon, XMarkIcon, PlusIcon, ListBulletIcon, WrenchIcon, Cog6ToothIcon } from '@heroicons/react/24/solid';

import { ErrorBoundary } from './components/ErrorBoundary';

const App: React.FC = () => {
  const ctrl = useAppController();

  React.useEffect(() => {
    const runMigration = async () => {
      const hasMigrated = await getSetting('has_migrated_times_v4');
      if (!hasMigrated) {
        await migrateShotTimes();
        await saveSetting('has_migrated_times_v4', true);
      }
    };
    runMigration();
  }, []);

  const getTabStyle = (tab: string) => {
      const isActive = ctrl.activeTab === tab;
      
      // Layout Base - Vertical stack, centered
      const base = "flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-all duration-300 group relative rounded-2xl cursor-pointer select-none active:scale-95";
      
      // Icon Style
      const iconContainerBase = "w-10 h-8 rounded-full flex items-center justify-center transition-all duration-500 ease-out relative";
      const iconActive = "bg-on-surface text-surface shadow-md translate-y-0 scale-110";
      const iconInactive = "text-on-surface-variant/60 group-hover:text-on-surface-variant group-hover:bg-white/5";

      // Text Label Style
      const labelClass = `text-[9px] font-bold uppercase tracking-widest transition-all duration-300 leading-none ${isActive ? 'text-on-surface opacity-100 translate-y-0' : 'text-on-surface-variant/70 opacity-80 group-hover:opacity-100'}`;

      let Icon = PlusIcon;
      if (tab === 'history') Icon = ListBulletIcon;
      if (tab === 'maintenance') Icon = WrenchIcon;
      if (tab === 'settings') Icon = Cog6ToothIcon;

      return (
        <button onClick={() => ctrl.handleTabChange(tab as any)} className={base}>
            <div className={`${iconContainerBase} ${isActive ? iconActive : iconInactive}`}>
                <Icon className="w-5 h-5" />
            </div>
            <span className={labelClass}>
                {tab === 'new' ? 'NOU' : tab === 'history' ? 'ISTORIC' : tab === 'maintenance' ? 'SERVICE' : 'SETĂRI'}
            </span>
        </button>
      );
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen pb-32 relative bg-surface transition-colors duration-700">
        
        {/* AMBIENT BACKGROUND LAYER */}
        <div className="fixed inset-0 pointer-events-none z-0">
            {/* Soft, top-down gradient to give depth */}
            <div className="absolute top-0 left-0 right-0 h-[40vh] bg-gradient-to-b from-white/10 to-transparent opacity-60"></div>
            {/* Subtle Noise Texture for Premium Feel */}
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        </div>

        {ctrl.theme.isRandomizing && (
            <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center overflow-hidden animate-fade-in">
                <div className="relative w-full h-full flex items-center justify-center">
                    <div className="absolute w-[200vw] h-[200vw] bg-[conic-gradient(from_0deg,transparent_0deg,#ff0000_60deg,transparent_120deg,#00ff00_180deg,transparent_240deg,#0000ff_300deg,transparent_360deg)] animate-[spin_0.5s_linear_infinite] opacity-50 blur-3xl"></div>
                    <div className="absolute w-64 h-64 bg-white/10 rounded-full backdrop-blur-xl border border-white/20 animate-pulse flex items-center justify-center z-10">
                        <span className="text-white font-black tracking-[0.5em] text-xs">GENERATING...</span>
                    </div>
                </div>
            </div>
        )}

        {/* FULL SCREEN IMAGE VIEWER */}
        {ctrl.fullScreenImage && (
            <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-scale-in" onClick={() => ctrl.setFullScreenImage(null)}>
                <img src={ctrl.fullScreenImage} className="max-w-full max-h-full rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] object-contain border border-white/10" alt="Fullscreen" />
                <button className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 border border-white/10 transition-all active:scale-90">
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </div>
        )}

        {ctrl.showAbout && (
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center animate-fade-in px-6" onClick={() => ctrl.setShowAbout(false)}>
                <div className="bg-[#121212] p-6 rounded-[2rem] border border-white/10 shadow-2xl flex flex-col items-center justify-center gap-1.5 transform transition-all animate-scale-in" onClick={(e) => e.stopPropagation()}>
                    <div className="text-white text-xs sm:text-sm font-black tracking-[0.15em] uppercase text-center drop-shadow-sm">
                        PharmaBarista v7
                    </div>
                    <div className="text-white/70 text-[11px] sm:text-xs font-bold tracking-[0.1em] uppercase text-center drop-shadow-sm">
                        Copyright Darie Joean 2026
                    </div>
                </div>
            </div>
        )}

        {ctrl.selectedShot && (
            <ShotDetailModal 
                shot={ctrl.selectedShot} 
                onClose={() => ctrl.setSelectedShot(null)} 
                onViewImage={(img) => { ctrl.setFullScreenImage(img); ctrl.pushHistoryState(); }}
                onShotUpdated={ctrl.handleShotUpdated}
                uniqueMachines={ctrl.savedMachines.map(m => m.name)}
                uniqueBeans={ctrl.savedBeans.map(b => b.name)}
                waterList={ctrl.waterList}
            />
        )}

        {ctrl.theme.showThemeEditor && (
            <ThemeEditorModal 
                colors={ctrl.theme.activeColors}
                defaultColors={THEME_METADATA[ctrl.theme.theme].defaults}
                themeName={THEME_METADATA[ctrl.theme.theme].name}
                onChange={ctrl.theme.handleColorChange} 
                onSave={ctrl.theme.handleSaveTheme} 
                onReset={ctrl.theme.handleResetTheme}
                onClose={() => ctrl.theme.setShowThemeEditor(false)} 
            />
        )}
        
        {ctrl.theme.showThemeSelector && (
            <ThemeSelectorModal
                currentTheme={ctrl.theme.theme}
                customizations={ctrl.theme.allCustomizations}
                onSelect={ctrl.theme.handleSelectTheme}
                onClose={() => ctrl.theme.setShowThemeSelector(false)}
            />
        )}
        
        <NavigationDrawer 
            isOpen={ctrl.isMenuOpen} 
            onClose={() => ctrl.setIsMenuOpen(false)} 
            activeTab={ctrl.activeTab}
            onNavigate={ctrl.handleNavigateToSection}
        />

      {/* HEADER - SYMMETRICAL & PREMIUM */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-white/5 pt-safe-top transition-all duration-300">
        <div className="max-w-md mx-auto px-5 py-3 flex justify-between items-center relative">
          
          {/* LEFT BUTTON (Theme Icon) - Fixed Size Circle */}
          <button 
            onClick={ctrl.theme.handleCycleTheme}
            style={{ backgroundColor: ctrl.theme.nextThemeData.bgColor }}
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border border-white/10 shadow-lg p-2 active:scale-90 transition-transform hover:shadow-xl group"
          >
             <div className="w-full h-full transform transition-transform group-hover:rotate-12 duration-500">
                <PharmaCoffeeIcon isLightMode={ctrl.theme.nextThemeData.isLight} />
             </div>
          </button>

          {/* CENTER TEXT - Mathematically centered due to equal side buttons */}
          <div className="flex flex-col justify-center items-center flex-1 min-w-0 h-full gap-0.5">
             <div 
               onClick={() => { ctrl.setShowAbout(true); ctrl.pushHistoryState(); }}
               className={`text-sm font-black tracking-[0.25em] whitespace-nowrap text-center leading-none transition-colors drop-shadow-sm text-[var(--header-title-color)] cursor-pointer active:scale-95 active:opacity-70`}
             >
                PHARMABARISTA
             </div>
             
             <div className="flex items-center gap-1.5 opacity-60">
                <span className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase tabular-nums">
                    {ctrl.currentTime.toLocaleDateString('ro-RO')}
                </span>
                <span className="w-1 h-1 rounded-full bg-on-surface-variant/50"></span>
                <span className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase tabular-nums">
                    {ctrl.currentTime.toLocaleTimeString('ro-RO', { hour12: false, hour: '2-digit', minute:'2-digit' })}
                </span>
             </div>
          </div>

          {/* RIGHT BUTTON (Menu) - Fixed Size Circle (Identical to Left) */}
          <button 
            onClick={() => { ctrl.setIsMenuOpen(true); ctrl.pushHistoryState(); }} 
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-surface-container-high border border-white/10 shadow-lg text-on-surface active:scale-90 transition-transform hover:shadow-xl hover:bg-surface-container"
          >
            <Bars3Icon className="w-6 h-6 drop-shadow-sm" />
          </button>
        </div>
      </header>

      {/* TAG MODAL */}
      <TagModal 
        category={ctrl.activeTagCategory} 
        selectedTags={ctrl.activeTagCategory ? useEditorStore.getState().tags[ctrl.activeTagCategory] : []} 
        onClose={() => ctrl.setActiveTagCategory(null)} 
        onToggleTag={ctrl.handleToggleTag} 
      />
      
      {ctrl.showAnalysis && <AnalysisDashboard shots={ctrl.shots} onClose={() => ctrl.setShowAnalysis(false)} />}

      <main className="max-w-md mx-auto px-5 pt-6 flex flex-col gap-6 relative z-10 min-h-[85vh]">
        {/* Animated Wrapper for Tab Switching - Key forces re-mount animation */}
        <div key={ctrl.activeTab} className="animate-fade-in flex flex-col gap-6 w-full">
            {ctrl.activeTab === 'new' && (
                <NewShotView 
                    shots={ctrl.shots}
                    waterList={ctrl.waterList} 
                    tampersList={ctrl.tampersList}
                    accessoriesList={ctrl.accessoriesList}
                    uniqueMachines={ctrl.editorLogic.uniqueMachines}
                    uniqueBeans={ctrl.editorLogic.uniqueBeans}
                    
                    loading={ctrl.editorLogic.loading}
                    errorMsg={ctrl.editorLogic.errorMsg}

                    onAddMachine={() => ctrl.openManager('machine')}
                    onAddBean={() => ctrl.openManager('bean')}
                    onAddWater={() => ctrl.openManager('water')}
                    onManageTampers={() => ctrl.openManager('tamper')}
                    onManageTampLevels={() => ctrl.openManager('tamper')}
                    
                    handleImageUpload={ctrl.editorLogic.handleImageUpload}
                    onViewImage={(img) => { ctrl.setFullScreenImage(img); ctrl.pushHistoryState(); }}
                    onOpenTagModal={(cat) => { ctrl.setActiveTagCategory(cat); ctrl.pushHistoryState(); }}
                    
                    onSaveAndAnalyze={ctrl.handleSaveWrapper}
                    onCancel={() => ctrl.editorLogic.resetForm(true)}
                    applySuggestion={ctrl.editorLogic.applySuggestion}
                />
            )}

            {ctrl.activeTab === 'history' && (
                <HistoryView 
                    shots={ctrl.shots}
                    onDeleteShot={ctrl.handleDeleteShot}
                    onViewShot={ctrl.handleViewHistoryShot}
                    onOpenAnalysis={() => { ctrl.setShowAnalysis(true); ctrl.pushHistoryState(); }}
                />
            )}

            {ctrl.activeTab === 'maintenance' && <MaintenanceView />}

            {ctrl.activeTab === 'settings' && (<SettingsView 
                engineMode={ctrl.engineMode}
                onSetEngineMode={ctrl.setEngineMode}
                machineName={ctrl.machineName} 
                beanName={ctrl.beanName} 
                onClearData={ctrl.clearAllData} 
                shots={ctrl.shots} 
                onOpenThemeEditor={() => { ctrl.theme.setShowThemeEditor(true); ctrl.pushHistoryState(); }}
                onOpenThemeSelector={() => { ctrl.theme.setShowThemeSelector(true); ctrl.pushHistoryState(); }}
                onGenerateRandomTheme={ctrl.theme.handleGenerateRandomTheme}
                currentCustomizations={ctrl.theme.allCustomizations}
                managerType={ctrl.settingsManagerType}
                onSetManagerType={(type) => { ctrl.setSettingsManagerType(type); if(type) ctrl.pushHistoryState(); }}
                initialManagerView={ctrl.initialManagerView}
                onNavigate={(tab) => { ctrl.setActiveTab(tab); ctrl.pushHistoryState(); }}
                installPrompt={ctrl.installPrompt}
                onInstall={ctrl.handleInstallApp}
            />)}
        </div>
      </main>

      {/* FLOATING NAVIGATION BAR - PREMIUM GLASS DOCK STYLE */}
      <nav className="fixed bottom-5 left-4 right-4 z-50 animate-slide-up">
        <div className="max-w-md mx-auto bg-surface-container/90 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-between px-3 py-2 relative overflow-visible ring-1 ring-white/5">
            {getTabStyle('new')}
            {getTabStyle('history')}
            {getTabStyle('maintenance')}
            {getTabStyle('settings')}
        </div>
      </nav>
      </div>
    </ErrorBoundary>
  );
};

export default App;

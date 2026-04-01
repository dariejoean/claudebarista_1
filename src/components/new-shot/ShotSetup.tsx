
import React, { useMemo, useEffect } from 'react';
import { ListItem, TampLevel } from '../../types';
import { FlowControlDial } from '../FlowControlDial';
import { BluetoothManager } from '../BluetoothManager';
import { useBluetoothStore } from '../../services/bluetoothService';
import { useEditorStore } from '../../store/editorStore';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { 
    BOX_STYLE, 
    LABEL_STYLE, 
    VALUE_WRAPPER_STYLE, 
    NUMERIC_INPUT_STYLE, 
    MULTILINE_LABEL_STYLE, 
    SECTION_HEADER_STYLE,
    getDynamicSectionHeaderStyle
} from '../../styles/common';

interface ShotSetupProps {
    uniqueMachines: string[];
    uniqueBeans: string[];
    waterList: ListItem[];
    tampersList: ListItem[];
    accessoriesList: ListItem[];
    onAddMachine: () => void;
    onAddBean: () => void;
    onAddWater: () => void;
    onManageTampers: () => void;
    onManageTampLevels: () => void;
    // Handlers for opening the Selection Modal
    onSelectMachine: () => void;
    onSelectBean: () => void;
    onSelectWater: () => void;
    onSelectGrinder?: () => void; 
    onSelectBasket?: () => void;
}

export const ShotSetup: React.FC<ShotSetupProps> = React.memo((props) => {
    // Connect to Store
    const machineName = useEditorStore(s => s.machineName);
    const beanName = useEditorStore(s => s.beanName);
    const waterName = useEditorStore(s => s.waterName);
    const grinderName = useEditorStore(s => s.grinderName);
    const basketName = useEditorStore(s => s.basketName);
    
    const tamperName = useEditorStore(s => s.tamperName);
    const setTamperName = useEditorStore(s => s.setTamperName);
    const tampLevel = useEditorStore(s => s.tampLevel);
    const setTampLevel = useEditorStore(s => s.setTampLevel);
    const grindSetting = useEditorStore(s => s.grindSetting);
    const setGrindSetting = useEditorStore(s => s.setGrindSetting);
    const doseIn = useEditorStore(s => s.doseIn);
    const setDoseIn = useEditorStore(s => s.setDoseIn);
    const isDoseLocked = useEditorStore(s => s.isDoseLocked);
    const setIsDoseLocked = useEditorStore(s => s.setIsDoseLocked);
    const temperature = useEditorStore(s => s.temperature);
    const setTemperature = useEditorStore(s => s.setTemperature);
    
    // NEW: Pressure
    const pressure = useEditorStore(s => s.pressure);
    const setPressure = useEditorStore(s => s.setPressure);
    
    // NEW: Flow Control
    const flowControlSetting = useEditorStore(s => s.flowControlSetting);
    const setFlowControlSetting = useEditorStore(s => s.setFlowControlSetting);

    const otherAccessories = useEditorStore(s => s.otherAccessories);
    const setOtherAccessories = useEditorStore(s => s.setOtherAccessories);

    // Bluetooth Data
    const currentWeight = useBluetoothStore(s => s.currentWeight);
    const currentPressure = useBluetoothStore(s => s.currentPressure);
    const connectedScale = useBluetoothStore(s => s.connectedScale);
    const connectedPressureSensor = useBluetoothStore(s => s.connectedPressureSensor);

    // Auto-sync Bluetooth data to Editor Store
    const maxPressureRef = React.useRef(0);

    useEffect(() => {
        if (connectedScale && currentWeight !== undefined && !isDoseLocked) {
            setDoseIn(currentWeight);
        }
    }, [currentWeight, connectedScale, setDoseIn, isDoseLocked]);

    useEffect(() => {
        if (connectedPressureSensor && currentPressure > maxPressureRef.current) {
            maxPressureRef.current = currentPressure;
            setPressure(currentPressure);
        }
    }, [currentPressure, connectedPressureSensor, setPressure]);

    const availableTampLevels = useMemo(() => {
        const selectedTamper = props.tampersList.find(t => t.label === tamperName);
        if (selectedTamper && selectedTamper.levels && selectedTamper.levels.length > 0) {
            return selectedTamper.levels.map((lvl, idx) => ({
                id: `custom-${idx}`,
                label: lvl,
                order: idx
            } as ListItem));
        }
        return [];
    }, [tamperName, props.tampersList]);

    const handleTamperChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newName = e.target.value;
        setTamperName(newName);
        // Reset level on tamper change logic
        const selectedTamper = props.tampersList.find(t => t.label === newName);
        if (selectedTamper && selectedTamper.levels && selectedTamper.levels.length > 0) {
            setTampLevel("");
        } else {
            // If no specific levels, default to something generic or let user type
            setTampLevel("15kg");
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div id="section-new-setup" className={`${SECTION_HEADER_STYLE} scroll-mt-24`} style={getDynamicSectionHeaderStyle()}>PREGĂTIRE</div>
            
            {/* BLUETOOTH DEVICES */}
            <BluetoothManager />

            {/* ESPRESSOR (Full Width) */}
            <div className={BOX_STYLE}>
                <label className={LABEL_STYLE}>ESPRESSOR</label>
                <div className={VALUE_WRAPPER_STYLE}>
                    <button 
                        onClick={props.onSelectMachine}
                        className="w-full h-full flex items-center justify-center gap-1 active:scale-95 transition-transform"
                    >
                        <span className="text-base font-bold text-on-surface px-1 text-center leading-tight line-clamp-3 text-ellipsis overflow-hidden break-words">
                            {machineName || "Alege..."}
                        </span>
                        <ChevronDownIcon className="w-4 h-4 text-on-surface-variant opacity-50 shrink-0" />
                    </button>
                </div>
            </div>

            {/* APA (Full Width) */}
            <div className={BOX_STYLE}>
                <label className={LABEL_STYLE}>APĂ</label>
                <div className={VALUE_WRAPPER_STYLE}>
                    <button 
                        onClick={props.onSelectWater}
                        className="w-full h-full flex items-center justify-center gap-1 active:scale-95 transition-transform"
                    >
                        <span className="text-base font-bold text-on-surface px-1 text-center leading-tight line-clamp-3 text-ellipsis overflow-hidden break-words">
                            {waterName || "Alege..."}
                        </span>
                        <ChevronDownIcon className="w-4 h-4 text-on-surface-variant opacity-50 shrink-0" />
                    </button>
                </div>
            </div>

            {/* CAFEA (Full Width) */}
            <div className={BOX_STYLE}>
                <label className={LABEL_STYLE}>CAFEA</label>
                <div className={VALUE_WRAPPER_STYLE}>
                    <button 
                        onClick={props.onSelectBean}
                        className="w-full h-full flex items-center justify-center gap-1 active:scale-95 transition-transform"
                    >
                        <span className="text-base font-bold text-on-surface px-1 text-center leading-tight line-clamp-3 text-ellipsis overflow-hidden break-words">
                            {beanName || "Alege..."}
                        </span>
                        <ChevronDownIcon className="w-4 h-4 text-on-surface-variant opacity-50 shrink-0" />
                    </button>
                </div>
            </div>
            
            {/* RASNITA (Full Width) */}
            <div className={BOX_STYLE}>
                <label className={LABEL_STYLE}>RÂȘNIȚĂ</label>
                <div className={VALUE_WRAPPER_STYLE}>
                    <button 
                        onClick={props.onSelectGrinder}
                        className="w-full h-full flex items-center justify-center gap-1 active:scale-95 transition-transform"
                    >
                        <span className="text-base font-bold text-on-surface px-1 text-center leading-tight line-clamp-3 text-ellipsis overflow-hidden break-words">
                            {grinderName || "Alege..."}
                        </span>
                        <ChevronDownIcon className="w-4 h-4 text-on-surface-variant opacity-50 shrink-0" />
                    </button>
                </div>
            </div>

            {/* SITA (Full Width) */}
            <div className={BOX_STYLE}>
                <label className={LABEL_STYLE}>SITĂ (BASKET)</label>
                <div className={VALUE_WRAPPER_STYLE}>
                    <button 
                        onClick={props.onSelectBasket}
                        className="w-full h-full flex items-center justify-center gap-1 active:scale-95 transition-transform"
                    >
                        <span className="text-base font-bold text-on-surface px-1 text-center leading-tight line-clamp-3 text-ellipsis overflow-hidden break-words">
                            {basketName || "Alege..."}
                        </span>
                        <ChevronDownIcon className="w-4 h-4 text-on-surface-variant opacity-50 shrink-0" />
                    </button>
                </div>
            </div>

            {/* GRIND SETTING (Text Input) */}
      <div className={BOX_STYLE}>
        <label className={LABEL_STYLE}>MĂCINARE (GRAD)</label>
        <div className={VALUE_WRAPPER_STYLE}>
          <input
            type="text"
            value={grindSetting}
            onChange={e => setGrindSetting(e.target.value)}
            placeholder="ex: 1+4.75"
            className="w-full h-full bg-transparent text-2xl font-bold text-on-surface text-center outline-none placeholder:text-on-surface-variant/30"
          />
        </div>
      </div>

      {/* TAMPER (Full Width) */}
            <div className={BOX_STYLE}>
               <label className={LABEL_STYLE}>TAMPER</label>
               <div className={VALUE_WRAPPER_STYLE}>
                  {props.tampersList.length > 0 ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                          {/* Added opacity-0 to hide native select text but keep clickability */}
                          <select 
                            value={tamperName} 
                            onChange={handleTamperChange} 
                            className="w-full h-full bg-transparent text-sm font-bold text-on-surface text-center leading-tight whitespace-normal outline-none appearance-none px-1 cursor-pointer absolute inset-0 z-10 opacity-0"
                          >
                            {props.tampersList.map(t => <option key={t.id} value={t.label} className="bg-surface-container text-on-surface">{t.label}</option>)}
                          </select>
                          {/* Visual Overlay to match styling exactly */}
                          <div className="flex items-center justify-center gap-1 pointer-events-none w-full">
                              <span className="text-base font-bold text-on-surface px-1 text-center leading-tight line-clamp-3 text-ellipsis overflow-hidden break-words">
                                  {tamperName}
                              </span>
                              <ChevronDownIcon className="w-4 h-4 text-on-surface-variant opacity-50 shrink-0" />
                          </div>
                      </div>
                  ) : (
                      <button onClick={props.onManageTampers} className="w-[90%] py-3 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-sm border border-white/10 bg-surface text-on-surface hover:brightness-125 active:scale-95 transition-all">Alege...</button>
                  )}
               </div>
            </div>

            {/* TAMPARE (LEVEL) (Full Width) */}
            <div className={BOX_STYLE}>
              <label className={LABEL_STYLE}>TAMPARE (kgf)</label>
              <div className={VALUE_WRAPPER_STYLE}>
                  {availableTampLevels.length > 0 ? (
                      <select value={tampLevel} onChange={(e) => setTampLevel(e.target.value)} className="w-full bg-transparent text-lg font-bold text-on-surface p-4 outline-none appearance-none text-center cursor-pointer text-ellipsis uppercase">
                        <option value="" disabled className="bg-surface-container text-on-surface-variant">Alege...</option>
                        {availableTampLevels.map(t => <option key={t.id} value={t.label} className="bg-surface-container text-on-surface uppercase">{t.label}</option>)}
                      </select>
                  ) : (
                      <input 
                        type="text" 
                        value={tampLevel} 
                        onChange={(e) => setTampLevel(e.target.value)} 
                        placeholder="Ex: 15kg" 
                        className="w-full h-full bg-transparent text-lg font-bold text-on-surface text-center outline-none placeholder:text-on-surface-variant/30 uppercase"
                      />
                  )}
              </div>
           </div>

           {/* FLOW CONTROL - Only for Torre Pierino */}
           {machineName?.includes('Torre Pierino') && (
               <div className={`${BOX_STYLE} h-auto min-h-[140px]`}>
                   <label className={LABEL_STYLE}>FLOW CONTROL (ROTAȚII)</label>
                   {/* Custom wrapper to fit the dial component nicely */}
                   <div className="w-full bg-surface-container/50 rounded-2xl p-2 relative overflow-hidden flex items-center justify-center">
                       <FlowControlDial value={flowControlSetting} onChange={setFlowControlSetting} />
                   </div>
               </div>
           )}

            {/* DOSE & TEMP (Remains 2 Cols) */}
            <div className="grid grid-cols-2 gap-4">
               <div className={`${BOX_STYLE} relative`}>
                  <label className={MULTILINE_LABEL_STYLE}>
                        DOZĂ CAFEA <span className="block leading-tight">(g)</span>
                        {connectedScale && !isDoseLocked && <span className="block text-[8px] text-green-400 animate-pulse mt-1">● LIVE</span>}
                        {connectedScale && isDoseLocked && <span className="block text-[8px] text-gray-400 mt-1">● BLOCAT</span>}
                   </label>
                  <div className={VALUE_WRAPPER_STYLE}>
                    <div className="flex items-center justify-center w-full">
                      <input type="number" step="0.01" value={doseIn} onChange={e => setDoseIn(parseFloat(e.target.value))} className={`${NUMERIC_INPUT_STYLE} !text-left pl-4`} />
                    </div>
                  </div>
                  {connectedScale && (
                      <button
                          onClick={() => setIsDoseLocked(!isDoseLocked)}
                          className={`absolute bottom-2 right-2 text-[10px] px-2 py-1 rounded-md font-bold transition-colors ${isDoseLocked ? 'bg-green-500/20 text-green-400' : 'bg-surface-container text-gray-400 hover:text-white'}`}
                      >
                          {isDoseLocked ? 'DEBLOCARE' : 'OK'}
                      </button>
                  )}
               </div>
               <div className={BOX_STYLE}>
                  <label className={MULTILINE_LABEL_STYLE}>TEMPERATURĂ <span className="block leading-tight">(°C)</span></label>
                  <div className={VALUE_WRAPPER_STYLE}>
                    <div className="flex items-center justify-center w-full">
                      <input type="number" value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))} className={`${NUMERIC_INPUT_STYLE}`} />
                    </div>
                  </div>
               </div>
            </div>
        </div>
    );
});

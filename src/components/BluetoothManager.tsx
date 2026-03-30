
import React, { useState } from 'react';
import { bluetoothService, useBluetoothStore } from '../services/bluetoothService';
import { 
  SignalIcon, 
  SignalSlashIcon, 
  ScaleIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export const BluetoothManager: React.FC = () => {
  const { 
    connectedScale, 
    connectedPressureSensor, 
    currentWeight, 
    currentPressure,
    isScanning,
    setScanning,
    logs,
    clearLogs
  } = useBluetoothStore();

  const [error, setError] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  const handleConnectScale = async () => {
    setError(null);
    useBluetoothStore.getState().clearLogs();
    setScanning(true);
    try {
      await bluetoothService.scanAndConnectScale();
    } catch (err: any) {
      setError(err.message || 'Eroare la conectarea cântarului');
    } finally {
      setScanning(false);
    }
  };

  const handleConnectPressure = async () => {
    setError(null);
    useBluetoothStore.getState().clearLogs();
    setScanning(true);
    try {
      await bluetoothService.scanAndConnectPressure();
    } catch (err: any) {
      setError(err.message || 'Eroare la conectarea senzorului de presiune');
    } finally {
      setScanning(false);
    }
  };

  const handleDisconnect = (type: 'scale' | 'pressure') => {
    bluetoothService.disconnect(type);
  };

  const handleReconnect = async (type: 'scale' | 'pressure') => {
    setError(null);
    setScanning(true);
    try {
      await bluetoothService.reconnect(type);
    } catch (err: any) {
      setError(err.message || `Eroare la reconectarea ${type === 'scale' ? 'cântarului' : 'senzorului'}`);
    } finally {
      setScanning(false);
    }
  };

  const handleReset = () => {
    setError(null);
    bluetoothService.reset();
  };

  if (!navigator.bluetooth) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex flex-col items-center gap-4 text-center">
        <SignalSlashIcon className="w-12 h-12 text-red-400" />
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-black uppercase tracking-widest text-red-400">Bluetooth Indisponibil</h3>
          <p className="text-[10px] text-red-400/80 leading-relaxed">
            Browser-ul tău nu suportă Web Bluetooth. Folosește Chrome sau Edge pe Android sau Desktop.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 bg-surface-container rounded-3xl border border-white/5 shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-black uppercase tracking-widest text-crema-400 flex items-center gap-2">
          <SignalIcon className="w-5 h-5" />
          Dispozitive Bluetooth
        </h3>
        <div className="flex items-center gap-2">
          {isScanning && <ArrowPathIcon className="w-5 h-5 animate-spin text-crema-400" />}
          <button 
            onClick={handleReset}
            className="p-1.5 rounded-full bg-on-surface/5 text-on-surface/40 hover:text-on-surface/60 transition-colors"
            title="Resetează conexiunile"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
          <XCircleIcon className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Scale Connection */}
      <div className={`flex flex-col p-4 bg-surface-container-high rounded-2xl border border-white/5 gap-4 transition-all ${!connectedScale ? 'min-h-[120px]' : ''}`}>
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-full flex-shrink-0 ${connectedScale ? 'bg-green-500/20 text-green-400' : 'bg-on-surface/10 text-on-surface/40'}`}>
              <ScaleIcon className="w-6 h-6" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-on-surface uppercase tracking-wider truncate">Cântar Bookoo Ultra</span>
              <span className="text-[10px] font-medium text-on-surface-variant opacity-60 truncate">
                {connectedScale ? `Conectat: ${connectedScale.name}` : 'Deconectat'}
              </span>
            </div>
          </div>

          {connectedScale && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex flex-col items-end">
                <span className="text-lg font-black text-on-surface tabular-nums">{currentWeight.toFixed(2)}g</span>
                <span className="text-[8px] font-bold text-green-400 uppercase tracking-widest">Live</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleReconnect('scale')}
                  disabled={isScanning}
                  className="p-2 rounded-full bg-crema-500/10 text-crema-400 hover:bg-crema-500/20 transition-colors disabled:opacity-50"
                  title="Reconectează"
                >
                  <ArrowPathIcon className={`w-5 h-5 ${isScanning ? 'animate-spin' : ''}`} />
                </button>
                <button 
                  onClick={() => handleDisconnect('scale')}
                  className="p-2 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  title="Deconectează"
                >
                  <SignalSlashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
        
        {!connectedScale && (
          <button 
            onClick={handleConnectScale}
            disabled={isScanning}
            className="w-full py-3.5 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-500 hover:shadow-[0_8px_24px_rgba(37,99,235,0.4)] transition-all disabled:opacity-50 shadow-[0_6px_16px_rgba(0,0,0,0.3)] border-2 border-white/20 flex items-center justify-center gap-2 mt-auto"
          >
            <SignalIcon className="w-4 h-4" />
            Conectează
          </button>
        )}
      </div>

      {/* Pressure Sensor Connection */}
      <div className={`flex flex-col p-4 bg-surface-container-high rounded-2xl border border-white/5 gap-4 transition-all ${!connectedPressureSensor ? 'min-h-[120px]' : ''}`}>
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-full flex-shrink-0 ${connectedPressureSensor ? 'bg-blue-500/20 text-blue-400' : 'bg-on-surface/10 text-on-surface/40'}`}>
              <SignalIcon className="w-6 h-6" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-on-surface uppercase tracking-wider truncate">Senzor Bookoo EM</span>
              <span className="text-[10px] font-medium text-on-surface-variant opacity-60 truncate">
                {connectedPressureSensor ? `Conectat: ${connectedPressureSensor.name}` : 'Deconectat'}
              </span>
            </div>
          </div>

          {connectedPressureSensor && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex flex-col items-end">
                <span className="text-lg font-black text-on-surface tabular-nums">{currentPressure.toFixed(1)} bar</span>
                <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">Live</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleReconnect('pressure')}
                  disabled={isScanning}
                  className="p-2 rounded-full bg-crema-500/10 text-crema-400 hover:bg-crema-500/20 transition-colors disabled:opacity-50"
                  title="Reconectează"
                >
                  <ArrowPathIcon className={`w-5 h-5 ${isScanning ? 'animate-spin' : ''}`} />
                </button>
                <button 
                  onClick={() => handleDisconnect('pressure')}
                  className="p-2 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  title="Deconectează"
                >
                  <SignalSlashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
        
        {!connectedPressureSensor && (
          <button 
            onClick={handleConnectPressure}
            disabled={isScanning}
            className="w-full py-3.5 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-500 hover:shadow-[0_8px_24px_rgba(37,99,235,0.4)] transition-all disabled:opacity-50 shadow-[0_6px_16px_rgba(0,0,0,0.3)] border-2 border-white/20 flex items-center justify-center gap-2 mt-auto"
          >
            <SignalIcon className="w-4 h-4" />
            Conectează
          </button>
        )}
      </div>

      <div className="mt-2 p-3 bg-crema-900/20 rounded-xl border border-crema-500/10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] text-on-surface-variant leading-relaxed italic">
            * Asigură-te că dispozitivele sunt pornite și Bluetooth-ul este activat.
          </p>
          <button 
            onClick={() => setShowLogs(!showLogs)}
            className="text-[10px] font-bold text-crema-400 uppercase tracking-widest hover:underline"
          >
            {showLogs ? 'Ascunde Log-uri' : 'Vezi Log-uri'}
          </button>
        </div>

        {showLogs && (
          <div className="mt-2 p-2 bg-black/40 rounded-lg border border-white/5 font-mono text-[9px] text-green-400/80 max-h-40 overflow-y-auto flex flex-col gap-1">
            <div className="flex justify-between items-center mb-1 border-b border-white/10 pb-1">
              <span className="text-white/40 uppercase tracking-tighter">Debug Console</span>
              <button onClick={clearLogs} className="text-red-400/60 hover:text-red-400">Clear</button>
            </div>
            {logs.length === 0 ? (
              <span className="text-white/20 italic">Niciun log disponibil...</span>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="leading-tight break-all">{log}</div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

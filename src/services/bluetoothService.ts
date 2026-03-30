
import { create } from 'zustand';

interface BluetoothState {
  isScanning: boolean;
  connectedScale: BluetoothDevice | null;
  connectedPressureSensor: BluetoothDevice | null;
  currentWeight: number;
  currentPressure: number;
  isRecording: boolean;
  logs: string[];
  
  setScanning: (scanning: boolean) => void;
  setConnectedScale: (device: BluetoothDevice | null) => void;
  setConnectedPressureSensor: (device: BluetoothDevice | null) => void;
  setCurrentWeight: (weight: number) => void;
  setCurrentPressure: (pressure: number) => void;
  setRecording: (recording: boolean) => void;
  addLog: (message: string) => void;
  clearLogs: () => void;
  disconnect: (type: 'scale' | 'pressure') => void;
  reconnect: (type: 'scale' | 'pressure') => Promise<void>;
}

export const useBluetoothStore = create<BluetoothState>((set, get) => ({
  isScanning: false,
  connectedScale: null,
  connectedPressureSensor: null,
  currentWeight: 0,
  currentPressure: 0,
  isRecording: false,
  logs: [],

  setScanning: (scanning) => set({ isScanning: scanning }),
  setConnectedScale: (device) => set({ connectedScale: device }),
  setConnectedPressureSensor: (device) => set({ connectedPressureSensor: device }),
  setCurrentWeight: (weight) => set({ currentWeight: weight }),
  setCurrentPressure: (pressure) => set({ currentPressure: pressure }),
  setRecording: (recording) => set({ isRecording: recording }),
  addLog: (message) => set((state) => {
    const newLog = `[${new Date().toLocaleTimeString()}] ${message}`;
    // Limit logs to 20 items to prevent memory bloat and UI lag
    const newLogs = [...state.logs, newLog].slice(-20);
    return { logs: newLogs };
  }),
  clearLogs: () => set({ logs: [] }),

  disconnect: (type) => {
    const state = get();
    if (type === 'scale' && state.connectedScale) {
      state.connectedScale.gatt?.disconnect();
      set({ connectedScale: null, currentWeight: 0 });
    } else if (type === 'pressure' && state.connectedPressureSensor) {
      state.connectedPressureSensor.gatt?.disconnect();
      set({ connectedPressureSensor: null, currentPressure: 0 });
    }
  },

  reconnect: async (type) => {
    const state = get();
    if (type === 'scale') {
      await bluetoothService.scanAndConnectScale();
    } else {
      await bluetoothService.scanAndConnectPressure();
    }
  }
}));

const buf2hex = (data: DataView) => {
  const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
};

export const BLE_UUIDS = {
  SCALE_SERVICE: '0000ff10-0000-1000-8000-00805f9b34fb',
  SCALE_CHARACTERISTIC: '0000ff11-0000-1000-8000-00805f9b34fb',
  
  ACAIA_SERVICE: '00001820-0000-1000-8000-00805f9b34fb',
  ACAIA_CHARACTERISTIC: '00002a80-0000-1000-8000-00805f9b34fb',

  ACAIA_NEW_SERVICE: 'ef841101-9334-4001-97a2-0568a62a2882',
  ACAIA_NEW_CHARACTERISTIC: 'ef841102-9334-4001-97a2-0568a62a2882',

  BOOKOO_SCALE_SERVICE: '00000ffe-0000-1000-8000-00805f9b34fb',
  BOOKOO_SCALE_CHARACTERISTIC: '0000ff11-0000-1000-8000-00805f9b34fb',

  BOOKOO_EM_SERVICE: '00000fff-0000-1000-8000-00805f9b34fb',
  BOOKOO_EM_CHARACTERISTIC: '0000ff02-0000-1000-8000-00805f9b34fb',

  PRESSURE_SERVICE: '0000ffe0-0000-1000-8000-00805f9b34fb',
  PRESSURE_CHARACTERISTIC: '0000ffe1-0000-1000-8000-00805f9b34fb',
};

const OPTIONAL_SERVICES = [
  '0000ff10-0000-1000-8000-00805f9b34fb',
  '0000ff11-0000-1000-8000-00805f9b34fb',
  '0000ffe0-0000-1000-8000-00805f9b34fb',
  '0000ffe1-0000-1000-8000-00805f9b34fb',
  '0000ffe2-0000-1000-8000-00805f9b34fb',
  '0000ffe3-0000-1000-8000-00805f9b34fb',
  '0000ffe4-0000-1000-8000-00805f9b34fb',
  '0000ffe5-0000-1000-8000-00805f9b34fb',
  '0000ffe9-0000-1000-8000-00805f9b34fb',
  '0000fff0-0000-1000-8000-00805f9b34fb',
  '0000fff1-0000-1000-8000-00805f9b34fb',
  '0000fff2-0000-1000-8000-00805f9b34fb',
  '0000fff3-0000-1000-8000-00805f9b34fb',
  '0000fff4-0000-1000-8000-00805f9b34fb',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000ff01-0000-1000-8000-00805f9b34fb',
  '00001820-0000-1000-8000-00805f9b34fb',
  '0000181d-0000-1000-8000-00805f9b34fb',
  '0000181a-0000-1000-8000-00805f9b34fb',
  '00001810-0000-1000-8000-00805f9b34fb',
  '00001811-0000-1000-8000-00805f9b34fb',
  '0000180f-0000-1000-8000-00805f9b34fb',
  'ef841101-9334-4001-97a2-0568a62a2882',
  'ef841102-9334-4001-97a2-0568a62a2882',
  'ef841103-9334-4001-97a2-0568a62a2882',
  '0000180a-0000-1000-8000-00805f9b34fb',
  '00001800-0000-1000-8000-00805f9b34fb',
  '00001801-0000-1000-8000-00805f9b34fb',
  '0000181b-0000-1000-8000-00805f9b34fb',
  '0000181c-0000-1000-8000-00805f9b34fb',
  '0000ffb0-0000-1000-8000-00805f9b34fb',
  '0000ffa0-0000-1000-8000-00805f9b34fb',
  '000000ff-0000-1000-8000-00805f9b34fb',
  '00000ff0-0000-1000-8000-00805f9b34fb',
  '00000ffe-0000-1000-8000-00805f9b34fb',
  '00000fff-0000-1000-8000-00805f9b34fb',
  '0000ff11-0000-1000-8000-00805f9b34fb',
  '0000ff12-0000-1000-8000-00805f9b34fb',
  '0000ff01-0000-1000-8000-00805f9b34fb',
  '0000ff02-0000-1000-8000-00805f9b34fb',
  '0000fe59-0000-1000-8000-00805f9b34fb',
  '8ec90001-f315-4f60-9fb8-838830daea50',
  '8ec90003-f315-4f60-9fb8-838830daea50',
];

export const bluetoothService = {
  async scanAndConnectScale() {
    const store = useBluetoothStore.getState();
    store.addLog('Începere scanare cântar...');
    
    if (!window.isSecureContext) {
      throw new Error('Bluetooth necesită o conexiune securizată (HTTPS). Te rugăm să verifici adresa URL.');
    }
    if (!navigator.bluetooth) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        throw new Error('Safari pe iOS nu suportă Web Bluetooth. Te rugăm să folosești un browser precum Bluefy sau WebBLE.');
      }
      throw new Error('Browser-ul tău nu suportă Web Bluetooth. Încearcă Chrome sau Edge.');
    }

    try {
      store.addLog('Așteptare selecție cântar...');
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'Bookoo' },
          { namePrefix: 'BOOKOO' },
          { namePrefix: 'Acaia' },
          { namePrefix: 'ACAIA' }
        ],
        optionalServices: OPTIONAL_SERVICES
      });

      store.addLog(`Cântar selectat: ${device.name}. Conectare GATT...`);
      
      // Handle unexpected disconnection
      device.addEventListener('gattserverdisconnected', () => {
        store.addLog(`Cântar ${device.name} deconectat neașteptat. Încercare reconectare...`);
        store.setConnectedScale(null);
        // Optional: Trigger auto-reconnect logic here if needed
      });

      let server = await device.gatt?.connect();
      if (!server) throw new Error('Conexiunea GATT a eșuat.');
      
      store.addLog('Conectat. Descoperire servicii...');
      let services: BluetoothRemoteGATTService[] = [];
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        store.addLog(`Tentativă descoperire servicii ${attempts + 1}/3...`);
        await new Promise(r => setTimeout(r, 500));
        
        try {
          services = await server.getPrimaryServices();
          store.addLog(`Găsite ${services.length} servicii.`);
          
          const hasCustomService = services.some(s => !s.uuid.includes('1800') && !s.uuid.includes('1801'));
          if (hasCustomService) {
            store.addLog('Servicii custom găsite. Continuăm...');
            break;
          }
          
          store.addLog('Doar servicii standard găsite. Reconectare forțată...');
          await device.gatt?.disconnect();
          await new Promise(r => setTimeout(r, 1000));
          server = await device.gatt?.connect() as BluetoothRemoteGATTServer;
        } catch (e) {
          store.addLog(`Eroare la descoperire: ${e instanceof Error ? e.message : String(e)}`);
          await device.gatt?.disconnect();
          await new Promise(r => setTimeout(r, 1000));
          server = await device.gatt?.connect() as BluetoothRemoteGATTServer;
        }
        attempts++;
      }

      const knownScaleServices = [
        '00000ffe-0000-1000-8000-00805f9b34fb', // Bookoo Scale
        '0000ff10-0000-1000-8000-00805f9b34fb',
        '0000ffe0-0000-1000-8000-00805f9b34fb',
        '0000ffb0-0000-1000-8000-00805f9b34fb',
        '00001820-0000-1000-8000-00805f9b34fb',
        'ef841101-9334-4001-97a2-0568a62a2882',
        '0000181d-0000-1000-8000-00805f9b34fb',
        '0000fff0-0000-1000-8000-00805f9b34fb'
      ];

      const servicesToScan = services.filter(s => !s.uuid.includes('1800') && !s.uuid.includes('1801'));
      const foundUuids = servicesToScan.map(s => s.uuid.toLowerCase());
      
      for (const uuid of knownScaleServices) {
        if (!foundUuids.includes(uuid)) {
          try {
            const s = await server.getPrimaryService(uuid);
            servicesToScan.push(s);
            store.addLog(`Găsit serviciu cântar: ${uuid.substring(0, 8)}`);
          } catch (e) {}
        }
      }

      // If still very few services, add back others but keep them at the end
      if (servicesToScan.length === 0) {
        servicesToScan.push(...services);
      }

      let notifyChar: BluetoothRemoteGATTCharacteristic | null = null;
      let writeChar: BluetoothRemoteGATTCharacteristic | null = null;

      store.addLog(`Scanare caracteristici în ${servicesToScan.length} servicii...`);
      for (const service of servicesToScan) {
        try {
          store.addLog(`Scanare serviciu: ${service.uuid}`);
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            const cUuid = char.uuid.toLowerCase();
            const props = char.properties;
            const propStr = `N:${props.notify}, I:${props.indicate}, R:${props.read}, W:${props.write}, WwR:${props.writeWithoutResponse}`;
            store.addLog(`  -> Char: ${cUuid.substring(0, 8)}... (${propStr})`);
            
            const isTargetUuid = cUuid.includes('ff11') || cUuid.includes('ffe1') || cUuid.includes('ffb2') || 
                               cUuid.includes('2a80') || cUuid.includes('1102') || cUuid.includes('2a9d');
            const isWriteTarget = cUuid.includes('ff12') || cUuid.includes('ffe2');
            const isStandard = cUuid.includes('2a00') || cUuid.includes('2a01') || cUuid.includes('2a05') || cUuid.includes('2a06');
            
            if (!isStandard) {
              if ((props.notify || props.indicate) && (!notifyChar || isTargetUuid)) {
                notifyChar = char;
              }
              if ((props.write || props.writeWithoutResponse) && (!writeChar || isWriteTarget)) {
                writeChar = char;
              }
            }
          }
        } catch (e) { 
          store.addLog(`  Eroare scanare caracteristici: ${e instanceof Error ? e.message : String(e)}`);
          continue; 
        }
      }

      if (!notifyChar) {
        const allUuids = servicesToScan.map(s => s.uuid.toLowerCase()).join(', ');
        store.addLog('EROARE: Nicio caracteristică de notificare găsită.');
        throw new Error(`[v18] Cântar (${device.name}): Serviciu negăsit. UUID-uri: ${allUuids || 'niciunul'}.`);
      }

      store.addLog(`Selectat Notify: ${notifyChar.uuid.substring(0, 8)}`);
      if (writeChar) store.addLog(`Selectat Write: ${writeChar.uuid.substring(0, 8)}`);

      store.addLog('Activare notificări/indicații...');
      await notifyChar.startNotifications();
      
      const isBookoo = device.name?.toLowerCase().includes('bookoo');

      // Scale Handshake (Acaia style only, skip for Bookoo to prevent Error 4201)
      if (writeChar && !isBookoo) {
        try {
          store.addLog('Trimitere handshake Acaia...');
          const payload = new Uint8Array([0xef, 0xdd, 0x0b, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
          if (writeChar.properties.writeWithoutResponse && writeChar.writeValueWithoutResponse) {
             await writeChar.writeValueWithoutResponse(payload);
          } else {
             await writeChar.writeValue(payload);
          }
        } catch (e) {
          store.addLog(`Handshake eșuat: ${e instanceof Error ? e.message : String(e)}`);
        }
      } else if (isBookoo) {
        store.addLog('Cântar Bookoo detectat. Se omite handshake-ul.');
      }

      store.addLog('Cântar activat. Așteptare date...');
      notifyChar.addEventListener('characteristicvaluechanged', (event: Event) => {
        const value = (event.target as BluetoothRemoteGATTCharacteristic).value!;
        const hex = buf2hex(value);
        useBluetoothStore.getState().addLog(`Scale Data: ${hex}`);

        // Acaia format
        if (value.byteLength >= 6 && value.getUint8(0) === 0xEF && value.getUint8(1) === 0xDD) {
          const type = value.getUint8(2);
          if (type === 0x0C || type === 0x08) {
            const weightRaw = value.getInt32(3, true);
            useBluetoothStore.getState().setCurrentWeight(weightRaw / 10.0);
          }
        } 
        // Bookoo Scale format (20 bytes)
        else if (value.byteLength === 20) {
          const bookooRawStatus = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
          
          // Try to detect if it's ASCII or Binary
          // Some Bookoo scales send ASCII weight at index 7-12
          // Others send binary weight at index 7-9
          
          // Check if index 7-9 are ASCII digits (0-9)
          const isAscii = bookooRawStatus[7] >= 48 && bookooRawStatus[7] <= 57 &&
                          bookooRawStatus[8] >= 48 && bookooRawStatus[8] <= 57;
          
          let weight = 0;
          if (isAscii) {
            try {
              const weightStr = new TextDecoder().decode(bookooRawStatus.slice(7, 13)).trim();
              weight = parseFloat(weightStr);
              if (isNaN(weight)) throw new Error('Not a number');
            } catch (e) {
              // Fallback to binary parsing if ASCII fails
              weight = (bookooRawStatus[7] << 16) + (bookooRawStatus[8] << 8) + bookooRawStatus[9];
              weight = weight / 100.0;
            }
          } else {
            // Binary parsing: 3 bytes starting at index 7
            weight = (bookooRawStatus[7] << 16) + (bookooRawStatus[8] << 8) + bookooRawStatus[9];
            weight = weight / 100.0;
          }

          if (bookooRawStatus[6] === 45) { // 45 is ASCII for '-'
            weight = weight * -1;
          }
          
          // Safety check for weight
          if (!isNaN(weight) && Math.abs(weight) < 5000) {
            useBluetoothStore.getState().setCurrentWeight(weight);
          }
        }
        else if (value.byteLength === 4) {
          // Try float32 and int32
          const f32 = value.getFloat32(0, true);
          if (f32 > -1000 && f32 < 5000) {
            useBluetoothStore.getState().setCurrentWeight(f32);
          } else {
            const i32 = value.getInt32(0, true);
            useBluetoothStore.getState().setCurrentWeight(i32 / 10.0);
          }
        }
        else {
          try {
            const str = new TextDecoder().decode(value).trim();
            const weight = parseFloat(str.replace(/[^\d.-]/g, ''));
            if (!isNaN(weight)) useBluetoothStore.getState().setCurrentWeight(weight);
          } catch (e) {}
        }
      });

      useBluetoothStore.getState().setConnectedScale(device);
      return device;
    } catch (error) {
      console.error('Scale Error:', error);
      throw error;
    }
  },

  async scanAndConnectPressure() {
    const store = useBluetoothStore.getState();
    store.addLog('Începere scanare senzor presiune...');
    
    if (!window.isSecureContext) {
      throw new Error('Bluetooth necesită o conexiune securizată (HTTPS). Te rugăm să verifici adresa URL.');
    }
    if (!navigator.bluetooth) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        throw new Error('Safari pe iOS nu suportă Web Bluetooth. Te rugăm să folosești un browser precum Bluefy sau WebBLE.');
      }
      throw new Error('Browser-ul tău nu suportă Web Bluetooth. Încearcă Chrome sau Edge.');
    }

    try {
      store.addLog('Așteptare selecție senzor...');
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'Bookoo' },
          { namePrefix: 'BOOKOO' }
        ],
        optionalServices: OPTIONAL_SERVICES
      });

      store.addLog(`Senzor selectat: ${device.name}. Conectare GATT...`);
      
      // Handle unexpected disconnection
      device.addEventListener('gattserverdisconnected', () => {
        store.addLog(`Senzor ${device.name} deconectat neașteptat. Încercare reconectare...`);
        store.setConnectedPressureSensor(null);
      });

      let server = await device.gatt?.connect();
      if (!server) throw new Error('Conexiunea GATT a eșuat.');

      store.addLog('Conectat. Descoperire servicii...');
      let services: BluetoothRemoteGATTService[] = [];
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        store.addLog(`Tentativă descoperire servicii ${attempts + 1}/3...`);
        await new Promise(r => setTimeout(r, 500));
        
        try {
          services = await server.getPrimaryServices();
          store.addLog(`Găsite ${services.length} servicii.`);
          
          const hasCustomService = services.some(s => !s.uuid.includes('1800') && !s.uuid.includes('1801'));
          if (hasCustomService) {
            store.addLog('Servicii custom găsite. Continuăm...');
            break;
          }
          
          store.addLog('Doar servicii standard găsite. Reconectare forțată...');
          await device.gatt?.disconnect();
          await new Promise(r => setTimeout(r, 1000));
          server = await device.gatt?.connect() as BluetoothRemoteGATTServer;
        } catch (e) {
          store.addLog(`Eroare la descoperire: ${e instanceof Error ? e.message : String(e)}`);
          await device.gatt?.disconnect();
          await new Promise(r => setTimeout(r, 1000));
          server = await device.gatt?.connect() as BluetoothRemoteGATTServer;
        }
        attempts++;
      }

      const knownPressureServices = [
        '00000fff-0000-1000-8000-00805f9b34fb', // Bookoo EM
        '8ec90001-f315-4f60-9fb8-838830daea50', 
        '0000ffe0-0000-1000-8000-00805f9b34fb',
        '0000fff0-0000-1000-8000-00805f9b34fb',
        '0000ff00-0000-1000-8000-00805f9b34fb',
        '0000181a-0000-1000-8000-00805f9b34fb',
        '0000ffe1-0000-1000-8000-00805f9b34fb',
        '000000ff-0000-1000-8000-00805f9b34fb',
        '00000ff0-0000-1000-8000-00805f9b34fb',
        '0000fe59-0000-1000-8000-00805f9b34fb'
      ];

      const servicesToScan = [...services];
      const foundUuids = services.map(s => s.uuid.toLowerCase());

      store.addLog('Căutare servicii cunoscute...');
      for (const uuid of knownPressureServices) {
        if (!foundUuids.includes(uuid)) {
          try {
            const s = await server.getPrimaryService(uuid);
            servicesToScan.push(s);
            store.addLog(`Găsit serviciu adițional: ${uuid}`);
          } catch (e) {}
        }
      }

      let notifyChar: BluetoothRemoteGATTCharacteristic | null = null;
      let writeChar: BluetoothRemoteGATTCharacteristic | null = null;
      let bookooCmdChar: BluetoothRemoteGATTCharacteristic | null = null;
      let bookooNotifyChar: BluetoothRemoteGATTCharacteristic | null = null;

      store.addLog(`Scanare caracteristici în ${servicesToScan.length} servicii...`);
      for (const service of servicesToScan) {
        try {
          store.addLog(`Scanare serviciu: ${service.uuid}`);
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            const cUuid = char.uuid.toLowerCase();
            const props = char.properties;
            const propStr = `N:${props.notify}, I:${props.indicate}, R:${props.read}, W:${props.write}, WwR:${props.writeWithoutResponse}`;
            store.addLog(`  -> Char: ${cUuid.substring(0, 8)}... (${propStr})`);
            
            const isTargetUuid = cUuid.includes('ff02') || cUuid.includes('8ec90003') || cUuid.includes('ffe1') || cUuid.includes('fff1') || 
                               cUuid.includes('ff01') || cUuid.includes('00ff') || cUuid.includes('0ff0') || 
                               cUuid.includes('fe59') || cUuid.includes('ffe2') || cUuid.includes('fff2');
            const isWriteTarget = cUuid.includes('ff01') || cUuid.includes('8ec90002');
            
            if (cUuid.includes('ff01')) {
              bookooCmdChar = char;
            }
            if (cUuid.includes('ff02')) {
              bookooNotifyChar = char;
            }

            if (props.notify || props.indicate) {
              if (!notifyChar || isTargetUuid) notifyChar = char;
            }
            if (props.write || props.writeWithoutResponse) {
              if (!writeChar || isWriteTarget) writeChar = char;
            }
          }
        } catch (e) { 
          store.addLog(`  Eroare scanare caracteristici: ${e instanceof Error ? e.message : String(e)}`);
          continue; 
        }
      }

      const isBookoo = device.name?.toLowerCase().includes('bookoo');
      const targetNotifyChar = (isBookoo && bookooNotifyChar) ? bookooNotifyChar : notifyChar;

      if (!targetNotifyChar) {
        const allUuids = servicesToScan.map(s => s.uuid.toLowerCase()).join(', ');
        store.addLog('EROARE: Nicio caracteristică de notificare găsită.');
        throw new Error(`[v18] Presiune (${device.name}): Serviciu negăsit. UUID-uri: ${allUuids || 'niciunul'}.`);
      }

      store.addLog(`Selectat Notify: ${targetNotifyChar.uuid.substring(0, 8)}`);
      if (writeChar) store.addLog(`Selectat Write: ${writeChar.uuid.substring(0, 8)}`);
      if (bookooCmdChar) store.addLog(`Găsit Bookoo CMD Char: ${bookooCmdChar.uuid.substring(0, 8)}`);

      store.addLog('Activare notificări/indicații...');
      await targetNotifyChar.startNotifications();

      const targetWriteChar = bookooCmdChar || writeChar;

      // Bookoo EM handshake/start command if writable and specifically Bookoo EM
      if (isBookoo && targetWriteChar) {
        try {
          store.addLog(`Așteptare scurtă înainte de pornire Bookoo EM...`);
          await new Promise(r => setTimeout(r, 300)); // 300ms delay for stability
          
          store.addLog(`Trimitere comandă pornire Bookoo EM către ${targetWriteChar.uuid.substring(0, 8)}...`);
          const cmd = new Uint8Array([0x02, 0x0c, 0x01, 0x00, 0x00, 0x00, 0x0f]);
          if (targetWriteChar.properties.write) {
            await targetWriteChar.writeValue(cmd);
            store.addLog('Comandă trimisă cu writeValue.');
          } else if (targetWriteChar.properties.writeWithoutResponse && targetWriteChar.writeValueWithoutResponse) {
            await targetWriteChar.writeValueWithoutResponse(cmd);
            store.addLog('Comandă trimisă cu writeValueWithoutResponse.');
          } else {
            await targetWriteChar.writeValue(cmd);
            store.addLog('Comandă trimisă cu writeValue (fallback).');
          }
        } catch (e) {
          store.addLog(`Comanda handshake eșuată: ${e instanceof Error ? e.message : String(e)}`);
        }
      } else if (!isBookoo) {
        store.addLog('Senzor presiune standard detectat. Se omite handshake-ul.');
      }

      store.addLog('Senzor activat. Așteptare date...');
      targetNotifyChar.addEventListener('characteristicvaluechanged', (event: Event) => {
        const value = (event.target as BluetoothRemoteGATTCharacteristic).value!;
        const hex = buf2hex(value);
        
        // Log only occasionally to avoid spamming, but log all Bookoo EM packets
        if (value.byteLength === 10 || Math.random() < 0.1) {
          useBluetoothStore.getState().addLog(`Pressure Data (${value.byteLength}b): ${hex}`);
        }

        // Bookoo EM format (10 bytes)
        if (value.byteLength === 10) {
          // Bookoo EM Protocol:
          // Index 0: Header (0x02)
          // Index 1: Command/Type (0x0C)
          // Index 2-3 or 4-5: Pressure (Big Endian, 100x bar)
          
          const val45 = (value.getUint8(4) << 8) + value.getUint8(5);
          const val23 = (value.getUint8(2) << 8) + value.getUint8(3);
          
          const p45 = val45 / 100.0;
          const p23 = val23 / 100.0;
          
          let pressure = 0;
          // Heuristic: pressure is likely between 0 and 15 bar
          if (p45 > 0 && p45 < 20) {
            pressure = p45;
          } else if (p23 > 0 && p23 < 20) {
            pressure = p23;
          } else {
            pressure = p45; // Fallback
          }
          
          if (!isNaN(pressure)) {
            useBluetoothStore.getState().setCurrentPressure(pressure);
          }
        }
        else if (value.byteLength >= 3 && value.getUint8(0) === 0x01) {
          const pressureRaw = value.getUint16(1, true);
          useBluetoothStore.getState().setCurrentPressure(pressureRaw / 10.0);
        }
        else if (value.byteLength === 4) {
          const f32 = value.getFloat32(0, true);
          if (f32 >= 0 && f32 < 20) {
            useBluetoothStore.getState().setCurrentPressure(f32);
          }
        } else if (value.byteLength === 2) {
          const pressureRaw = value.getUint16(0, true);
          useBluetoothStore.getState().setCurrentPressure(pressureRaw / 10.0);
        } else {
          // Fallback to string parsing
          try {
            const str = new TextDecoder().decode(value).trim();
            const pressure = parseFloat(str.replace(/[^\d.-]/g, ''));
            if (!isNaN(pressure)) useBluetoothStore.getState().setCurrentPressure(pressure);
          } catch (e) {}
        }
      });

      useBluetoothStore.getState().setConnectedPressureSensor(device);
      return device;
    } catch (error) {
      console.error('Pressure Error:', error);
      throw error;
    }
  },

  reset() {
    const store = useBluetoothStore.getState();
    store.addLog('Resetare sistem Bluetooth...');
    try {
      if (store.connectedScale?.gatt?.connected) store.connectedScale.gatt.disconnect();
      if (store.connectedPressureSensor?.gatt?.connected) store.connectedPressureSensor.gatt.disconnect();
    } catch (e) {}
    
    store.setConnectedScale(null);
    store.setConnectedPressureSensor(null);
    store.setCurrentWeight(0);
    store.setCurrentPressure(0);
    store.setScanning(false);
    store.setRecording(false);
    store.clearLogs();
    store.addLog('Sistem resetat.');
  },

  disconnect(type: 'scale' | 'pressure') {
    useBluetoothStore.getState().disconnect(type);
  },

  async reconnect(type: 'scale' | 'pressure') {
    await useBluetoothStore.getState().reconnect(type);
  }
};

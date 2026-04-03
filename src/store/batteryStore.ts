import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Battery, BatteryCell, AppSettings } from '../types/battery';

interface BatteryState {
  batteries: Battery[];
  settings: AppSettings;
  addBattery: (battery: Battery) => void;
  updateBattery: (battery: Battery) => void;
  deleteBattery: (id: string) => void;
  duplicateBattery: (id: string) => void;
  updateCell: (batteryId: string, index: number, cell: Partial<BatteryCell>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

const makeCells = (count: number, voltage = 1.24): BatteryCell[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    voltage,
    level: 3,
    density: 1.2,
    notes: ''
  }));

const demoBatteries: Battery[] = [
  {
    id: crypto.randomUUID(),
    type: 'HMU',
    serial: '1087860/100-1',
    testDate: '2026-03-02',
    workSheet: 'WS-1001',
    cellLot: 'LOT-HMU-01',
    capacityTestNumber: 'CAP-01',
    readBatteryVoltage: 99.57,
    cells: makeCells(80, 1.245)
  },
  {
    id: crypto.randomUUID(),
    type: 'TSR',
    serial: '254002/1',
    testDate: '2026-03-10',
    workSheet: 'WS-1002',
    cellLot: 'LOT-TSR-11',
    capacityTestNumber: 'CAP-02',
    readBatteryVoltage: 61.44,
    cells: makeCells(48, 1.28)
  },
  {
    id: crypto.randomUUID(),
    type: 'Metro Milano 66ah',
    serial: '261312/1-2-3-4',
    testDate: '2026-03-15',
    workSheet: 'WS-1003',
    cellLot: 'LOT-MM66-03',
    capacityTestNumber: 'CAP-03',
    readBatteryVoltage: 84.48,
    cells: makeCells(66, 1.28)
  },
  {
    id: crypto.randomUUID(),
    type: 'Metro Milano 75',
    serial: '260706/1-2-3-4-5',
    testDate: '2026-03-20',
    workSheet: 'WS-1004',
    cellLot: 'LOT-MM75-07',
    capacityTestNumber: 'CAP-04',
    readBatteryVoltage: 96,
    cells: makeCells(75, 1.28)
  }
];

export const useBatteryStore = create<BatteryState>()(
  persist(
    (set) => ({
      batteries: demoBatteries,
      settings: {
        okMin: 1.2,
        okMax: 1.3,
        criticalThreshold: 1.1,
        diffThreshold: 0.5,
        companyName: 'BatteryCheck Pro',
        darkMode: true
      },
      addBattery: (battery) => set((state) => ({ batteries: [battery, ...state.batteries] })),
      updateBattery: (battery) =>
        set((state) => ({ batteries: state.batteries.map((b) => (b.id === battery.id ? battery : b)) })),
      deleteBattery: (id) => set((state) => ({ batteries: state.batteries.filter((b) => b.id !== id) })),
      duplicateBattery: (id) =>
        set((state) => {
          const source = state.batteries.find((b) => b.id === id);
          if (!source) return state;
          const copy: Battery = {
            ...source,
            id: crypto.randomUUID(),
            serial: `${source.serial}-COPY`,
            testDate: new Date().toISOString().slice(0, 10)
          };
          return { batteries: [copy, ...state.batteries] };
        }),
      updateCell: (batteryId, index, cell) =>
        set((state) => ({
          batteries: state.batteries.map((b) => {
            if (b.id !== batteryId) return b;
            const cells = [...b.cells];
            cells[index] = { ...cells[index], ...cell };
            return { ...b, cells };
          })
        })),
      updateSettings: (settings) => set((state) => ({ settings: { ...state.settings, ...settings } }))
    }),
    { name: 'batterycheck-pro-v1' }
  )
);

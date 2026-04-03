export type CellStatus = 'OK' | 'BASSA' | 'CRITICA' | 'MORTA';

export interface BatteryCell {
  id: number;
  voltage: number;
  level: number;
  density: number;
  notes: string;
}

export interface BatteryHeader {
  id: string;
  type: string;
  serial: string;
  testDate: string;
  workSheet: string;
  cellLot: string;
  capacityTestNumber: string;
  readBatteryVoltage: number;
}

export interface Battery extends BatteryHeader {
  cells: BatteryCell[];
}

export interface AppSettings {
  okMin: number;
  okMax: number;
  criticalThreshold: number;
  diffThreshold: number;
  companyName: string;
  darkMode: boolean;
}

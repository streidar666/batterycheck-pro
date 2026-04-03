import { Battery, BatteryCell, CellStatus } from '../types/battery';

export const getCellStatus = (voltage: number, criticalThreshold: number, okMin: number): CellStatus => {
  if (voltage <= 0.01) return 'MORTA';
  if (voltage < criticalThreshold) return 'CRITICA';
  if (voltage < okMin) return 'BASSA';
  return 'OK';
};

export const averageVoltage = (cells: BatteryCell[]): number => {
  if (!cells.length) return 0;
  return cells.reduce((sum, c) => sum + c.voltage, 0) / cells.length;
};

export const batteryStats = (battery: Battery, criticalThreshold: number, okMin: number) => {
  const avg = averageVoltage(battery.cells);
  const sum = battery.cells.reduce((acc, c) => acc + c.voltage, 0);
  const min = Math.min(...battery.cells.map((c) => c.voltage));
  const max = Math.max(...battery.cells.map((c) => c.voltage));
  const criticalCount = battery.cells.filter((c) => c.voltage < criticalThreshold).length;
  const outRange = battery.cells.filter((c) => c.voltage < okMin).length;
  return {
    avg,
    sum,
    min,
    max,
    criticalCount,
    outRange,
    diff: battery.readBatteryVoltage - sum,
    cells: battery.cells.map((c) => ({ ...c, dV: c.voltage - avg }))
  };
};

import { useMemo, useRef } from 'react';
import { useBatteryStore } from '../../store/batteryStore';
import { getCellStatus } from '../../utils/calculations';
import { useKeyboardNav } from '../../hooks/useKeyboardNav';

const cols = ['voltage', 'level', 'density', 'notes'] as const;

export const CellTable = ({ batteryId }: { batteryId: string }) => {
  const { batteries, settings, updateCell } = useBatteryStore();
  const battery = batteries.find((b) => b.id === batteryId);
  const refs = useRef<Record<string, HTMLInputElement | null>>({});

  const avg = useMemo(() => {
    if (!battery) return 0;
    return battery.cells.reduce((a, c) => a + c.voltage, 0) / battery.cells.length;
  }, [battery]);

  const { handleKeyDown } = useKeyboardNav({
    rowCount: battery?.cells.length ?? 0,
    colCount: cols.length,
    onMove: (row, col) => {
      refs.current[`${row}-${col}`]?.focus();
      refs.current[`${row}-${col}`]?.scrollIntoView({ block: 'nearest' });
    },
    onEdit: () => undefined
  });

  if (!battery) return null;

  return (
    <div className="bg-slate-800 rounded-lg overflow-auto max-h-[60vh]">
      <table className="w-full text-sm border-separate border-spacing-0">
        <thead className="sticky top-0 bg-slate-900 z-10">
          <tr>
            <th className="sticky left-0 bg-slate-900 px-2 py-2">#</th><th>V a vuoto</th><th>Livello</th><th>Densità</th><th>dV</th><th>Note</th><th>Stato</th>
          </tr>
        </thead>
        <tbody>
          {battery.cells.map((cell, row) => {
            const status = getCellStatus(cell.voltage, settings.criticalThreshold, settings.okMin);
            const rowClass = status === 'MORTA' ? 'bg-red-950 line-through' : status === 'CRITICA' ? 'bg-red-900/40' : status === 'BASSA' ? 'bg-amber-900/20' : '';
            return (
              <tr key={cell.id} className={rowClass}>
                <td className="sticky left-0 bg-slate-800 px-2 py-1 font-mono">{cell.id}</td>
                <td><Input row={row} col={0} refs={refs} value={cell.voltage} type="number" min={0} max={2} step={0.001} onKeyDown={handleKeyDown} onChange={(v) => updateCell(batteryId, row, { voltage: Number(v) })} /></td>
                <td><Input row={row} col={1} refs={refs} value={cell.level} type="number" min={0} max={20} step={1} onKeyDown={handleKeyDown} onChange={(v) => updateCell(batteryId, row, { level: Number(v) })} /></td>
                <td><Input row={row} col={2} refs={refs} value={cell.density} type="number" min={0.5} max={2} step={0.01} onKeyDown={handleKeyDown} onChange={(v) => updateCell(batteryId, row, { density: Number(v) })} /></td>
                <td className="font-mono px-2">{(cell.voltage - avg).toFixed(3)}</td>
                <td><Input row={row} col={3} refs={refs} value={cell.notes} type="text" onKeyDown={handleKeyDown} onChange={(v) => updateCell(batteryId, row, { notes: v })} /></td>
                <td className="px-2">{status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

interface InputProps {
  row: number;
  col: number;
  refs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  value: number | string;
  type: string;
  min?: number;
  max?: number;
  step?: number;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => void;
  onChange: (value: string) => void;
}

const Input = ({ row, col, refs, value, type, min, max, step, onKeyDown, onChange }: InputProps) => (
  <input
    ref={(el) => {
      refs.current[`${row}-${col}`] = el;
    }}
    className="w-full bg-slate-900 p-1 font-mono"
    value={value}
    type={type}
    min={min}
    max={max}
    step={step}
    onChange={(e) => onChange(e.target.value)}
    onKeyDown={(e) => onKeyDown(e, row, col)}
  />
);

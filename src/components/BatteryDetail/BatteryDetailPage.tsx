import { Link, useParams } from 'react-router-dom';
import { useBatteryStore } from '../../store/batteryStore';
import { batteryStats } from '../../utils/calculations';
import { StatsBar } from './StatsBar';
import { VoltageChart } from './VoltageChart';
import { CellTable } from './CellTable';

export const BatteryDetailPage = () => {
  const { id } = useParams();
  const { batteries, settings } = useBatteryStore();
  const battery = batteries.find((b) => b.id === id);

  if (!battery) return <div>Batteria non trovata</div>;

  const stats = batteryStats(battery, settings.criticalThreshold, settings.okMin);
  const hasCritical = stats.criticalCount > 0;
  const hasBigDiff = Math.abs(stats.diff) > settings.diffThreshold;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{battery.type} · {battery.serial}</h1>
        <Link to="/" className="underline">← Dashboard</Link>
      </div>

      {hasCritical && <div className="bg-red-600 text-white p-2 rounded animate-pulse">⚠ Celle critiche rilevate.</div>}
      {hasBigDiff && <div className="bg-amber-500 text-slate-900 p-2 rounded">Differenza V batteria oltre soglia: {stats.diff.toFixed(3)}V</div>}

      <StatsBar
        avg={stats.avg}
        sum={stats.sum}
        read={battery.readBatteryVoltage}
        diff={stats.diff}
        min={stats.min}
        max={stats.max}
        outRange={stats.outRange}
        critical={stats.criticalCount}
      />

      <VoltageChart cells={battery.cells} min={settings.okMin} max={settings.okMax} avg={stats.avg} />
      <CellTable batteryId={battery.id} />
    </div>
  );
};

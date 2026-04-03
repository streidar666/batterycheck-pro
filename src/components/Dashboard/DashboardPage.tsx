import { Link } from 'react-router-dom';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useBatteryStore } from '../../store/batteryStore';
import { batteryStats } from '../../utils/calculations';
import { BatteryForm } from '../BatteryForm/BatteryForm';

export const DashboardPage = () => {
  const { batteries, settings, deleteBattery, duplicateBattery } = useBatteryStore();
  const cards = batteries.reduce(
    (acc, b) => {
      const stats = batteryStats(b, settings.criticalThreshold, settings.okMin);
      if (stats.criticalCount > 0) acc.critical += 1;
      else if (stats.outRange > 0) acc.warn += 1;
      else acc.ok += 1;
      return acc;
    },
    { ok: 0, warn: 0, critical: 0 }
  );

  const chartData = batteries.map((b) => {
    const stats = batteryStats(b, settings.criticalThreshold, settings.okMin);
    return { name: b.serial, avg: Number(stats.avg.toFixed(3)) };
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <BatteryForm />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card label="Totale" value={String(batteries.length)} color="text-blue-400" />
        <Card label="OK" value={String(cards.ok)} color="text-ok" />
        <Card label="Attenzione" value={String(cards.warn)} color="text-warn" />
        <Card label="Critiche" value={String(cards.critical)} color="text-crit" />
      </div>
      <div className="bg-slate-800 rounded-lg p-4 h-72">
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Bar dataKey="avg" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2">
        {batteries.map((b) => {
          const stats = batteryStats(b, settings.criticalThreshold, settings.okMin);
          const color = stats.criticalCount > 0 ? 'border-crit' : stats.outRange > 0 ? 'border-warn' : 'border-ok';
          return (
            <div key={b.id} className={`border-l-4 ${color} bg-slate-800 p-3 rounded flex items-center justify-between gap-2`}>
              <Link to={`/battery/${b.id}`} className="font-medium underline">{b.type} · {b.serial}</Link>
              <div className="flex gap-2">
                <button onClick={() => duplicateBattery(b.id)} className="px-2 py-1 rounded bg-slate-700">Duplica</button>
                <button onClick={() => deleteBattery(b.id)} className="px-2 py-1 rounded bg-red-900">Elimina</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Card = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="bg-slate-800 rounded-lg p-3">
    <div className="text-xs text-slate-400">{label}</div>
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
  </div>
);

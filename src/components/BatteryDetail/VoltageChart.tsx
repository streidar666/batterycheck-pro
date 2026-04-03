import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, ReferenceLine, Tooltip } from 'recharts';
import { BatteryCell } from '../../types/battery';

export const VoltageChart = ({ cells, min, max, avg }: { cells: BatteryCell[]; min: number; max: number; avg: number }) => {
  const data = cells.map((c) => ({ id: c.id, v: c.voltage }));
  return (
    <div className="bg-slate-800 p-4 rounded-lg h-72">
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="id" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip />
          <ReferenceLine y={min} stroke="#ef4444" strokeDasharray="4 4" />
          <ReferenceLine y={max} stroke="#22c55e" strokeDasharray="4 4" />
          <ReferenceLine y={avg} stroke="#38bdf8" strokeDasharray="2 2" />
          <Line type="monotone" dataKey="v" stroke="#22d3ee" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

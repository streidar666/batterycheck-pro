interface Props {
  avg: number;
  sum: number;
  read: number;
  diff: number;
  min: number;
  max: number;
  outRange: number;
  critical: number;
}

export const StatsBar = ({ avg, sum, read, diff, min, max, outRange, critical }: Props) => {
  const items = [
    ['V Media', avg.toFixed(3)],
    ['V Somma', sum.toFixed(3)],
    ['V Letta', read.toFixed(3)],
    ['Differenza', diff.toFixed(3)],
    ['Min', min.toFixed(3)],
    ['Max', max.toFixed(3)],
    ['Fuori Range', String(outRange)],
    ['Critiche', String(critical)]
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
      {items.map(([k, v]) => (
        <div key={k} className="bg-slate-800 rounded p-2">
          <div className="text-xs text-slate-400">{k}</div>
          <div className="font-mono text-sm">{v}</div>
        </div>
      ))}
    </div>
  );
};

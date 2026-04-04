import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useBatteryStore, Cell, Project } from './store/batteryStore';

// Import external libraries (assumes they are loaded via CDN in index.html)
declare const window: any;

const STORAGE_KEY = 'batterycheck_pro_state_v1';

const VOLTAGE_RANGES = {
  EMPTY: { label: 'VUOTO', color: 'bg-gray-400', severity: 0 },
  OK: { label: 'OK', color: 'bg-emerald-500', severity: 1 },
  LOW: { label: 'DA CARICARE', color: 'bg-amber-400', severity: 2 },
  HIGH: { label: 'SOVRATENSIONE', color: 'bg-orange-500', severity: 2 },
  CRITICAL: { label: 'CRITICO', color: 'bg-red-500', severity: 3 },
  ERROR: { label: 'ERRORE', color: 'bg-purple-500', severity: 4 }
};

const severityInfo: Record<number, { label: string; color: string }> = {
  0: { label: 'Nessun dato', color: 'bg-gray-400' },
  1: { label: 'OK', color: 'bg-emerald-500' },
  2: { label: 'Attenzione', color: 'bg-amber-400' },
  3: { label: 'Critico', color: 'bg-red-500' },
  4: { label: 'Errore', color: 'bg-purple-500' }
};

const validateVoltage = (value: string | number | null | undefined) => {
  if (value === '' || value === null || value === undefined) return { valid: true };
  const num = Number(value);
  if (Number.isNaN(num)) return { valid: false, message: 'Valore non numerico' };
  if (num < 0) return { valid: false, message: 'Valore negativo non ammesso' };
  if (num > 2) return { valid: false, message: 'Max 2.000 V' };
  return { valid: true };
};

const validateLevel = (value: string | number | null | undefined) => {
  if (value === '' || value === null || value === undefined) return { valid: true };
  const num = Number(value);
  if (!Number.isInteger(num)) return { valid: false, message: 'Inserire un numero intero' };
  if (num < 0 || num > 6) return { valid: false, message: 'Range ammesso 0-6' };
  return { valid: true };
};

const validateDensity = (value: string | number | null | undefined) => {
  if (value === '' || value === null || value === undefined) return { valid: true };
  const num = Number(value);
  if (Number.isNaN(num)) return { valid: false, message: 'Valore non numerico' };
  if (num < 0.5 || num > 2) return { valid: false, message: 'Range 0.5-2.0 g/cm³' };
  return { valid: true };
};

const evaluateCell = (cell: Cell) => {
  const hasVoltage = cell.voltage !== '' && cell.voltage !== null && cell.voltage !== undefined;
  const hasLevel = cell.level !== '' && cell.level !== null && cell.level !== undefined;
  const hasDensity = cell.density !== '' && cell.density !== null && cell.density !== undefined;

  if (!hasVoltage && !hasLevel && !hasDensity) {
    return { ...VOLTAGE_RANGES.EMPTY, factors: [] };
  }

  let severity = 1;
  const factors: string[] = [];

  if (hasVoltage) {
    const num = Number(cell.voltage);
    if (Number.isNaN(num)) {
      severity = 4;
      factors.push('Tensione non valida');
    } else if (num < 1) {
      severity = Math.max(severity, 4);
      factors.push('Tensione <1.0V (cortocircuito)');
    } else if (num <= 1.2) {
      severity = Math.max(severity, 3);
      factors.push('Tensione ≤1.2V');
    } else if (num < 1.3) {
      severity = Math.max(severity, 2);
      factors.push('Tensione <1.30V');
    } else if (num >= 1.5) {
      severity = Math.max(severity, 3);
      factors.push('Tensione ≥1.50V');
    } else if (num >= 1.45) {
      severity = Math.max(severity, 2);
      factors.push('Tensione ≥1.45V');
    }
  } else {
    severity = Math.max(severity, 2);
    factors.push('Manca misura di tensione');
  }

  if (hasLevel) {
    const level = Number(cell.level);
    if (Number.isNaN(level)) {
      severity = Math.max(severity, 4);
      factors.push('Livello non valido');
    } else if (level < 0 || level > 6) {
      severity = Math.max(severity, 4);
      factors.push('Livello fuori scala');
    } else if (level <= 1) {
      severity = Math.max(severity, 3);
      factors.push('Livello molto basso');
    } else if (level <= 2) {
      severity = Math.max(severity, 2);
      factors.push('Livello da verificare');
    }
  }

  if (hasDensity) {
    const density = Number(cell.density);
    if (Number.isNaN(density)) {
      severity = Math.max(severity, 4);
      factors.push('Densità non valida');
    } else if (density < 1.05 || density > 1.35) {
      severity = Math.max(severity, 3);
      factors.push('Densità fuori intervallo ideale');
    } else if (density < 1.1 || density > 1.3) {
      severity = Math.max(severity, 2);
      factors.push('Densità da controllare');
    }
  }

  const info = severityInfo[severity] || severityInfo[1];
  let label = info.label;

  if (severity === 2 && factors.length) {
    label = `Attenzione (${factors[0]})`;
  } else if (severity >= 3 && factors.length) {
    label = `${info.label} (${factors[0]})`;
  }

  return {
    label,
    color: info.color,
    severity,
    factors,
    isWarning: severity === 2,
    isAnomaly: severity >= 3
  };
};

const formatVoltage = (value: string | number | null | undefined) => {
  if (value === '' || value === null || value === undefined) return '';
  const num = Number(value);
  return Number.isNaN(num) ? String(value) : num.toFixed(3);
};

const formatDensity = (value: string | number | null | undefined) => {
  if (value === '' || value === null || value === undefined) return '';
  const num = Number(value);
  return Number.isNaN(num) ? String(value) : num.toFixed(2);
};

const generateCells = (count: number): Cell[] => {
  return Array.from({ length: count }, (_, idx) => ({
    id: idx + 1,
    voltage: '',
    level: '',
    density: '',
    notes: ''
  }));
};

interface Stats {
  total: number;
  measured: number;
  warnings: number;
  anomalies: number;
  voltage: {
    min: string | null;
    max: string | null;
    avg: string | null;
    sum: string | null;
  };
}

const computeStats = (cells: Cell[]): Stats => {
  if (!cells.length) {
    return {
      total: 0,
      measured: 0,
      warnings: 0,
      anomalies: 0,
      voltage: { min: null, max: null, avg: null, sum: null }
    };
  }

  let measured = 0;
  let warnings = 0;
  let anomalies = 0;
  const voltages: number[] = [];

  cells.forEach((cell) => {
    const status = evaluateCell(cell);
    if (cell.voltage || cell.level || cell.density || cell.notes) measured += 1;
    if (status.isWarning) warnings += 1;
    if (status.isAnomaly) anomalies += 1;
    const voltage = Number(cell.voltage);
    if (!Number.isNaN(voltage)) voltages.push(voltage);
  });

  if (!voltages.length) {
    return {
      total: cells.length,
      measured,
      warnings,
      anomalies,
      voltage: { min: null, max: null, avg: null, sum: null }
    };
  }

  const min = Math.min(...voltages);
  const max = Math.max(...voltages);
  const sum = voltages.reduce((acc, val) => acc + val, 0);
  const avg = sum / voltages.length;

  return {
    total: cells.length,
    measured,
    warnings,
    anomalies,
    voltage: {
      min: min.toFixed(3),
      max: max.toFixed(3),
      avg: avg.toFixed(3),
      sum: sum.toFixed(3)
    }
  };
};

const buildAnalysis = (cells: Cell[], stats: Stats, project: Project | null): string => {
  if (!cells.length) {
    return 'Configura il progetto per iniziare la raccolta dati.';
  }

  const measuredCells = cells.filter((cell) => cell.voltage || cell.level || cell.density);
  if (!measuredCells.length) {
    return 'Inserisci almeno un valore di tensione per generare un report.';
  }

  const parsed = measuredCells
    .map((cell) => ({ ...cell, voltageNum: Number(cell.voltage) }))
    .filter((cell) => !Number.isNaN(cell.voltageNum));

  const lowCells = parsed.filter((cell) => cell.voltageNum < 1.3);
  const criticalCells = parsed.filter((cell) => cell.voltageNum <= 1.2);
  const overchargeCells = parsed.filter((cell) => cell.voltageNum >= 1.45);
  const extremeCells = parsed.filter((cell) => cell.voltageNum < 1.0 || cell.voltageNum >= 1.5);

  const lines: string[] = [];

  lines.push(`Analizzate ${measuredCells.length} celle su ${cells.length} totali.`);
  if (stats.voltage.avg) {
    lines.push(`Tensione media ${stats.voltage.avg} V, range ${stats.voltage.min} - ${stats.voltage.max} V.`);
  }

  if (criticalCells.length) {
    lines.push(`⚠️ ${criticalCells.length} celle sono sotto la soglia nominale (≤1.200 V). Effettua ricarica immediata.`);
  }

  if (lowCells.length && !criticalCells.length) {
    lines.push(`ℹ️ ${lowCells.length} celle sono sotto 1.300 V: pianifica una ricarica di equalizzazione.`);
  }

  if (overchargeCells.length) {
    lines.push(`🔥 ${overchargeCells.length} celle risultano oltre 1.450 V. Valuta interventi per evitare sovraccarichi.`);
  }

  if (extremeCells.length) {
    lines.push('‼️ Alcune celle presentano valori anomali estremi: isola e verifica manualmente (possibile cortocircuito).');
  }

  if (!criticalCells.length && !overchargeCells.length && !lowCells.length) {
    lines.push('✅ Tutte le celle rilevate sono allineate al range ottimale per batterie NiCd FNC.');
  }

  if (project?.note) {
    lines.push(`Nota operatore: ${project.note}`);
  }

  lines.push('Mantieni le celle sopra 1.30 V per limitare l\'autoscarica e ripeti il controllo ogni 30 giorni.');

  return lines.join('\n');
};

// Toast Component
interface Toast {
  id: number;
  message: string;
  variant: string;
}

const Toasts: React.FC<{ items: Toast[]; removeToast: (id: number) => void }> = ({ items, removeToast }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {items.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg text-white toast-enter ${toast.variant}`}
        >
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            className="text-white/80 hover:text-white"
            onClick={() => removeToast(toast.id)}
            aria-label="Chiudi notifica"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

// Project Setup Modal
interface ProjectSetupModalProps {
  initialProject: Project;
  onCancel: () => void;
  onConfirm: (project: Project) => void;
}

const ProjectSetupModal: React.FC<ProjectSetupModalProps> = ({ initialProject, onCancel, onConfirm }) => {
  const [project, setProject] = useState<Project>(initialProject);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setProject(initialProject);
  }, [initialProject]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProject((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!project.lotto.trim()) newErrors.lotto = 'Campo obbligatorio';
    if (!project.matricola.trim()) newErrors.matricola = 'Campo obbligatorio';
    if (!project.numCelle || Number(project.numCelle) <= 0) newErrors.numCelle = 'Inserisci il numero di celle';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    onConfirm({ ...project, numCelle: Number(project.numCelle) });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 px-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Configura nuova batteria FNC</h2>
            <p className="text-sm text-slate-500">Imposta i dettagli del lotto e il numero di celle da monitorare.</p>
          </div>
          <button className="text-slate-500 hover:text-slate-700" onClick={onCancel}>×</button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">Lotto *</span>
              <input
                className={`rounded-lg border px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 ${errors.lotto ? 'border-red-400' : 'border-slate-300'}`}
                name="lotto"
                value={project.lotto}
                onChange={handleChange}
                placeholder="es. FNC-2024-001"
              />
              {errors.lotto && <span className="text-xs text-red-500">{errors.lotto}</span>}
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">Matricola *</span>
              <input
                className={`rounded-lg border px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 ${errors.matricola ? 'border-red-400' : 'border-slate-300'}`}
                name="matricola"
                value={project.matricola}
                onChange={handleChange}
                placeholder="es. BAT-NiCd-23"
              />
              {errors.matricola && <span className="text-xs text-red-500">{errors.matricola}</span>}
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">Operatore</span>
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                name="operatore"
                value={project.operatore}
                onChange={handleChange}
                placeholder="Nome tecnico"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">Impianto / Cliente</span>
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                name="impianto"
                value={project.impianto}
                onChange={handleChange}
                placeholder="Località"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">Data controllo</span>
              <input
                type="date"
                className="rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                name="data"
                value={project.data}
                onChange={handleChange}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">Numero celle *</span>
              <input
                type="number"
                min="1"
                className={`rounded-lg border px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 ${errors.numCelle ? 'border-red-400' : 'border-slate-300'}`}
                name="numCelle"
                value={project.numCelle}
                onChange={handleChange}
              />
              {errors.numCelle && <span className="text-xs text-red-500">{errors.numCelle}</span>}
            </label>
          </div>

          <button
            type="button"
            className="text-sm text-emerald-600 hover:text-emerald-700"
            onClick={() => setShowAdvanced((value) => !value)}
          >
            {showAdvanced ? 'Nascondi note' : 'Aggiungi note di progetto'}
          </button>

          {showAdvanced && (
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">Note</span>
              <textarea
                className="min-h-[80px] rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                name="note"
                value={project.note}
                onChange={handleChange}
                placeholder="Eventuali indicazioni operative o stato iniziale"
              />
            </label>
          )}

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
            >
              Salva configurazione
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Quick Actions Component
interface QuickActionsProps {
  onBulkFill: (field: keyof Cell, value: string) => void;
  onClear: () => void;
  onAnalyze: () => void;
  onExport: () => void;
  hasData: boolean;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onBulkFill, onClear, onAnalyze, onExport, hasData }) => {
  const [field, setField] = useState<'voltage' | 'level' | 'density'>('voltage');
  const [value, setValue] = useState('');

  const handleFill = () => {
    if (!value) return;
    if (field === 'voltage' && !validateVoltage(value).valid) return;
    if (field === 'level' && !validateLevel(value).valid) return;
    if (field === 'density' && !validateDensity(value).valid) return;
    onBulkFill(field, value);
    setValue('');
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={field}
          onChange={(e) => setField(e.target.value as 'voltage' | 'level' | 'density')}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        >
          <option value="voltage">Tensione (V)</option>
          <option value="level">Livello</option>
          <option value="density">Densità</option>
        </select>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          placeholder="Valore"
          type="number"
          step="any"
        />
        <button
          onClick={handleFill}
          className="rounded-lg bg-blue-500 px-3 py-2 text-sm font-medium text-white shadow hover:bg-blue-600"
        >
          Compila tutto
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onClear}
          disabled={!hasData}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Pulisci dati
        </button>
        <button
          onClick={onAnalyze}
          disabled={!hasData}
          className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white shadow transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Analizza valori
        </button>
        <button
          onClick={onExport}
          disabled={!hasData}
          className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Esporta PDF
        </button>
      </div>
    </div>
  );
};

// Stats Panel Component
interface StatsPanelProps {
  project: Project | null;
  stats: Stats;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ project, stats }) => {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">BatteryCheck Pro</h1>
          <p className="mt-2 text-sm text-slate-500">
            Monitoraggio tensioni celle NiCd FNC — mantieni i valori sopra 1.300 V per prestazioni ottimali.
          </p>
          {project && (
            <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-600 md:grid-cols-2">
              <div><span className="font-semibold text-slate-800">Lotto:</span> {project.lotto || '—'}</div>
              <div><span className="font-semibold text-slate-800">Matricola:</span> {project.matricola || '—'}</div>
              <div><span className="font-semibold text-slate-800">Operatore:</span> {project.operatore || '—'}</div>
              <div><span className="font-semibold text-slate-800">Data:</span> {project.data || '—'}</div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Celle totali</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{stats.total}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Misurate</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{stats.measured}</p>
          </div>
          <div className="rounded-xl bg-amber-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-amber-600">Attenzioni</p>
            <p className="mt-1 text-xl font-semibold text-amber-700">{stats.warnings}</p>
          </div>
          <div className="rounded-xl bg-red-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-red-600">Critiche</p>
            <p className="mt-1 text-xl font-semibold text-red-700">{stats.anomalies}</p>
          </div>
        </div>
      </div>

      {stats.voltage.avg && (
        <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
          <p>
            <span className="font-semibold text-slate-800">Tensione media:</span> {stats.voltage.avg} V ·
            <span className="font-semibold text-slate-800"> min:</span> {stats.voltage.min} V ·
            <span className="font-semibold text-slate-800"> max:</span> {stats.voltage.max} V
          </p>
        </div>
      )}
    </section>
  );
};

// Cells Table Component
interface CellsTableProps {
  cells: Cell[];
  onChange: (index: number, field: keyof Cell, value: string) => void;
  onBlur: (index: number, field: keyof Cell, value: string) => void;
  validationErrors: Record<string, string>;
}

const CellsTable: React.FC<CellsTableProps> = ({ cells, onChange, onBlur, validationErrors }) => {
  return (
    <section className="rounded-2xl bg-white p-0 shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Cella</th>
              <th className="px-4 py-3">Tensione (V)</th>
              <th className="px-4 py-3">Livello</th>
              <th className="px-4 py-3">Densità</th>
              <th className="px-4 py-3">Stato</th>
              <th className="px-4 py-3">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {cells.map((cell, index) => {
              const status = evaluateCell(cell);
              return (
                <tr key={cell.id} className={`${status.severity >= 3 ? 'bg-red-50' : status.severity === 2 ? 'bg-amber-50' : 'bg-white'} hover:bg-slate-50`}>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">{cell.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <input
                        name={`voltage-${index}`}
                        type="number"
                        step="0.001"
                        value={cell.voltage}
                        onChange={(e) => onChange(index, 'voltage', e.target.value)}
                        onBlur={(e) => onBlur(index, 'voltage', e.target.value)}
                        className={`w-full rounded-lg border px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 ${validationErrors['voltage-' + index] ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                        placeholder="1.320"
                      />
                      {validationErrors['voltage-' + index] && (
                        <span className="text-xs text-red-500">{validationErrors['voltage-' + index]}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <input
                        name={`level-${index}`}
                        type="number"
                        step="1"
                        value={cell.level}
                        onChange={(e) => onChange(index, 'level', e.target.value)}
                        className={`w-full rounded-lg border px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 ${validationErrors['level-' + index] ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                        placeholder="3"
                      />
                      {validationErrors['level-' + index] && (
                        <span className="text-xs text-red-500">{validationErrors['level-' + index]}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <input
                        name={`density-${index}`}
                        type="number"
                        step="0.01"
                        value={cell.density}
                        onChange={(e) => onChange(index, 'density', e.target.value)}
                        onBlur={(e) => onBlur(index, 'density', e.target.value)}
                        className={`w-full rounded-lg border px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 ${validationErrors['density-' + index] ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                        placeholder="1.20"
                      />
                      {validationErrors['density-' + index] && (
                        <span className="text-xs text-red-500">{validationErrors['density-' + index]}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      name={`notes-${index}`}
                      value={cell.notes}
                      onChange={(e) => onChange(index, 'notes', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      placeholder="Annotazioni..."
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

// Chart Panel Component
interface ChartPanelProps {
  cells: Cell[];
}

const ChartPanel: React.FC<ChartPanelProps> = ({ cells }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current || !(window as any).Chart) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const labels = cells.map((cell) => `Cella ${cell.id}`);
    const data = cells.map((cell) => {
      const value = Number(cell.voltage);
      return Number.isNaN(value) ? null : value;
    });

    chartRef.current = new (window as any).Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Tensione (V)',
            data,
            borderColor: '#059669',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            pointRadius: 4,
            pointHoverRadius: 5,
            tension: 0.2,
            spanGaps: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            suggestedMin: 1,
            suggestedMax: 1.5,
            title: { display: true, text: 'Volt' },
            grid: { color: '#e2e8f0' }
          },
          x: {
            title: { display: true, text: 'Numero cella' }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: any) => `Tensione: ${ctx.parsed.y.toFixed(3)} V`
            }
          }
        }
      }
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [cells]);

  const hasData = cells.some((cell) => cell.voltage !== '' && !Number.isNaN(Number(cell.voltage)));
  if (!hasData) {
    return (
      <section className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
        Inserisci i valori di tensione per visualizzare l'andamento grafico della batteria.
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">Profilo tensioni</h2>
      <div className="h-72">
        <canvas ref={canvasRef} role="img" aria-label="Grafico andamento tensioni"></canvas>
      </div>
    </section>
  );
};

// Analysis Panel Component
interface AnalysisPanelProps {
  analysis: string;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis }) => {
  if (!analysis) {
    return (
      <section className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm">
        Premi "Analizza valori" per generare automaticamente una diagnosi dello stato della batteria.
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-slate-800">Report automatico</h2>
      <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-700">{analysis}</pre>
    </section>
  );
};

// Legend Panel Component
const LegendPanel: React.FC = () => (
  <section className="rounded-2xl bg-white p-6 shadow-sm">
    <h2 className="mb-4 text-lg font-semibold text-slate-800">Legenda stato celle</h2>
    <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
        <span>OK — tensione compresa tra 1.300 V e 1.450 V</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 rounded-full bg-amber-400"></span>
        <span>Attenzione — cella da ricaricare o parametro fuori range</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 rounded-full bg-red-500"></span>
        <span>Critico — intervenire immediatamente</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 rounded-full bg-purple-500"></span>
        <span>Errore — valore non valido o misura mancante</span>
      </div>
    </div>
  </section>
);

// Main App Component
const DEFAULT_PROJECT: Project = {
  lotto: '',
  matricola: '',
  operatore: '',
  impianto: '',
  data: new Date().toISOString().slice(0, 10),
  numCelle: 60,
  note: ''
};

const App: React.FC = () => {
  const { project, cells, analysis, setProject, setCells, updateCell, setAnalysis, resetAll } = useBatteryStore();
  const [showSetup, setShowSetup] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!project && !cells.length) {
      setShowSetup(true);
    }
  }, []);

  const stats = useMemo(() => computeStats(cells), [cells]);

  const addToast = useCallback((message: string, variant: string = 'bg-slate-900/95') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const handleProjectConfirm = (data: Project) => {
    setProject(data);
    setCells(generateCells(data.numCelle));
    setAnalysis('');
    setValidationErrors({});
    setShowSetup(false);
    addToast(`Progetto "${data.lotto}" configurato`, 'bg-emerald-500');
  };

  const handleCellChange = (index: number, field: keyof Cell, value: string) => {
    updateCell(index, field, value);

    let validation = { valid: true };
    if (field === 'voltage') validation = validateVoltage(value);
    if (field === 'level') validation = validateLevel(value);
    if (field === 'density') validation = validateDensity(value);

    setValidationErrors((prev) => {
      const copy = { ...prev };
      const key = `${field}-${index}`;
      if (!validation.valid) {
        copy[key] = validation.message;
      } else {
        delete copy[key];
      }
      return copy;
    });
  };

  const handleCellBlur = (index: number, field: keyof Cell, value: string) => {
    if (field === 'voltage') {
      updateCell(index, field, formatVoltage(value));
    }
    if (field === 'density') {
      updateCell(index, field, formatDensity(value));
    }
  };

  const handleBulkFill = (field: keyof Cell, value: string) => {
    const newCells = cells.map((cell) => ({ ...cell, [field]: value }));
    setCells(newCells);
    addToast(`Valore applicato a tutte le celle (${field})`, 'bg-blue-500');
  };

  const handleClear = () => {
    const newCells = cells.map((cell) => ({ ...cell, voltage: '', level: '', density: '', notes: '' }));
    setCells(newCells);
    setAnalysis('');
    setValidationErrors({});
    addToast('Valori azzerati', 'bg-amber-500');
  };

  const handleAnalyze = () => {
    const report = buildAnalysis(cells, stats, project);
    setAnalysis(report);
    addToast('Analisi aggiornata', 'bg-emerald-500');
  };

  const handleExport = async () => {
    if (!exportRef.current || !(window as any).html2canvas || !(window as any).jspdf) {
      addToast('Librerie PDF non caricate', 'bg-red-500');
      return;
    }

    const element = exportRef.current;
    addToast('Generazione PDF in corso...', 'bg-slate-900/95');
    
    try {
      const canvas = await (window as any).html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
      const image = canvas.toDataURL('image/png', 1.0);
      const pdf = new (window as any).jspdf.jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(image);
      const imgRatio = imgProps.width / imgProps.height;
      let renderWidth = pdfWidth;
      let renderHeight = renderWidth / imgRatio;
      
      if (renderHeight > pdfHeight) {
        renderHeight = pdfHeight;
        renderWidth = renderHeight * imgRatio;
      }
      
      pdf.addImage(image, 'PNG', 0, 0, renderWidth, renderHeight);
      pdf.save(`batterycheck-${project?.lotto || 'report'}.pdf`);
      addToast('Report PDF generato', 'bg-emerald-500');
    } catch (err) {
      console.error(err);
      addToast('Errore durante la creazione del PDF', 'bg-red-500');
    }
  };

  const handleReset = () => {
    resetAll();
    setValidationErrors({});
    setShowSetup(true);
    addToast('Configurazione ripristinata', 'bg-amber-500');
  };

  const hasData = cells.some((cell) => cell.voltage || cell.level || cell.density || cell.notes);

  return (
    <>
      {showSetup && (
        <ProjectSetupModal
          initialProject={project || DEFAULT_PROJECT}
          onCancel={() => setShowSetup(false)}
          onConfirm={handleProjectConfirm}
        />
      )}

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-emerald-600 shadow-sm ring-1 ring-emerald-100 transition hover:bg-emerald-50"
            onClick={() => setShowSetup(true)}
          >
            Modifica progetto
          </button>
          <button
            className="text-sm text-slate-500 hover:text-red-500"
            onClick={handleReset}
          >
            Cancella configurazione salvata
          </button>
        </div>

        <div className="space-y-6" ref={exportRef} id="report-area">
          <StatsPanel project={project} stats={stats} />
          <QuickActions
            onBulkFill={handleBulkFill}
            onClear={handleClear}
            onAnalyze={handleAnalyze}
            onExport={handleExport}
            hasData={hasData}
          />
          <CellsTable
            cells={cells}
            onChange={handleCellChange}
            onBlur={handleCellBlur}
            validationErrors={validationErrors}
          />
          <ChartPanel cells={cells} />
          <AnalysisPanel analysis={analysis} />
          <LegendPanel />
        </div>
      </div>

      <Toasts items={toasts} removeToast={removeToast} />
    </>
  );
};

export default App;

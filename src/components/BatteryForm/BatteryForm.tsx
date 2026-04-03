import { FormEvent, useState } from 'react';
import { useBatteryStore } from '../../store/batteryStore';
import { Battery } from '../../types/battery';

export const BatteryForm = () => {
  const { addBattery } = useBatteryStore();
  const [type, setType] = useState('HMU');
  const [serial, setSerial] = useState('');
  const [testDate, setTestDate] = useState(new Date().toISOString().slice(0, 10));
  const [cells, setCells] = useState(80);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const battery: Battery = {
      id: crypto.randomUUID(),
      type,
      serial,
      testDate,
      workSheet: '',
      cellLot: '',
      capacityTestNumber: '',
      readBatteryVoltage: Number((cells * 1.25).toFixed(2)),
      cells: Array.from({ length: cells }, (_, i) => ({
        id: i + 1,
        voltage: 1.25,
        level: 3,
        density: 1.2,
        notes: ''
      }))
    };
    addBattery(battery);
    setSerial('');
  };

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-800 p-3 rounded-lg">
      <input className="bg-slate-900 rounded p-2" value={type} onChange={(e) => setType(e.target.value)} placeholder="Tipo" />
      <input className="bg-slate-900 rounded p-2" value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="Seriale" required />
      <input className="bg-slate-900 rounded p-2" type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
      <input className="bg-slate-900 rounded p-2" type="number" value={cells} min={1} max={120} step={1} onChange={(e) => setCells(Number(e.target.value))} />
      <button type="submit" className="col-span-2 md:col-span-4 bg-ok text-slate-950 font-semibold rounded p-2">Crea batteria</button>
    </form>
  );
};

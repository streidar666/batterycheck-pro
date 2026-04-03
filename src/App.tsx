import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardPage } from './components/Dashboard/DashboardPage';
import { BatteryDetailPage } from './components/BatteryDetail/BatteryDetailPage';
import { useBatteryStore } from './store/batteryStore';

export const App = () => {
  const { settings, updateSettings } = useBatteryStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.darkMode);
  }, [settings.darkMode]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-bold">BatteryCheck Pro</h1>
          <p className="text-xs text-slate-400">Offline-ready battery testing</p>
        </div>
        <button className="bg-slate-800 px-3 py-1 rounded" onClick={() => updateSettings({ darkMode: !settings.darkMode })}>
          {settings.darkMode ? 'Light' : 'Dark'}
        </button>
      </header>
      <main className="p-4">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/battery/:id" element={<BatteryDetailPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
};

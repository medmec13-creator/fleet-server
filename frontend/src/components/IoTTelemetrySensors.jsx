import React, { useState, useEffect } from 'react';
import { Activity, Thermometer, Gauge, Battery, AlertTriangle, CheckCircle2, RefreshCw, AlertOctagon, ShieldAlert, Zap } from 'lucide-react';
import { getLang } from '../i18n';
import { API, apiFetch } from '../apiConfig';
import { CardSkeleton } from './Skeleton';

export default function IoTTelemetrySensors({ lang = 'fr' }) {
  const t = getLang(lang);
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, normal, alert
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchTelemetry = () => {
    setLoading(true);
    apiFetch('/api/analytics/telemetry_iot')
      .then(res => res.json())
      .then(data => {
        setSensors(data);
        setLastUpdated(new Date());
      })
      .catch(err => console.error('Error fetching telemetry:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchTelemetry, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const filteredSensors = sensors.filter(s => {
    if (filter === 'normal') return s.status === 'Normal';
    if (filter === 'alert') return s.status !== 'Normal';
    return true;
  });

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('normal') || s.includes('ok')) {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          {status}
        </span>
      );
    }
    if (s.includes('critique') || s.includes('urgent') || s.includes('surchauffe') || s.includes('chute') || s.includes('fuite')) {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
          {status}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
        {status}
      </span>
    );
  };

  if (loading && sensors.length === 0) {
    return (
      <div className="space-y-6">
        <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 animate-pulse h-24" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton count={8} />
        </div>
      </div>
    );
  }

  const normalCount = sensors.filter(s => s.status === 'Normal').length;
  const alertCount = sensors.length - normalCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-white font-outfit flex items-center space-x-2">
              <Activity className="w-6 h-6 text-cyan-400" />
              <span>{t.iot.title}</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">{t.iot.subtitle}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-semibold">
              {normalCount} / {sensors.length} {t.iot.normal}
            </span>
            {alertCount > 0 && (
              <span className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-mono font-semibold animate-pulse">
                {alertCount} Alerts
              </span>
            )}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                autoRefresh ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              Auto 10s: {autoRefresh ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={fetchTelemetry}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title={t.common.refresh}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            filter === 'all' ? 'bg-cyan-600 text-white' : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
          }`}
        >
          {lang === 'es' ? 'Todos' : 'Tous'} ({sensors.length})
        </button>
        <button
          onClick={() => setFilter('normal')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            filter === 'normal' ? 'bg-emerald-600 text-white' : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
          }`}
        >
          {t.iot.normal} ({normalCount})
        </button>
        <button
          onClick={() => setFilter('alert')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            filter === 'alert' ? 'bg-rose-600 text-white' : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
          }`}
        >
          Alertes ({alertCount})
        </button>
      </div>

      {/* Grid of Sensor Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredSensors.map((s, i) => (
          <div
            key={i}
            className={`glass-card p-4 rounded-xl border transition ${
              s.status === 'Surchauffe Moteur'
                ? 'border-rose-500/60 bg-rose-950/20 shadow-lg shadow-rose-950/40'
                : s.status === 'Pression Pneus Basse'
                ? 'border-amber-500/60 bg-amber-950/20'
                : 'border-slate-800 hover:border-cyan-500/40'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono font-bold text-white text-sm">{s.registration}</span>
              {getStatusBadge(s.status)}
            </div>

            <p className="text-xs text-slate-400 mb-3">{s.brand} ({s.fuel_type})</p>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center space-x-1">
                  <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                  <span>{t.iot.engineTemp}:</span>
                </span>
                <span className={`font-bold ${s.engine_temp_c > 100 ? 'text-rose-400 animate-pulse' : 'text-slate-200'}`}>
                  {s.engine_temp_c} °C
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center space-x-1">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.iot.tirePressure}:</span>
                </span>
                <span className={`font-bold ${s.tire_pressure_psi < 95 ? 'text-amber-400 font-bold' : 'text-slate-200'}`}>
                  {s.tire_pressure_psi} PSI
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center space-x-1">
                  <Battery className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.iot.fuelBattery}:</span>
                </span>
                <span className="font-bold text-emerald-400">{s.fuel_battery_pct}%</span>
              </div>

              {/* Driving events if present */}
              {(s.harsh_braking_events > 0 || s.speeding_events > 0) && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-rose-300 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-rose-400" />
                    {t.iot.harshBraking}: {s.harsh_braking_events || 0}
                  </span>
                  <span className="text-amber-300 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    {t.iot.speeding}: {s.speeding_events || 0}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

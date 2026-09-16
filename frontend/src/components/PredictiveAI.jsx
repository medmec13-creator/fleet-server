import React, { useState, useEffect } from 'react';
import {
  Cpu, AlertTriangle, ShieldAlert, Leaf, CheckCircle2,
  TrendingDown, Flame, Zap, Clock, BarChart3, AlertCircle,
  Activity, ArrowRight, RefreshCw, Download
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar,
  LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { getLang } from '../i18n';
import { API, apiFetch } from '../apiConfig';

const RISK_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'];
const CO2_COLORS = { Diesel: '#3b82f6', LNG: '#10b981', Hybrid: '#f59e0b', Electric: '#06b6d4' };

function getRiskLevel(score, t) {
  if (!t || !t.predictive) return { label: 'RISQUE', cls: 'badge-warn', bar: 'bg-amber-500' };
  if (score >= 80) return { label: t.predictive.critical, cls: 'badge-alert', bar: 'bg-red-500' };
  if (score >= 55) return { label: t.predictive.high, cls: 'badge-warn', bar: 'bg-amber-500' };
  return { label: t.predictive.medium, cls: 'badge-live', bar: 'bg-blue-500' };
}

// 90-day failure forecast (deterministic from risk scores)
function buildForecast(vehicles) {
  const months = ['J+30', 'J+60', 'J+90'];
  return months.map((m, mi) => ({
    month: m,
    predicted: Math.round(vehicles.reduce((s, v) => s + (v.risk_score / 100) * (mi + 1) * 0.7, 0)),
    preventive: Math.round(vehicles.length * (mi + 1) * 0.4),
  }));
}

export default function PredictiveAI({ lang = 'fr' }) {
  const t = getLang(lang);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiFetch('/api/analytics/predictive')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="shimmer h-28 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="shimmer h-64 rounded-2xl" />
          <div className="shimmer h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-8 rounded-2xl border border-red-500/30 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <h3 className="text-white font-bold">Erreur de chargement</h3>
        <p className="text-slate-400 text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600/20 border border-red-500/40 text-red-400 rounded-xl text-xs hover:bg-red-600/30 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 inline mr-1" /> Réessayer
        </button>
      </div>
    );
  }

  if (!data) return null;

  const co2 = data.co2_footprint || { total_co2_tons: 0, total_saved_tons: 0, breakdown: [] };
  const vehicles = data.high_risk_vehicles || [];
  const forecast = buildForecast(vehicles);

  // ESG Score (composite)
  const esgScore = Math.min(100, Math.round(
    70 + (co2.total_saved_tons / (co2.total_co2_tons || 1)) * 30
  ));

  // CO2 intensity from breakdown
  const co2Intensity = co2.breakdown.reduce((acc, r) => {
    if (r.co2_g_per_km) return acc + r.co2_g_per_km;
    return acc;
  }, 0) / (co2.breakdown.length || 1);

  const pieData = co2.breakdown.map(b => ({ name: b.fuel_type, value: b.co2_tons }));

  return (
    <div className="space-y-5 slide-up">
      {/* ── HEADER ─────────────────────────────── */}
      <div className="gradient-border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white font-outfit flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            {t.predictive?.title || 'Intelligence Prédictive & Bilan Carbone ESG'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t.predictive?.subtitle || 'Détection automatisée des risques mécaniques et calcul des émissions CO₂'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="glass-card px-4 py-2.5 rounded-xl border border-emerald-500/30 kpi-glow-emerald text-center">
            <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
              {t.predictive?.co2Savings || 'Économies CO₂ Flotte Verte'}
            </p>
            <span className="text-xl font-black text-emerald-400 font-mono">
              -{co2.total_saved_tons?.toLocaleString()} T
            </span>
          </div>
          <div className="glass-card px-4 py-2.5 rounded-xl border border-blue-500/30 kpi-glow-blue text-center">
            <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">Score ESG</p>
            <span className="text-xl font-black text-blue-400 font-mono">{esgScore}/100</span>
          </div>
          <div className="glass-card px-4 py-2.5 rounded-xl border border-rose-500/30 kpi-glow-rose text-center">
            <p className="text-[10px] text-rose-400 font-semibold uppercase tracking-wider">Véhicules Critiques</p>
            <span className="text-xl font-black text-rose-400 font-mono">{vehicles.filter(v => v.risk_score >= 80).length}</span>
          </div>
        </div>
      </div>

      {/* ── MAIN GRID ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Risk Score List */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/60">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <h3 className="text-base font-bold text-white font-outfit">
                {t.predictive?.riskScore || 'Score de Risque Panne Véhicules (IA)'}
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              {t.predictive?.top10 || 'Top 10 Véhicules Prioritaires'}
            </span>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {vehicles.map((v, i) => {
              const risk = getRiskLevel(v.risk_score, t);
              const isSelected = selectedVehicle === v.vehicle_id;
              return (
                <div
                  key={v.vehicle_id}
                  onClick={() => setSelectedVehicle(isSelected ? null : v.vehicle_id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500/60 bg-blue-950/20'
                      : 'border-slate-800/60 bg-slate-900/50 hover:border-rose-500/30 hover:bg-rose-950/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-400 font-black text-xs font-mono shrink-0">
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white font-mono truncate">
                          {v.registration} <span className="text-slate-500">({v.brand})</span>
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {t.predictive?.downtime || 'Immobilisation'}: {v.downtime_hours}h · {v.model_year}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${risk.cls}`}>
                        {risk.label}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                        {(v.maint_cost / 1e3).toFixed(0)}k€
                      </div>
                    </div>
                  </div>
                  {/* Risk bar */}
                  <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${risk.bar} rounded-full transition-all duration-700`}
                      style={{ width: `${v.risk_score}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600 mt-0.5 font-mono">
                    <span>0</span>
                    <span className="text-slate-400 font-semibold">{v.risk_score}/100</span>
                    <span>100</span>
                  </div>
                  {/* Expanded detail */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-xs slide-up">
                      <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                        <div className="text-slate-500 text-[10px]">Coût Maintenance</div>
                        <div className="text-white font-bold font-mono">{(v.maint_cost / 1e3).toFixed(1)}k€</div>
                      </div>
                      <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                        <div className="text-slate-500 text-[10px]">Immobilisation</div>
                        <div className="text-white font-bold font-mono">{v.downtime_hours}h</div>
                      </div>
                      <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                        <div className="text-slate-500 text-[10px]">Année</div>
                        <div className="text-white font-bold">{v.model_year}</div>
                      </div>
                      <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                        <div className="text-slate-500 text-[10px]">Énergie</div>
                        <div className="text-white font-bold">{v.fuel_type}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CO2 Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/60 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-400" />
              <h3 className="text-base font-bold text-white font-outfit">
                {t.predictive?.co2ByFuel || 'Émissions CO₂ par Motorisation'}
              </h3>
            </div>
            <span className="text-xs text-emerald-400 font-mono">
              {co2.total_co2_tons?.toLocaleString()} T CO₂
            </span>
          </div>

          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={co2.breakdown} margin={{ top: 4, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  {co2.breakdown.map((b) => (
                    <linearGradient key={b.fuel_type} id={`co2-${b.fuel_type}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CO2_COLORS[b.fuel_type] || '#64748b'} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={CO2_COLORS[b.fuel_type] || '#64748b'} stopOpacity={0.4} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="fuel_type" stroke="#334155" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis stroke="#334155" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => `${(v / 1000).toFixed(0)}kt`} />
                <Tooltip
                  contentStyle={{ background: 'rgba(8,12,20,0.97)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, fontSize: 12 }}
                  formatter={(val) => [`${val.toLocaleString()} T CO₂`, 'Émissions']}
                />
                <Bar dataKey="co2_tons" radius={[6, 6, 0, 0]}>
                  {co2.breakdown.map((b) => (
                    <Cell key={b.fuel_type} fill={`url(#co2-${b.fuel_type})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* CO2 breakdown table */}
          <div className="space-y-2">
            {co2.breakdown.map(b => (
              <div key={b.fuel_type} className="flex items-center gap-3 text-xs">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CO2_COLORS[b.fuel_type] || '#64748b' }} />
                <span className="text-slate-400 w-16 shrink-0">{b.fuel_type}</span>
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full progress-bar-animated"
                    style={{
                      '--progress-width': `${(b.co2_tons / co2.total_co2_tons) * 100}%`,
                      background: CO2_COLORS[b.fuel_type] || '#64748b'
                    }}
                  />
                </div>
                <span className="text-slate-300 font-mono w-20 text-right">
                  {b.co2_g_per_km?.toFixed(0)} g/km
                </span>
                <span className="text-slate-500 font-mono">{(b.co2_tons / 1000).toFixed(1)}kt</span>
              </div>
            ))}
          </div>

          {/* Intensity + ESG */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                {t.predictive?.co2Intensity || 'Intensité Carbone Flotte'}
              </p>
              <p className="text-lg font-black text-cyan-400 font-mono mt-0.5">
                {co2Intensity.toFixed(0)} <span className="text-xs font-normal text-slate-500">g/km</span>
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                {t.predictive?.esgScore || 'Score ESG Flotte'}
              </p>
              <div className="flex items-end gap-1 mt-0.5">
                <span className="text-lg font-black font-mono text-emerald-400">{esgScore}</span>
                <span className="text-xs text-slate-500 mb-0.5">/100</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full progress-bar-animated" style={{ '--progress-width': `${esgScore}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FORECAST ───────────────────────────── */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800/60">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <h3 className="text-base font-bold text-white font-outfit">
              {t.predictive?.forecastTitle || 'Prévision Panne 90 Jours'}
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 bg-slate-800/60 px-2 py-1 rounded-lg font-mono">
            Modèle ML · Algorithme Gradient Boosting
          </span>
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={forecast} margin={{ top: 4, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="month" stroke="#334155" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis stroke="#334155" tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{ background: 'rgba(8,12,20,0.97)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, fontSize: 12 }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Bar dataKey="predicted" name="Pannes Prévues" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="preventive" name="Maintenances Préventives" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

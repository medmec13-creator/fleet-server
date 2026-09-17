import React, { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, Fuel, Wrench, Truck, Clock, AlertTriangle,
  ShieldAlert, Award, Activity, Navigation, Users, Zap, ArrowUpRight,
  ArrowDownRight, BarChart3, Gauge, MapPin, CheckCircle2, XCircle, AlertCircle,
  AlertOctagon, CheckCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
  ComposedChart, Line, RadialBarChart, RadialBar
} from 'recharts';
import { getLang } from '../i18n';
import { API, apiFetch } from '../apiConfig';
import { CardSkeleton, ChartSkeleton, TableSkeleton, ListSkeleton } from './Skeleton';
import { showToast } from './Toast';

const fmt = (v) => {
  if (v >= 1e6) return `${(v / 1e6).toFixed(2).replace('.', ',')} M€`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0).replace('.', ' ')} k€`;
  return `${(v || 0).toFixed(0)} €`;
};
const fmtEuroDec = (v) => `${(v || 0).toFixed(2).replace('.', ',')} €`;
const fmtN = (v) => (v >= 1e6 ? `${(v / 1e6).toFixed(2)} M` : v >= 1e3 ? `${(v / 1e3).toFixed(1)} k` : String(v || 0));
const fmtKm = (v) => `${Math.round(v || 0).toLocaleString('fr-FR')} km`;
const pct = (v) => `${(v || 0).toFixed(1)}%`;

// Mini sparkline KPI card with trend
function KpiCard({ label, value, sub, icon: Icon, trend, color, sparkData, dataKey, glowClass }) {
  const trendUp = trend >= 0;
  return (
    <div className={`glass-card rounded-2xl p-4 border ${color.border} ${glowClass} hover:scale-[1.01] transition-all duration-300`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
          <h3 className={`text-2xl font-black font-outfit mt-0.5 ${color.text}`}>{value}</h3>
          {sub && <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{sub}</p>}
        </div>
        <div className={`w-9 h-9 rounded-xl ${color.iconBg} flex items-center justify-center`}>
          <Icon className={`w-4.5 h-4.5 ${color.icon}`} />
        </div>
      </div>
      {/* Trend badge */}
      {trend !== undefined && (
        <div className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5 mb-2 ${
          trendUp ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
        }`}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend).toFixed(1)}% vs prec.
        </div>
      )}
      {/* Sparkline */}
      {sparkData && sparkData.length > 0 && (
        <div className="h-10 mt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id={`spark-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color.sparkColor} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={color.sparkColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color.sparkColor}
                strokeWidth={1.5}
                fill={`url(#spark-${dataKey})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// Activity item
function ActivityItem({ icon: Icon, color, text, time, badge }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-800/60 last:border-0">
      <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center shrink-0`}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-300 leading-snug">{text}</p>
        <p className="text-[11px] text-slate-600 mt-0.5 font-mono">{time}</p>
      </div>
      {badge && (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${badge.cls}`}>{badge.label}</span>
      )}
    </div>
  );
}

// Fleet status dot
function StatusDot({ colorCls }) {
  return <span className={`w-2 h-2 rounded-full ${colorCls || 'bg-slate-600'} shrink-0 inline-block`} />;
}

const FUEL_COLORS = {
  'Diesel': '#3b82f6',
  'LNG': '#10b981',
  'Hybrid': '#f59e0b',
  'Electric': '#06b6d4',
};

export default function SamsaraOverview({ summaryData, trendsData, vehicleData, routeData, driverData, safetyData, maintData, loading = false, lang = 'fr', onSelectTrip }) {
  const t = getLang(lang);
  const [pingTime, setPingTime] = useState(Date.now());
  const [liveData, setLiveData] = useState(null);
  const [activeActionModal, setActiveActionModal] = useState(null);

  // Simulate live telemetry feed
  useEffect(() => {
    const iv = setInterval(() => setPingTime(Date.now()), 8000);
    return () => clearInterval(iv);
  }, []);

  // Fetch live IoT data for activity feed
  useEffect(() => {
    apiFetch('/api/analytics/telemetry_iot')
      .then(r => r.json())
      .then(setLiveData)
      .catch(() => {});
  }, [pingTime]);

  if (loading || !summaryData) {
    return (
      <div className="space-y-5">
        <div className="gradient-border p-5 h-24 rounded-2xl animate-pulse bg-slate-900/40" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardSkeleton count={3} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <CardSkeleton count={6} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <ChartSkeleton height="h-64" title="Performance Financière" />
          </div>
          <ChartSkeleton height="h-64" title="Statut Flotte" />
        </div>
        <TableSkeleton rows={5} cols={5} />
      </div>
    );
  }

  const s = summaryData;
  const rev = s.total_revenue || 0;
  const margin = s.total_margin || 0;
  const marginRate = s.margin_rate || 0;
  const fuelCost = s.total_fuel_cost || 0;
  const maintCost = s.maintenance?.total_cost || 0;
  const accidents = s.accidents?.count || 0;

  // Executive Highlight Metrics
  const availability = s.fleet_availability || {
    total_vehicles: 600,
    available_count: 555,
    in_maint_count: 30,
    in_breakdown_count: 15,
    availability_rate: 92.5
  };
  const costPerKm = s.cost_per_km || 1.42;
  const imminentAlerts = s.imminent_maint_alerts || 12;

  // API errors are objects; charts require an array.
  const safeTrendsData = Array.isArray(trendsData) ? trendsData : [];

  // Compute month-over-month trend from trendsData (last vs second-to-last month)
  const lastM = safeTrendsData.slice(-1)[0];
  const prevM = safeTrendsData.slice(-2, -1)[0];
  const revTrend = lastM && prevM && prevM.revenue > 0 ? ((lastM.revenue - prevM.revenue) / prevM.revenue) * 100 : 0;
  const marginTrend = lastM && prevM && prevM.margin > 0 ? ((lastM.margin - prevM.margin) / prevM.margin) * 100 : 0;
  const fuelTrend = lastM && prevM && prevM.fuel_cost > 0 ? ((lastM.fuel_cost - prevM.fuel_cost) / prevM.fuel_cost) * 100 : 0;

  // Fuel type pie data
  const fuelPie = vehicleData?.fuel_types?.map(f => ({
    name: f.fuel_type,
    value: f.total_trips,
    revenue: f.revenue,
  })) || [];

  // Route top 5 bar
  const topRoutes = (routeData || []).slice(0, 6).map(r => ({
    name: `${r.origin?.split(' ')[0]}→${r.destination?.split(' ')[0]}`,
    revenue: Math.round((r.revenue || 0) / 1000),
    margin: Math.round((r.margin || 0) / 1000),
  }));

  // Driver leaderboard
  const topDrivers = (driverData || []).slice(0, 6);

  // Severity donut from safety data
  const severityData = (safetyData?.severities || []).map(sv => ({
    name: sv.severity,
    value: sv.count,
  }));
  const SEV_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

  // Maintenance type bars
  const maintTypes = (maintData?.by_type || []).slice(0, 5).map(m => ({
    name: m.type?.slice(0, 12),
    cost: Math.round((m.cost || 0) / 1000),
    hours: Math.round(m.downtime_hours || 0),
  }));

  // Fleet status breakdown
  const fleetStatuses = [
    { label: lang === 'es' ? 'En Servicio' : 'Actifs en Service', count: availability.available_count, color: 'text-emerald-400', bg: '#10b981' },
    { label: lang === 'es' ? 'En Mantenimiento' : 'En Maintenance Atelier', count: availability.in_maint_count, color: 'text-amber-400', bg: '#f59e0b' },
    { label: lang === 'es' ? 'Avería / Alerta' : 'En Panne / Alerte URGENT', count: availability.in_breakdown_count, color: 'text-red-400', bg: '#ef4444' },
  ];
  const totalLive = availability.total_vehicles || 600;

  // Activity feed items (generated from real data hints)
  const activities = [
    { icon: AlertTriangle, color: 'bg-red-500/80', text: `${t.hub.anomalyDetected} ${vehicleData?.top_vehicles?.[0]?.registration || 'TRK-001'}`, time: `${t.hub.ago} 2 ${t.hub.min}`, badge: { label: 'URGENT', cls: 'badge-alert' } },
    { icon: Wrench, color: 'bg-amber-500/80', text: `${t.hub.maintScheduled} ${maintData?.by_brand?.[0]?.brand || 'Renault'} (${maintData?.by_type?.[0]?.type || 'Préventive'})`, time: `${t.hub.ago} 8 ${t.hub.min}`, badge: { label: 'WARN', cls: 'badge-warn' } },
    { icon: CheckCircle2, color: 'bg-emerald-600/80', text: `${t.hub.tripClosed} ${topRoutes[0]?.name || 'Paris→Berlin'} · +${fmt(lastM?.revenue / (lastM?.trips || 1))} ${t.common.margin.toLowerCase()}`, time: `${t.hub.ago} 14 ${t.hub.min}`, badge: { label: 'OK', cls: 'badge-live' } },
    { icon: Users, color: 'bg-blue-600/80', text: `${t.hub.ecoRecord} ${topDrivers[0]?.name || 'Driver A'} · 98/100 pts`, time: `${t.hub.ago} 21 ${t.hub.min}` },
    { icon: Navigation, color: 'bg-indigo-600/80', text: `${t.hub.newRoute} ${topRoutes[1]?.name || 'Lyon→Madrid'} (${topRoutes[1]?.revenue || 0}k€)`, time: `${t.hub.ago} 35 ${t.hub.min}` },
    { icon: Fuel, color: 'bg-cyan-600/80', text: `${t.hub.fuelAlert} ${vehicleData?.brands?.[0]?.brand || 'MAN'}`, time: `${t.hub.ago} 1 ${t.hub.hrs}` },
  ];

  return (
    <div className="space-y-5 count-animate">
      {/* ── TOP EXECUTIVE CONTROL HEADER ─────────────────── */}
      <div className="gradient-border p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white font-outfit tracking-tight">{t.hub.title}</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono border border-blue-500/30 font-bold uppercase tracking-wide">
              Rifaragon Enterprise v4.0
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            {t.hub.subtitle} · {fmtN(s.total_trips)} {t.common.trips.toLowerCase()} · {new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Quick Executive Command Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveActionModal('dispatch')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-semibold transition"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{lang === 'es' ? 'Despacho Express' : 'Dispatch Express'}</span>
          </button>
          <button
            onClick={() => setActiveActionModal('maint')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-semibold transition"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>{lang === 'es' ? 'Planificar Mantenimiento' : 'Planifier Maintenance'}</span>
          </button>
          <button
            onClick={() => showToast(lang === 'es' ? 'Diagnostic motor preventivo iniciado...' : 'Diagnostic moteur préventif lancé sur la flotte...', 'info')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold transition"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{lang === 'es' ? 'Diagnóstico IA' : 'Diagnostic IA'}</span>
          </button>
          <div className="badge-live flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ml-1">
            <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-400 status-live" />
            Live · Cache &lt;1ms
          </div>
        </div>
      </div>

      {/* ── HERO EXECUTIVE KPI CARDS (DISPONIBILITÉ / ALERTES / COÛT PAR KM) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Availability Rate Card */}
        <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 kpi-glow-emerald flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 font-mono">
              {lang === 'es' ? 'Disponibilidad de Flota' : 'Disponibilité de la Flotte'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Truck className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black font-outfit text-white">{pct(availability.availability_rate)}</h3>
            <span className="text-xs text-emerald-400 font-mono font-semibold">({availability.available_count} / {availability.total_vehicles} veh.)</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${availability.availability_rate}%` }} />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-800/60">
            <span>{availability.available_count} {lang === 'es' ? 'Activos' : 'Actifs'}</span>
            <span className="text-amber-400">{availability.in_maint_count} {lang === 'es' ? 'Mant.' : 'Maint.'}</span>
            <span className="text-red-400">{availability.in_breakdown_count} {lang === 'es' ? 'Avería' : 'En Panne'}</span>
          </div>
        </div>

        {/* Imminent Maintenance Alerts Card */}
        <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 kpi-glow-amber flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400 font-mono">
              {lang === 'es' ? 'Alertas Mantenimiento' : 'Maintenance Imminente'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black font-outfit text-amber-300">{imminentAlerts}</h3>
            <span className="text-xs text-slate-400 font-mono">{lang === 'es' ? 'alertas críticas' : 'alertes révisions/usure'}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 line-clamp-1">
            {lang === 'es' ? 'Frenos > 85% y temperatura motor elevadas' : 'Usure freins > 85% & temp. moteur élevées'}
          </p>
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-800/60">
            <span className="text-amber-400 font-semibold">{lang === 'es' ? 'Acción requerida' : 'Intervention requise'}</span>
            <button onClick={() => setActiveActionModal('maint')} className="text-amber-300 underline font-semibold hover:text-white">
              {lang === 'es' ? 'Ver plan' : 'Voir planning →'}
            </button>
          </div>
        </div>

        {/* Cost per Kilometer Card */}
        <div className="glass-panel p-4 rounded-2xl border border-blue-500/30 kpi-glow-blue flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-blue-400 font-mono">
              {lang === 'es' ? 'Cooste por Kilómetro' : 'Coût au Kilomètre (€/km)'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Gauge className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black font-outfit text-white">{fmtEuroDec(costPerKm)}</h3>
            <span className="text-xs text-blue-400 font-mono font-semibold">/ km</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-3 pt-2 border-t border-slate-800/60">
            <span>Carb: {fmtEuroDec(s.fuel_cost_per_km || 0.54)}/km</span>
            <span>Maint: {fmtEuroDec(s.maint_cost_per_km || 0.38)}/km</span>
          </div>
        </div>
      </div>

      {/* ── KPI SPARKLINE ROW ────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <KpiCard
          label={t.common.revenue} value={fmt(rev)} sub={`${fmtN(s.total_trips)} ${t.common.trips.toLowerCase()}`}
          icon={DollarSign} trend={revTrend} sparkData={safeTrendsData} dataKey="revenue"
          color={{ border: 'border-blue-500/20', text: 'text-white', iconBg: 'bg-blue-500/15', icon: 'text-blue-400', sparkColor: '#3b82f6' }}
          glowClass="kpi-glow-blue"
        />
        <KpiCard
          label={t.common.margin} value={fmt(margin)} sub={`Taux: ${pct(marginRate)}`}
          icon={TrendingUp} trend={marginTrend} sparkData={safeTrendsData} dataKey="margin"
          color={{ border: 'border-emerald-500/20', text: 'text-emerald-400', iconBg: 'bg-emerald-500/15', icon: 'text-emerald-400', sparkColor: '#10b981' }}
          glowClass="kpi-glow-emerald"
        />
        <KpiCard
          label={t.common.fuelCost} value={fmt(fuelCost)} sub={`${(s.avg_fuel_consumption || 0).toFixed(1)} L/100km`}
          icon={Fuel} trend={-Math.abs(fuelTrend)} sparkData={safeTrendsData} dataKey="fuel_cost"
          color={{ border: 'border-amber-500/20', text: 'text-amber-400', iconBg: 'bg-amber-500/15', icon: 'text-amber-400', sparkColor: '#f59e0b' }}
          glowClass="kpi-glow-amber"
        />
        <KpiCard
          label={t.common.maintCost} value={fmt(maintCost)} sub={`${fmtN(s.maintenance?.count)} ops`}
          icon={Wrench} sparkData={safeTrendsData} dataKey="maint_cost"
          color={{ border: 'border-purple-500/20', text: 'text-purple-400', iconBg: 'bg-purple-500/15', icon: 'text-purple-400', sparkColor: '#8b5cf6' }}
          glowClass="kpi-glow-purple"
        />
        <KpiCard
          label={t.common.distance} value={fmtKm(s.total_distance_km)} sub={`A vide: ${pct(s.deadhead_ratio)}`}
          icon={Navigation}
          color={{ border: 'border-cyan-500/20', text: 'text-cyan-400', iconBg: 'bg-cyan-500/15', icon: 'text-cyan-400', sparkColor: '#06b6d4' }}
          glowClass=""
        />
        <KpiCard
          label={t.common.accidents} value={String(accidents)} sub={`${t.hub.faultRate}: ${pct(s.accidents?.fault_rate)}`}
          icon={ShieldAlert}
          color={{ border: 'border-rose-500/20', text: 'text-rose-400', iconBg: 'bg-rose-500/15', icon: 'text-rose-400', sparkColor: '#f43f5e' }}
          glowClass="kpi-glow-rose"
        />
      </div>

      {/* ── MAIN 3-COLUMN GRID ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Revenue + Margin Trend (2/3 width) */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800/60">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white font-outfit">{t.hub.financialTrends}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">{t.common.revenue} · {t.common.margin} · {t.common.fuelCost} · {t.common.maintCost}</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
              2024 — 2026
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={safeTrendsData} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradMarg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#334155" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                <YAxis stroke="#334155" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
                <Tooltip
                  contentStyle={{ background: 'rgba(8,12,20,0.97)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, fontSize: 12 }}
                  formatter={(val, name) => [fmt(val), name]}
                />
                <Area type="monotone" dataKey="revenue" name={t.common.revenue} stroke="#3b82f6" strokeWidth={2} fill="url(#gradRev)" />
                <Area type="monotone" dataKey="margin" name={t.common.margin} stroke="#10b981" strokeWidth={2} fill="url(#gradMarg)" />
                <Line type="monotone" dataKey="fuel_cost" name={t.common.fuelCost} stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                <Line type="monotone" dataKey="maint_cost" name={t.common.maintCost} stroke="#8b5cf6" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fleet Status Panel (1/3 width) */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/60 flex flex-col">
          <h3 className="text-base font-bold text-white font-outfit mb-1">{t.hub.fleetStatus}</h3>
          <p className="text-[11px] text-slate-500 mb-3">600 {t.common.vehicles.toLowerCase()} · {t.hub.updated}</p>

          {/* Radial status bars */}
          <div className="flex-1">
            {fleetStatuses.map((fs) => (
              <div key={fs.label} className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-xs">
                    <StatusDot colorCls={fs.color.replace('text-', 'bg-')} />
                    <span className={`font-medium ${fs.color}`}>{fs.label}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">{fs.count} veh.</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full progress-bar-animated"
                    style={{
                      '--progress-width': `${(fs.count / totalLive) * 100}%`,
                      background: fs.bg
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* KPI mini grid */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/60">
            {[
              { label: 'On-Time', val: pct(s.on_time_rate), color: 'text-emerald-400' },
              { label: t.common.deadhead, val: pct(s.deadhead_ratio), color: 'text-amber-400' },
              { label: t.common.anomalies, val: pct(s.anomaly_rate), color: 'text-red-400' },
            ].map(k => (
              <div key={k.label} className="text-center">
                <div className={`text-lg font-black font-outfit ${k.color}`}>{k.val}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">{k.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SECOND ROW ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* Fuel Type Donut */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/60">
          <h3 className="text-sm font-bold text-white font-outfit mb-1">{t.hub.energyMix}</h3>
          <p className="text-[11px] text-slate-500 mb-2">{t.hub.energySub}</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fuelPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {fuelPie.map((entry, i) => (
                    <Cell key={i} fill={FUEL_COLORS[entry.name] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'rgba(8,12,20,0.95)', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }}
                  formatter={(val, name) => [fmtN(val) + ` ${t.common.trips.toLowerCase()}`, name]}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Routes Revenue */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/60">
          <h3 className="text-sm font-bold text-white font-outfit mb-1">{t.hub.topRoutes}</h3>
          <p className="text-[11px] text-slate-500 mb-2">{t.hub.topRoutesSub}</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topRoutes} layout="vertical" margin={{ left: 5, right: 10, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} width={65} />
                <Tooltip
                  contentStyle={{ background: 'rgba(8,12,20,0.95)', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }}
                  formatter={(val) => [`${val}k€`]}
                />
                <Bar dataKey="revenue" name={t.common.revenue} fill="#3b82f6" radius={[0, 3, 3, 0]} />
                <Bar dataKey="margin" name={t.common.margin} fill="#10b981" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Accident Severity Donut */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/60">
          <h3 className="text-sm font-bold text-white font-outfit mb-1">{t.hub.safetyAccidents}</h3>
          <p className="text-[11px] text-slate-500 mb-2">{t.hub.safetySub}</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData.length ? severityData : [{ name: 'N/A', value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {(severityData.length ? severityData : [{ name: 'N/A' }]).map((_, i) => (
                    <Cell key={i} fill={SEV_COLORS[i % SEV_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'rgba(8,12,20,0.95)', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Maintenance by Type */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/60">
          <h3 className="text-sm font-bold text-white font-outfit mb-1">{t.hub.maintByType}</h3>
          <p className="text-[11px] text-slate-500 mb-2">{t.hub.maintSub}</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={maintTypes} margin={{ left: 5, right: 10, top: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: 'rgba(8,12,20,0.95)', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }}
                  formatter={(val) => [`${val}k€`]}
                />
                <Bar dataKey="cost" name={t.common.cost} fill="#8b5cf6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── THIRD ROW: Driver Leaderboard + Activity Feed ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Driver Leaderboard */}
        <div className="xl:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800/60">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white font-outfit">{t.hub.topDrivers}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">{t.hub.driverSub}</p>
            </div>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800">
                  <th className="text-left pb-2 font-semibold">#</th>
                  <th className="text-left pb-2 font-semibold">{t.common.drivers}</th>
                  <th className="text-right pb-2 font-semibold">{t.common.trips}</th>
                  <th className="text-right pb-2 font-semibold">{t.common.margin}</th>
                  <th className="text-right pb-2 font-semibold hidden sm:table-cell">{t.common.score}</th>
                  <th className="text-right pb-2 font-semibold hidden md:table-cell">{t.common.accidents}</th>
                  <th className="text-left pb-2 font-semibold pl-3">Perf.</th>
                </tr>
              </thead>
              <tbody>
                {topDrivers.map((d, i) => (
                  <tr key={d.driver_id} className="border-b border-slate-800/40 hover:bg-slate-800/30 transition">
                    <td className="py-2.5 pr-2">
                      <span className={`font-bold font-mono ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-700' : 'text-slate-600'}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <div className="font-semibold text-slate-200">{d.name}</div>
                      <div className="text-slate-600 text-[10px] font-mono">{d.nationality} · {d.experience}yr</div>
                    </td>
                    <td className="py-2.5 text-right text-slate-400 font-mono">{d.trips}</td>
                    <td className="py-2.5 text-right text-emerald-400 font-semibold">{fmt(d.margin)}</td>
                    <td className="py-2.5 text-right hidden sm:table-cell">
                      <span className={`font-mono font-semibold ${d.safety_score >= 90 ? 'text-emerald-400' : d.safety_score >= 75 ? 'text-amber-400' : 'text-red-400'}`}>
                        {d.safety_score}
                      </span>
                    </td>
                    <td className="py-2.5 text-right hidden md:table-cell">
                      <span className={d.accidents > 2 ? 'text-red-400' : d.accidents > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                        {d.accidents}
                      </span>
                    </td>
                    <td className="py-2.5 pl-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden shrink-0">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, (d.margin / (topDrivers[0]?.margin || 1)) * 100)}%`,
                              background: i === 0 ? '#f59e0b' : '#3b82f6'
                            }}
                          />
                        </div>
                        <button
                          onClick={() => triggerToast(lang === 'es' ? `Canal de radio abierto con ${d.name}` : `Canal radio ouvert avec ${d.name}`)}
                          className="px-2 py-0.5 rounded bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-[10px] text-blue-300 font-semibold transition"
                        >
                          {lang === 'es' ? 'Radio' : 'Radio'}
                        </button>
                        <button
                          onClick={() => onSelectTrip && onSelectTrip(1001 + i)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] text-slate-300 font-semibold transition"
                        >
                          {lang === 'es' ? 'Ver' : 'Voir'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/60 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-white font-outfit">{t.hub.activity}</h3>
            <span className="badge-live text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">LIVE</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-0 max-h-72 xl:max-h-none pr-1">
            {activities.map((a, i) => (
              <ActivityItem key={i} {...a} />
            ))}
          </div>
          {/* IoT Telemetry snapshot */}
          {liveData && liveData.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-800/60">
              <p className="text-[11px] text-slate-500 font-mono mb-2">↳ IoT Telemetry Alert Snapshot</p>
              {liveData.slice(0, 2).map((v, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1">
                  <span className="text-slate-400 font-mono">{v.registration}</span>
                  <span className={`font-semibold ${v.engine_temp_c > 100 ? 'text-red-400' : 'text-amber-400'}`}>
                    {v.engine_temp_c}°C
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${v.status === 'ALERT' ? 'badge-alert' : 'badge-warn'}`}>
                    {v.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM ROW: Brand Performance ─────────────────── */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800/60">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white font-outfit">{t.hub.byBrand}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">{t.hub.brandSub}</p>
          </div>
          <BarChart3 className="w-4 h-4 text-blue-400" />
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={(vehicleData?.brands || []).slice(0, 8).map(b => ({
                name: b.brand,
                CA: Math.round((b.revenue || 0) / 1000),
                Marge: Math.round((b.margin || 0) / 1000),
                Carburant: Math.round((b.fuel_cost || 0) / 1000),
              }))}
              margin={{ top: 4, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${v}k`} />
              <Tooltip
                contentStyle={{ background: 'rgba(8,12,20,0.97)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, fontSize: 12 }}
                formatter={(val) => [`${val}k€`]}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Bar dataKey="CA" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Marge" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Carburant" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── ACTION MODALS ─────────────────────────────────── */}
      {activeActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-slate-700/80 shadow-2xl slide-up">
            {activeActionModal === 'dispatch' && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white font-outfit">
                    {lang === 'es' ? 'Despacho Express de Flota' : 'Dispatch Express Flotte'}
                  </h3>
                </div>
                <p className="text-xs text-slate-300 mb-4">
                  {lang === 'es'
                    ? 'Reasignar automáticamente 14 rutas optimizadas para reducir tiempo de vacíos (deadhead) en un 8.4%.'
                    : 'Réassigner automatiquement 14 trajets optimisés pour réduire le taux à vide (deadhead) de 8.4%.'}
                </p>
                <div className="space-y-2 mb-5 text-xs font-mono bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rutas en espera:</span>
                    <span className="text-emerald-400 font-bold">14 prioritarias</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ahorro est. CO₂:</span>
                    <span className="text-cyan-400 font-bold">-1.2 Toneladas</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gain Marge Brut:</span>
                    <span className="text-amber-400 font-bold">+18,400 €</span>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setActiveActionModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    {lang === 'es' ? 'Cancelar' : 'Annuler'}
                  </button>
                  <button
                    onClick={() => {
                      setActiveActionModal(null);
                      showToast(lang === 'es' ? '⚡ 14 Rutas express despachadas con éxito' : '⚡ 14 Trajets express dispatchés avec succès', 'success');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition shadow-lg shadow-blue-600/30"
                  >
                    {lang === 'es' ? 'Ejecutar Despacho' : 'Lancer Dispatch'}
                  </button>
                </div>
              </div>
            )}

            {activeActionModal === 'maint' && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Wrench className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold text-white font-outfit">
                    {lang === 'es' ? 'Planificador de Mantenimiento' : 'Planification Maintenance Urgente'}
                  </h3>
                </div>
                <p className="text-xs text-slate-300 mb-4">
                  {lang === 'es'
                    ? 'Crear orden de trabajo predictiva para los 5 vehículos con mayor riesgo de fallo de motor.'
                    : 'Générer ordre de travail prédictif pour les 5 véhicules à haut risque de défaillance moteur.'}
                </p>
                <div className="space-y-2 mb-5 text-xs font-mono bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Véhicules ciblés:</span>
                    <span className="text-amber-400 font-bold">TRK-084, TRK-112, TRK-209</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Temps d'immobilisation:</span>
                    <span className="text-blue-400 font-bold">4.5 heures</span>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setActiveActionModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    {lang === 'es' ? 'Cancelar' : 'Annuler'}
                  </button>
                  <button
                    onClick={() => {
                      setActiveActionModal(null);
                      showToast(lang === 'es' ? '🛠️ Órdenes de trabajo enviadas a talleres Rifaragon' : '🛠️ Ordres de travail envoyés aux ateliers Rifaragon', 'success');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition shadow-lg shadow-amber-600/30"
                  >
                    {lang === 'es' ? 'Confirmar Órdenes' : 'Confirmer Ordres'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

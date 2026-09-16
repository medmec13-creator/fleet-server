import React from 'react';
import { DollarSign, TrendingUp, Fuel, Wrench, Truck, Clock, AlertTriangle, ShieldAlert, Award } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getLang } from '../i18n';

export default function ExecutiveOverview({ summaryData, trendsData, vehicleData, routeData, lang = 'fr' }) {
  const t = getLang(lang);

  if (!summaryData) {
    return (
      <div className="p-12 text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-400 font-mono">{t.common.loading}</p>
      </div>
    );
  }

  const formatCurrency = (val) => {
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)} M€`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(0)} k€`;
    return `${val.toFixed(0)} €`;
  };

  const kpis = [
    {
      title: t.common.revenue,
      value: formatCurrency(summaryData.total_revenue),
      subtext: `Distance: ${(summaryData.total_distance_km / 1e6).toFixed(1)}M km`,
      icon: DollarSign,
      color: "from-blue-500/20 to-indigo-500/10",
      iconColor: "text-blue-400",
      borderColor: "border-blue-500/30"
    },
    {
      title: t.common.margin,
      value: formatCurrency(summaryData.total_margin),
      subtext: `${lang === 'es' ? 'Tasa Margen' : 'Taux de Marge'}: ${summaryData.margin_rate}%`,
      icon: TrendingUp,
      color: "from-emerald-500/20 to-teal-500/10",
      iconColor: "text-emerald-400",
      borderColor: "border-emerald-500/30"
    },
    {
      title: t.common.fuelCost,
      value: formatCurrency(summaryData.total_fuel_cost),
      subtext: `${lang === 'es' ? 'Media' : 'Moy'}: ${summaryData.avg_fuel_consumption} L/100km`,
      icon: Fuel,
      color: "from-amber-500/20 to-orange-500/10",
      iconColor: "text-amber-400",
      borderColor: "border-amber-500/30"
    },
    {
      title: t.common.maintCost,
      value: formatCurrency(summaryData.maintenance?.total_cost || 0),
      subtext: `Downtime: ${(summaryData.maintenance?.total_downtime_hours || 0).toLocaleString()} hrs`,
      icon: Wrench,
      color: "from-purple-500/20 to-pink-500/10",
      iconColor: "text-purple-400",
      borderColor: "border-purple-500/30"
    },
    {
      title: lang === 'es' ? 'Volumen de Viajes' : 'Volume de Trajets',
      value: summaryData.total_trips?.toLocaleString(),
      subtext: lang === 'es' ? 'Viajes registrados' : 'Trajets enregistrés',
      icon: Truck,
      color: "from-cyan-500/20 to-blue-500/10",
      iconColor: "text-cyan-400",
      borderColor: "border-cyan-500/30"
    },
    {
      title: lang === 'es' ? 'Entregas a Tiempo' : "Livraisons à l'Heure",
      value: `${summaryData.on_time_rate}%`,
      subtext: `SLA: 90%`,
      icon: Clock,
      color: "from-teal-500/20 to-emerald-500/10",
      iconColor: "text-teal-400",
      borderColor: "border-teal-500/30"
    },
    {
      title: lang === 'es' ? 'Tasa de Anomalías' : "Taux d'Anomalies",
      value: `${summaryData.anomaly_rate}%`,
      subtext: `${((summaryData.total_trips * summaryData.anomaly_rate) / 100).toFixed(0)} ${lang === 'es' ? 'viajes' : 'trajets'}`,
      icon: AlertTriangle,
      color: "from-rose-500/20 to-red-500/10",
      iconColor: "text-rose-400",
      borderColor: "border-rose-500/30"
    },
    {
      title: lang === 'es' ? 'Daños Accidentes' : 'Dommages Accidents',
      value: formatCurrency(summaryData.accidents?.total_damage_cost || 0),
      subtext: `${summaryData.accidents?.count} ${lang === 'es' ? 'casos' : 'cas'}`,
      icon: ShieldAlert,
      color: "from-red-500/20 to-orange-500/10",
      iconColor: "text-red-400",
      borderColor: "border-red-500/30"
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div
              key={index}
              className={`glass-card p-5 rounded-2xl border ${kpi.borderColor} bg-gradient-to-br ${kpi.color} flex items-center justify-between`}
            >
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{kpi.title}</p>
                <h3 className="text-2xl font-extrabold text-white mt-1 font-outfit">{kpi.value}</h3>
                <p className="text-xs text-slate-400 mt-1">{kpi.subtext}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl bg-slate-900/60 border border-slate-700/50 flex items-center justify-center ${kpi.iconColor}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue, Expense & Margin Trend */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white font-outfit">
                {lang === 'es' ? 'Rendimiento Financiero Mensual' : 'Performance Financière Mensuelle'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'es' ? 'Evolución de Facturación, Margen Neto y Combustible' : 'Évolution du Chiffre d\'Affaires, de la Marge Nette et du Coût Carburant'}
              </p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" opacity={0.5} />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1e6).toFixed(1)}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#131c2e', borderColor: '#1e2d4a', borderRadius: '12px', color: '#fff' }}
                  formatter={(value) => [`${(value/1e3).toFixed(1)} k€`, '']}
                />
                <Area type="monotone" dataKey="revenue" name={t.common.revenue} stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="margin" name={t.common.margin} stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorMargin)" />
                <Area type="monotone" dataKey="fuel_cost" name={t.common.fuelCost} stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorFuel)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Brand Margin Breakdown */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white font-outfit mb-1">
              {lang === 'es' ? 'Margen por Marca de Fabricante' : 'Marge par Marque de Constructeur'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {lang === 'es' ? 'Comparativa de las 7 marcas principales' : 'Comparatif des 7 principales marques de tracteurs'}
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleData?.brands || []} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" horizontal={false} opacity={0.5} />
                  <XAxis type="number" stroke="#64748b" tickFormatter={(v) => `${(v/1e6).toFixed(1)}M`} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="brand" stroke="#94a3b8" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#131c2e', borderColor: '#1e2d4a', borderRadius: '12px', color: '#fff' }}
                    formatter={(val) => [`${(val/1e6).toFixed(2)} M€`, t.common.margin]}
                  />
                  <Bar dataKey="margin" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Top Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Profitable Routes */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="text-md font-bold text-white font-outfit">
                {lang === 'es' ? 'Top 5 Rutas Más Rentables' : 'Top 5 Routes les Plus Rentables'}
              </h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">{t.common.routes}</th>
                  <th className="pb-3 font-semibold">{t.common.trips}</th>
                  <th className="pb-3 font-semibold">{t.common.revenue}</th>
                  <th className="pb-3 font-semibold">{t.common.margin}</th>
                  <th className="pb-3 font-semibold">Taux</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {routeData?.slice(0, 5).map((route, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 font-medium text-white flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold flex items-center justify-center">{i+1}</span>
                      <span>{route.origin} ➔ {route.destination}</span>
                    </td>
                    <td className="py-3 text-slate-300 font-mono">{route.total_trips?.toLocaleString()}</td>
                    <td className="py-3 text-slate-300 font-mono">{(route.revenue/1e3).toFixed(0)} k€</td>
                    <td className="py-3 text-emerald-400 font-semibold font-mono">{(route.margin/1e3).toFixed(0)} k€</td>
                    <td className="py-3 text-slate-300 font-mono">{route.margin_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Vehicles ROI */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Truck className="w-5 h-5 text-blue-400" />
              <h3 className="text-md font-bold text-white font-outfit">
                {lang === 'es' ? 'Top Vehículos Eficientes' : 'Top Véhicules Performants'}
              </h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">{lang === 'es' ? 'Matrícula' : 'Immatriculation'}</th>
                  <th className="pb-3 font-semibold">{t.common.brand}</th>
                  <th className="pb-3 font-semibold">{t.common.fuelType}</th>
                  <th className="pb-3 font-semibold">{t.common.trips}</th>
                  <th className="pb-3 font-semibold">{t.common.margin}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {vehicleData?.top_vehicles?.slice(0, 5).map((v, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 font-medium text-white font-mono">{v.registration}</td>
                    <td className="py-3 text-slate-300">{v.brand}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800 text-slate-300 rounded-full border border-slate-700">
                        {v.fuel_type}
                      </span>
                    </td>
                    <td className="py-3 text-slate-300 font-mono">{v.trips?.toLocaleString()}</td>
                    <td className="py-3 text-emerald-400 font-semibold font-mono">{(v.margin/1e3).toFixed(0)} k€</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Fuel, Gauge, Clock, Layers, ArrowUpRight, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getLang } from '../i18n';

export default function FleetOperations({ summaryData, vehicleData, lang = 'fr' }) {
  const t = getLang(lang);

  if (!summaryData) {
    return (
      <div className="p-12 text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-400 font-mono">{t.common.loading}</p>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

  const fuelBreakdown = vehicleData?.fuel_types || [];
  const brandBreakdown = vehicleData?.brands || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-blue-900/30 to-indigo-900/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-white font-outfit">
              {lang === 'es' ? 'Eficiencia Energética & Rendimiento Operativo' : 'Efficacité Énergétique & Performance Opérationnelle'}
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              {lang === 'es'
                ? 'Análisis detallado de consumo de combustible, viajes en vacío y SLAs'
                : 'Analyse détaillée de la consommation de carburant, de l\'optimisation des trajets à vide et des SLA de livraison.'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-700/60 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                {lang === 'es' ? 'Consumo Medio' : 'Consommation Moyenne'}
              </span>
              <span className="text-lg font-bold text-amber-400 font-mono">{summaryData.avg_fuel_consumption} L/100km</span>
            </div>
            <div className="bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-700/60 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">{t.common.deadhead}</span>
              <span className="text-lg font-bold text-cyan-400 font-mono">{summaryData.deadhead_ratio}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fuel Consumption per Brand */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white font-outfit">
                {lang === 'es' ? 'Consumo por Marca (L/100km)' : 'Consommation par Marque (L/100km)'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'es' ? 'Eficiencia media de la flota' : 'Efficacité moyenne constatée sur l\'ensemble de la flotte'}
              </p>
            </div>
            <Fuel className="w-5 h-5 text-amber-400" />
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={brandBreakdown} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" opacity={0.5} />
                <XAxis dataKey="brand" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} domain={[20, 32]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#131c2e', borderColor: '#1e2d4a', borderRadius: '12px', color: '#fff' }}
                  formatter={(val) => [`${val} L/100km`, lang === 'es' ? 'Consumo Medio' : 'Consommation Moy.']}
                />
                <Bar dataKey="avg_consumption" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fuel Type Distribution */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white font-outfit">
                {lang === 'es' ? 'Mix Energético de la Flota' : 'Mix Énergétique de la Flotte'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'es' ? 'Distribución de facturación por motorización' : 'Répartition des revenus par type de motorisation'}
              </p>
            </div>
            <Layers className="w-5 h-5 text-blue-400" />
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fuelBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="revenue"
                  nameKey="fuel_type"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {fuelBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#131c2e', borderColor: '#1e2d4a', borderRadius: '12px', color: '#fff' }}
                  formatter={(val) => [`${(val/1e6).toFixed(1)} M€`, t.common.revenue]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Operational Details Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h3 className="text-lg font-bold text-white font-outfit mb-4">
          {lang === 'es' ? 'Tabla Comparativa de Combustibles & Motorizaciones' : 'Tableau Comparatif des Carburants & Motorisations'}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                <th className="pb-3 font-semibold">{t.common.fuelType}</th>
                <th className="pb-3 font-semibold">{t.common.trips}</th>
                <th className="pb-3 font-semibold">{t.common.revenue}</th>
                <th className="pb-3 font-semibold">{t.common.margin}</th>
                <th className="pb-3 font-semibold">{t.common.fuelCost}</th>
                <th className="pb-3 font-semibold">L/100km</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {fuelBreakdown.map((item, index) => (
                <tr key={index} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 font-medium text-white flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    <span>{item.fuel_type}</span>
                  </td>
                  <td className="py-3 text-slate-300 font-mono">{item.total_trips?.toLocaleString()}</td>
                  <td className="py-3 text-slate-300 font-mono">{(item.revenue/1e6).toFixed(2)} M€</td>
                  <td className="py-3 text-emerald-400 font-semibold font-mono">{(item.margin/1e6).toFixed(2)} M€</td>
                  <td className="py-3 text-amber-400 font-mono">{(item.fuel_cost/1e6).toFixed(2)} M€</td>
                  <td className="py-3 text-slate-300 font-mono">{item.avg_consumption} L/100km</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

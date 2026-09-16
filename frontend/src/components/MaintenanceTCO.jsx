import React from 'react';
import { Wrench, Clock, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getLang } from '../i18n';

export default function MaintenanceTCO({ maintData, summaryData, lang = 'fr' }) {
  const t = getLang(lang);

  if (!maintData) {
    return (
      <div className="p-12 text-center">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-400 font-mono">{t.common.loading}</p>
      </div>
    );
  }

  const typeMap = {
    'preventive': { label: lang === 'es' ? 'Preventiva' : 'Préventive', color: '#10b981' },
    'corrective': { label: lang === 'es' ? 'Correctiva' : 'Corrective', color: '#f59e0b' },
    'emergency': { label: lang === 'es' ? 'Urgencia / Avería' : 'Urgence / Panne', color: '#ef4444' }
  };

  const byTypeFormatted = maintData.by_type?.map(tItem => ({
    ...tItem,
    displayType: typeMap[tItem.type]?.label || tItem.type
  })) || [];

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-purple-500/30 bg-purple-950/20 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase">
              {lang === 'es' ? 'Coste Total Mantenimiento' : 'Coût Total Maintenance'}
            </p>
            <h3 className="text-2xl font-extrabold text-white mt-1 font-outfit">
              {((summaryData?.maintenance?.total_cost || 0) / 1e6).toFixed(2)} M€
            </h3>
            <p className="text-xs text-purple-400 mt-1">
              {summaryData?.maintenance?.count?.toLocaleString()} {lang === 'es' ? 'intervenciones' : 'interventions'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Wrench className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-amber-950/20 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase">
              {lang === 'es' ? 'Tiempo de Inmovilización' : "Temps d'Immobilisation"}
            </p>
            <h3 className="text-2xl font-extrabold text-amber-400 mt-1 font-outfit font-mono">
              {(summaryData?.maintenance?.total_downtime_hours || 0).toLocaleString()} hrs
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'es' ? 'Media' : 'Moy.'} {(summaryData?.maintenance?.total_downtime_hours / (summaryData?.maintenance?.count || 1)).toFixed(1)} hrs / {lang === 'es' ? 'intervención' : 'intervention'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase">
              {lang === 'es' ? 'Mantenimiento Preventivo %' : 'Part Préventive vs Urgence'}
            </p>
            <h3 className="text-2xl font-extrabold text-emerald-400 mt-1 font-outfit">
              {byTypeFormatted.find(tItem => tItem.type === 'preventive') ? 
                `${((byTypeFormatted.find(tItem => tItem.type === 'preventive').count / (summaryData?.maintenance?.count || 1)) * 100).toFixed(0)}%` : '0%'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'es' ? 'Mantenimiento planificado bajo control' : 'Maintenance planifiée sous contrôle'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Type */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white font-outfit">
                {lang === 'es' ? 'Coste por Tipo de Intervención' : 'Coût par Type d\'Intervention'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'es' ? 'Distribución entre Preventivo, Correctivo y Urgencias' : 'Répartition du budget entre Préventif, Correctif et Urgences'}
              </p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byTypeFormatted} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" opacity={0.5} />
                <XAxis dataKey="displayType" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1e6).toFixed(1)}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#131c2e', borderColor: '#1e2d4a', borderRadius: '12px', color: '#fff' }}
                  formatter={(val) => [`${(val/1e6).toFixed(2)} M€`, t.common.maintCost]}
                />
                <Bar dataKey="cost" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Maintenance Cost by Brand */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white font-outfit">
                {lang === 'es' ? 'Coste de Mantenimiento por Marca' : 'Coût de Maintenance par Marque'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'es' ? 'Comparación por fabricante' : 'Comparaison du coût d\'entretien des véhicules'}
              </p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={maintData.by_brand || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" opacity={0.5} />
                <XAxis dataKey="brand" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1e6).toFixed(1)}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#131c2e', borderColor: '#1e2d4a', borderRadius: '12px', color: '#fff' }}
                  formatter={(val) => [`${(val/1e6).toFixed(2)} M€`, t.common.maintCost]}
                />
                <Bar dataKey="cost" fill="#ec4899" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Table by Type */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h3 className="text-lg font-bold text-white font-outfit mb-4">
          {lang === 'es' ? 'Detalle de Intervenciones' : 'Détail des Interventions de Maintenance'}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Type</th>
                <th className="pb-3 font-semibold">{lang === 'es' ? 'Intervenciones' : 'Interventions'}</th>
                <th className="pb-3 font-semibold">{t.common.cost}</th>
                <th className="pb-3 font-semibold">{lang === 'es' ? 'Coste Medio' : 'Coût Moyen'}</th>
                <th className="pb-3 font-semibold">{lang === 'es' ? 'Inmovilización Total' : 'Immobilisation Total'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {byTypeFormatted.map((item, index) => (
                <tr key={index} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 font-medium text-white flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.type === 'preventive' ? '#10b981' : item.type === 'corrective' ? '#f59e0b' : '#ef4444' }}></span>
                    <span className="capitalize">{item.displayType}</span>
                  </td>
                  <td className="py-3 text-slate-300 font-mono">{item.count?.toLocaleString()}</td>
                  <td className="py-3 text-purple-400 font-semibold font-mono">{(item.cost/1e6).toFixed(2)} M€</td>
                  <td className="py-3 text-slate-300 font-mono">{(item.cost / item.count).toFixed(0)} €</td>
                  <td className="py-3 text-amber-400 font-mono">{item.downtime_hours?.toLocaleString()} hrs</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

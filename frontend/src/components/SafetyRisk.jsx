import React from 'react';
import { ShieldAlert, AlertTriangle, UserX, Award, ShieldCheck, HeartPulse } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getLang } from '../i18n';

export default function SafetyRisk({ safetyData, driverData, summaryData, lang = 'fr' }) {
  const t = getLang(lang);

  if (!safetyData || !driverData) {
    return (
      <div className="p-12 text-center">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-400 font-mono">{t.common.loading}</p>
      </div>
    );
  }

  const severityMap = {
    'Minor': { label: lang === 'es' ? 'Menor' : 'Mineur', color: '#f59e0b' },
    'Moderate': { label: lang === 'es' ? 'Moderado' : 'Modéré', color: '#f97316' },
    'Severe': { label: lang === 'es' ? 'Grave' : 'Grave', color: '#ef4444' }
  };

  const severitiesFormatted = safetyData.severities?.map(s => ({
    ...s,
    displayLabel: severityMap[s.severity]?.label || s.severity
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-red-500/30 bg-red-950/20 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase">
              {lang === 'es' ? 'Total Accidentes Registrados' : 'Total Accidents Enregistrés'}
            </p>
            <h3 className="text-2xl font-extrabold text-white mt-1 font-outfit">
              {safetyData.total_accidents?.toLocaleString()}
            </h3>
            <p className="text-xs text-red-400 mt-1">
              {lang === 'es' ? 'En 306 600 viajes (0,39%)' : 'Sur 306 600 trajets (0,39%)'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-orange-500/30 bg-orange-950/20 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase">{t.safety.damageCost}</p>
            <h3 className="text-2xl font-extrabold text-orange-400 mt-1 font-outfit font-mono">
              {((summaryData?.accidents?.total_damage_cost || 0) / 1e6).toFixed(2)} M€
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'es' ? 'Media' : 'Moy.'} {((summaryData?.accidents?.total_damage_cost || 0) / (safetyData.total_accidents || 1)).toFixed(0)} € / {lang === 'es' ? 'accidente' : 'accident'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-amber-950/20 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase">{t.safety.faultRate}</p>
            <h3 className="text-2xl font-extrabold text-amber-400 mt-1 font-outfit">
              {safetyData.overall_fault_rate}%
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'es' ? 'Sensibilización & formación' : 'Sensibilisation & formation requises'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <UserX className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white font-outfit">{t.safety.byGravity}</h3>
              <p className="text-xs text-slate-400">
                {lang === 'es' ? 'Distribución del coste de daños según gravedad' : 'Répartition du coût des dommages selon la sévérité'}
              </p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severitiesFormatted} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" opacity={0.5} />
                <XAxis dataKey="displayLabel" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1e6).toFixed(1)}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#131c2e', borderColor: '#1e2d4a', borderRadius: '12px', color: '#fff' }}
                  formatter={(val) => [`${(val/1e6).toFixed(2)} M€`, t.safety.damageCost]}
                />
                <Bar dataKey="damage_cost" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Safe Drivers Leaderboard */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white font-outfit">
                {lang === 'es' ? 'Mejores Conductores Más Seguros' : 'Top Chauffeurs les Plus Sûrs'}
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              {lang === 'es' ? 'Score de Seguridad Base' : 'Score de Sécurité Base'}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">{t.common.drivers}</th>
                  <th className="pb-3 font-semibold">{lang === 'es' ? 'Experiencia' : 'Expérience'}</th>
                  <th className="pb-3 font-semibold">{t.common.score}</th>
                  <th className="pb-3 font-semibold">{t.common.trips}</th>
                  <th className="pb-3 font-semibold">{t.common.accidents}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {driverData?.slice(0, 6).map((d, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 font-medium text-white">{d.name}</td>
                    <td className="py-2.5 text-slate-300">{d.experience} {lang === 'es' ? 'años' : 'ans'}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-mono">
                        {d.safety_score} / 100
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-300 font-mono">{d.trips}</td>
                    <td className="py-2.5 text-slate-300 font-mono">{d.accidents}</td>
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

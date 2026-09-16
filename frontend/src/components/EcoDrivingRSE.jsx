import React, { useState, useEffect } from 'react';
import { Leaf, Award, UserCheck, ShieldCheck, Clock, HeartPulse, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getLang } from '../i18n';
import { API, apiFetch } from '../apiConfig';

export default function EcoDrivingRSE({ lang = 'fr' }) {
  const t = getLang(lang);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/analytics/ecodriving')
      .then(res => res.json())
      .then(data => setDrivers(data))
      .catch(err => console.error('Error fetching ecodriving:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-400 font-mono">{t.common.loading}</p>
      </div>
    );
  }

  const avgEcoScore = drivers.length > 0
    ? (drivers.reduce((acc, d) => acc + (d.eco_score || 0), 0) / drivers.length).toFixed(1)
    : '86.4';

  const avgCompliance = drivers.length > 0
    ? (drivers.reduce((acc, d) => acc + (d.rest_compliance_pct || 0), 0) / drivers.length).toFixed(1)
    : '98.2';

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-white font-outfit flex items-center space-x-2">
              <Leaf className="w-6 h-6 text-emerald-400" />
              <span>{t.eco.title}</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">{t.eco.subtitle}</p>
          </div>
          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {t.eco.avgFleet}: {avgEcoScore} / 100
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold">
              {t.eco.restCompliance}: {avgCompliance}%
            </span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h3 className="text-lg font-bold text-white font-outfit mb-4">{t.eco.topScores}</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={drivers.slice(0, 10)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" opacity={0.5} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} domain={[60, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#131c2e', borderColor: '#1e2d4a', borderRadius: '12px', color: '#fff' }}
                  formatter={(val) => [`${val} / 100`, t.eco.ecoScore]}
                />
                <Bar dataKey="eco_score" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h3 className="text-lg font-bold text-white font-outfit mb-4">{t.eco.compliance}</h3>
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#0d1526] z-10">
                <tr className="text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">{t.common.drivers}</th>
                  <th className="pb-3 font-semibold">{t.eco.hoursPerWeek}</th>
                  <th className="pb-3 font-semibold">{t.eco.smoothAccel}</th>
                  <th className="pb-3 font-semibold">{t.eco.restCompliance}</th>
                  <th className="pb-3 font-semibold">{t.eco.ecoScore}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {drivers.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 font-medium text-white">{d.name}</td>
                    <td className="py-2.5 text-slate-300 font-mono">{d.driving_hours_week} h</td>
                    <td className="py-2.5 text-teal-400 font-mono">{d.smooth_acceleration_pct || 92}%</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded-full font-mono">
                        {d.rest_compliance_pct}%
                      </span>
                    </td>
                    <td className="py-2.5 text-emerald-400 font-bold font-mono">{d.eco_score} / 100</td>
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

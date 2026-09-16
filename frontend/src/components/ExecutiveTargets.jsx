import React, { useState, useEffect } from 'react';
import { Target } from 'lucide-react';
import { getLang } from '../i18n';
import { API, apiFetch } from '../apiConfig';

export default function ExecutiveTargets({ summaryData, lang = 'fr' }) {
  const t = getLang(lang);
  const [targets, setTargets] = useState(null);

  useEffect(() => {
    apiFetch('/api/analytics/targets')
      .then(res => res.json())
      .then(data => setTargets(data))
      .catch(err => console.error('Error fetching targets:', err));
  }, []);

  if (!summaryData || !targets) {
    return (
      <div className="p-12 text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-400 font-mono">{t.common.loading}</p>
      </div>
    );
  }

  const revAchievement = ((summaryData.total_revenue / targets.target_revenue) * 100).toFixed(1);
  const marginAchievement = ((summaryData.total_margin / targets.target_margin) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-white font-outfit flex items-center space-x-2">
              <Target className="w-6 h-6 text-blue-400" />
              <span>{lang === 'es' ? 'Cuadro de Mando Presupuestario & Objetivos Ejecutivos (Target vs Actual)' : 'Tableau de Bord Budgétaire & Objectifs Exécutifs (Target vs Actual)'}</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              {lang === 'es'
                ? 'Comparación en tiempo real de resultados financieros vs objetivos de gestión.'
                : 'Comparaison temps réel des résultats financiers aux objectifs de gestion 2024-2026.'}
            </p>
          </div>
        </div>
      </div>

      {/* Target Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue Target */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400 uppercase">{t.common.revenue}</span>
            <span className="px-2.5 py-1 text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl font-mono">
              {revAchievement}% {lang === 'es' ? 'Alcanzado' : 'Atteint'}
            </span>
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-2xl font-extrabold text-white font-outfit font-mono">
                {(summaryData.total_revenue / 1e6).toFixed(1)} M€
              </span>
              <span className="text-xs text-slate-400 font-mono">{lang === 'es' ? 'Meta' : 'Cible'}: {(targets.target_revenue / 1e6).toFixed(1)} M€</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, revAchievement)}%` }} />
            </div>
          </div>
        </div>

        {/* Margin Target */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400 uppercase">{t.common.margin}</span>
            <span className="px-2.5 py-1 text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-mono">
              {marginAchievement}% {lang === 'es' ? 'Alcanzado' : 'Atteint'}
            </span>
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-2xl font-extrabold text-emerald-400 font-outfit font-mono">
                {(summaryData.total_margin / 1e6).toFixed(1)} M€
              </span>
              <span className="text-xs text-slate-400 font-mono">{lang === 'es' ? 'Meta' : 'Cible'}: {(targets.target_margin / 1e6).toFixed(1)} M€</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, marginAchievement)}%` }} />
            </div>
          </div>
        </div>

        {/* SLA Target */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400 uppercase">{lang === 'es' ? 'Puntualidad SLA' : 'Objectif Ponctualité SLA'}</span>
            <span className="px-2.5 py-1 text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl font-mono">
              {summaryData.on_time_rate >= targets.target_on_time_pct ? (lang === 'es' ? 'Conforme' : 'Conforme') : (lang === 'es' ? 'Bajo Objetivo' : 'Sous Cible')}
            </span>
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-2xl font-extrabold text-cyan-400 font-outfit font-mono">
                {summaryData.on_time_rate}%
              </span>
              <span className="text-xs text-slate-400 font-mono">{lang === 'es' ? 'Meta' : 'Cible'}: {targets.target_on_time_pct}%</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (summaryData.on_time_rate / targets.target_on_time_pct) * 100)}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Wrench, ShieldAlert, AlertTriangle, Layers, RefreshCw, CheckCircle2, Calendar, Droplets } from 'lucide-react';
import { getLang } from '../i18n';
import { API, apiFetch } from '../apiConfig';

export default function WarehouseRUL({ lang = 'fr' }) {
  const t = getLang(lang);
  const [wearItems, setWearItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduledVehicles, setScheduledVehicles] = useState(new Set());

  useEffect(() => {
    apiFetch('/api/analytics/warehouse_rul')
      .then(res => res.json())
      .then(data => setWearItems(data))
      .catch(err => console.error('Error fetching RUL wear:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleScheduleMaintenance = (reg) => {
    setScheduledVehicles(prev => {
      const next = new Set(prev);
      next.add(reg);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-400 font-mono">{t.common.loading}</p>
      </div>
    );
  }

  const avgRUL = wearItems.length > 0
    ? (wearItems.reduce((acc, item) => acc + item.remaining_useful_life_km, 0) / wearItems.length).toFixed(0)
    : 12450;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-white font-outfit flex items-center space-x-2">
              <Wrench className="w-6 h-6 text-purple-400" />
              <span>{lang === 'es' ? 'Gestión de Piezas & Vida Útil Restante (RUL)' : 'Gestion des Pièces & Durée de Vie Restante (RUL)'}</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              {lang === 'es'
                ? 'Predicción del desgaste mecánico de frenos, neumáticos y aceite con alertas de revisión inminente.'
                : 'Prévision de l\'usure mécanique des freins, pneus et huiles avec alertes de révision imminente.'}
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40 font-semibold">
              {wearItems.length} {lang === 'es' ? 'Vehículos en Alerta Usura' : 'Véhicules en Alerte Usure'}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold">
              RUL {lang === 'es' ? 'Medio' : 'Moyen'}: {Number(avgRUL).toLocaleString()} km
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Alert Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {wearItems.map((item, i) => {
          const isScheduled = scheduledVehicles.has(item.registration);
          const oilLife = item.oil_life_pct || Math.max(10, 100 - item.brake_wear_pct * 0.8);

          return (
            <div key={i} className="glass-card p-5 rounded-xl border border-purple-500/30 bg-slate-900/80 space-y-3.5 hover:border-purple-400/50 transition">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-white text-sm">{item.registration} ({item.brand})</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full">
                  {item.wear_alert}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Brakes */}
                <div>
                  <div className="flex justify-between text-slate-300 text-[11px] mb-1 font-mono">
                    <span>{lang === 'es' ? 'Desgaste Pastillas Freno:' : 'Usure Plaquettes de Frein:'}</span>
                    <span className="font-bold text-rose-400">{item.brake_wear_pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${item.brake_wear_pct}%` }} />
                  </div>
                </div>

                {/* Tires */}
                <div>
                  <div className="flex justify-between text-slate-300 text-[11px] mb-1 font-mono">
                    <span>{lang === 'es' ? 'Desgaste Neumáticos:' : 'Usure Pneumatiques:'}</span>
                    <span className="font-bold text-amber-400">{item.tire_wear_pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${item.tire_wear_pct}%` }} />
                  </div>
                </div>

                {/* Oil Life */}
                <div>
                  <div className="flex justify-between text-slate-300 text-[11px] mb-1 font-mono">
                    <span className="flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-cyan-400" />
                      {lang === 'es' ? 'Vida Útil Aceite Restante:' : 'Durée Vie Huile Restante:'}
                    </span>
                    <span className={`font-bold ${oilLife < 20 ? 'text-rose-400' : 'text-cyan-400'}`}>{oilLife.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${oilLife < 20 ? 'bg-rose-500' : 'bg-cyan-500'}`} style={{ width: `${oilLife}%` }} />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">RUL {lang === 'es' ? 'Estimado:' : 'Estimé :'}</span>
                <span className="font-bold text-cyan-400">{item.remaining_useful_life_km.toLocaleString()} km</span>
              </div>

              <button
                onClick={() => handleScheduleMaintenance(item.registration)}
                disabled={isScheduled}
                className={`w-full mt-2 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  isScheduled
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                    : 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40'
                }`}
              >
                {isScheduled ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{lang === 'es' ? 'Revisión Programada' : 'Révision Planifiée'}</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{lang === 'es' ? 'Planificar Revisión' : 'Planifier Révision'}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

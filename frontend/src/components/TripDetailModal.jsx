import React, { useState, useEffect } from 'react';
import { X, Truck, User, Navigation, DollarSign, Fuel, Wrench, Shield, CheckCircle2, AlertOctagon } from 'lucide-react';
import { getLang } from '../i18n';
import { API, apiFetch } from '../apiConfig';

export default function TripDetailModal({ tripId, onClose, lang = 'fr' }) {
  const t = getLang(lang);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId) return;
    setLoading(true);
    apiFetch(`/api/trip_detail?id=${tripId}`)
      .then(res => res.json())
      .then(data => setDetail(data))
      .catch(err => console.error('Error loading trip detail:', err))
      .finally(() => setLoading(false));
  }, [tripId]);

  if (!tripId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-3xl rounded-2xl border border-blue-500/40 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-blue-950/60 to-indigo-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-white font-mono">{tripId}</h3>
                {detail && (
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                    detail.is_on_time ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  }`}>
                    {detail.is_on_time ? (lang === 'es' ? 'Entregado a tiempo' : "Livré à l'heure") : (lang === 'es' ? 'Retraso SLA' : 'Retard SLA')}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">{lang === 'es' ? 'Ficha Telemétrica & Informe 360° del Viaje' : 'Fiche Télémétrique & Rapport 360° du Trajet'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs">
          {loading || !detail ? (
            <div className="py-12 text-center text-slate-400 font-mono">{t.common.loading}</div>
          ) : (
            <>
              {/* Route & Customer Banner */}
              <div className="glass-card p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">{t.common.routes}</span>
                  <h4 className="text-base font-extrabold text-white mt-0.5">
                    {detail.route.origin} ({detail.route.origin_country}) ➔ {detail.route.destination} ({detail.route.destination_country})
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">Client: <strong className="text-slate-200">{detail.customer.name}</strong> ({detail.customer.industry})</p>
                </div>
                <div className="text-right border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4 font-mono">
                  <span className="text-[10px] text-slate-400 uppercase block">{t.common.distance}</span>
                  <span className="text-lg font-bold text-blue-400">{detail.actual_distance_km} km</span>
                  <span className="text-[10px] text-slate-400 block">{lang === 'es' ? 'Cargado' : 'Chargé'}: {detail.loaded_km} km | {t.common.deadhead}: {detail.empty_km} km</span>
                </div>
              </div>

              {/* Driver & Tractor Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Driver */}
                <div className="glass-card p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center space-x-2 text-indigo-400 font-bold mb-2">
                    <User className="w-4 h-4" />
                    <span>{lang === 'es' ? 'Perfil Conductor' : 'Profil Chauffeur'}</span>
                  </div>
                  <div className="space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nom:</span>
                      <span className="font-semibold text-white">{detail.driver.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Expérience:</span>
                      <span>{detail.driver.experience} {lang === 'es' ? 'años' : 'ans'} ({detail.driver.nationality})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Score Sécurité:</span>
                      <span className="text-emerald-400 font-bold font-mono">{detail.driver.safety_score} / 100</span>
                    </div>
                  </div>
                </div>

                {/* Tractor */}
                <div className="glass-card p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center space-x-2 text-cyan-400 font-bold mb-2">
                    <Truck className="w-4 h-4" />
                    <span>{lang === 'es' ? 'Tractor Rutero' : 'Tracteur Routier'}</span>
                  </div>
                  <div className="space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{lang === 'es' ? 'Matrícula:' : 'Immatriculation:'}</span>
                      <span className="font-mono font-bold text-white">{detail.tractor.registration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t.common.brand} / {t.common.fuelType}:</span>
                      <span>{detail.tractor.brand} ({detail.tractor.fuel_type})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">VIN:</span>
                      <span className="font-mono text-slate-400 text-[10px]">{detail.tractor.vin}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="glass-card p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                  {lang === 'es' ? 'Desglose Financiero del Viaje' : 'Décomposition Financière & P&L du Trajet'}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">{t.common.revenue}</span>
                    <span className="text-sm font-bold text-white">{detail.revenue} €</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">{t.common.fuelCost}</span>
                    <span className="text-sm font-bold text-amber-400">{detail.fuel_cost} €</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">{lang === 'es' ? 'Peajes & Salarios' : 'Péages & Salaire'}</span>
                    <span className="text-sm font-bold text-slate-300">{(detail.toll_cost + detail.driver_cost).toFixed(2)} €</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                    <span className="text-[10px] text-emerald-400 block">{t.common.margin}</span>
                    <span className="text-sm font-bold text-emerald-400">{detail.margin} €</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

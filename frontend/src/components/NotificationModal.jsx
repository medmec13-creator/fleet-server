import React, { useState } from 'react';
import { Bell, X, ShieldAlert, AlertTriangle, Wrench, CheckCircle2, Trash2 } from 'lucide-react';
import { getLang } from '../i18n';

export default function NotificationModal({ isOpen, onClose, lang = 'fr' }) {
  if (!isOpen) return null;
  const t = getLang(lang);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'critical',
      title: lang === 'es' ? 'Alerta de Temperatura Moteur' : 'Alerte Surchauffe Moteur',
      message: lang === 'es' ? 'Vehículo TRK-104 en ruta Lyon-Paris (106°C)' : 'Véhicule TRK-104 en route Lyon-Paris (106°C)',
      time: 'Il y a 3 min',
      unread: true
    },
    {
      id: 2,
      type: 'warning',
      title: lang === 'es' ? 'Presión Baja Neumáticos' : 'Pression Pneus Basse',
      message: lang === 'es' ? 'Vehículo MAN-088 — Pression 88 PSI' : 'Véhicule MAN-088 — Pression 88 PSI',
      time: 'Il y a 12 min',
      unread: true
    },
    {
      id: 3,
      type: 'info',
      title: lang === 'es' ? 'Revisión Planificada' : 'Révision Planifiée',
      message: lang === 'es' ? 'Mantenimiento preventivo completado para Volvo FH16' : 'Maintenance préventive effectuée pour Volvo FH16',
      time: 'Il y a 45 min',
      unread: true
    }
  ]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-16 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-sm rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[500px]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white font-outfit">Notifications & Alertes</h3>
          </div>
          <div className="flex items-center space-x-2">
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                title={lang === 'es' ? 'Borrar todo' : 'Tout effacer'}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-slate-500 font-mono">
              {lang === 'es' ? 'No hay notificaciones' : 'Aucune notification'}
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`p-3 rounded-xl border transition ${
                  n.type === 'critical'
                    ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                    : n.type === 'warning'
                    ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold flex items-center gap-1.5">
                    {n.type === 'critical' ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    ) : n.type === 'warning' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    {n.title}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{n.time}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{n.message}</p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-slate-800 bg-slate-950 text-center">
            <button
              onClick={markAllRead}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition"
            >
              {lang === 'es' ? 'Marcar todo como leído' : 'Tout marquer comme lu'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

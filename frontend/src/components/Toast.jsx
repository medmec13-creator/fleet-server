import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const showToast = (message, type = 'info', duration = 4000) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('toast:notify', {
      detail: { id: Date.now() + Math.random(), message, type, duration }
    }));
  }
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      const toast = e.detail;
      setToasts((prev) => [...prev, toast]);
      if (toast.duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, toast.duration);
      }
    };

    window.addEventListener('toast:notify', handleToast);
    return () => window.removeEventListener('toast:notify', handleToast);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
          error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
          warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
          info: <Info className="w-4 h-4 text-blue-400 shrink-0" />,
        };

        const borderColors = {
          success: 'border-emerald-500/30 bg-slate-900/95 text-emerald-200',
          error: 'border-rose-500/30 bg-slate-900/95 text-rose-200',
          warning: 'border-amber-500/30 bg-slate-900/95 text-amber-200',
          info: 'border-blue-500/30 bg-slate-900/95 text-slate-200',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl text-xs font-medium slide-up ${borderColors[toast.type] || borderColors.info}`}
          >
            <div className="flex items-center gap-2.5">
              {icons[toast.type] || icons.info}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-white transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

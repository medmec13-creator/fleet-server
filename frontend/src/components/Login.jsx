import React, { useState } from 'react';
import { X, Lock, User, Globe } from 'lucide-react';
import { getLang } from '../i18n';
import { apiFetch } from '../apiConfig';

export default function Login({ isOpen, onClose, onSuccess, lang = 'fr' }) {
  if (!isOpen) return null;
  const t = getLang(lang).auth || {};
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [tenant, setTenant] = useState('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password, tenant_id: tenant })
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || `HTTP ${res.status}`);
      }
      const responseData = await res.json();
      const data = responseData?.data || responseData;
      // Expected shape: { access_token, refresh_token?, tenant }
      if (typeof window !== 'undefined' && window.localStorage) {
        if (data.access_token) window.localStorage.setItem('access_token', data.access_token);
        if (data.refresh_token) window.localStorage.setItem('refresh_token', data.refresh_token);
        if (data.tenant) window.localStorage.setItem('tenant_id', data.tenant);
        else window.localStorage.setItem('tenant_id', tenant);
      }
      onSuccess && onSuccess(data);
      onClose && onClose();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-md rounded-2xl border border-indigo-500/20 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{t.title || 'Connexion'}</h3>
              <p className="text-xs text-slate-400">{t.subtitle || 'Authentifiez-vous pour accéder à FleetPulse'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {error && <div className="text-sm text-rose-400 font-mono">{error}</div>}
          <div>
            <label className="text-xs text-slate-400 block mb-1">{t.username || 'Nom d\'utilisateur'}</label>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <input value={username} onChange={(e) => setUsername(e.target.value)} className="flex-1 bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none" />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">{t.password || 'Mot de passe'}</label>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="flex-1 bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none" />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">{t.tenant || 'Tenant / Company ID'}</label>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400" />
              <input value={tenant} onChange={(e) => setTenant(e.target.value)} className="flex-1 bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition">
              {loading ? (t.loggingIn || 'Connexion...') : (t.login || 'Se connecter')}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition">{t.cancel || 'Annuler'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

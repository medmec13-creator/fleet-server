import React, { useState, useEffect } from 'react';
import { FileText, DollarSign, Clock, AlertTriangle, Search, Filter } from 'lucide-react';
import { getLang } from '../i18n';
import { API, apiFetch } from '../apiConfig';

export default function Billing({ lang }) {
  const t = getLang(lang).billing;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    apiFetch('/api/billing')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredInvoices = data?.invoices.filter(i => 
    i.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.country.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatCurrency = (val) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="glass-card p-5 rounded-2xl border border-slate-800/60 shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] -z-10 group-hover:bg-emerald-500/20 transition-all duration-700" />
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-400" />
              {t.title}
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              {t.subtitle}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-xl text-sm font-semibold transition">
              <Filter className="w-4 h-4" /> {getLang(lang).common.filters}
            </button>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800/60 kpi-glow-blue">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 font-semibold text-sm">{t.totalInvoiced}</h3>
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <DollarSign className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {formatCurrency(data?.total_invoiced)}
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800/60 kpi-glow-amber">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 font-semibold text-sm">{t.totalPending}</h3>
            <div className="p-2 bg-amber-500/20 rounded-xl">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {formatCurrency(data?.total_pending)}
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800/60 kpi-glow-emerald">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 font-semibold text-sm">Taux de Recouvrement</h3>
            <div className="p-2 bg-emerald-500/20 rounded-xl">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {(((data?.total_invoiced - data?.total_pending) / data?.total_invoiced) * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="glass-card rounded-2xl border border-slate-800/60 overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-slate-800/60 flex items-center justify-between bg-slate-900/50">
          <h3 className="font-semibold text-white">Factures Clients</h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-blue-500 transition-colors text-white w-64"
            />
          </div>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800/60 uppercase text-[10px] tracking-wider">
                <th className="p-4 font-semibold">{t.customer}</th>
                <th className="p-4 font-semibold">{t.industry} / {t.country}</th>
                <th className="p-4 font-semibold text-right">{t.trips}</th>
                <th className="p-4 font-semibold text-right">{t.invoiced}</th>
                <th className="p-4 font-semibold text-right">{t.pending}</th>
                <th className="p-4 font-semibold text-center">{t.status}</th>
                <th className="p-4 font-semibold text-right">{t.lastInvoice}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredInvoices.map((inv, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-semibold text-white">{inv.customer_name}</td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-slate-300">{inv.industry}</span>
                      <span className="text-xs text-slate-500">{inv.country}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right font-mono text-slate-300">{inv.total_trips.toLocaleString()}</td>
                  <td className="p-4 text-right font-mono text-emerald-400 font-semibold">{formatCurrency(inv.total_invoiced)}</td>
                  <td className="p-4 text-right font-mono text-amber-400 font-semibold">{formatCurrency(inv.pending_amount)}</td>
                  <td className="p-4 text-center">
                    {inv.status === 'payé' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                        {t.statusPaid}
                      </span>
                    )}
                    {inv.status === 'en attente' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/20">
                        {t.statusPending}
                      </span>
                    )}
                    {inv.status === 'en retard' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-rose-500/20 text-rose-400 border border-rose-500/20">
                        <AlertTriangle className="w-3 h-3" /> {t.statusLate}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right text-slate-400 text-xs">{inv.last_invoice_date}</td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">Aucun résultat trouvé</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

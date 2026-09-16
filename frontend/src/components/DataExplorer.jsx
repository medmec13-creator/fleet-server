import React, { useState, useEffect } from 'react';
import { Database, Search, ChevronLeft, ChevronRight, Download, AlertOctagon, CheckCircle2, Eye } from 'lucide-react';
import { getLang } from '../i18n';
import { API, apiFetch } from '../apiConfig';

export default function DataExplorer({ filters, onSelectTrip, lang = 'fr' }) {
  const t = getLang(lang);
  const [trips, setTrips] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const qParams = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        search: search
      });
      if (filters.year) qParams.append('year', filters.year);

      const res = await apiFetch(`/api/trips?${qParams.toString()}`);
      const data = await res.json();
      setTrips(data.data || []);
      setTotalPages(data.total_pages || 1);
      setTotalRecords(data.total_records || 0);
    } catch (err) {
      console.error('Error fetching trips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [page, search, filters.year]);

  const handleExportCSV = () => {
    if (!trips.length) return;
    const headers = [
      "ID Trajet", "Date", "Chauffeur", "Itinéraire", "Immatriculation",
      "Distance (km)", "Coût Carburant (€)", "Revenus (€)", "Marge (€)", "À l'heure", "Anomalie"
    ];
    const rows = trips.map(t => [
      t.trip_id, t.date, `"${t.driver_name}"`, `"${t.route_name}"`, t.tractor_reg,
      t.distance_km, t.fuel_cost, t.revenue, t.margin, t.is_on_time ? 1 : 0, t.is_anomaly ? 1 : 0
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `export_trajets_page_${page}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white font-outfit flex items-center space-x-2">
            <Database className="w-6 h-6 text-blue-400" />
            <span>{lang === 'es' ? 'Explorador Dinámico de Viajes' : 'Explorateur Dynamique de Trajets'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'es'
              ? `Búsqueda global y fichas de telemetría en ${totalRecords.toLocaleString()} registros`
              : `Recherche globale et ouverture de fiches télémétriques dans ${totalRecords.toLocaleString()} enregistrements`}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={lang === 'es' ? "Buscar conductor, ruta, matrícula..." : "Rechercher chauffeur, trajet, plaque..."}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="bg-slate-900/90 border border-slate-700/80 text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2 outline-none focus:border-blue-500 w-64 md:w-80 transition"
            />
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.common.download}</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                <th className="pb-3 font-semibold">ID</th>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">{t.common.drivers}</th>
                <th className="pb-3 font-semibold">{t.common.routes}</th>
                <th className="pb-3 font-semibold">{lang === 'es' ? 'Matrícula' : 'Plaque'}</th>
                <th className="pb-3 font-semibold">Distance</th>
                <th className="pb-3 font-semibold">{t.common.fuelCost}</th>
                <th className="pb-3 font-semibold">{t.common.revenue}</th>
                <th className="pb-3 font-semibold">{t.common.margin}</th>
                <th className="pb-3 font-semibold">Statut SLA</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="11" className="py-8 text-center text-slate-400 font-mono">{t.common.loading}</td>
                </tr>
              ) : trips.map((tItem, index) => (
                <tr key={index} className="hover:bg-slate-800/40 transition cursor-pointer" onClick={() => onSelectTrip(tItem.trip_id)}>
                  <td className="py-3 font-mono font-semibold text-blue-400">
                    <span>{tItem.trip_id}</span>
                  </td>
                  <td className="py-3 text-slate-300 font-mono">{tItem.date}</td>
                  <td className="py-3 font-medium text-white">{tItem.driver_name}</td>
                  <td className="py-3 text-slate-300">{tItem.route_name}</td>
                  <td className="py-3 font-mono text-slate-300">{tItem.tractor_reg}</td>
                  <td className="py-3 text-slate-300 font-mono">{tItem.distance_km} km</td>
                  <td className="py-3 text-amber-400 font-mono">{tItem.fuel_cost} €</td>
                  <td className="py-3 text-slate-300 font-mono">{tItem.revenue} €</td>
                  <td className="py-3 text-emerald-400 font-semibold font-mono">{tItem.margin} €</td>
                  <td className="py-3">
                    <div className="flex items-center space-x-1.5">
                      {tItem.is_on_time ? (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> {t.common.onTime}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full flex items-center">
                          {lang === 'es' ? 'Retraso' : 'Retard'}
                        </span>
                      )}

                      {tItem.is_anomaly && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full flex items-center">
                          <AlertOctagon className="w-3 h-3 mr-1" /> {t.common.anomalies}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectTrip(tItem.trip_id); }}
                      className="p-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg border border-blue-500/30 transition"
                      title={lang === 'es' ? "Ver ficha de telemetría" : "Ouvrir la fiche télémétrique"}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400">
          <div>
            {lang === 'es' ? 'Mostrando' : 'Affichage de'} <span className="text-white font-semibold">{((page-1)*15) + 1}</span> {lang === 'es' ? 'a' : 'à'} <span className="text-white font-semibold">{Math.min(page*15, totalRecords)}</span> {lang === 'es' ? 'de' : 'sur'} <span className="text-white font-semibold">{totalRecords.toLocaleString()}</span> {lang === 'es' ? 'resultados' : 'résultats'}
          </div>

          <div className="flex items-center space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-200">Pág. {page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

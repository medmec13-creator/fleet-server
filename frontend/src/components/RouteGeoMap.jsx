import React, { useState } from 'react';
import { Navigation, Globe, ArrowRight, DollarSign, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RouteGeoMap({ routeData }) {
  const [selectedCountry, setSelectedCountry] = useState('ALL');

  if (!routeData) return <div className="p-8 text-center text-slate-400">Chargement de la cartographie...</div>;

  const filteredRoutes = selectedCountry === 'ALL'
    ? routeData
    : routeData.filter(r => r.origin_country === selectedCountry || r.destination_country === selectedCountry);

  const countryStats = [
    { code: 'ALL', name: 'Toutes les Routes Européennes' },
    { code: 'FR', name: 'France 🇫🇷' },
    { code: 'ES', name: 'Espagne 🇪🇸' },
    { code: 'DE', name: 'Allemagne 🇩🇪' },
    { code: 'IT', name: 'Italie 🇮🇹' },
    { code: 'NL', name: 'Pays-Bas 🇳🇱' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white font-outfit flex items-center space-x-2">
            <Globe className="w-6 h-6 text-blue-400" />
            <span>Réseau Logistique & Cartographie Européenne</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Analyse des axes de transport transfrontaliers et nationaux (150 itinéraires de fret)</p>
        </div>

        {/* Country Selector Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {countryStats.map(c => (
            <button
              key={c.code}
              onClick={() => setSelectedCountry(c.code)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                selectedCountry === c.code
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Route Visualizer Cards */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800">
          <h3 className="text-lg font-bold text-white font-outfit mb-4">Itinéraires Logistiques Clés</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
            {filteredRoutes.slice(0, 12).map((route, i) => (
              <div key={i} className="glass-card p-4 rounded-xl border border-slate-800 hover:border-blue-500/40 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
                    {route.is_international ? 'Transfrontalier' : 'National'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{route.distance_km} km</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm font-bold text-white mb-3">
                  <span className="text-slate-200">{route.origin} ({route.origin_country})</span>
                  <ArrowRight className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-slate-200">{route.destination} ({route.destination_country})</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Trajets</span>
                    <span className="font-mono text-slate-300 font-semibold">{route.total_trips?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Revenus</span>
                    <span className="font-mono text-slate-300 font-semibold">{(route.revenue/1e3).toFixed(0)} k€</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Marge</span>
                    <span className="font-mono text-emerald-400 font-semibold">{(route.margin/1e3).toFixed(0)} k€</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Route Profitability Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white font-outfit mb-1">Marge par Trajet (€/km)</h3>
            <p className="text-xs text-slate-400 mb-4">Top 8 des axes routiers les plus rentables par kilomètre</p>
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredRoutes.slice(0, 8).map(r => ({
                    name: `${r.origin.substring(0, 4)}➔${r.destination.substring(0, 4)}`,
                    marginPerKm: roundTwo(r.margin / (r.distance_km * (r.total_trips || 1)))
                  }))}
                  layout="vertical"
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" horizontal={false} opacity={0.5} />
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} width={70} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#131c2e', borderColor: '#1e2d4a', borderRadius: '12px', color: '#fff' }}
                    formatter={(val) => [`${val} €/km`, 'Rentabilité']}
                  />
                  <Bar dataKey="marginPerKm" fill="#10b981" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function roundTwo(val) {
  return Math.round((val || 0) * 100) / 100;
}

import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Globe, Navigation, ArrowRight, MapPin } from 'lucide-react';
import { getLang } from '../i18n';

// Fix leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Hub Marker Icon
const createHubIcon = (color = '#3b82f6') => {
  return L.divIcon({
    className: 'custom-hub-pin',
    html: `<div style="
      width: 16px; height: 16px; background-color: ${color};
      border: 3px solid #ffffff; border-radius: 50%;
      box-shadow: 0 0 12px ${color};
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

const CITY_COORDS = {
  'Zaragoza': [41.6488, -0.8891],
  'Lyon': [45.7640, 4.8357],
  'Paris': [48.8566, 2.3522],
  'Madrid': [40.4168, -3.7038],
  'Barcelona': [41.3851, 2.1734],
  'Frankfurt': [50.1109, 8.6821],
  'Milan': [45.4642, 9.1900],
  'Amsterdam': [52.3676, 4.9041],
  'Brussels': [50.8503, 4.3517],
  'Marseille': [43.2965, 5.3698],
  'Valencia': [39.4699, -0.3763],
  'Munich': [48.1351, 11.5820],
  'Bordeaux': [44.8378, -0.5792],
  'Lille': [50.6292, 3.0573],
  'Stuttgart': [48.7758, 9.1829]
};

export default function LeafletFleetMap({ routeData, lang = 'fr' }) {
  const t = getLang(lang);
  const [selectedRoute, setSelectedRoute] = useState(null);

  if (!routeData) {
    return (
      <div className="p-12 text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-400 font-mono">{t.common.loading}</p>
      </div>
    );
  }

  // Build route lines for routes where both origin and destination have coordinates
  const polylineRoutes = routeData.map(r => {
    const orig = CITY_COORDS[r.origin];
    const dest = CITY_COORDS[r.destination];
    if (orig && dest) {
      return {
        ...r,
        positions: [orig, dest],
        color: r.is_international ? '#3b82f6' : '#10b981'
      };
    }
    return null;
  }).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white font-outfit flex items-center space-x-2">
            <Globe className="w-6 h-6 text-blue-400" />
            <span>{lang === 'es' ? 'Mapa SIG & Geolocalización de la Red Europea' : 'Carte SIG & Géolocalisation du Réseau Européen'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'es'
              ? 'Superposición de hubs logísticos y trazados interactivos de rutas transfronterizas'
              : 'Superposition des hubs logistiques et tracés interactifs des routes transfrontalières'}
          </p>
        </div>
        <div className="flex items-center space-x-4 text-xs font-medium">
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block shadow-sm shadow-blue-500"></span>
            <span className="text-slate-300">{lang === 'es' ? 'Rutas Transfronterizas' : 'Routes Transfrontalières'}</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500"></span>
            <span className="text-slate-300">{lang === 'es' ? 'Rutas Nacionales' : 'Routes Nationales'}</span>
          </span>
        </div>
      </div>

      {/* Main Map Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-2 rounded-2xl border border-slate-800 overflow-hidden relative min-h-[520px]">
          <MapContainer
            center={[46.2276, 2.2137]}
            zoom={5}
            scrollWheelZoom={true}
            style={{ width: '100%', height: '520px', borderRadius: '16px' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {/* City Markers */}
            {Object.entries(CITY_COORDS).map(([city, coords]) => (
              <Marker key={city} position={coords} icon={createHubIcon('#3b82f6')}>
                <Popup className="custom-leaflet-popup">
                  <div className="p-2 text-xs font-sans text-slate-900">
                    <strong className="text-sm font-bold block">{city}</strong>
                    <span className="text-slate-600 block mt-0.5">Hub Logistique Européen</span>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Route Polylines */}
            {polylineRoutes.map((r, i) => (
              <Polyline
                key={i}
                positions={r.positions}
                pathOptions={{
                  color: r.color,
                  weight: selectedRoute?.route_id === r.route_id ? 5 : 2.5,
                  opacity: selectedRoute?.route_id === r.route_id ? 1 : 0.7,
                  dashArray: r.is_international ? '6, 6' : null
                }}
                eventHandlers={{
                  click: () => setSelectedRoute(r)
                }}
              >
                <Popup>
                  <div className="p-2 text-xs font-sans text-slate-900">
                    <strong className="text-sm font-bold block">{r.origin} ➔ {r.destination}</strong>
                    <div className="mt-1 space-y-0.5 text-slate-700">
                      <div>Distance: <strong>{r.distance_km} km</strong></div>
                      <div>{t.common.trips}: <strong>{r.total_trips?.toLocaleString()}</strong></div>
                      <div>{t.common.margin}: <strong className="text-emerald-700">{(r.margin/1e3).toFixed(0)} k€</strong></div>
                    </div>
                  </div>
                </Popup>
              </Polyline>
            ))}
          </MapContainer>
        </div>

        {/* Route Details Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white font-outfit mb-3">
              {lang === 'es' ? 'Detalle de Ejes Viales' : 'Détail des Axes Routiers'}
            </h3>
            {selectedRoute ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/40">
                  <div className="flex justify-between items-center mb-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
                      {selectedRoute.is_international ? (lang === 'es' ? 'Transfronteriza' : 'Transfrontalier') : (lang === 'es' ? 'Nacional' : 'National')}
                    </span>
                    <span className="font-mono text-slate-400">{selectedRoute.distance_km} km</span>
                  </div>
                  <h4 className="text-base font-extrabold text-white flex items-center space-x-2">
                    <span>{selectedRoute.origin}</span>
                    <ArrowRight className="w-4 h-4 text-blue-400" />
                    <span>{selectedRoute.destination}</span>
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">{t.common.revenue}</span>
                    <span className="text-sm font-bold text-white">{(selectedRoute.revenue/1e3).toFixed(0)} k€</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">{t.common.margin}</span>
                    <span className="text-sm font-bold text-emerald-400">{(selectedRoute.margin/1e3).toFixed(0)} k€</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">{t.common.trips}</span>
                    <span className="text-sm font-bold text-slate-200">{selectedRoute.total_trips?.toLocaleString()}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">{t.common.onTime}</span>
                    <span className="text-sm font-bold text-cyan-400">{selectedRoute.on_time_rate}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                <MapPin className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <span>
                  {lang === 'es'
                    ? 'Haga clic en cualquier ruta del mapa para ver sus métricas.'
                    : 'Cliquez sur n\'importe quel itinéraire sur la carte pour afficher ses métriques télémétriques.'}
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800">
            <span className="text-[11px] text-slate-500">Flux connectés sur la cartographie SIG OpenStreetMap / CARTO</span>
          </div>
        </div>
      </div>
    </div>
  );
}

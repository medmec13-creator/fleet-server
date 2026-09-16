import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import SamsaraOverview from './components/SamsaraOverview';
import FilterBar from './components/FilterBar';
import ExecutiveOverview from './components/ExecutiveOverview';
import FleetOperations from './components/FleetOperations';
import MaintenanceTCO from './components/MaintenanceTCO';
import SafetyRisk from './components/SafetyRisk';
import LeafletFleetMap from './components/LeafletFleetMap';
import PredictiveAI from './components/PredictiveAI';
import WhatIfSimulator from './components/WhatIfSimulator';
import DataExplorer from './components/DataExplorer';
import GeminiChatModal from './components/GeminiChatModal';
import TripDetailModal from './components/TripDetailModal';
import Billing from './components/Billing';
import IoTTelemetrySensors from './components/IoTTelemetrySensors';
import EcoDrivingRSE from './components/EcoDrivingRSE';
import WarehouseRUL from './components/WarehouseRUL';
import ExecutiveTargets from './components/ExecutiveTargets';
import UserGuideModal from './components/UserGuideModal';
import NotificationModal from './components/NotificationModal';
import { MessageCircle, SlidersHorizontal, X, Bell, ChevronDown, Globe, Sun, Moon, BookOpen, Download, AlertOctagon, Zap, ShieldAlert, Menu } from 'lucide-react';
import { getLang } from './i18n';
import { API, apiFetch, getAuthToken } from './apiConfig';
import Login from './components/Login';
export default function App() {
  const [activeTab, setActiveTab] = useState('hub');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(!getAuthToken());
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getAuthToken()));
  const [currentUser, setCurrentUser] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [lang, setLang] = useState('fr');
  const [theme, setTheme] = useState('dark');
  const [notifCount] = useState(3);

  const t = getLang(lang);

  const [filters, setFilters] = useState({
    year: '', brand: '', fuel_type: '', vehicle_class: '', anomaly: ''
  });

  const [filterOptions, setFilterOptions] = useState({});
  const [summaryData, setSummaryData] = useState(null);
  const [trendsData, setTrendsData] = useState([]);
  const [vehicleData, setVehicleData] = useState(null);
  const [driverData, setDriverData] = useState([]);
  const [routeData, setRouteData] = useState([]);
  const [maintData, setMaintData] = useState(null);
  const [safetyData, setSafetyData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load filter options once
    useEffect(() => {
      apiFetch('/api/filter_options')
        .then(r => r.json())
        .then(setFilterOptions)
        .catch(console.error);
  }, []);

  // Fetch all analytics with progressive non-blocking rendering
  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    const params = new URLSearchParams();
    if (filters.year) params.set('year', filters.year);
    if (filters.brand) params.set('brand', filters.brand);
    if (filters.fuel_type) params.set('fuel_type', filters.fuel_type);
    if (filters.vehicle_class) params.set('vehicle_class', filters.vehicle_class);
    if (filters.anomaly) params.set('anomaly', filters.anomaly);
    const qs = params.toString() ? `?${params}` : '';

    const readJson = async (path) => {
      const response = await apiFetch(path);
      if (!response.ok) throw new Error(`API ${response.status}`);
      return response.json();
    };

    // Render the executive shell as soon as the two essential aggregates arrive.
    try {
      const [summary, trends] = await Promise.all([
        readJson(`/api/summary${qs}`),
        readJson(`/api/analytics/trends${qs}`),
      ]);
      if (summary && !summary.error) setSummaryData(summary);
      if (Array.isArray(trends)) setTrendsData(trends);
    } catch (error) {
      console.error(error);
      return;
    }

    // Defer expensive breakdowns so the first viewport is immediately usable.
    const detailRequests = [
      [`${API}/api/analytics/vehicles${qs}`, setVehicleData],
      [`${API}/api/analytics/drivers${qs}`, setDriverData],
      [`${API}/api/analytics/routes${qs}`, setRouteData],
      [`${API}/api/analytics/maintenance${qs}`, setMaintData],
      [`${API}/api/analytics/safety${qs}`, setSafetyData],
    ];
    for (const [path, setter] of detailRequests) {
      try {
        const data = await readJson(path);
        if (!data?.error) setter(data);
      } catch (error) {
        console.error(error);
      }
    }
  }, [filters, isAuthenticated]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetFilters = () => setFilters({ year: '', brand: '', fuel_type: '', vehicle_class: '', anomaly: '' });
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const currentTabLabel = t.nav[activeTab] || activeTab;

  // Export executive summary report CSV
  const handleExportExecutiveReport = () => {
    if (!summaryData) return;
    const reportData = [
      ["Metric", "Valeur"],
      ["Chiffre d'Affaires", summaryData.total_revenue],
      ["Marge Nette", summaryData.total_margin],
      ["Taux de Marge (%)", summaryData.margin_rate],
      ["Coût Carburant", summaryData.total_fuel_cost],
      ["Trajets Totaux", summaryData.total_trips],
      ["Taux On-Time SLA (%)", summaryData.on_time_rate],
      ["Taux Anomalies (%)", summaryData.anomaly_rate],
      ["Coût Maintenance", summaryData.maintenance?.total_cost || 0],
      ["Coût Dommages Accidents", summaryData.accidents?.total_damage_cost || 0]
    ];

    const csvContent = "data:text/csv;charset=utf-8," + reportData.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rapport_Executive_FleetPulse_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenLogin = () => setIsLoginOpen(true);
  const handleLoginSuccess = (data) => {
    setIsAuthenticated(Boolean(data && data.access_token));
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('access_token');
      window.localStorage.removeItem('refresh_token');
      window.localStorage.removeItem('tenant_id');
    }
    setIsAuthenticated(false);
  };

  // react to silent-refresh logout events
  useEffect(() => {
    const onLoggedOut = () => {
      setIsAuthenticated(false);
      setIsLoginOpen(true);
    };
    window.addEventListener('auth:logged_out', onLoggedOut);
    return () => window.removeEventListener('auth:logged_out', onLoggedOut);
  }, []);

  // fetch current user when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentUser(null);
      return;
    }
    apiFetch('/api/auth/me')
      .then(r => r.json())
      .then(d => setCurrentUser(d && d.data ? d.data : null))
      .catch(() => setCurrentUser(null));
  }, [isAuthenticated]);

  return (
    <div className={`mesh-bg min-h-screen flex font-sans text-slate-100 selection:bg-blue-500/30 ${theme === 'light' ? 'theme-light' : ''}`}>
      {/* ===== SIDEBAR ===== */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        lang={lang}
        onOpenGuide={() => setIsGuideOpen(true)}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ===== TOP HEADER BAR ===== */}
        <header className="glass-panel sticky top-0 z-30 h-14 flex items-center px-3 sm:px-5 gap-2 sm:gap-3 border-b border-slate-800/60">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white md:hidden border border-slate-700/80 transition"
            title="Menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <span className="text-slate-500 text-xs font-mono hidden sm:inline">FleetPulse</span>
            <ChevronDown className="w-3 h-3 text-slate-600 -rotate-90 hidden sm:inline" />
            <span className="text-slate-200 font-semibold text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{currentTabLabel}</span>
          </div>

          <div className="flex-1" />

          {/* Executive Export Button */}
          <button
            onClick={handleExportExecutiveReport}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition"
            title={lang === 'es' ? 'Exportar Informe Ejecutivo CSV' : 'Exporter Rapport Exécutif CSV'}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Rapport Exécutif</span>
          </button>

          {/* Quick Critical Alert Jump */}
          <button
            onClick={() => { setFilters(prev => ({ ...prev, anomaly: '1' })); setIsFilterOpen(true); }}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-semibold transition"
            title={lang === 'es' ? 'Filtrar Anomalías Criticas' : 'Filtrer Anomalies Critiques'}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Alertes (1.2%)</span>
          </button>

          {/* Live Status Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full badge-live text-xs font-mono">
            <span className="relative inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 status-live" />
            {t.common.live}
          </div>

          {/* User Guide / Manual Button */}
          <button
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-xs font-bold text-slate-200 transition"
            title={lang === 'es' ? 'Guía de Uso & Manuel' : 'Mode d\'Emploi & Manuel'}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline font-mono">{lang === 'es' ? 'Manual' : 'Guide'}</span>
          </button>

          {/* Theme Switcher Toggle (Dark / Light) */}
          <button
            onClick={() => setTheme(th => (th === 'dark' ? 'light' : 'dark'))}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-xs font-bold text-slate-200 transition"
            title={theme === 'dark' ? 'Passer en Mode Lumière' : 'Passer en Mode Sombre'}
          >
            {theme === 'dark' ? (
              <>
                <Moon className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline font-mono">Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline font-mono">Light</span>
              </>
            )}
          </button>

          {/* Language Switcher Button (FR / ES) */}
          <button
            onClick={() => setLang(l => (l === 'fr' ? 'es' : 'fr'))}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-xs font-bold text-slate-200 transition"
            title={lang === 'fr' ? 'Cambiar a Español' : 'Passer en Français'}
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono">{lang === 'fr' ? '🇫🇷 FR' : '🇪🇸 ES'}</span>
          </button>

          {/* Filter Toggle */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${activeFilterCount > 0 || isFilterOpen
                ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.common.filters}</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Notifications */}
          <button
            onClick={() => setIsNotifOpen(true)}
            className="relative p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-slate-200 transition"
            title="Notifications & Alertes"
          >
            <Bell className="w-4 h-4" />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                {notifCount}
              </span>
            )}
          </button>

          {/* AI Chat */}
          <button
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:scale-105 transition-all"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">IA Chat</span>
          </button>

          {/* Login / Logout */}
          {!isAuthenticated ? (
            <button onClick={handleOpenLogin} className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-200 font-semibold border border-slate-700/60">Login</button>
          ) : (
            <div className="flex items-center gap-2">
              {currentUser && (
                <div className="text-xs font-mono text-slate-300 px-2 py-1 rounded-xl bg-slate-800/40 border border-slate-700/40">
                  {currentUser.email} · {currentUser.role}
                </div>
              )}
              <button onClick={handleLogout} className="px-3 py-1.5 rounded-xl bg-rose-700/10 hover:bg-rose-700/20 text-xs text-rose-300 font-semibold border border-rose-700/20">Logout</button>
            </div>
          )}
        </header>

        {/* ===== FILTER DRAWER ===== */}
        {isFilterOpen && (
          <div className="glass-panel border-b border-slate-800/60 px-5 py-3 slide-up flex items-center gap-3 flex-wrap">
            <FilterBar
              filters={filters}
              setFilters={setFilters}
              filterOptions={filterOptions}
              onReset={resetFilters}
              inline={true}
              lang={lang}
            />
            <button
              onClick={() => setIsFilterOpen(false)}
              className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ===== MAIN SCROLL AREA ===== */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-5 space-y-1 slide-up" key={activeTab}>
            {/* Hub - Samsara High-Density Executive View */}
            {activeTab === 'hub' && (
              <SamsaraOverview
                summaryData={summaryData}
                trendsData={trendsData}
                vehicleData={vehicleData}
                routeData={routeData}
                driverData={driverData}
                safetyData={safetyData}
                maintData={maintData}
                lang={lang}
                onSelectTrip={(id) => setSelectedTripId(id)}
              />
            )}

            {activeTab === 'overview' && (
              <ExecutiveOverview
                summaryData={summaryData}
                trendsData={trendsData}
                vehicleData={vehicleData}
                routeData={routeData}
                lang={lang}
              />
            )}

            {activeTab === 'targets' && <ExecutiveTargets summaryData={summaryData} lang={lang} />}

            {activeTab === 'ops' && (
              <FleetOperations summaryData={summaryData} vehicleData={vehicleData} lang={lang} />
            )}

            {activeTab === 'billing' && <Billing lang={lang} />}

            {activeTab === 'iot' && <IoTTelemetrySensors lang={lang} />}

            {activeTab === 'ecodriving' && <EcoDrivingRSE lang={lang} />}

            {activeTab === 'maint' && (
              <MaintenanceTCO maintData={maintData} summaryData={summaryData} lang={lang} />
            )}

            {activeTab === 'rul' && <WarehouseRUL lang={lang} />}

            {activeTab === 'safety' && (
              <SafetyRisk safetyData={safetyData} driverData={driverData} summaryData={summaryData} lang={lang} />
            )}

            {activeTab === 'routes' && <LeafletFleetMap routeData={routeData} lang={lang} />}

            {activeTab === 'predictive' && <PredictiveAI lang={lang} />}

            {activeTab === 'simulator' && <WhatIfSimulator lang={lang} />}

            {activeTab === 'explorer' && (
              <DataExplorer filters={filters} onSelectTrip={(id) => setSelectedTripId(id)} lang={lang} />
            )}
          </div>
        </main>

        {/* ===== FOOTER ===== */}
        <footer className="border-t border-slate-800/50 px-5 py-2.5 flex items-center justify-between text-[11px] text-slate-600 font-mono bg-[#080c14]/80">
          <span>RifaragonPulse v4.0 © 2026 · Fleet Intelligence Platform</span>
          <div className="flex items-center gap-3">
            <span className="text-emerald-600">● Cache &lt;1ms</span>
            <span>306 600 {lang === 'es' ? 'Viajes' : 'Trajets'} · 600 {lang === 'es' ? 'Vehículos' : 'Véhicules'} · 650 {lang === 'es' ? 'Conductores' : 'Chauffeurs'}</span>
          </div>
        </footer>
      </div>

      {/* ===== MODALS ===== */}
      <GeminiChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} lang={lang} />
      <TripDetailModal tripId={selectedTripId} onClose={() => setSelectedTripId(null)} lang={lang} />
      <UserGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} lang={lang} />
      <NotificationModal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} lang={lang} />
      <Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onSuccess={handleLoginSuccess} lang={lang} />
    </div>
  );
}

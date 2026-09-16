import React from 'react';
import {
  Truck, Activity, Target, Radio, Leaf, Wrench, Layers, Shield,
  Navigation, Cpu, Sliders, Database, ChevronLeft, ChevronRight,
  LayoutDashboard, BookOpen, FileText
} from 'lucide-react';
import { getLang } from '../i18n';

const NAV_CONFIG = [
  { id: 'hub', icon: LayoutDashboard, sectionKey: null },
  { id: 'overview', icon: Activity, sectionKey: 'analytics' },
  { id: 'targets', icon: Target, sectionKey: null },
  { id: 'ops', icon: Truck, sectionKey: 'ops' },
  { id: 'billing', icon: FileText, sectionKey: 'finance' },
  { id: 'iot', icon: Radio, sectionKey: null },
  { id: 'ecodriving', icon: Leaf, sectionKey: null },
  { id: 'maint', icon: Wrench, sectionKey: 'health' },
  { id: 'rul', icon: Layers, sectionKey: null },
  { id: 'safety', icon: Shield, sectionKey: null },
  { id: 'routes', icon: Navigation, sectionKey: 'intel' },
  { id: 'predictive', icon: Cpu, sectionKey: null },
  { id: 'simulator', icon: Sliders, sectionKey: null },
  { id: 'explorer', icon: Database, sectionKey: 'data' },
];

export default function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed, lang = 'fr', onOpenGuide, mobileOpen, setMobileOpen }) {
  const t = getLang(lang);
  let lastSection = null;

  const sectionLabels = {
    analytics: lang === 'es' ? 'Análisis' : 'Analyses',
    ops: lang === 'es' ? 'Operaciones' : 'Opérations',
    finance: lang === 'es' ? 'Finanzas' : 'Finances',
    health: lang === 'es' ? 'Salud & Mantenimiento' : 'Santé & Maintenance',
    intel: lang === 'es' ? 'Inteligencia' : 'Intelligence',
    data: lang === 'es' ? 'Datos' : 'Données',
  };

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen && setMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <aside
        className={`
          fixed md:sticky top-0 h-screen flex flex-col bg-[#070b12] border-r border-slate-800/60
          transition-all duration-300 ease-in-out z-50 md:z-40 shrink-0
          ${mobileOpen ? 'left-0 w-[240px]' : '-left-full md:left-0'}
          ${collapsed ? 'md:w-[60px]' : 'md:w-[220px]'}
        `}
        style={{ boxShadow: '4px 0 24px rgba(0,0,0,0.4)' }}
      >
      {/* ── BRAND HEADER ── */}
      <div className={`flex items-center h-14 border-b border-slate-800/60 px-3 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <button onClick={() => setActiveTab('hub')} className="flex items-center gap-2.5 overflow-hidden text-left">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-black tracking-tight text-white font-outfit leading-none">
                Rifaragon<span className="text-blue-400">Pulse</span>
              </h1>
              <span className="text-[9px] text-slate-500 font-mono tracking-wider">v4.0 ULTRA</span>
            </div>
          </button>
        )}
        {collapsed && (
          <button onClick={() => setActiveTab('hub')} className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Truck className="w-4 h-4 text-white" />
          </button>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-slate-800/60 transition shrink-0"
            title="Réduire"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── COLLAPSE EXPAND BUTTON (when collapsed) ── */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center justify-center py-2 text-slate-600 hover:text-slate-300 transition"
          title="Agrandir"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* ── NAV ITEMS ── */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {NAV_CONFIG.map((item) => {
          const Icon = item.icon;
          const label = t.nav[item.id] || item.id;
          const isActive = activeTab === item.id;
          const sectionTitle = item.sectionKey ? sectionLabels[item.sectionKey] : null;
          const showSection = !collapsed && sectionTitle && sectionTitle !== lastSection;
          if (sectionTitle) lastSection = sectionTitle;

          return (
            <React.Fragment key={item.id}>
              {showSection && (
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 px-3 pt-3 pb-1">
                  {sectionTitle}
                </p>
              )}
              <button
                onClick={() => handleNavClick(item.id)}
                title={collapsed ? label : undefined}
                className={`
                  sidebar-active-item w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium
                  transition-all duration-200 group relative
                  ${isActive
                    ? 'bg-blue-600/20 text-blue-300 font-semibold'
                    : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
              >
                {/* Active left indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-r-full" />
                )}
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400'} transition-colors`} />
                {!collapsed && (
                  <span className="truncate leading-none">{label}</span>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {/* ── STATUS FOOTER & GUIDE BUTTON ── */}
      {!collapsed ? (
        <div className="p-3 border-t border-slate-800/60 space-y-2">
          <button
            onClick={onOpenGuide}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 rounded-xl text-xs font-semibold transition"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{lang === 'es' ? 'Guía de Uso' : 'Mode d\'emploi'}</span>
          </button>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-600 pt-1">
            <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
            </span>
            <span>{lang === 'es' ? 'Sistema Operativo' : 'Système opérationnel'}</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center py-2 space-y-2 border-t border-slate-800/60">
          <button
            onClick={onOpenGuide}
            className="p-2 text-indigo-400 hover:bg-slate-800 rounded-xl transition"
            title={lang === 'es' ? 'Guía de Uso' : 'Mode d\'emploi'}
          >
            <BookOpen className="w-4 h-4" />
          </button>
          <span className="relative w-2 h-2 rounded-full bg-emerald-500">
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
          </span>
        </div>
      )}
    </aside>
  </>
  );
}

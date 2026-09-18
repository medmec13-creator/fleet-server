import React, { useState, useEffect } from 'react';
import { Truck, Shield, Wrench, Navigation, Activity, Sliders, Database, MessageSquare, Cpu, Printer, Radio, Leaf, Target, Layers } from 'lucide-react';
import rifAragonLogo from '../assets/rif_aragon_logo.png';

export default function Navbar({ activeTab, setActiveTab, onOpenChat, onPrintReport }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { id: 'overview', label: 'Vue Synthétique', icon: Activity },
    { id: 'targets', label: 'Objectifs Budgets', icon: Target },
    { id: 'ops', label: 'Opérations', icon: Truck },
    { id: 'iot', label: 'Capteurs IoT', icon: Radio },
    { id: 'ecodriving', label: 'Éco-Conduite RSE', icon: Leaf },
    { id: 'maint', label: 'Maintenance', icon: Wrench },
    { id: 'rul', label: 'Usure RUL & Pièces', icon: Layers },
    { id: 'safety', label: 'Sécurité & Risques', icon: Shield },
    { id: 'routes', label: 'Carte SIG & Routes', icon: Navigation },
    { id: 'predictive', label: 'IA & Prédictif / CO₂', icon: Cpu },
    { id: 'simulator', label: 'Simulateur Financial', icon: Sliders },
    { id: 'explorer', label: 'Explorateur Données', icon: Database },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={rifAragonLogo} alt="Rif Aragon" className="w-10 h-10 object-contain shrink-0" />

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-extrabold tracking-tight text-white font-outfit">
                  Rifaragon<span className="text-blue-500">Pulse</span> <span className="text-indigo-400">AI</span>
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-mono">
                  v3.0 Ultimate Seed
                </span>
              </div>
              <p className="text-xs text-slate-400">Plateforme Analytique, IoT & Intelligence de Flotte</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:hidden">
            <button
              onClick={onPrintReport}
              className="p-2 bg-slate-800 text-slate-200 rounded-lg text-xs"
              title="Imprimer / Export PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button 
              onClick={onOpenChat}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition"
            >
              <MessageSquare className="w-4 h-4" />
              <span>AI Chat</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="hidden md:flex items-center space-x-2.5">
          <button
            onClick={onPrintReport}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition"
            title="Imprimer / Exporter le Rapport PDF Exécutif"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Rapport PDF</span>
          </button>

          <button 
            onClick={onOpenChat}
            className="flex items-center space-x-2 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-medium shadow-md shadow-indigo-500/20 transition-all hover:scale-105"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Assistant AI</span>
          </button>

          <div className="text-right border-l border-slate-800 pl-3">
            <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Enriched Seeds</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">{time}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

import React, { useState, useEffect } from 'react';
import { Sliders, TrendingUp, TrendingDown, DollarSign, Fuel, Users, Wrench, RefreshCw, Download } from 'lucide-react';
import { getLang } from '../i18n';
import { API, apiFetch } from '../apiConfig';

export default function WhatIfSimulator({ lang = 'fr' }) {
  const t = getLang(lang);
  const [fuelChange, setFuelChange] = useState(0);
  const [wageChange, setWageChange] = useState(0);
  const [maintChange, setMaintChange] = useState(0);
  const [revenueChange, setRevenueChange] = useState(0);
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSimulation = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/simulate', {
        method: 'POST',
        body: JSON.stringify({
          fuel_change_pct: fuelChange,
          wage_change_pct: wageChange,
          maint_change_pct: maintChange,
          revenue_change_pct: revenueChange
        })
      });
      const data = await res.json();
      setSimulationResult(data);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSimulation();
  }, [fuelChange, wageChange, maintChange, revenueChange]);

  const handleReset = () => {
    setFuelChange(0);
    setWageChange(0);
    setMaintChange(0);
    setRevenueChange(0);
  };

  const handleExport = () => {
    if (!simulationResult) return;
    const report = {
      timestamp: new Date().toISOString(),
      parameters: { fuelChange, wageChange, maintChange, revenueChange },
      result: simulationResult
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulation_what_if_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-blue-950/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-white font-outfit flex items-center space-x-2">
              <Sliders className="w-6 h-6 text-indigo-400" />
              <span>{t.simulator.title}</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">{t.simulator.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={!simulationResult}
              className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold rounded-xl border border-blue-500/40 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.common.export}</span>
            </button>
            <button
              onClick={handleReset}
              className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t.simulator.reset}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Controls Column */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <h3 className="text-lg font-bold text-white font-outfit border-b border-slate-800 pb-3">
            {lang === 'es' ? 'Parámetros de Simulación' : 'Paramètres de Simulation'}
          </h3>

          {/* Revenue Price Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center space-x-1.5 font-medium text-slate-300">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>{t.simulator.revenuePrice}</span>
              </span>
              <span className={`font-bold font-mono px-2 py-0.5 rounded ${revenueChange > 0 ? 'bg-emerald-500/20 text-emerald-400' : revenueChange < 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                {revenueChange > 0 ? `+${revenueChange}%` : `${revenueChange}%`}
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              step="1"
              value={revenueChange}
              onChange={(e) => setRevenueChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>-20%</span>
              <span>0%</span>
              <span>+20%</span>
            </div>
          </div>

          {/* Fuel Price Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center space-x-1.5 font-medium text-slate-300">
                <Fuel className="w-4 h-4 text-amber-400" />
                <span>{t.simulator.fuelPrice}</span>
              </span>
              <span className={`font-bold font-mono px-2 py-0.5 rounded ${fuelChange > 0 ? 'bg-rose-500/20 text-rose-400' : fuelChange < 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                {fuelChange > 0 ? `+${fuelChange}%` : `${fuelChange}%`}
              </span>
            </div>
            <input
              type="range"
              min="-25"
              max="25"
              step="1"
              value={fuelChange}
              onChange={(e) => setFuelChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>-25%</span>
              <span>0%</span>
              <span>+25%</span>
            </div>
          </div>

          {/* Wage Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center space-x-1.5 font-medium text-slate-300">
                <Users className="w-4 h-4 text-blue-400" />
                <span>{t.simulator.driverWages}</span>
              </span>
              <span className={`font-bold font-mono px-2 py-0.5 rounded ${wageChange > 0 ? 'bg-rose-500/20 text-rose-400' : wageChange < 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                {wageChange > 0 ? `+${wageChange}%` : `${wageChange}%`}
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              step="1"
              value={wageChange}
              onChange={(e) => setWageChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>-20%</span>
              <span>0%</span>
              <span>+20%</span>
            </div>
          </div>

          {/* Maintenance Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center space-x-1.5 font-medium text-slate-300">
                <Wrench className="w-4 h-4 text-purple-400" />
                <span>{t.simulator.maintCost}</span>
              </span>
              <span className={`font-bold font-mono px-2 py-0.5 rounded ${maintChange > 0 ? 'bg-rose-500/20 text-rose-400' : maintChange < 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                {maintChange > 0 ? `+${maintChange}%` : `${maintChange}%`}
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              step="1"
              value={maintChange}
              onChange={(e) => setMaintChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>-30%</span>
              <span>0%</span>
              <span>+30%</span>
            </div>
          </div>
        </div>

        {/* Right Output Results Column */}
        <div className="lg:col-span-2 space-y-6">
          {simulationResult && (
            <>
              {/* Primary Impact Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Baseline Margin Card */}
                <div className="glass-panel p-5 rounded-2xl border border-slate-800">
                  <p className="text-xs font-semibold text-slate-400 uppercase">{t.simulator.baselineMargin}</p>
                  <h3 className="text-2xl font-extrabold text-white mt-1 font-outfit font-mono">
                    {(simulationResult.baseline.margin / 1e6).toFixed(2)} M€
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {lang === 'es' ? 'Tasa de margen:' : 'Taux de marge:'} {simulationResult.baseline.margin_rate}%
                  </p>
                </div>

                {/* Simulated Margin Card */}
                <div className={`glass-panel p-5 rounded-2xl border ${
                  simulationResult.impact.margin_change >= 0 
                    ? 'border-emerald-500/40 bg-emerald-950/20' 
                    : 'border-rose-500/40 bg-rose-950/20'
                }`}>
                  <p className="text-xs font-semibold text-slate-400 uppercase">{t.simulator.projectedMargin}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <h3 className="text-2xl font-extrabold text-white font-outfit font-mono">
                      {(simulationResult.simulated.margin / 1e6).toFixed(2)} M€
                    </h3>
                    <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded flex items-center ${
                      simulationResult.impact.margin_change >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {simulationResult.impact.margin_change >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {simulationResult.impact.margin_change >= 0 ? '+' : ''}{(simulationResult.impact.margin_change / 1e6).toFixed(2)} M€
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    {lang === 'es' ? 'Nuevo Tasa de Margen:' : 'Nouveau Taux de Marge:'} {simulationResult.simulated.margin_rate}%
                  </p>
                </div>
              </div>

              {/* Impact Breakdown List */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-800">
                <h3 className="text-md font-bold text-white font-outfit mb-4">{t.simulator.impactDetail}</h3>
                <div className="space-y-3 text-xs">
                  {/* Revenue Impact */}
                  {simulationResult.impact.revenue_impact !== undefined && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-slate-300 flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        <span>{t.simulator.revenueImpact}</span>
                      </span>
                      <span className={`font-mono font-bold ${simulationResult.impact.revenue_impact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {simulationResult.impact.revenue_impact >= 0 ? '+' : ''}{(simulationResult.impact.revenue_impact / 1e6).toFixed(2)} M€
                      </span>
                    </div>
                  )}

                  {/* Fuel Impact */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-300 flex items-center space-x-2">
                      <Fuel className="w-4 h-4 text-amber-400" />
                      <span>{t.simulator.fuelImpact}</span>
                    </span>
                    <span className={`font-mono font-bold ${simulationResult.impact.fuel_impact <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {simulationResult.impact.fuel_impact <= 0 ? '' : '+'}{(simulationResult.impact.fuel_impact / 1e6).toFixed(2)} M€
                    </span>
                  </div>

                  {/* Wage Impact */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-300 flex items-center space-x-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span>{t.simulator.wageImpact}</span>
                    </span>
                    <span className={`font-mono font-bold ${simulationResult.impact.driver_impact <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {simulationResult.impact.driver_impact <= 0 ? '' : '+'}{(simulationResult.impact.driver_impact / 1e6).toFixed(2)} M€
                    </span>
                  </div>

                  {/* Maintenance Impact */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-300 flex items-center space-x-2">
                      <Wrench className="w-4 h-4 text-purple-400" />
                      <span>{t.simulator.maintImpact}</span>
                    </span>
                    <span className={`font-mono font-bold ${simulationResult.impact.maint_impact <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {simulationResult.impact.maint_impact <= 0 ? '' : '+'}{(simulationResult.impact.maint_impact / 1e6).toFixed(2)} M€
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

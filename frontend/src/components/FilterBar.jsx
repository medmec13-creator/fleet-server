import React from 'react';
import { Filter, RotateCcw, Calendar, Truck, Fuel, AlertOctagon } from 'lucide-react';
import { getLang } from '../i18n';

const SELECT_CLS = "bg-slate-900/90 border border-slate-700/60 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5";

export default function FilterBar({ filters, setFilters, filterOptions, onReset, inline = false, lang = 'fr' }) {
  const t = getLang(lang);
  const handleChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const isFiltered = filters.year || filters.brand || filters.fuel_type || filters.vehicle_class || filters.anomaly;

  const controls = (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {!inline && (
        <div className="flex items-center gap-1.5 text-slate-400 font-medium mr-1">
          <Filter className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-white font-semibold font-outfit">{t.common.filters} :</span>
        </div>
      )}

      {/* Year */}
      <div className={SELECT_CLS}>
        <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <select value={filters.year} onChange={e => handleChange('year', e.target.value)}
          className="bg-transparent text-slate-200 outline-none cursor-pointer text-xs min-w-0">
          <option value="">{t.common.allYears}</option>
          {filterOptions.years?.map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
        </select>
      </div>

      {/* Brand */}
      <div className={SELECT_CLS}>
        <Truck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        <select value={filters.brand} onChange={e => handleChange('brand', e.target.value)}
          className="bg-transparent text-slate-200 outline-none cursor-pointer text-xs min-w-0">
          <option value="">{t.common.allBrands}</option>
          {filterOptions.brands?.map(b => <option key={b} value={b} className="bg-slate-900">{b}</option>)}
        </select>
      </div>

      {/* Fuel Type */}
      <div className={SELECT_CLS}>
        <Fuel className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <select value={filters.fuel_type} onChange={e => handleChange('fuel_type', e.target.value)}
          className="bg-transparent text-slate-200 outline-none cursor-pointer text-xs min-w-0">
          <option value="">{t.common.allFuels}</option>
          {filterOptions.fuel_types?.map(f => <option key={f} value={f} className="bg-slate-900">{f}</option>)}
        </select>
      </div>

      {/* Vehicle Class */}
      <div className={SELECT_CLS}>
        <select value={filters.vehicle_class} onChange={e => handleChange('vehicle_class', e.target.value)}
          className="bg-transparent text-slate-200 outline-none cursor-pointer text-xs min-w-0">
          <option value="">{t.common.allClasses}</option>
          {filterOptions.vehicle_classes?.map(vc => <option key={vc} value={vc} className="bg-slate-900">{vc}</option>)}
        </select>
      </div>

      {/* Anomaly Toggle */}
      <button onClick={() => handleChange('anomaly', filters.anomaly === '1' ? '' : '1')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
          filters.anomaly === '1'
            ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
            : 'bg-slate-900/80 border-slate-700/60 text-slate-400 hover:text-slate-200'
        }`}>
        <AlertOctagon className={`w-3.5 h-3.5 ${filters.anomaly === '1' ? 'animate-pulse' : ''}`} />
        {t.common.anomalies}
      </button>

      {/* Reset */}
      {isFiltered && (
        <button onClick={onReset}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition text-xs border border-slate-700/60">
          <RotateCcw className="w-3 h-3" />
          {t.common.reset}
        </button>
      )}
    </div>
  );

  if (inline) return controls;

  return (
    <div className="glass-panel border-b border-slate-800/60 py-3 px-5">
      {controls}
    </div>
  );
}

import React from 'react';

export function CardSkeleton({ count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card rounded-2xl p-4 border border-slate-800/80 animate-pulse space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-3 bg-slate-800 rounded w-20" />
            <div className="w-8 h-8 rounded-xl bg-slate-800" />
          </div>
          <div className="h-7 bg-slate-800 rounded w-28" />
          <div className="h-3 bg-slate-800/60 rounded w-16" />
        </div>
      ))}
    </>
  );
}

export function ChartSkeleton({ height = 'h-64', title = '' }) {
  return (
    <div className={`glass-panel p-5 rounded-2xl border border-slate-800/60 animate-pulse flex flex-col justify-between ${height}`}>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-slate-800 rounded w-36" />
          <div className="h-4 bg-slate-800 rounded w-16" />
        </div>
      )}
      <div className="flex-1 flex items-end gap-2 pt-4">
        {Array.from({ length: 12 }).map((_, i) => {
          const h = [40, 65, 30, 85, 55, 70, 90, 45, 60, 75, 50, 80][i % 12];
          return (
            <div
              key={i}
              className="flex-1 bg-slate-800/60 rounded-t"
              style={{ height: `${h}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800/60 animate-pulse space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="h-4 bg-slate-800 rounded w-32" />
        <div className="h-4 bg-slate-800 rounded w-20" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center justify-between gap-4 py-2 border-b border-slate-800/40">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="h-3.5 bg-slate-800/70 rounded flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ items = 4 }) {
  return (
    <div className="glass-panel p-4 rounded-2xl border border-slate-800/60 animate-pulse space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-800/40">
          <div className="w-8 h-8 rounded-lg bg-slate-800 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-slate-800 rounded w-3/4" />
            <div className="h-2.5 bg-slate-800/60 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

import React from 'react';

export const StatsCard = ({ title, value, subtitle, icon: Icon, trend, color = 'brand' }) => {
  const colorMap = {
    brand: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };

  return (
    <div className="p-5 rounded-xl bg-surface-100 border border-surface-400/40 shadow-subtle flex items-start justify-between">
      <div className="space-y-1">
        <span className="text-xs font-medium text-slate-400">{title}</span>
        <div className="text-2xl font-bold text-slate-100 font-mono tracking-tight">{value}</div>
        {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-xl border ${colorMap[color] || colorMap.brand}`}>
        {Icon && <Icon className="w-5 h-5" />}
      </div>
    </div>
  );
};

export default StatsCard;

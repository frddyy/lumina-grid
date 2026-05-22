import React from 'react';
import { Info } from 'lucide-react';
import { Tooltip } from './Tooltip';

export const MetricCard = ({ 
  label, 
  value, 
  subValue, 
  icon: Icon, 
  trend,
  tooltip
}: { 
  label: string; 
  value: string; 
  subValue?: string; 
  icon: any; 
  trend?: string;
  tooltip?: string;
}) => (
  <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 relative group">
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
      <Icon size={80} />
    </div>
    <div className="flex items-center gap-3">
      <div className="p-2.5 rounded-xl bg-white/5 text-white/80 ring-1 ring-white/10">
        <Icon size={18} />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium uppercase tracking-widest text-zinc-500">{label}</span>
        {tooltip && (
          <Tooltip content={tooltip}>
            <Info size={12} className="text-zinc-600 hover:text-zinc-400 transition-colors cursor-help" />
          </Tooltip>
        )}
      </div>
    </div>
    <div className="flex flex-col">
      <span className="text-3xl font-light text-white tracking-tight">{value}</span>
      {subValue && (
        <span className="text-xs font-mono text-zinc-500 mt-1 uppercase tracking-tight">
          {subValue}
        </span>
      )}
    </div>
    {trend && (
      <div className="flex items-center gap-1.5 mt-2">
        <div className="h-1 text-[10px] uppercase font-bold text-emerald-500 flex items-center">
          {trend}
        </div>
      </div>
    )}
  </div>
);

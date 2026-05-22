import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { InverterUnit } from '../../types';

export const UnitCard = ({ 
  unit, 
  index, 
  onClick, 
  onDiagnose 
}: { 
  unit: InverterUnit; 
  index: number; 
  key?: string; 
  onClick: () => void; 
  onDiagnose: (e: React.MouseEvent) => void;
}) => {
  const isDegraded = unit.status === 'Degraded';
  const isIsolated = unit.status === 'Isolated';
  const isCritical = unit.status === 'Critical';
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.02 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`glass-card p-4 rounded-xl glass-card-hover group relative cursor-pointer ${
        isIsolated ? 'opacity-50 grayscale border-white/5 bg-white/[0.01]' :
        isCritical ? 'ring-1 ring-rose-500/30 bg-rose-500/[0.02]' :
        isDegraded ? 'ring-1 ring-amber-500/30 bg-amber-500/[0.02]' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-tighter">
            {unit.name}
          </span>
          <span className="text-sm font-semibold text-white/90">{unit.id}</span>
        </div>
        <div className="flex items-center gap-2">
          {unit.isRerouted && (
            <span className="px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded-sm">
              Rerouted
            </span>
          )}
          <div className={`w-1.5 h-1.5 rounded-full ${
            isIsolated ? 'bg-zinc-500' :
            isCritical ? 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]' :
            isDegraded ? 'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-emerald-500'
          }`} />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-end mb-1">
            <span className="text-[10px] text-zinc-500 uppercase font-medium">Power</span>
            <span className={`text-lg font-mono font-medium ${
              isIsolated ? 'text-zinc-500' :
              isCritical ? 'text-rose-400' :
              isDegraded ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {unit.current_power_kw.toFixed(1)} <span className="text-[10px] text-zinc-600">kW</span>
            </span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (unit.current_power_kw / 600) * 100)}%` }}
              className={`h-full ${
                isIsolated ? 'bg-zinc-500' :
                isCritical ? 'bg-rose-500' :
                isDegraded ? 'bg-amber-500' : 'bg-emerald-500'
              }`} 
            />
          </div>
        </div>

        <div className="flex justify-between text-[10px] md:text-[11px] font-mono gap-2 w-full">
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-zinc-600 uppercase tracking-wider truncate">Irradiation</span>
            <span className="text-zinc-400 truncate">{unit.solar_irradiation.toFixed(2)} W/m²</span>
          </div>
          <div className="flex flex-col text-right flex-1 min-w-0 items-end">
            <span className="text-zinc-600 uppercase tracking-wider truncate">Efficiency</span>
            <span className="text-zinc-400 truncate w-full text-right">{isIsolated ? 'Offline' : isCritical ? 'Critical Error' : isDegraded ? '4% drop' : '94%'}</span>
          </div>
        </div>
      </div>
      
      <button
        onClick={onDiagnose}
        className="mt-4 flex items-center justify-center gap-1.5 w-full py-2.5 border border-white/10 bg-white/[0.03] hover:bg-amber-500/10 hover:border-amber-500/30 text-zinc-400 hover:text-amber-500 rounded-xl text-[10px] font-semibold tracking-widest uppercase transition-all shadow-sm active:scale-95 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.05)]"
      >
        <Sparkles size={12} className="opacity-70 group-hover:opacity-100 group-hover:animate-pulse" /> AI Diagnose
      </button>
      
      {(isDegraded || isCritical) && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden rounded-xl">
           <div className={`absolute -top-[1px] left-0 w-full h-[1px] bg-gradient-to-r from-transparent ${isCritical ? 'via-rose-500/50' : 'via-amber-500/50'} to-transparent`} />
        </div>
      )}
    </motion.div>
  );
};

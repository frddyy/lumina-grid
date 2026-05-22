import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { InverterUnit } from '../../types';

interface AICoPilotProps {
  showWeatherAlert: boolean;
  isExecuting: boolean;
  setIsRerouteConfirmOpen: (isOpen: boolean) => void;
  setMitigationPlan: (plan: { unitId: string; action: string }[]) => void;
  t: any; // Labels for translation
  units: InverterUnit[];
  isolatedUnits: string[];
}

export const AICoPilot: React.FC<AICoPilotProps> = ({ 
  showWeatherAlert, 
  isExecuting, 
  setIsRerouteConfirmOpen, 
  setMitigationPlan,
  t,
  units,
  isolatedUnits
}) => {
  const targets = ['Unit 12', 'Unit 15'];
  const unitsToHandle = targets.filter(id => !isolatedUnits.includes(id));
  
  if (!showWeatherAlert || unitsToHandle.length === 0) return null;

  const mitigationPlan = unitsToHandle.map(id => {
    const u = units.find(unit => unit.id === id);
    const status = u?.status || 'Normal';
    const action = status === 'Critical' ? 'isolate' : 'reroute';
    return { unitId: id, action };
  });

  const handleExecuteClick = () => {
    setMitigationPlan(mitigationPlan);
    setIsRerouteConfirmOpen(true);
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, height: 0 }}
        animate={{ opacity: 1, scale: 1, height: 'auto' }}
        exit={{ opacity: 0, scale: 0.95, height: 0 }}
        className="glass-card border-amber-500/20 bg-amber-500/[0.03] p-6 rounded-2xl relative overflow-hidden group shadow-[0_0_40px_rgba(245,158,11,0.1)] text-left mb-8"
      >
        <div className="flex items-center gap-2 mb-4 shrink-0">
          <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg ring-1 ring-amber-500/20">
            <ShieldAlert size={16} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500">AI Co-Pilot</span>
        </div>
        
        <div className="space-y-4 flex flex-col">
          <div className="space-y-2 mb-4">
            <p className="text-lg font-light text-white leading-tight tracking-tight">
              Weather Alert: <span className="font-normal opacity-80 text-amber-100">Rain in Sector A.</span>
            </p>
            <p className="text-sm text-zinc-400 font-light leading-relaxed mb-2">
              Output for <span className="text-amber-200 font-medium">{unitsToHandle.join(' & ')}</span> dropped. 
            </p>
            <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-1 block">Mitigation Plan</span>
              {mitigationPlan.map(plan => (
                <div key={plan.unitId} className="flex justify-between items-center text-sm text-zinc-300">
                  <span>{plan.unitId}</span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${plan.action === 'isolate' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {plan.action}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative group/btn-container shrink-0">
            <button 
              onClick={handleExecuteClick}
              disabled={isExecuting}
              className="w-full relative z-10 flex items-center justify-center gap-2 py-3 bg-amber-500 text-black rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all hover:bg-amber-400 active:scale-[0.98] disabled:opacity-50 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]"
            >
              {isExecuting ? 'Executing...' : 'Execute Mitigation Plan'}
              {!isExecuting && <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />}
            </button>
            <div className="absolute inset-0 bg-amber-500 blur-xl opacity-20 animate-pulse rounded-xl" />
          </div>
        </div>

        {/* Subtle glow effect */}
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-500/15 blur-3xl rounded-full pointer-events-none" />
      </motion.div>
    </AnimatePresence>
  );
};

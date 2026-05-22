import React from 'react';
import { Compass } from 'lucide-react';

export const LoadingOverlay = () => {
  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xl z-0" />
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl relative">
            <Compass className="text-white animate-[spin_4s_linear_infinite]" size={40} strokeWidth={1.5} />
          </div>
        </div>
        <div className="text-center space-y-3">
          <h2 className="text-xl font-semibold tracking-wide text-white">Establishing Secure Grid Telemetry...</h2>
          <p className="text-sm font-mono text-zinc-500 uppercase tracking-widest animate-pulse">
            Awaiting First Block
          </p>
        </div>
      </div>
    </div>
  );
};

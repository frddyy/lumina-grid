import React from 'react';

export const Tooltip = ({ content, children, active = true }: { content: string, children: React.ReactNode, key?: string, active?: boolean }) => (
  <div className="group relative inline-block">
    {children}
    {active && (
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-black/60 backdrop-blur-xl border border-white/10 text-[10px] text-zinc-300 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-[200] w-max min-w-[80px] text-center scale-95 group-hover:scale-100 origin-bottom">
        {content}
      </div>
    )}
  </div>
);

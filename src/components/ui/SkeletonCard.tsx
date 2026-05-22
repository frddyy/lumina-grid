import React from 'react';

export const SkeletonCard = () => (
  <div className="glass-card p-4 rounded-xl relative overflow-hidden h-[100px] border-white/5">
    <div className="flex justify-between items-start mb-4">
      <div className="w-12 h-4 bg-white/5 rounded animate-pulse" />
      <div className="w-8 h-4 bg-white/5 rounded animate-pulse" />
    </div>
    <div className="w-2/3 h-6 bg-white/5 rounded animate-pulse" />
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full animate-shimmer" />
  </div>
);

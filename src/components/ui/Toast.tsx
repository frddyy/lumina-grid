import React from 'react';
import { Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Toast = ({ message, onClose, show }: { message: string; onClose: () => void; show: boolean }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed bottom-24 right-8 z-[120] glass-card px-6 py-4 rounded-2xl flex items-center gap-4 bg-emerald-500/[0.05] border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)]"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-black">
            <Zap size={16} fill="currentColor" />
          </div>
          <p className="text-sm font-medium text-white">{message}</p>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

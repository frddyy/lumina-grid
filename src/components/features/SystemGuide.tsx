import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, X } from 'lucide-react';

interface SystemGuideProps {
  isGuideOpen: boolean;
  setIsGuideOpen: (isOpen: boolean) => void;
  t: any;
}

export const SystemGuide: React.FC<SystemGuideProps> = ({ 
  isGuideOpen, 
  setIsGuideOpen, 
  t 
}) => {
  return (
    <AnimatePresence>
      {isGuideOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-[90vw] max-w-md max-h-[90vh] overflow-y-auto bg-brand-bg border border-white/10 rounded-2xl p-6 shadow-2xl"
          >
            <button 
              onClick={() => setIsGuideOpen(false)}
              className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full text-zinc-500 transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-white/5 text-white rounded-2xl ring-1 ring-white/10">
                <BookOpen size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white tracking-tight">{t.guide}</h2>
                <p className="text-xs text-zinc-500 font-mono tracking-widest uppercase">LUMINAGRID OS • KERNEL BUILD 1.0</p>
              </div>
            </div>

            <div className="space-y-6">
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">{t.guideTitle1}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed font-light">
                  {t.guideContent1}
                </p>
              </section>
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">{t.guideTitle2}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed font-light">
                  {t.guideContent2}
                </p>
              </section>
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">{(t as any).guideTitle3}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed font-light">
                  {(t as any).guideContent3}
                </p>
              </section>
              <button 
                onClick={() => setIsGuideOpen(false)}
                className="w-full py-4 glass-card border-white/10 hover:bg-white/5 text-white rounded-2xl font-semibold text-xs uppercase tracking-[0.2em] transition-all"
              >
                {t.close}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

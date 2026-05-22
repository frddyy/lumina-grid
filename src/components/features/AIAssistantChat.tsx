import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Terminal, ShieldCheck, X, Send, Loader2 } from 'lucide-react';
import { gridService } from '../../services/gridService';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  action?: 'reroute' | 'isolate';
  actionUnit?: string;
  status?: 'approved' | 'rejected';
}

interface AIAssistantChatProps {
  isChatModalOpen: boolean;
  setIsChatModalOpen: (isOpen: boolean) => void;
  chatHistory: ChatMessage[];
  isTyping: boolean;
  chatMessage: string;
  setChatMessage: (msg: string) => void;
  handleSendChat: () => void;
  handleReroute: (index?: number) => void;
  handleRejectAction: (index: number) => void;
  onActionSuccess?: (unitId: string, action: 'isolate' | 'reroute', chatIndex: number, messages: string[]) => void;
  t: any;
}

export const AIAssistantChat: React.FC<AIAssistantChatProps> = ({
  isChatModalOpen,
  setIsChatModalOpen,
  chatHistory,
  isTyping,
  chatMessage,
  setChatMessage,
  handleSendChat,
  handleReroute,
  handleRejectAction,
  onActionSuccess,
  t
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isExecutingAction, setIsExecutingAction] = useState<number | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  const formatMarkdown = (text: string, isUser: boolean = false) => {
    return text.split('\n').map((line, i) => {
      if (!line.trim()) return <div key={i} className="h-1.5" />;
      return (
        <span key={i} className={`block ${isUser ? '' : 'mb-1'} leading-relaxed`} dangerouslySetInnerHTML={{
          __html: line.replace(/\*\*(.*?)\*\*/g, isUser ? '<strong>$1</strong>' : '<strong class="font-semibold text-white">$1</strong>')
        }} />
      );
    });
  };

  return (
    <>
      <AnimatePresence>
        {isChatModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatModalOpen(false)}
              className="absolute inset-0 pointer-events-auto"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md h-[85vh] bg-brand-bg border border-white/10 rounded-2xl flex flex-col shadow-2xl relative z-10 overflow-hidden pointer-events-auto"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">AI Assistant</h2>
                    <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">Active Analysis</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsChatModalOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full text-zinc-500 transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {chatHistory.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                    <div className="p-4 bg-white/5 rounded-full text-zinc-700">
                      <Terminal size={32} />
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      LuminaGrid AI Co-Pilot is ready. Ask about fleet efficiency, weather impacts, or maintenance schedules.
                    </p>
                  </div>
                )}
                {chatHistory.map((chat, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={i} 
                    className={`flex flex-col ${chat.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                      chat.role === 'user' 
                      ? 'bg-amber-500/20 text-amber-100 rounded-tr-none' 
                      : 'bg-white/5 text-zinc-400 rounded-tl-none border border-white/5'
                    }`}>
                      {formatMarkdown(chat.text, chat.role === 'user')}
                      
                      {chat.status && (
                        <div className={`mt-2 pt-2 border-t border-white/5 font-mono text-[9px] uppercase tracking-widest flex items-center gap-1.5 ${
                          chat.status === 'approved' ? 'text-emerald-500' : 'text-zinc-500'
                        }`}>
                          {chat.status === 'approved' ? <ShieldCheck size={10} /> : <X size={10} />}
                          <span>Action: {chat.status === 'approved' ? 'Approved' : 'Rejected'}</span>
                        </div>
                      )}
                    </div>
                    
                    {((chat.action === 'reroute' || chat.action === 'isolate') || (chat.mitigationPlan && chat.mitigationPlan.length > 0)) && !chat.status && (
                      <div className="mt-3 w-full max-w-[85%] p-3 glass-card bg-white/[0.03] border border-white/10 rounded-xl">
                        <p className="text-[10px] text-zinc-400 mb-2 uppercase tracking-widest font-mono">Suggested Action</p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleReroute(i)}
                            disabled={isExecutingAction === i}
                            className={`flex-1 py-2 px-2 text-black rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                              chat.mitigationPlan && chat.mitigationPlan.length > 1 ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]' :
                              chat.action === 'isolate' ? 'bg-rose-500 hover:bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'bg-amber-500 hover:bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                            } disabled:opacity-50`}
                          >
                            {chat.mitigationPlan && chat.mitigationPlan.length > 1 
                              ? `⚡️ Execute Batch Mitigation (${chat.mitigationPlan.length} Actions)`
                              : `⚡️ Execute ${chat.action} ${chat.actionUnit && `on ${chat.actionUnit}`}`}
                          </button>
                          <button 
                            onClick={() => handleRejectAction(i)}
                            disabled={isExecutingAction === i}
                            className="py-2 px-3 bg-white/5 border border-white/10 text-zinc-400 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 transition-colors disabled:opacity-50"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="flex flex-col items-start">
                    <div className="bg-white/5 text-zinc-500 px-4 py-3 rounded-2xl text-[11px] rounded-tl-none border border-white/5 italic flex items-center gap-2">
                       <span className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce" />
                       <span className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                       <span className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-6 border-t border-white/5 bg-white/[0.01] pb-safe md:pb-8">
                <div className="relative group mb-1 md:mb-0">
                  <textarea 
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChat();
                      }
                    }}
                    placeholder={t.chatPlaceholder}
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-4 pr-12 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all placeholder:text-zinc-600 resize-none custom-scrollbar"
                  />
                  <button 
                    onClick={handleSendChat}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-amber-500 hover:text-amber-400 transition-colors"
                    aria-label="Send"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-50 pointer-events-none">
        <button 
          onClick={() => setIsChatModalOpen(!isChatModalOpen)}
          className="pointer-events-auto w-14 h-14 bg-amber-500 rounded-full flex items-center justify-center text-black shadow-[0_8px_32px_rgba(245,158,11,0.3)] hover:scale-110 active:scale-95 transition-all relative overflow-hidden group"
          aria-label="Toggle AI Assistant"
        >
          <motion.div
            animate={{ rotate: isChatModalOpen ? 45 : 0 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            {isChatModalOpen ? <X size={24} /> : <Sparkles size={24} />}
          </motion.div>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </button>
      </div>
    </>
  );
};

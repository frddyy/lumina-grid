import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Zap, 
  Activity, 
  CloudRain, 
  ShieldAlert, 
  Terminal, 
  Sun, 
  Compass,
  Cpu,
  BarChart3,
  FileSpreadsheet,
  BookOpen,
  Globe,
  X,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  History,
  MessageSquare,
  FileDown,
  ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { InverterUnit, SystemLog } from './types';

import { Tooltip } from './components/ui/Tooltip';
import { MetricCard } from './components/ui/MetricCard';
import { SkeletonCard } from './components/ui/SkeletonCard';
import { UnitCard } from './components/ui/UnitCard';
import { LoadingOverlay } from './components/ui/LoadingOverlay';
import { Toast } from './components/ui/Toast';
import { AICoPilot } from './components/features/AICoPilot';
import { SystemGuide } from './components/features/SystemGuide';
import { AIAssistantChat } from './components/features/AIAssistantChat';
import { useTelemetry } from './hooks/useTelemetry';
import { labels } from './constants/labels';
import { gridService } from './services/gridService';
import { aiService } from './services/aiService';

// --- Main App ---

export default function App() {
  const isolatedUnitsRef = useRef<string[]>([]);
  const reroutedUnitsRef = useRef<string[]>([]);
  const { units, setUnits, lastUpdated, setLastUpdated } = useTelemetry(isolatedUnitsRef, reroutedUnitsRef);
  
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [language, setLanguage] = useState<'EN' | 'ID'>('EN');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<InverterUnit | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'Normal' | 'Degraded'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isRerouteConfirmOpen, setIsRerouteConfirmOpen] = useState(false);
  const [mitigationPlan, setMitigationPlan] = useState<{unitId: string, action: string}[]>([]);
  const [pendingChatActionIndex, setPendingChatActionIndex] = useState<number | undefined>(undefined);
  const [isConfirmingAction, setIsConfirmingAction] = useState<'isolate' | 'reroute' | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ 
    role: 'user' | 'ai', 
    text: string, 
    action?: 'reroute' | 'isolate', // keeping for legacy/single
    actionUnit?: string,
    mitigationPlan?: { action: 'isolate' | 'reroute', unitId: string }[],
    status?: 'approved' | 'rejected'
  }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showAllUnits, setShowAllUnits] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<string | null>(null);
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false);
  const [diagnosisUnitId, setDiagnosisUnitId] = useState<string | null>(null);
  const [isolatedUnits, setIsolatedUnits] = useState<string[]>([]);
  const [showWeatherAlert, setShowWeatherAlert] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleAIDiagnose = async (unit: InverterUnit, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDiagnosisUnitId(unit.id);
    setIsConfirmingAction(null);
    setIsDiagnosisModalOpen(true);
    setIsDiagnosing(true);
    setDiagnosisResult(null);
    try {
      const data = await aiService.analyzeTelemetry({
        unitName: unit.id,
        status: unit.status,
        acPower: unit.current_power_kw,
        dcPower: unit.current_power_kw * 1.05,
        ambientTemp: 34.2,
        moduleTemp: 45.0,
        irradiation: unit.solar_irradiation
      });
      if (data.status === 'success') {
        setDiagnosisResult(data.diagnosis);
      } else {
        setDiagnosisResult(`**Error:** ${data.message || 'Analysis failed.'}`);
      }
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.message;
      setDiagnosisResult(`**Connection Error:** Could not reach AI Assistant.\n\n${errorMsg}`);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const formatDiagnosis = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (!line.trim()) return <br key={i} />;
      return (
        <p key={i} className="mb-3 leading-relaxed text-zinc-300 font-light" dangerouslySetInnerHTML={{
          __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-medium">$1</strong>')
        }} />
      );
    });
  };



  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === 'w') {
        setShowWeatherAlert(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // SSE Telemetry is now handled by useTelemetry

  const unitHistoryData = useMemo(() => {
    if (!selectedUnit) return [];
    
    const currentUnit = units.find(u => u.id === selectedUnit.id) || selectedUnit;
    
    if (currentUnit.status === 'Critical' || currentUnit.status === 'Isolated') {
      return Array.from({ length: 24 }).map((_, i) => ({
        time: `${((new Date().getHours() - (23 - i) + 24) % 24).toString().padStart(2, '0')}:00`,
        power: 0
      }));
    }
    
    return Array.from({ length: 24 }).map((_, i) => {
      const hour = (new Date().getHours() - (23 - i) + 24) % 24;
      const basePower = currentUnit.current_power_kw;
      // Simulate some fluctuations based on time of day (sine wave-ish for solar)
      const dayFactor = Math.max(0, Math.sin((hour / 24) * Math.PI * 2 - Math.PI / 2));
      const fluctuation = (Math.random() - 0.5) * 30;
      const degradation = currentUnit.status === 'Degraded' && i > 16 ? 0.6 : 1;
      
      return {
        time: `${hour.toString().padStart(2, '0')}:00`,
        power: Math.max(0, (basePower * dayFactor + fluctuation) * degradation)
      };
    });
  }, [selectedUnit, units]);

  const isAnyModalOpen = isGuideOpen || isExportModalOpen || isLogsModalOpen || !!selectedUnit || isChatModalOpen || isRerouteConfirmOpen || isDiagnosisModalOpen;

  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isAnyModalOpen]);

  // Handle auto-closing sidebar on mobile when resizing or performing actions
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdated('Just now');
    }, 1500);
  };

  const filteredUnits = useMemo(() => {
    return units.filter(u => {
      const matchesSearch = u.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           u.status.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || u.status === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [units, searchTerm, filterType]);

  const sortedUnits = useMemo(() => {
    return [...filteredUnits].sort((a, b) => {
      const priority: Record<string, number> = { 'Critical': 3, 'Degraded': 2, 'Isolated': 1, 'Normal': 0 };
      const aP = priority[a.status] || 0;
      const bP = priority[b.status] || 0;
      if (aP !== bP) return bP - aP;
      return 0;
    });
  }, [filteredUnits]);

  const displayedUnits = showAllUnits ? sortedUnits : sortedUnits.slice(0, 10);

  const totalPower = useMemo(() => 
    units.reduce((acc, u) => acc + u.current_power_kw, 0).toLocaleString(undefined, { maximumFractionDigits: 0 }), 
  [units]);

  const activeCount = units.filter(u => u.status === 'Normal').length;
  const unhandledIssues = units.filter(u => 
    (u.status === 'Degraded' && !u.isRerouted) || 
    (u.status === 'Critical' && !isolatedUnitsRef.current.includes(u.id))
  ).length;

  const activeIssues = units.filter(u => u.status !== 'Normal').length;

  let fleetStatus: 'OPERATIONAL' | 'MITIGATION ACTIVE' | 'ATTENTION REQUIRED' = 'OPERATIONAL';
  if (unhandledIssues > 0) fleetStatus = 'ATTENTION REQUIRED';
  else if (activeIssues > 0 && unhandledIssues === 0) fleetStatus = 'MITIGATION ACTIVE';

  const handleReroute = async (fromChatIndex?: number) => {
    let chatAction = 'reroute';
    let localPayload = mitigationPlan.length > 0 ? [...mitigationPlan] : undefined;
    
    if (fromChatIndex !== undefined && typeof fromChatIndex === 'number') {
      const chatMessage = chatHistory[fromChatIndex];
      chatAction = chatMessage?.action || 'reroute';
      if (chatMessage?.mitigationPlan && chatMessage.mitigationPlan.length > 0) {
        localPayload = chatMessage.mitigationPlan;
        setMitigationPlan(localPayload);
      }
      setChatHistory(prev => prev.map((chat, idx) => 
        idx === fromChatIndex ? { ...chat, status: 'approved' as const } : chat
      ));
      setPendingChatActionIndex(undefined);
    }
    
    setIsRerouteConfirmOpen(false);
    setIsExecuting(true);
    
    try {
      const payload = localPayload || [{ unitId: 'Unit 12', action: chatAction }];
      const data = await gridService.executeBatchActions(payload);
      
      if (data.status === 'success') {
        const newlyIsolated = payload.filter((p: any) => p.action === 'isolate').map((p: any) => p.unitId);
        if (newlyIsolated.length > 0) {
          setIsolatedUnits(prev => {
            const updatedIsolated = [...prev, ...newlyIsolated];
            isolatedUnitsRef.current = updatedIsolated;
            return updatedIsolated;
          });
        }
        setShowWeatherAlert(false);

        setUnits(prev => prev.map(u => {
          if (newlyIsolated.includes(u.id)) {
            return { ...u, status: 'Isolated', current_power_kw: 0 };
          }
          const newlyRerouted = payload.filter((p: any) => p.action === 'reroute').map((p: any) => p.unitId);
          if (newlyRerouted.includes(u.id)) {
            reroutedUnitsRef.current.push(u.id);
            return { ...u, isRerouted: true };
          }
          return u;
        }));
        const logMessages = data.messages?.length > 0 && !data.messages[0].includes('Batch Mitigation') 
          ? data.messages 
          : payload.map((p: any) => `[System] Executed ${p.action.toUpperCase()} on ${p.unitId}`);
          
        const newLogs = logMessages.map((msg: string, i: number) => ({
          id: Date.now().toString() + i, 
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
          type: 'info' as const, 
          message: msg
        }));

        setLogs(prev => [...newLogs, ...prev]);
        setToastMessage(t.rerouteSuccess);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
      } else {
        throw new Error(data.message);
      }
    } catch (e) {
      console.error(e);
      setToastMessage("Failed to execute reroute.");
      setShowToast(true);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRejectAction = (index: number) => {
    setChatHistory(prev => prev.map((chat, idx) => 
      idx === index ? { ...chat, status: 'rejected' as const } : chat
    ));
    
    // Add AI confirmation of rejection
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setChatHistory(prev => [...prev, { 
          role: 'ai', 
          text: "Load balancing plan rejected. Monitoring situation for further degradation." 
        }]);
      }, 800);
    }, 200);
  };

  const handleIndividualActionClick = (action: 'isolate' | 'reroute') => {
    setIsConfirmingAction(action);
  };

  const executeIndividualAction = async () => {
    if (!diagnosisUnitId || !isConfirmingAction) return;
    
    const actionTarget = isConfirmingAction;
    setIsConfirmingAction(null);
    setIsExecuting(true);
    try {
      const data = await gridService.executeGridAction(
         actionTarget === 'isolate' ? 'Isolate Unit' : 'Reroute 500kW', 
         diagnosisUnitId, 
         'executed'
      );
      
      if (data.status === 'success') {
        if (actionTarget === 'isolate') {
          setIsolatedUnits(prev => {
            const newIsolated = [...prev, diagnosisUnitId];
            isolatedUnitsRef.current = newIsolated;
            return newIsolated;
          });
          setUnits(prev => prev.map(u => u.id === diagnosisUnitId ? { ...u, status: 'Isolated', current_power_kw: 0 } : u));
        } else if (actionTarget === 'reroute') {
          reroutedUnitsRef.current.push(diagnosisUnitId);
          setUnits(prev => prev.map(u => 
            u.id === diagnosisUnitId ? { ...u, isRerouted: true } : u
          ));
        }
        setLogs(prev => [
          { 
            id: Date.now().toString(), 
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
            type: actionTarget === 'isolate' ? 'warning' : 'info', 
            message: actionTarget === 'isolate' ? `Critical Action: ${diagnosisUnitId} isolated from grid` : `Load Reroute Successful on ${diagnosisUnitId}`
          }, 
          ...prev
        ]);
        setToastMessage(`${diagnosisUnitId} successfully ${actionTarget}d.`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
        setIsDiagnosisModalOpen(false);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error("Execute API failed:", err);
      setToastMessage(`Failed to ${actionTarget} unit.`);
      setShowToast(true);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExportData = () => {
    setIsExportModalOpen(false);
    setToastMessage(t.exportSuccess);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const handleSendChat = async () => {
    if (!chatMessage.trim()) return;
    
    const newUserMsg = { role: 'user' as const, text: chatMessage };
    setChatHistory(prev => [...prev, newUserMsg]);
    const msgToSend = chatMessage;
    setChatMessage('');
    setIsTyping(true);

    try {
      const payloadData = units.map(u => ({ id: u.id, status: u.status, power: u.current_power_kw }));
      
      const data = await aiService.chatWithAI(msgToSend, payloadData);
      
      let aiResponse: { role: 'ai', text: string, action?: 'reroute' | 'isolate', actionUnit?: string, mitigationPlan?: { action: 'isolate' | 'reroute', unitId: string }[] } = { role: 'ai', text: '' };
      
      if (data.status === 'success') {
        let replyText = data.reply;
        const actionRegex = /\[ACTION:(ISOLATE|REROUTE):(Unit \d+)\]/gi;
        const matches = [...replyText.matchAll(actionRegex)];
        
        if (matches.length > 0) {
          aiResponse.mitigationPlan = matches.map(m => ({
            action: m[1].toLowerCase() as 'isolate' | 'reroute',
            unitId: m[2]
          }));
          
          // For backwards compatibility with single actions
          if (matches.length === 1) {
            aiResponse.action = aiResponse.mitigationPlan[0].action;
            aiResponse.actionUnit = aiResponse.mitigationPlan[0].unitId;
          }
          
          aiResponse.text = replyText.replace(actionRegex, '').trim();
        } else {
          aiResponse.text = replyText;
        }
      } else {
        aiResponse.text = `Error: ${data.message || 'Analysis failed.'}`;
      }
      
      setChatHistory(prev => [...prev, aiResponse]);
    } catch (e) {
      console.error(e);
      setChatHistory(prev => [...prev, { role: 'ai', text: "Connection to AI Assistant failed." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleChatActionSuccess = (unitId: string, action: 'isolate' | 'reroute', chatIndex: number, messages: string[]) => {
    setChatHistory(prev => prev.map((chat, idx) => 
      idx === chatIndex ? { ...chat, status: 'approved' as const } : chat
    ));
    
    setUnits(prev => prev.map(u => {
      if (u.id === unitId) {
        if (action === 'isolate') {
          isolatedUnitsRef.current.push(unitId);
          return { ...u, status: 'Isolated', current_power_kw: 0 };
        } else {
          reroutedUnitsRef.current.push(unitId);
          return { ...u, isRerouted: true };
        }
      }
      return u;
    }));
    
    const newLogs = messages.map((msg, i) => ({
      id: Date.now().toString() + i,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
      type: 'info' as const,
      message: msg
    }));
    
    setLogs(prev => [...newLogs, ...prev]);
  };

  const t = labels[language];

  if (units.length === 0) {
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
  }

  const activeUnit = selectedUnit ? units.find(u => u.id === selectedUnit.id) || selectedUnit : null;

  return (
    <div className="min-h-screen bg-brand-bg flex">
      
      <Toast message={toastMessage} show={showToast} onClose={() => setShowToast(false)} />
      
      {/* Sidebar */}
      {/* Mobile Edge Trigger */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed left-0 top-1/2 -translate-y-1/2 z-50 w-6 h-14 bg-zinc-900/80 backdrop-blur-xl border-t border-r border-b border-white/10 rounded-r-xl flex items-center justify-center text-zinc-400 active:scale-95 transition-all shadow-2xl"
        style={{ display: isSidebarOpen ? 'none' : 'flex' }}
      >
        <ChevronRight size={16} strokeWidth={3} />
      </button>

      {/* Sidebar - Mobile Drawer Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[140] md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarOpen ? 260 : 80,
          x: 0
        }}
        className={`fixed inset-y-0 left-0 bg-[#0A0A0A] border-r border-[#1F1F1F] flex flex-col z-[150] transition-all duration-300 h-screen ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="h-24 flex items-center px-6 justify-between overflow-hidden shrink-0">
          <div className="flex items-center gap-3">
            {isSidebarOpen && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm font-semibold tracking-tight text-white whitespace-nowrap"
              >
                LuminaGrid
              </motion.span>
            )}
          </div>
          
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 hover:bg-[#1F1F1F] rounded-md text-zinc-500 transition-colors shrink-0"
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <div className={`w-5 h-5 border-[1.5px] border-current rounded-[4px] relative transition-transform ${isSidebarOpen ? '' : 'rotate-180'}`}>
              <div className="absolute top-0 right-1.5 bottom-0 w-[1.5px] bg-current" />
            </div>
          </button>
        </div>

        <nav className="flex-1 px-4 py-8 flex flex-col gap-2 overflow-hidden">
          {[
            { id: 'logs', icon: History, label: t.systemLogs, onClick: () => {
              setIsSidebarOpen(false);
              setIsLogsModalOpen(true);
            }},
            { id: 'ai', icon: MessageSquare, label: t.aiAssistant, onClick: () => {
              setIsSidebarOpen(false);
              setIsChatModalOpen(true);
            }},
            { id: 'guide', icon: BookOpen, label: t.systemGuide, onClick: () => {
                setIsSidebarOpen(false);
                setIsGuideOpen(true);
            }},
            { id: 'export', icon: FileDown, label: t.export, hidden: true, onClick: () => {
                setIsSidebarOpen(false);
                setIsExportModalOpen(true);
            }}
          ].map((item) => (
            <Tooltip key={item.id} content={item.label} active={!isSidebarOpen}>
              <button
                onClick={item.onClick}
                className={`group flex items-center w-full h-12 text-zinc-500 hover:text-white transition-colors relative ${item.hidden ? 'hidden' : ''}`}
              >
                <div className="w-10 h-10 flex items-center justify-center rounded-lg group-hover:bg-[#1F1F1F] transition-colors shrink-0">
                  <item.icon size={20} strokeWidth={1.5} />
                </div>
                
                <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="ml-3 text-[13px] font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </Tooltip>
          ))}
        </nav>

        <div className="p-4 border-t border-[#1F1F1F]">
          <Tooltip content={language === 'EN' ? 'Change Language' : 'Ganti Bahasa'} active={!isSidebarOpen}>
            <button 
              onClick={() => setLanguage(l => l === 'EN' ? 'ID' : 'EN')}
              className="group flex items-center w-full h-12 text-zinc-500 hover:text-white transition-colors relative"
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-lg group-hover:bg-[#1F1F1F] transition-colors shrink-0">
                <Globe size={18} strokeWidth={1.5} />
              </div>
              
              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="ml-3 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap"
                  >
                    {language === 'EN' ? 'Language: EN' : 'Bahasa: ID'}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </Tooltip>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className={`flex-1 relative transition-all duration-300 ${isSidebarOpen ? 'md:ml-[260px]' : 'md:ml-[80px] ml-0'}`}>
        <div className="p-4 md:p-8 lg:p-12 pb-24 max-w-[1720px] mx-auto selection:bg-white/10 overflow-x-hidden">
          
          {/* Header */}
          <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-white border border-white/5 rounded-xl">
                  <Compass className="text-black" size={20} strokeWidth={1.5} />
                </div>
                <h1 className="text-2xl font-semibold tracking-tighter text-white">{t.title} <span className="font-light text-zinc-500 ml-1">OS</span></h1>
              </div>
              <p className="text-zinc-500 text-sm max-w-sm font-light leading-relaxed">
                {t.sub} <br />
                <span className="flex items-center gap-2 mt-1">
                  <span className="text-zinc-600">System Status:</span>
                  <span className={`flex items-center gap-1.5 font-medium tracking-wide ${
                    fleetStatus === 'OPERATIONAL' ? 'text-emerald-500' : 
                    fleetStatus === 'MITIGATION ACTIVE' ? 'text-blue-400' : 
                    'text-amber-500'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      fleetStatus === 'OPERATIONAL' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 
                      fleetStatus === 'MITIGATION ACTIVE' ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.4)]' : 
                      'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                    }`} />
                    {fleetStatus === 'OPERATIONAL' ? t.operational : 
                     fleetStatus === 'MITIGATION ACTIVE' ? 'MITIGATION ACTIVE' : 
                     'ATTENTION REQUIRED'}
                  </span>
                </span>
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-6 px-6 py-3 glass-card rounded-2xl">
                <div className="flex items-center gap-2">
                  <Sun size={14} className="text-amber-400" />
                  <span className="text-xs font-mono text-zinc-400">8.42 W/m²</span>
                </div>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-emerald-500" />
                  <span className="text-xs font-mono text-zinc-400">50.02 Hz</span>
                </div>
                <div className="w-px h-4 bg-white/10" />
                <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest text-right">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </header>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <MetricCard 
              label={t.totalPower} 
              value={`${totalPower} kW`} 
              subValue="Fleet Cumulative Realtime"
              icon={Zap}
              trend="+12.4% FROM YESTERDAY"
              tooltip="The current instantaneous power being generated across all units."
            />
            <MetricCard 
              label={t.activeUnits} 
              value={`${activeCount}/40`} 
              subValue="Units in Optimal State"
              icon={Cpu}
              trend="2 UNITS DEGRADED"
              tooltip="The count of inverters operating within normal performance parameters."
            />
            <MetricCard 
              label={t.weather} 
              value="Cloudy" 
              subValue="Sector A Monitoring"
              icon={CloudRain}
              trend="WIND 12 KM/H"
              tooltip="Real-time atmospheric analysis from on-site weather sensors."
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
            
            {/* Main Grid */}
            <section className="space-y-6">
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <BarChart3 size={18} className="text-zinc-500" />
                    <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-400">{t.fleet}</h2>
                    <div className="hidden sm:flex items-center gap-2 ml-4 px-3 py-1 bg-white/[0.02] border border-white/5 rounded-full">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">{t.lastUpdatedText}: {lastUpdated}</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-all active:scale-95 disabled:opacity-50 group"
                  >
                    <RefreshCw size={18} className={`${isRefreshing ? 'animate-spin text-amber-500' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                  </button>
                </div>

                {/* Advanced Controls */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500/50 transition-colors" size={18} />
                    <input 
                      type="text"
                      placeholder={t.searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/5 focus:border-amber-500/30 focus:bg-white/[0.04] rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-zinc-700 transition-all focus:outline-none"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-zinc-600 font-mono pointer-events-none hidden md:block">
                      Cmd+K
                    </div>
                  </div>

                  <div className="flex p-1 bg-white/[0.02] border border-white/5 rounded-2xl overflow-x-auto custom-scrollbar">
                    {[
                      { id: 'all', label: t.allUnits, icon: Activity },
                      { id: 'Degraded', label: t.degraded, icon: ShieldAlert },
                      { id: 'Normal', label: t.normal, icon: ShieldCheck }
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => setFilterType(btn.id as any)}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all whitespace-nowrap ${
                          filterType === btn.id 
                          ? 'bg-white/10 text-white shadow-xl' 
                          : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <btn.icon size={14} className={filterType === btn.id ? 'text-amber-500' : ''} />
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <AnimatePresence mode="popLayout">
                  {isRefreshing ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <SkeletonCard key={`skeleton-${i}`} />
                    ))
                  ) : (
                    displayedUnits.map((u, i) => (
                      <UnitCard 
                        key={u.id} 
                        unit={u} 
                        index={i} 
                        onClick={() => setSelectedUnit(u)} 
                        onDiagnose={(e) => handleAIDiagnose(u, e)}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>

              {!isRefreshing && displayedUnits.length > 0 && (
                <div className="flex justify-center pt-4">
                  <button 
                    onClick={() => setShowAllUnits(!showAllUnits)}
                    className="px-8 py-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-2xl text-[10px] text-zinc-500 hover:text-white font-mono uppercase tracking-[0.2em] transition-all"
                  >
                    {showAllUnits ? t.viewLess : t.viewMore}
                  </button>
                </div>
              )}

              {!isRefreshing && displayedUnits.length === 0 && (
                <div className="py-20 text-center">
                  <div className="inline-flex p-4 bg-white/5 rounded-full text-zinc-600 mb-4">
                    <Search size={32} />
                  </div>
                  <p className="text-zinc-500 font-light text-sm">No units found matching your search or filter.</p>
                </div>
              )}
            </section>

            {/* Right Panel */}
            <aside className="space-y-8 lg:sticky lg:top-12">
              
              {/* Status Legend Card */}
              <div className="glass-card rounded-[2rem] p-6 border-white/5 bg-white/[0.01]">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4 px-1">System Status Key</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-2 rounded-xl hover:bg-white/[0.02] transition-colors">
                    <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)] shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold tracking-tight text-white uppercase text-left">Operational</p>
                      <p className="text-[10px] text-zinc-500 leading-snug text-left">Output within nominal range</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-2 rounded-xl hover:bg-white/[0.02] transition-colors">
                    <div className="mt-1 w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.3)] shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold tracking-tight text-amber-500 uppercase text-left">Degraded</p>
                      <p className="text-[10px] text-zinc-500 leading-snug text-left">Restricted by environment</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-2 rounded-xl hover:bg-white/[0.02] transition-colors">
                    <div className="mt-1 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)] shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold tracking-tight text-rose-500 uppercase text-left">Critical</p>
                      <p className="text-[10px] text-zinc-500 leading-snug text-left">Communication loss / Failure</p>
                    </div>
                  </div>
                </div>
              </div>

              <AICoPilot 
                showWeatherAlert={showWeatherAlert} 
                isExecuting={isExecuting} 
                setIsRerouteConfirmOpen={setIsRerouteConfirmOpen} 
                setMitigationPlan={setMitigationPlan}
                t={t} 
                units={units}
                isolatedUnits={isolatedUnits}
              />

              {/* Logs */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <Terminal size={14} className="text-zinc-600" />
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600">{t.systemLogs}</h3>
                </div>
                
                <div className="glass-card rounded-2xl overflow-hidden">
                  <div className="divide-y divide-white/[0.05]">
                    {logs.map((log) => (
                      <div key={log.id} className="p-4 flex gap-3 group hover:bg-white/[0.01] transition-colors text-left">
                        <span className="text-[10px] font-mono text-zinc-600 pt-0.5">{log.timestamp}</span>
                        <p className={`text-[11px] leading-relaxed ${
                          log.type === 'error' ? 'text-rose-400' : 
                          log.type === 'warning' ? 'text-amber-400' : 
                          'text-zinc-400'
                        }`}>
                          {log.message}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-white/[0.02] text-center">
                    <button 
                      onClick={() => setIsLogsModalOpen(true)}
                      className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
                    >
                      View All Activity
                    </button>
                  </div>
                </div>
              </section>

            </aside>
          </div>
        </div>
      </div>
      {/* Global Status Bar - Fixed Viewport */}
      <footer className={`fixed bottom-0 left-0 right-0 w-full p-2 md:p-4 pointer-events-none z-40 transition-all duration-300 ${isSidebarOpen ? 'md:pl-[260px]' : 'pl-0 md:pl-[80px]'}`}>
        <div className="max-w-[1720px] mx-auto flex justify-center items-center gap-4">
          <div className="glass-card backdrop-blur-3xl px-4 md:px-6 py-1.5 md:py-2.5 rounded-full flex items-center gap-3 md:gap-8 pointer-events-auto shadow-2xl border-white/5 ring-1 ring-white/5 bg-black/60">
            <div className="flex items-center gap-2">
               <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-400 whitespace-nowrap">Node 04-A: Active</span>
            </div>
            <div className="h-3 md:h-4 w-px bg-white/10" />
            <div className="flex items-center gap-3 md:gap-4 text-[8px] md:text-[10px] font-mono text-zinc-500 uppercase tracking-tight md:tracking-[.25em] whitespace-nowrap">
               <span>P_TOT: {totalPower}kW</span>
               <span>T_AMB: 24.2°C</span>
            </div>
          </div>
        </div>
      </footer>

      {/* System Guide Modal */}
      <SystemGuide 
        isGuideOpen={isGuideOpen} 
        setIsGuideOpen={setIsGuideOpen} 
        t={t} 
      />

      {/* Reroute Confirmation Modal */}
      <AnimatePresence>
        {isRerouteConfirmOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-[90vw] max-w-md max-h-[90vh] overflow-y-auto bg-brand-bg border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center gap-6">
                <div className="p-4 bg-amber-500/10 text-amber-500 rounded-full ring-1 ring-amber-500/20">
                  <Activity size={32} />
                </div>
                <h3 className="text-lg font-semibold text-white tracking-tight">System Intervention</h3>
                <p className="text-sm text-zinc-400 font-light leading-relaxed">
                  {language === 'EN' 
                    ? `Confirm execution of the proposed mitigation plan to stabilize ${mitigationPlan.map(p => p.unitId).join(' & ')}?`
                    : `Konfirmasi eksekusi rencana mitigasi yang diusulkan untuk menstabilkan ${mitigationPlan.map(p => p.unitId).join(' & ')}?`}
                </p>
                <div className="flex flex-col gap-3 w-full">
                  <button 
                    onClick={() => handleReroute(pendingChatActionIndex)}
                    className="w-full py-3 bg-amber-500 text-black rounded-xl text-[10px] uppercase font-bold tracking-widest hover:bg-amber-400 transition-colors"
                  >
                    {t.confirmExecution}
                  </button>
                  <button 
                    onClick={() => {
                      setIsRerouteConfirmOpen(false);
                      setPendingChatActionIndex(undefined);
                    }}
                    className="w-full py-3 text-[10px] uppercase font-bold tracking-widest text-zinc-500 hover:text-white transition-colors"
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-[90vw] max-w-md max-h-[90vh] overflow-y-auto bg-brand-bg border border-white/10 rounded-2xl p-6 shadow-2xl text-center"
            >
              <div className="flex flex-col items-center text-center gap-6">
                <div className="p-4 bg-white/5 text-amber-500 rounded-full">
                  <FileSpreadsheet size={32} />
                </div>
                <p className="text-sm text-zinc-300 font-light leading-relaxed">
                  {t.exportConfirm}
                </p>
                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => setIsExportModalOpen(false)}
                    className="flex-1 py-3 text-[10px] uppercase font-bold tracking-widest text-zinc-500 hover:text-white transition-colors"
                  >
                    {t.cancel}
                  </button>
                  <button 
                    onClick={handleExportData}
                    className="flex-1 py-3 bg-white text-black rounded-xl text-[10px] uppercase font-bold tracking-widest hover:bg-zinc-200 transition-colors"
                  >
                    {t.confirm}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Activity Logs Modal */}
      <AnimatePresence>
        {isLogsModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div 
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="relative w-[95vw] max-w-2xl h-[80vh] flex flex-col bg-brand-bg border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white tracking-tight">{t.fullLogs}</h2>
                  <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Extended History • Fleet 01</p>
                </div>
                <button 
                  onClick={() => setIsLogsModalOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full text-zinc-500 transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-4 scroll-smooth">
                {/* Dynamic logs from state */}
                {logs.map((log, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={log.id} 
                    className="flex gap-6 pb-4 border-b border-white/[0.03] group"
                  >
                    <span className="text-[10px] font-mono text-zinc-500 pt-1 w-20 shrink-0">{log.timestamp}</span>
                    <p className={`text-sm font-light ${
                      log.type === 'error' ? 'text-rose-400' : 
                      log.type === 'warning' ? 'text-amber-400' : 
                      'text-emerald-400/80'
                    }`}>
                      {log.message}
                    </p>
                  </motion.div>
                ))}
                
                {/* Historical dummy logs */}
                {[
                  { time: '12:30 PM', msg: 'Peak production state reached • Fleet output 25.4 MW', type: 'info' },
                  { time: '11:05 AM', msg: 'Grid balance adjustment performed by Automated Control', type: 'info' },
                  { time: '09:12 AM', msg: 'Daily diagnostic routine completed: 0 errors detected', type: 'info' },
                  { time: '08:00 AM', msg: 'System startup normal • All nodes reporting green', type: 'info' },
                ].map((log, i) => (
                  <div key={`hist-${i}`} className="flex gap-6 pb-4 border-b border-white/[0.03] opacity-40 grayscale group hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-mono text-zinc-600 pt-1 w-20 shrink-0">{log.time}</span>
                    <p className="text-sm font-light text-zinc-500">
                      {log.msg}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-white/[0.02] flex justify-end">
                <button 
                  onClick={() => setIsLogsModalOpen(false)}
                  className="px-8 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-[10px] uppercase font-bold text-white transition-all tracking-widest"
                >
                  {t.close}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Unit Detail Modal */}
      <AnimatePresence>
        {activeUnit && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-[95vw] md:max-w-2xl h-[90vh] overflow-y-auto bg-brand-bg border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl custom-scrollbar"
            >
              <button 
                onClick={() => setSelectedUnit(null)}
                className="absolute top-8 right-8 p-2 hover:bg-white/5 rounded-full text-zinc-500 transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col md:flex-row gap-8 mb-8">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${activeUnit.status === 'Isolated' ? 'bg-zinc-500' : activeUnit.status === 'Critical' ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]' : activeUnit.status === 'Degraded' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                    <h2 className="text-2xl font-semibold text-white tracking-tight">{activeUnit.id}</h2>
                    {activeUnit.isRerouted && (
                      <span className="px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded-sm ml-2">
                        Rerouted
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">{activeUnit.name} • NODE-04-A</p>
                </div>
                <div className="flex gap-4">
                  <div className="p-4 glass-card bg-white/[0.02] rounded-3xl min-w-[120px]">
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-1">Efficiency</p>
                    <p className="text-xl font-mono text-white">{(activeUnit.status === 'Critical' || activeUnit.status === 'Isolated') ? '0.0%' : activeUnit.status === 'Degraded' ? '88.2%' : '94.8%'}</p>
                  </div>
                  <div className="p-4 glass-card bg-white/[0.02] rounded-3xl min-w-[120px]">
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-1">Temp</p>
                    <p className="text-xl font-mono text-white">34.2 °C</p>
                  </div>
                </div>
              </div>

              {/* Performance Visualization */}
              <div className="glass-card rounded-[2rem] p-6 mb-8 bg-white/[0.01]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">24H Output Curve (kW)</h3>
                  <div className="flex gap-2">
                    <div className={`px-2 py-1 text-[10px] rounded font-mono uppercase ${
                      activeUnit.status === 'Critical' ? 'bg-red-500/20 text-red-500' :
                      activeUnit.status === 'Isolated' ? 'bg-zinc-500/20 text-zinc-400' :
                      activeUnit.status === 'Degraded' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-emerald-500/10 text-emerald-500'
                    }`}>
                      {activeUnit.status === 'Critical' ? 'OFFLINE' : activeUnit.status === 'Isolated' ? 'ISOLATED' : activeUnit.status === 'Degraded' ? 'RESTRICTED' : 'OPTIMAL'}
                    </div>
                  </div>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={unitHistoryData}>
                      <defs>
                        <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={activeUnit.status === 'Critical' ? '#ef4444' : activeUnit.status === 'Isolated' ? '#71717a' : activeUnit.status === 'Degraded' ? '#f59e0b' : '#10b981'} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={activeUnit.status === 'Critical' ? '#ef4444' : activeUnit.status === 'Isolated' ? '#71717a' : activeUnit.status === 'Degraded' ? '#f59e0b' : '#10b981'} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis 
                        dataKey="time" 
                        stroke="#52525b" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        interval={3}
                      />
                      <YAxis 
                        stroke="#52525b" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                      />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: '#09090b', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="power" 
                        stroke={activeUnit.status === 'Critical' ? '#ef4444' : activeUnit.status === 'Isolated' ? '#71717a' : activeUnit.status === 'Degraded' ? '#f59e0b' : '#10b981'} 
                        fillOpacity={1} 
                        fill="url(#colorPower)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Diagnostic Codes */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 glass-card bg-white/[0.02] rounded-3xl">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-4">Diagnostic Codes</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">HV_DC_INPUT</span>
                      <span className={`font-mono ${activeUnit.status === 'Critical' ? 'text-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : activeUnit.status === 'Isolated' ? 'text-zinc-500' : 'text-emerald-500'}`}>
                        {activeUnit.status === 'Critical' ? activeUnit.diagnostics?.HV_DC_INPUT || 'FAULT' : activeUnit.status === 'Isolated' ? 'STANDBY' : 'OK'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">MPPT_LOCK</span>
                      <span className={`font-mono ${activeUnit.status === 'Critical' ? 'text-red-500' : activeUnit.status === 'Isolated' ? 'text-zinc-500' : activeUnit.status === 'Degraded' ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {activeUnit.status === 'Critical' ? activeUnit.diagnostics?.MPPT_LOCK || 'ERROR' : activeUnit.status === 'Isolated' ? 'STANDBY' : activeUnit.status === 'Degraded' ? 'WARN-02' : 'OK'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">GRID_SYNC</span>
                      <span className={`font-mono ${activeUnit.status === 'Critical' ? 'text-red-500' : activeUnit.status === 'Isolated' ? 'text-zinc-500' : 'text-emerald-500'}`}>
                        {activeUnit.status === 'Critical' ? activeUnit.diagnostics?.GRID_SYNC || 'LOSS' : activeUnit.status === 'Isolated' ? 'DISCONNECT' : 'OK'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-6 glass-card bg-white/[0.02] rounded-3xl">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-4">Hardware Info</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Firmware</span>
                      <span className="text-zinc-300 font-mono">v4.2.1-p</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Last Service</span>
                      <span className="text-zinc-300 font-mono">Apr 2026</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button 
                  onClick={() => setSelectedUnit(null)}
                  className="w-full py-4 glass-card bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-3xl font-semibold text-xs uppercase tracking-[0.2em] transition-all"
                >
                  Close Detailed View
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Diagnosis Modal */}
      <AnimatePresence>
        {isDiagnosisModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDiagnosing && setIsDiagnosisModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-[90vw] max-w-lg bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] rounded-3xl p-8 overflow-hidden pointer-events-auto"
            >
              {isDiagnosing && (
                <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                   <div className="h-full bg-amber-500 w-1/3 animate-[pulse_1.5s_infinite] shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                </div>
              )}
              
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                    <Sparkles size={24} className="text-black" />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium tracking-tight text-white">AI Diagnostic</h3>
                    <p className="text-xs text-zinc-400 font-mono tracking-widest uppercase mt-1">Powered by Gemini 2.5</p>
                  </div>
                </div>
                {!isDiagnosing && (
                  <button 
                    onClick={() => setIsDiagnosisModalOpen(false)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>

              <div className="min-h-[160px] max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                {isDiagnosing ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
                      <Sparkles size={36} className="text-amber-500 animate-bounce relative z-10" />
                    </div>
                    <p className="text-sm font-light text-zinc-300 animate-pulse tracking-wide">
                      Analyzing telemetry and knowledge base...
                    </p>
                  </div>
                ) : (
                  <div className="text-[13px] md:text-sm">
                    {diagnosisResult && formatDiagnosis(diagnosisResult)}
                  </div>
                )}
              </div>

              {!isDiagnosing && !isConfirmingAction && (
                <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleIndividualActionClick('isolate')} 
                      className="flex items-center gap-2 px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(244,63,94,0.1)] active:scale-95"
                    >
                      <ShieldAlert size={16} /> Isolate Unit
                    </button>
                    {units.find(u => u.id === diagnosisUnitId)?.status !== 'Critical' && (
                      <button 
                        onClick={() => handleIndividualActionClick('reroute')} 
                        className="flex items-center gap-2 px-5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(245,158,11,0.1)] active:scale-95"
                      >
                        <Activity size={16} /> Reroute
                      </button>
                    )}
                  </div>
                  <button 
                    onClick={() => setIsDiagnosisModalOpen(false)}
                    className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold tracking-wide transition-all shadow-lg backdrop-blur-sm"
                  >
                    Dismiss
                  </button>
                </div>
              )}
              
              {!isDiagnosing && isConfirmingAction && (
                <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-200">
                  <div className="text-center space-y-2">
                    <div className="inline-flex p-3 rounded-full bg-amber-500/10 text-amber-500 mb-2">
                      <ShieldAlert size={24} />
                    </div>
                    <p className="text-sm font-medium text-white">Action Confirmation required</p>
                    <p className="text-xs text-zinc-400 font-light leading-relaxed max-w-sm text-center">
                      Are you sure you want to <span className="text-amber-400 font-bold uppercase">{isConfirmingAction}</span> {diagnosisUnitId}? This manipulation directly affects grid distribution variables.
                    </p>
                  </div>
                  <div className="flex w-full gap-3 mt-2">
                    <button 
                      onClick={() => setIsConfirmingAction(null)}
                      className="flex-1 py-3 text-[10px] uppercase font-bold tracking-widest text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={executeIndividualAction}
                      disabled={isExecuting}
                      className={`flex-1 py-3 text-[10px] uppercase font-bold tracking-widest rounded-xl transition-all shadow-lg text-black ${
                        isConfirmingAction === 'isolate' ? 'bg-rose-500 hover:bg-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'bg-amber-500 hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                      }`}
                    >
                      {isExecuting ? 'Executing...' : 'Confirm Execution'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Assistant Modal & FAB */}
      <AIAssistantChat
        isChatModalOpen={isChatModalOpen}
        setIsChatModalOpen={setIsChatModalOpen}
        chatHistory={chatHistory}
        isTyping={isTyping}
        chatMessage={chatMessage}
        setChatMessage={setChatMessage}
        handleSendChat={handleSendChat}
        handleReroute={(index?: number) => {
          if (index !== undefined) {
            setPendingChatActionIndex(index);
            setIsRerouteConfirmOpen(true);
          } else {
            handleReroute();
          }
        }}
        handleRejectAction={handleRejectAction}
        onActionSuccess={handleChatActionSuccess}
        t={t}
      />

    </div>
  );
}

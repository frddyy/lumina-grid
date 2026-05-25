import { useState, useEffect, useRef, MutableRefObject } from 'react';
import { InverterUnit } from '../types';

export const useTelemetry = (isolatedUnitsRef: MutableRefObject<string[]>, reroutedUnitsRef: MutableRefObject<string[]>) => {
  const [units, setUnits] = useState<InverterUnit[]>([]);
  const [lastUpdated, setLastUpdated] = useState('Just now');
  const forcedCriticalRef = useRef<string[]>([]); // To maintain dev override

  useEffect(() => {
    // Developer Testing Trigger: Shift + C
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === 'c') {
        if (!forcedCriticalRef.current.includes('Unit 12')) {
           forcedCriticalRef.current.push('Unit 12');
        }
        setUnits(prev => prev.map(u => 
          u.id === 'Unit 12' ? { 
            ...u, 
            status: 'Critical', 
            current_power_kw: 0,
            efficiency: 0,
            diagnostics: { HV_DC_INPUT: 'FAULT', MPPT_LOCK: 'ERROR', GRID_SYNC: 'LOSS' }
          } : u
        ));
        console.log("🛠️ Dev Trigger: Unit 12 forced to Critical state.");
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:3000/api/telemetry/stream');
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.length > 0) {
          setUnits(prev => {
            const mergedMap = new Map();
            prev.forEach(u => mergedMap.set(u.id, u));
            
            data.forEach((incomingUnit: InverterUnit) => {
              // THIS IS THE CRITICAL FIX: preserve isRerouted from existing unit
              const existingUnit = mergedMap.get(incomingUnit.id);
              incomingUnit.isRerouted = existingUnit ? existingUnit.isRerouted : false;

              // 1. Check if isolated
              if (isolatedUnitsRef.current.includes(incomingUnit.id)) {
                mergedMap.set(incomingUnit.id, { ...incomingUnit, current_power_kw: 0, status: 'Isolated' });
                return;
              }
              
              // Developer override persistence
              if (forcedCriticalRef.current.includes(incomingUnit.id)) {
                mergedMap.set(incomingUnit.id, { 
                  ...incomingUnit, 
                  current_power_kw: 0, 
                  status: 'Critical',
                  efficiency: 0,
                  diagnostics: { HV_DC_INPUT: 'FAULT', MPPT_LOCK: 'ERROR', GRID_SYNC: 'LOSS' }
                });
                return;
              }

              // 2. LKGV: fallback to prev if incoming is 0
              if (incomingUnit.current_power_kw === 0 || !incomingUnit.current_power_kw) {
                const prevUnit = mergedMap.get(incomingUnit.id);
                if (prevUnit && prevUnit.current_power_kw > 0 && prevUnit.status !== 'Isolated' && prevUnit.status !== 'Critical') {
                  mergedMap.set(incomingUnit.id, { ...incomingUnit, current_power_kw: prevUnit.current_power_kw, status: prevUnit.status });
                  return;
                }
              }
              
              if (reroutedUnitsRef.current.includes(incomingUnit.id)) {
                incomingUnit.isRerouted = true;
              }
              
              mergedMap.set(incomingUnit.id, incomingUnit);
            });
            
            return Array.from(mergedMap.values());
          });
          setLastUpdated(new Date().toLocaleTimeString());
        }
      } catch (e) {
        console.error("Error parsing telemetry stream:", e);
      }
    };
    
    eventSource.onerror = (err) => {
      console.error("🔴 [SSE] Connection Error:", err);
    };
    
    return () => eventSource.close();
  }, [isolatedUnitsRef, reroutedUnitsRef]);

  return { units, setUnits, lastUpdated, setLastUpdated };
};

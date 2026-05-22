export interface InverterUnit {
  id: string;
  name: string;
  current_power_kw: number;
  status: 'Normal' | 'Degraded' | 'Isolated' | 'Critical';
  solar_irradiation: number;
  last_updated: string;
  efficiency?: number;
  diagnostics?: {
    HV_DC_INPUT: string;
    MPPT_LOCK: string;
    GRID_SYNC: string;
  };
  isRerouted?: boolean;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error';
  message: string;
}

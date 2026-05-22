import { apiClient } from './apiClient';

export interface TelemetryData {
  unitName: string;
  status?: string;
  acPower: number;
  dcPower: number;
  ambientTemp: number;
  moduleTemp: number;
  irradiation: number;
}

export const aiService = {
  analyzeTelemetry: async (data: TelemetryData) => {
    const response = await apiClient.post('/ai/analyze', data);
    return response.data;
  },
  
  chatWithAI: async (userMessage: string, gridContext: any) => {
    const response = await apiClient.post('/ai/chat', { userMessage, gridContext });
    return response.data;
  },
};

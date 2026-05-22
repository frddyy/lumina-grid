import { apiClient } from './apiClient';

export const gridService = {
  executeGridAction: async (actionName: string, unitTarget: string, status: string = 'executed') => {
    const response = await apiClient.post('/grid/execute', { actionName, unitTarget, status });
    return response.data;
  },
  executeBatchActions: async (actions: { unitId: string, action: string }[]) => {
    const response = await apiClient.post('/grid/execute', actions);
    return response.data;
  },
};

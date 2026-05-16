import { apiClient } from './client';

export async function getCexFlowLeaderboard(options = {}) {
  const response = await apiClient.get('/markets/cex-flow-leaderboard', {
    params: {
      range: options.range || '1m',
      limit: options.limit || 50,
      offset: options.offset || 0,
      ...(options.source ? { source: options.source } : {}),
      ...(options.fromDate ? { fromDate: options.fromDate } : {}),
      ...(options.toDate ? { toDate: options.toDate } : {})
    }
  });

  return response.data.data;
}

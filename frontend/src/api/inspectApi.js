import { apiClient } from './client';
import { refreshRecentCexFlowPipeline } from './tokensApi';

export async function resolveToken(query, chain = 'ethereum') {
  const response = await apiClient.post('/tokens/resolve', {
    chain,
    query
  });

  return response.data.data;
}

export async function analyzeResolvedToken(symbol, options = {}) {
  return refreshRecentCexFlowPipeline(symbol, {
    range: options.range || '1m',
    blocksBack: options.blocksBack || 216000,
    offset: options.offset || 50,
    maxPages: options.maxPages || 2,
    maxAddresses: options.maxAddresses || 7,
    valuationLimit: options.valuationLimit || 1000,
    largeTransferThresholdUsd: options.largeTransferThresholdUsd || 50000
  });
}

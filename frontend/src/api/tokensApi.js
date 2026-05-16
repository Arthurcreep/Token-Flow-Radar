import { apiClient } from './client';

export async function getTokens() {
  const response = await apiClient.get('/tokens');
  return response.data.data;
}

export async function getTokenOverview(symbol) {
  const response = await apiClient.get(`/tokens/${symbol}/overview`);
  return response.data.data;
}

export async function getTokenCexFlows(symbol, source) {
  const response = await apiClient.get(`/tokens/${symbol}/cex-flows`, {
    params: source ? { source } : {}
  });

  return response.data.data;
}

export async function getTokenTopHolders(symbol) {
  const response = await apiClient.get(`/tokens/${symbol}/holders/top`);
  return response.data.data;
}

export async function getTokenSignals(symbol) {
  const response = await apiClient.get(`/tokens/${symbol}/signals`);
  return response.data.data;
}

export async function ingestTokenTransfers(symbol) {
  const response = await apiClient.post(`/jobs/ingest-transfers/${symbol}`, null, {
    params: {
      offset: 50,
      maxPages: 1
    }
  });

  return response.data.data;
}

export async function ingestRecentTokenTransfers(symbol, options = {}) {
  const response = await apiClient.post(`/jobs/ingest-recent-transfers/${symbol}`, null, {
    params: {
      blocksBack: options.blocksBack || 500000,
      offset: options.offset || 50,
      maxPages: options.maxPages || 2,
      maxAddresses: options.maxAddresses || 7
    }
  });

  return response.data.data;
}

export async function calculateCexFlows(symbol, source) {
  const response = await apiClient.post(`/jobs/calculate-cex-flows/${symbol}`, null, {
    params: source ? { source } : {}
  });

  return response.data.data;
}

export async function calculateTokenMetrics(symbol) {
  const response = await apiClient.post(`/jobs/calculate-token-metrics/${symbol}`);
  return response.data.data;
}

export async function generateTokenSignals(symbol) {
  const response = await apiClient.post(`/jobs/generate-signals/${symbol}`);
  return response.data.data;
}

export async function refreshTokenPipeline(symbol) {
  const cexFlows = await calculateCexFlows(symbol);
  const metrics = await calculateTokenMetrics(symbol);
  const signal = await generateTokenSignals(symbol);

  return {
    cexFlows,
    metrics,
    signal
  };
}

export async function refreshRecentCexFlowPipeline(symbol, options = {}) {
  const transferSource = 'etherscan_v2_recent_cex_address_tokentx';
  const calculatedSource = 'calculated_from_etherscan_v2_recent_cex_address_tokentx';

  const ingestion = await ingestRecentTokenTransfers(symbol, options);
  const cexFlowJob = await calculateCexFlows(symbol, transferSource);
  const cexFlows = await getTokenCexFlows(symbol, calculatedSource);

  return {
    ingestion,
    cexFlowJob,
    cexFlows,
    transferSource,
    calculatedSource
  };
}

export async function ingestAndRefreshTokenPipeline(symbol) {
  const ingestion = await ingestTokenTransfers(symbol);
  const refreshed = await refreshTokenPipeline(symbol);

  return {
    ingestion,
    ...refreshed
  };
}

import { apiClient } from './client';

export async function getTokens() {
  const response = await apiClient.get('/tokens');
  return response.data.data;
}

export async function getTokenOverview(symbol) {
  const response = await apiClient.get(`/tokens/${symbol}/overview`);
  return response.data.data;
}

export async function getTokenCexFlows(symbol) {
  const response = await apiClient.get(`/tokens/${symbol}/cex-flows`);
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

export async function calculateCexFlows(symbol) {
  const response = await apiClient.post(`/jobs/calculate-cex-flows/${symbol}`);
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

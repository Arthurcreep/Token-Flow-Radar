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
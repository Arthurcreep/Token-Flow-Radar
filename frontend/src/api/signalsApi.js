import { apiClient } from './client';

export async function getSignals() {
  const response = await apiClient.get('/signals');
  return response.data.data;
}
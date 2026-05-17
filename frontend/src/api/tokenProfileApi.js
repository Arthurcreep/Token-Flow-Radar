const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

async function requestJson(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  const payload = await response.json();

  if (!response.ok || payload?.success === false) {
    const error = new Error(payload?.error?.message || 'Request failed');

    error.code = payload?.error?.code || 'REQUEST_FAILED';
    error.details = payload?.error?.details || null;
    error.payload = payload;

    throw error;
  }

  return payload.data;
}

export async function getTokenProfile({
  symbol,
  range = '1m'
}) {
  return requestJson(`/tokens/${encodeURIComponent(symbol)}/flow-profile?range=${encodeURIComponent(range)}`);
}

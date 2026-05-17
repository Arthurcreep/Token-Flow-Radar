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

export async function getTokenCexFlows({
  symbol,
  range = '1m',
  source = 'calculated_from_etherscan_v2_recent_cex_address_tokentx'
}) {
  return requestJson(
    `/tokens/${encodeURIComponent(symbol)}/cex-flows?source=${encodeURIComponent(source)}&range=${encodeURIComponent(range)}`
  );
}

export async function getTokenPriceContext(symbol) {
  return requestJson(`/price-context/${encodeURIComponent(symbol)}`);
}

export async function getTokenFlowDiagnostics({
  symbol,
  range = '1m'
}) {
  return requestJson(`/tokens/${encodeURIComponent(symbol)}/flow-diagnostics?range=${encodeURIComponent(range)}`);
}

export async function getTokenLeaderboardProfile({
  symbol,
  range = '1m',
  source = 'calculated_from_etherscan_v2_recent_cex_address_tokentx'
}) {
  const data = await requestJson(
    `/markets/cex-flow-leaderboard?range=${encodeURIComponent(range)}&source=${encodeURIComponent(source)}&limit=100`
  );

  const normalizedSymbol = String(symbol || '').toUpperCase();
  const item = (data.items || []).find((leaderboardItem) => (
    String(leaderboardItem.token?.symbol || '').toUpperCase() === normalizedSymbol
  ));

  return {
    leaderboard: data,
    item: item || null
  };
}

export async function getTokenProfile({
  symbol,
  range = '1m'
}) {
  const [
    cexFlows,
    priceContextData,
    leaderboardProfile,
    flowDiagnostics
  ] = await Promise.all([
    getTokenCexFlows({
      symbol,
      range
    }),
    getTokenPriceContext(symbol),
    getTokenLeaderboardProfile({
      symbol,
      range
    }),
    getTokenFlowDiagnostics({
      symbol,
      range
    })
  ]);

  return {
    symbol: String(symbol || '').toUpperCase(),
    range,
    cexFlows,
    priceContext: priceContextData.priceContext || null,
    token: cexFlows.items?.[0]?.token || priceContextData.token || leaderboardProfile.item?.token || flowDiagnostics.token || null,
    leaderboardItem: leaderboardProfile.item,
    analysisProfile: leaderboardProfile.item?.analysisProfile || null,
    flowDiagnostics
  };
}

const AppError = require('../../errors/AppError');

const COINGECKO_API_URL = process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';

function makeAppError(message, statusCode, code, details = null) {
  const error = new AppError(message, statusCode, code, details);

  error.code = code;
  error.statusCode = statusCode;
  error.details = details;

  return error;
}

function chunkArray(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

async function fetchMarketsByIds(coingeckoIds = []) {
  const uniqueIds = [...new Set(coingeckoIds.filter(Boolean))];

  if (!uniqueIds.length) return [];

  const chunks = chunkArray(uniqueIds, 100);
  const allRows = [];

  for (const chunk of chunks) {
    const url = new URL(`${COINGECKO_API_URL}/coins/markets`);

    url.searchParams.set('vs_currency', 'usd');
    url.searchParams.set('ids', chunk.join(','));
    url.searchParams.set('order', 'market_cap_desc');
    url.searchParams.set('per_page', String(chunk.length));
    url.searchParams.set('page', '1');
    url.searchParams.set('sparkline', 'false');
    url.searchParams.set('price_change_percentage', '24h,7d,30d');

    const response = await fetch(url, {
      headers: {
        accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw makeAppError(
        'CoinGecko markets request failed',
        502,
        'COINGECKO_MARKETS_FAILED',
        {
          status: response.status,
          ids: chunk
        }
      );
    }

    const payload = await response.json();

    if (!Array.isArray(payload)) {
      throw makeAppError(
        'CoinGecko markets response is not an array',
        502,
        'COINGECKO_MARKETS_BAD_RESPONSE',
        {
          ids: chunk
        }
      );
    }

    allRows.push(...payload);
  }

  return allRows;
}

module.exports = {
  fetchMarketsByIds
};

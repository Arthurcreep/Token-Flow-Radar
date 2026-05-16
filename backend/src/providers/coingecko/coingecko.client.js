const ExternalApiError = require('../../errors/ExternalApiError');

const DEFAULT_COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
const DEFAULT_RETRY_DELAY_MS = 1200;
const DEFAULT_MAX_RETRIES = 3;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildUrl(path, params = {}) {
  const baseUrl = process.env.COINGECKO_API_URL || DEFAULT_COINGECKO_API_URL;
  const url = new URL(`${baseUrl}${path}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url;
}

async function requestJsonWithRetry(url) {
  const maxRetries = Number(process.env.COINGECKO_MAX_RETRIES || DEFAULT_MAX_RETRIES);
  const retryDelayMs = Number(process.env.COINGECKO_RETRY_DELAY_MS || DEFAULT_RETRY_DELAY_MS);

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: 'application/json'
        }
      });

      if (response.status === 429 && attempt <= maxRetries) {
        await sleep(retryDelayMs * attempt);
        continue;
      }

      if (!response.ok) {
        throw new ExternalApiError(
          'CoinGecko request failed',
          'COINGECKO_HTTP_ERROR',
          {
            status: response.status,
            statusText: response.statusText
          }
        );
      }

      return response.json();
    } catch (error) {
      lastError = error;

      if (attempt <= maxRetries) {
        await sleep(retryDelayMs * attempt);
        continue;
      }
    }
  }

  throw lastError;
}

async function fetchCurrentUsdPrice(coingeckoId) {
  if (!coingeckoId) {
    throw new ExternalApiError(
      'CoinGecko id is required',
      'COINGECKO_ID_REQUIRED',
      {}
    );
  }

  const url = buildUrl('/simple/price', {
    ids: coingeckoId,
    vs_currencies: 'usd'
  });

  const payload = await requestJsonWithRetry(url);
  const price = payload?.[coingeckoId]?.usd;

  if (!price || Number.isNaN(Number(price))) {
    throw new ExternalApiError(
      'CoinGecko price not found',
      'COINGECKO_PRICE_NOT_FOUND',
      {
        coingeckoId,
        payload
      }
    );
  }

  return Number(price);
}

module.exports = {
  fetchCurrentUsdPrice
};

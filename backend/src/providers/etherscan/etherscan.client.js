const ExternalApiError = require('../../errors/ExternalApiError');

const DEFAULT_ETHERSCAN_API_URL = 'https://api.etherscan.io/v2/api';
const DEFAULT_CHAIN_ID = '1';
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 1200;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new ExternalApiError(
      `${name} is not configured`,
      'ETHERSCAN_CONFIG_MISSING',
      { env: name }
    );
  }

  return value;
}

function buildBaseUrl({ module, action, params = {} }) {
  const apiUrl = process.env.ETHERSCAN_API_URL || DEFAULT_ETHERSCAN_API_URL;
  const apiKey = getRequiredEnv('ETHERSCAN_API_KEY');
  const chainId = process.env.ETHERSCAN_CHAIN_ID || DEFAULT_CHAIN_ID;

  const url = new URL(apiUrl);

  url.searchParams.set('chainid', chainId);
  url.searchParams.set('module', module);
  url.searchParams.set('action', action);
  url.searchParams.set('apikey', apiKey);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url;
}

function isRateLimitPayload(payload) {
  const result = String(payload?.result || '').toLowerCase();
  const message = String(payload?.message || '').toLowerCase();

  return (
    result.includes('rate limit') ||
    result.includes('max calls per sec') ||
    message.includes('rate limit') ||
    message.includes('notok')
  );
}

async function requestJsonWithRetry(url) {
  const maxRetries = Number(process.env.ETHERSCAN_MAX_RETRIES || DEFAULT_MAX_RETRIES);
  const retryDelayMs = Number(process.env.ETHERSCAN_RETRY_DELAY_MS || DEFAULT_RETRY_DELAY_MS);

  let lastPayload = null;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt += 1) {
    const response = await fetch(url);

    if (!response.ok) {
      if (attempt <= maxRetries) {
        await sleep(retryDelayMs * attempt);
        continue;
      }

      throw new ExternalApiError(
        'Etherscan request failed',
        'ETHERSCAN_HTTP_ERROR',
        {
          status: response.status,
          statusText: response.statusText
        }
      );
    }

    const payload = await response.json();
    lastPayload = payload;

    if (payload.status === '0' && isRateLimitPayload(payload) && attempt <= maxRetries) {
      await sleep(retryDelayMs * attempt);
      continue;
    }

    return payload;
  }

  return lastPayload;
}

async function fetchLatestBlockNumber() {
  const url = buildBaseUrl({
    module: 'proxy',
    action: 'eth_blockNumber'
  });

  const payload = await requestJsonWithRetry(url);

  if (!payload.result) {
    throw new ExternalApiError(
      'Invalid latest block response',
      'ETHERSCAN_INVALID_LATEST_BLOCK_RESPONSE',
      {
        payload
      }
    );
  }

  const latestBlock = Number.parseInt(payload.result, 16);

  if (!Number.isInteger(latestBlock) || latestBlock <= 0) {
    throw new ExternalApiError(
      'Could not parse latest Ethereum block',
      'ETHERSCAN_LATEST_BLOCK_PARSE_ERROR',
      {
        result: payload.result
      }
    );
  }

  return latestBlock;
}

async function fetchErc20TransfersByAddress({
  address,
  contractAddress,
  startBlock = 0,
  endBlock = 999999999,
  page = 1,
  offset = 100,
  sort = 'asc'
}) {
  const url = buildBaseUrl({
    module: 'account',
    action: 'tokentx',
    params: {
      address,
      contractaddress: contractAddress,
      startblock: startBlock,
      endblock: endBlock,
      page,
      offset,
      sort
    }
  });

  const payload = await requestJsonWithRetry(url);

  if (payload.status === '0') {
    const message = payload.message || 'Etherscan returned error';

    if (message === 'No transactions found') {
      return [];
    }

    throw new ExternalApiError(
      message,
      'ETHERSCAN_API_ERROR',
      {
        result: payload.result
      }
    );
  }

  if (!Array.isArray(payload.result)) {
    throw new ExternalApiError(
      'Invalid Etherscan response',
      'ETHERSCAN_INVALID_RESPONSE',
      {
        payload
      }
    );
  }

  return payload.result;
}

module.exports = {
  fetchLatestBlockNumber,
  fetchErc20TransfersByAddress,
  sleep
};

require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api';

const FIRST_BATCH = [
  'MKR',
  'LDO',
  'PENDLE',
  'ENA',
  'PEPE'
];

const FULL_BATCH = [
  '1INCH',
  'AAVE',
  'ARB',
  'BAL',
  'COMP',
  'CRV',
  'CVX',
  'ENA',
  'ENS',
  'FET',
  'GRT',
  'LDO',
  'LINK',
  'MKR',
  'PENDLE',
  'PEPE',
  'RNDR',
  'SHIB',
  'SNX',
  'UNI',
  'WBTC'
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseSymbols() {
  if (process.env.SYMBOLS) {
    return process.env.SYMBOLS
      .split(',')
      .map((symbol) => symbol.trim().toUpperCase())
      .filter(Boolean);
  }

  const mode = String(process.env.UNIVERSE_ANALYZE_MODE || 'first').toLowerCase();

  if (mode === 'full') {
    return FULL_BATCH;
  }

  return FIRST_BATCH;
}

function parseNumberEnv(name, fallback) {
  const value = process.env[name];

  if (value === undefined || value === '') return fallback;

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) return fallback;

  return numberValue;
}

function getConfig() {
  return {
    source: process.env.TRANSFER_SOURCE || 'etherscan_v2_recent_cex_address_tokentx',
    calculatedSource: process.env.CALCULATED_SOURCE || 'calculated_from_etherscan_v2_recent_cex_address_tokentx',
    blocksBack: parseNumberEnv('BLOCKS_BACK', 216000),
    offset: parseNumberEnv('OFFSET', 50),
    maxPages: parseNumberEnv('MAX_PAGES', 2),
    maxAddresses: parseNumberEnv('MAX_ADDRESSES', 7),
    valuationLimit: parseNumberEnv('VALUATION_LIMIT', 1000),
    largeTransferThresholdUsd: parseNumberEnv('LARGE_TRANSFER_THRESHOLD_USD', 50000),
    delayMs: parseNumberEnv('UNIVERSE_ANALYZE_DELAY_MS', 2500)
  };
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();

  let payload = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch (error) {
    throw new Error(`Non-JSON response from ${url}: ${text.slice(0, 500)}`);
  }

  if (!response.ok || payload?.success === false) {
    const message = payload?.error?.message || `HTTP ${response.status}`;
    const code = payload?.error?.code || 'HTTP_REQUEST_FAILED';

    const error = new Error(message);
    error.code = code;
    error.details = payload?.error?.details || null;
    error.payload = payload;

    throw error;
  }

  return payload;
}

async function post(url) {
  return requestJson(url, {
    method: 'POST'
  });
}

async function get(url) {
  return requestJson(url);
}

async function runIngest(symbol, config) {
  const url = `${API_BASE_URL}/jobs/ingest-recent-transfers/${symbol}?blocksBack=${config.blocksBack}&offset=${config.offset}&maxPages=${config.maxPages}&maxAddresses=${config.maxAddresses}`;

  return post(url);
}

async function runValuation(symbol, config) {
  const url = `${API_BASE_URL}/jobs/value-transfers/${symbol}?source=${encodeURIComponent(config.source)}&limit=${config.valuationLimit}`;

  return post(url);
}

async function runCexFlowCalculation(symbol, config) {
  const url = `${API_BASE_URL}/jobs/calculate-cex-flows/${symbol}?source=${encodeURIComponent(config.source)}&largeTransferThresholdUsd=${config.largeTransferThresholdUsd}`;

  return post(url);
}

async function runPriceContextUpdate(symbol) {
  const url = `${API_BASE_URL}/price-context/update?symbols=${encodeURIComponent(symbol)}`;

  return post(url);
}

async function verifyCexFlows(symbol, config) {
  const url = `${API_BASE_URL}/tokens/${symbol}/cex-flows?source=${encodeURIComponent(config.calculatedSource)}&range=1m`;

  return get(url);
}

function extractData(payload) {
  return payload?.data || {};
}

async function analyzeOneSymbol(symbol, config) {
  const startedAt = Date.now();
  const steps = [];

  try {
    console.log(`\n=== ${symbol} ===`);

    console.log('→ ingest recent transfers');
    const ingestPayload = await runIngest(symbol, config);
    const ingest = extractData(ingestPayload);

    steps.push({
      step: 'ingest',
      status: 'success',
      data: ingest
    });

    console.log('→ value transfers');
    const valuationPayload = await runValuation(symbol, config);
    const valuation = extractData(valuationPayload);

    steps.push({
      step: 'valuation',
      status: 'success',
      data: valuation
    });

    console.log('→ calculate CEX flows');
    const cexFlowsPayload = await runCexFlowCalculation(symbol, config);
    const cexFlows = extractData(cexFlowsPayload);

    steps.push({
      step: 'cex_flows',
      status: 'success',
      data: cexFlows
    });

    console.log('→ update price context');
    const pricePayload = await runPriceContextUpdate(symbol);
    const priceContext = extractData(pricePayload);

    steps.push({
      step: 'price_context',
      status: 'success',
      data: priceContext
    });

    console.log('→ verify cex flows');
    const verifyPayload = await verifyCexFlows(symbol, config);
    const verify = extractData(verifyPayload);

    steps.push({
      step: 'verify',
      status: 'success',
      data: {
        range: verify.range,
        summary: verify.summary
      }
    });

    console.log(`ok ${symbol}`);

    return {
      symbol,
      status: 'success',
      durationMs: Date.now() - startedAt,
      cexSummary: verify.summary || null,
      steps
    };
  } catch (error) {
    console.log(`failed ${symbol} code=${error.code || 'UNKNOWN'} message=${error.message}`);

    return {
      symbol,
      status: 'failed',
      durationMs: Date.now() - startedAt,
      steps,
      error: {
        code: error.code || 'ANALYZE_FAILED',
        message: error.message,
        details: error.details || null
      }
    };
  }
}

async function main() {
  const symbols = parseSymbols();
  const config = getConfig();

  console.log('=== Token Universe Analysis ===');
  console.log(`apiBaseUrl=${API_BASE_URL}`);
  console.log(`symbols=${symbols.join(',')}`);
  console.log(`count=${symbols.length}`);
  console.log(`source=${config.source}`);
  console.log(`blocksBack=${config.blocksBack}`);
  console.log(`offset=${config.offset}`);
  console.log(`maxPages=${config.maxPages}`);
  console.log(`maxAddresses=${config.maxAddresses}`);
  console.log(`valuationLimit=${config.valuationLimit}`);
  console.log(`largeTransferThresholdUsd=${config.largeTransferThresholdUsd}`);
  console.log(`delayMs=${config.delayMs}`);

  const results = [];

  for (let index = 0; index < symbols.length; index += 1) {
    const symbol = symbols[index];

    const result = await analyzeOneSymbol(symbol, config);

    results.push(result);

    if (index < symbols.length - 1) {
      await sleep(config.delayMs);
    }
  }

  const summary = {
    total: results.length,
    success: results.filter((item) => item.status === 'success').length,
    failed: results.filter((item) => item.status === 'failed').length
  };

  console.log('\n=== Summary ===');
  console.table(summary);

  console.log('\n=== Results ===');
  console.table(
    results.map((item) => ({
      symbol: item.symbol,
      status: item.status,
      durationMs: item.durationMs,
      netflowUsd: item.cexSummary?.cexNetflowUsd ?? '',
      regimeHint: item.cexSummary?.regimeHint ?? '',
      error: item.error?.code || ''
    }))
  );

  const failed = results.filter((item) => item.status === 'failed');

  if (failed.length) {
    console.log('\n=== Failed Details ===');
    console.dir(failed, {
      depth: 6
    });
  }
}

main().catch((error) => {
  console.error('Fatal universe analysis error:', error);
  process.exit(1);
});
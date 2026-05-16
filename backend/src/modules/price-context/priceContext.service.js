const AppError = require('../../errors/AppError');
const priceContextRepository = require('./priceContext.repository');
const coingeckoMarketDataClient = require('../../providers/coingecko/coingeckoMarketData.client');

function makeAppError(message, statusCode, code, details = null) {
  const error = new AppError(message, statusCode, code, details);

  error.code = code;
  error.statusCode = statusCode;
  error.details = details;

  return error;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  return Number(value);
}

function calculateDrawdownFromAthPct({
  currentPriceUsd,
  athUsd
}) {
  const current = toNumber(currentPriceUsd);
  const ath = toNumber(athUsd);

  if (!ath || ath <= 0) return 0;

  return ((current - ath) / ath) * 100;
}

function calculateUpsideToAthPct({
  currentPriceUsd,
  athUsd
}) {
  const current = toNumber(currentPriceUsd);
  const ath = toNumber(athUsd);

  if (!current || current <= 0 || !ath || ath <= 0) return 0;

  return ((ath - current) / current) * 100;
}

function serializePriceContextRow(row) {
  if (!row) return null;

  return {
    token: {
      id: row.token_id,
      symbol: row.symbol,
      name: row.name,
      chain: row.chain,
      contractAddress: row.contract_address,
      coingeckoId: row.coingecko_id
    },
    priceContext: row.current_price_usd === null || row.current_price_usd === undefined
      ? null
      : {
          date: row.date,
          currentPriceUsd: toNumber(row.current_price_usd),
          athUsd: toNumber(row.ath_usd),
          athDate: row.ath_date,
          drawdownFromAthPct: toNumber(row.drawdown_from_ath_pct),
          upsideToAthPct: toNumber(row.upside_to_ath_pct),
          athChangePercentage: toNumber(row.ath_change_percentage),
          provider: row.provider,
          source: row.source,
          updatedAt: row.updated_at
        }
  };
}

async function getMarketRowWithFallback({
  token,
  marketById
}) {
  const primaryRow = marketById.get(token.coingecko_id);

  if (primaryRow) {
    return {
      market: primaryRow,
      source: 'coingecko_markets'
    };
  }

  await sleep(Number(process.env.COINGECKO_FALLBACK_DELAY_MS || 700));

  const fallbackRow = await coingeckoMarketDataClient.fetchCoinMarketDataById(token.coingecko_id);

  if (!fallbackRow) {
    return {
      market: null,
      source: null
    };
  }

  return {
    market: fallbackRow,
    source: 'coingecko_coin_market_data'
  };
}

async function updateTokenPriceContext({
  symbols
}) {
  const normalizedSymbols = symbols?.length
    ? symbols.map((symbol) => symbol.toUpperCase())
    : undefined;

  const tokens = await priceContextRepository.findTokensForPriceContext({
    symbols: normalizedSymbols
  });

  if (!tokens.length) {
    return {
      updated: 0,
      skipped: 0,
      failed: 0,
      items: [],
      warning: normalizedSymbols?.length
        ? 'No tokens with CoinGecko id found for requested symbols.'
        : 'No active tokens with CoinGecko id found.'
    };
  }

  const markets = await coingeckoMarketDataClient.fetchMarketsByIds(
    tokens.map((token) => token.coingecko_id)
  );

  const marketById = new Map();

  for (const market of markets) {
    marketById.set(market.id, market);
  }

  const results = [];
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const token of tokens) {
    try {
      const {
        market,
        source
      } = await getMarketRowWithFallback({
        token,
        marketById
      });

      if (!market) {
        skipped += 1;
        results.push({
          symbol: token.symbol,
          status: 'skipped',
          reason: 'CoinGecko market row not found',
          coingeckoId: token.coingecko_id
        });
        continue;
      }

      const currentPriceUsd = toNumber(market.current_price);
      const athUsd = toNumber(market.ath);
      const drawdownFromAthPct = calculateDrawdownFromAthPct({
        currentPriceUsd,
        athUsd
      });
      const upsideToAthPct = calculateUpsideToAthPct({
        currentPriceUsd,
        athUsd
      });

      await priceContextRepository.upsertPriceContext({
        tokenId: token.id,
        currentPriceUsd,
        athUsd,
        athDate: market.ath_date || null,
        drawdownFromAthPct,
        upsideToAthPct,
        athChangePercentage: market.ath_change_percentage ?? drawdownFromAthPct,
        provider: 'coingecko',
        source,
        rawPayload: market
      });

      updated += 1;

      results.push({
        symbol: token.symbol,
        status: 'updated',
        source,
        currentPriceUsd,
        athUsd,
        drawdownFromAthPct,
        upsideToAthPct,
        athDate: market.ath_date || null
      });
    } catch (error) {
      failed += 1;

      results.push({
        symbol: token.symbol,
        status: 'failed',
        coingeckoId: token.coingecko_id,
        error: {
          code: error.code || 'PRICE_CONTEXT_UPDATE_FAILED',
          message: error.message,
          details: error.details || null
        }
      });
    }
  }

  return {
    updated,
    skipped,
    failed,
    items: results
  };
}

async function getTokenPriceContext(symbol) {
  const row = await priceContextRepository.findPriceContextBySymbol(symbol);

  if (!row) {
    throw makeAppError(
      `Token ${symbol.toUpperCase()} not found.`,
      404,
      'TOKEN_NOT_FOUND',
      {
        symbol: symbol.toUpperCase()
      }
    );
  }

  const serialized = serializePriceContextRow(row);

  if (!serialized.priceContext) {
    return {
      ...serialized,
      warning: 'No price context found. Run POST /api/price-context/update first.'
    };
  }

  return serialized;
}

module.exports = {
  updateTokenPriceContext,
  getTokenPriceContext
};

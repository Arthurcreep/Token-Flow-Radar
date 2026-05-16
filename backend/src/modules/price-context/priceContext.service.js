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

  const tokenByCoingeckoId = new Map();

  for (const token of tokens) {
    tokenByCoingeckoId.set(token.coingecko_id, token);
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

  for (const token of tokens) {
    const market = marketById.get(token.coingecko_id);

    if (!market) {
      skipped += 1;
      results.push({
        symbol: token.symbol,
        status: 'skipped',
        reason: 'CoinGecko market row not found'
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
      source: 'coingecko_markets',
      rawPayload: market
    });

    updated += 1;

    results.push({
      symbol: token.symbol,
      status: 'updated',
      currentPriceUsd,
      athUsd,
      drawdownFromAthPct,
      upsideToAthPct,
      athDate: market.ath_date || null
    });
  }

  return {
    updated,
    skipped,
    failed: 0,
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

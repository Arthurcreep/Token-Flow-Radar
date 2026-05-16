const coingeckoClient = require('../../providers/coingecko/coingecko.client');
const valuationRepository = require('./transferValuation.repository');
const NotFoundError = require('../../errors/NotFoundError');
const BadRequestError = require('../../errors/BadRequestError');

function numberValue(value) {
  if (value === null || value === undefined || value === '') return 0;
  return Number(value);
}

function roundUsd(value) {
  return Math.round(Number(value) * 100) / 100;
}

async function valueTransfersForToken({
  symbol,
  source,
  limit = 1000,
  force = false
}) {
  const token = await valuationRepository.findTokenBySymbol(symbol);

  if (!token) {
    throw new NotFoundError(`Token ${symbol} not found`, 'TOKEN_NOT_FOUND', {
      symbol
    });
  }

  const coingeckoId = token.coingecko_id || token.coingeckoId;

  if (!coingeckoId) {
    throw new BadRequestError(
      'Token does not have coingecko id',
      'TOKEN_COINGECKO_ID_MISSING',
      {
        symbol: token.symbol
      }
    );
  }

  const priceUsd = await coingeckoClient.fetchCurrentUsdPrice(coingeckoId);

  const transfers = await valuationRepository.findTransfersForValuation({
    tokenId: token.id,
    source,
    force,
    limit
  });

  let updated = 0;
  let skippedInvalidAmount = 0;
  let totalAmountUsd = 0;

  for (const transfer of transfers) {
    const amountDecimal = numberValue(transfer.amount_decimal);

    if (!amountDecimal || Number.isNaN(amountDecimal)) {
      skippedInvalidAmount += 1;
      continue;
    }

    const amountUsd = roundUsd(amountDecimal * priceUsd);

    await valuationRepository.updateTransferUsd({
      transferId: transfer.id,
      amountUsd
    });

    updated += 1;
    totalAmountUsd += amountUsd;
  }

  return {
    token: {
      id: token.id,
      symbol: token.symbol,
      name: token.name,
      coingeckoId
    },
    provider: 'coingecko',
    priceMode: 'current_price',
    priceUsd,
    source: source || 'all',
    force,
    limit,
    transfersMatched: transfers.length,
    updated,
    skippedInvalidAmount,
    totalAmountUsd: roundUsd(totalAmountUsd),
    warning:
      'MVP valuation uses current CoinGecko price, not historical price at transfer timestamp. Good enough for recent-flow severity, not for precise historical accounting.'
  };
}

module.exports = {
  valueTransfersForToken
};

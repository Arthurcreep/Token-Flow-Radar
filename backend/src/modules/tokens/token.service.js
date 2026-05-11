const tokenRepository = require('./token.repository');
const NotFoundError = require('../../errors/NotFoundError');
const metricService = require('../metrics/metric.service');

async function getTokens() {
  const tokens = await tokenRepository.findAllActive();

  return tokens.map((token) => ({
    id: token.id,
    symbol: token.symbol,
    name: token.name,
    chain: token.chain,
    contractAddress: token.contract_address,
    decimals: token.decimals,
    coingeckoId: token.coingecko_id
  }));
}

async function getTokenBySymbol(symbol) {
  const token = await tokenRepository.findBySymbol(symbol);

  if (!token) {
    throw new NotFoundError(`Token ${symbol} not found`, 'TOKEN_NOT_FOUND', {
      symbol
    });
  }

  return {
    id: token.id,
    symbol: token.symbol,
    name: token.name,
    chain: token.chain,
    contractAddress: token.contract_address,
    decimals: token.decimals,
    coingeckoId: token.coingecko_id
  };
}

async function getTokenOverview(symbol) {
  const token = await getTokenBySymbol(symbol);

  let latestMetric = null;

  try {
    latestMetric = await metricService.getLatestMetric({ symbol });
  } catch (error) {
    return {
      ...token,
      regime: 'UNCLEAR',
      finalScore: null,
      confidence: null,
      dataFreshness: 'metrics_not_calculated',
      message: 'Token registry is ready, but token metrics are not calculated yet.'
    };
  }

  return {
    ...token,
    date: latestMetric.date,
    regime: latestMetric.regime,
    finalScore: latestMetric.finalScore,
    confidence: latestMetric.confidence,
    explanation: latestMetric.explanation,
    scoreVersion: latestMetric.scoreVersion,
    dataFreshness: 'ready',

    cex: {
      inflow7d: latestMetric.cexInflow7d,
      outflow7d: latestMetric.cexOutflow7d,
      netflow7d: latestMetric.cexNetflow7d,
      netflowUsd7d: latestMetric.cexNetflowUsd7d,
      balanceChange7d: latestMetric.cexBalanceChange7d
    },

    holders: {
      nonCexBalanceChange7d: latestMetric.nonCexBalanceChange7d,
      cexBalanceChange7d: latestMetric.cexBalanceChange7d
    },

    score: {
      cexFlowScore: latestMetric.cexFlowScore,
      holderScore: latestMetric.holderScore,
      finalScore: latestMetric.finalScore,
      confidence: latestMetric.confidence
    }
  };
}

module.exports = {
  getTokens,
  getTokenBySymbol,
  getTokenOverview
};
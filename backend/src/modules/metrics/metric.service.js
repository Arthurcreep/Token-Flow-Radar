const metricRepository = require('./metric.repository');
const NotFoundError = require('../../errors/NotFoundError');
const BadRequestError = require('../../errors/BadRequestError');

const SCORE_VERSION = 'v1-simple-cex-holder-score';

function numberValue(value) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function dateOnly(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function daysAgo(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() - days);
  return dateOnly(result);
}

function isCexHolder(holder) {
  return holder.address?.entity?.entity_type === 'cex' || holder.address?.address_type === 'cex';
}

function getDataModeFromSource(source) {
  if (!source) return 'unknown';
  if (source.includes('manual_seed_fake')) return 'fake';
  if (source.includes('etherscan')) return 'real';
  if (source.includes('mixed')) return 'mixed';
  return 'unknown';
}

function combineDataModes(left, right) {
  if (left === right) return left;
  if (left === 'unknown') return right;
  if (right === 'unknown') return left;
  return 'mixed';
}

function getSourceLabel({ dataMode, cexFlowSource, holderSource }) {
  if (dataMode === 'fake') return 'Manual fake UNI seed scenario';
  if (dataMode === 'real') return 'Real data sources';
  if (dataMode === 'mixed') return 'Mixed real/fake data';
  return 'Unknown data sources';
}

function getSourceWarning({ dataMode, cexFlowSource, holderSource }) {
  if (dataMode === 'fake') {
    return 'This is demo seed data. Do not treat this as a real market signal.';
  }

  if (dataMode === 'mixed') {
    return `Mixed data warning: CEX flows source=${cexFlowSource || 'default'}, holders source=${holderSource || 'default'}. Do not treat this as a real accumulation/distribution signal.`;
  }

  if (dataMode === 'real') {
    return null;
  }

  return 'Data source mode is unknown.';
}

function buildCexSummary(flows) {
  return flows.reduce(
    (acc, flow) => {
      acc.cexInflow7d += numberValue(flow.cex_inflow);
      acc.cexOutflow7d += numberValue(flow.cex_outflow);
      acc.cexNetflow7d += numberValue(flow.cex_netflow);
      acc.cexNetflowUsd7d += numberValue(flow.cex_netflow_usd);
      return acc;
    },
    {
      cexInflow7d: 0,
      cexOutflow7d: 0,
      cexNetflow7d: 0,
      cexNetflowUsd7d: 0
    }
  );
}

function buildHolderSummary(holders) {
  return holders.reduce(
    (acc, holder) => {
      const change7d = numberValue(holder.balance_change_7d);

      if (isCexHolder(holder)) {
        acc.cexBalanceChange7d += change7d;
        acc.cexHolderCount += 1;
      } else {
        acc.nonCexBalanceChange7d += change7d;
        acc.nonCexHolderCount += 1;

        if (change7d > 0) acc.nonCexAccumulatingCount += 1;
        if (change7d < 0) acc.nonCexDistributingCount += 1;
      }

      return acc;
    },
    {
      cexBalanceChange7d: 0,
      nonCexBalanceChange7d: 0,
      cexHolderCount: 0,
      nonCexHolderCount: 0,
      nonCexAccumulatingCount: 0,
      nonCexDistributingCount: 0
    }
  );
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function calculateCexFlowScore(cexSummary) {
  const netflow = cexSummary.cexNetflow7d;

  if (netflow < 0) return 40;
  if (netflow > 0) return -40;

  return 0;
}

function calculateHolderScore(holderSummary) {
  let score = 0;

  if (holderSummary.nonCexBalanceChange7d > 0) score += 35;
  if (holderSummary.nonCexBalanceChange7d < 0) score -= 35;
  if (holderSummary.cexBalanceChange7d < 0) score += 15;
  if (holderSummary.cexBalanceChange7d > 0) score -= 15;
  if (holderSummary.nonCexAccumulatingCount > holderSummary.nonCexDistributingCount) score += 10;
  if (holderSummary.nonCexDistributingCount > holderSummary.nonCexAccumulatingCount) score -= 10;

  return clamp(score, -60, 60);
}

function calculateConfidence({ flows, holders, dataMode }) {
  if (dataMode === 'mixed') {
    return 0.35;
  }

  let confidence = 0.3;

  if (flows.length > 0) confidence += 0.2;
  if (holders.length >= 5) confidence += 0.2;
  if (holders.length >= 10) confidence += 0.1;

  const labeledHolders = holders.filter((holder) => holder.address).length;
  const labelCoverage = holders.length ? labeledHolders / holders.length : 0;

  confidence += Math.min(labelCoverage * 0.2, 0.2);

  return Number(clamp(confidence, 0, 0.95).toFixed(4));
}

function detectRegime({ finalScore, cexSummary, holderSummary, confidence, dataMode }) {
  if (dataMode === 'mixed') {
    return 'MIXED_DATA_REVIEW_REQUIRED';
  }

  if (confidence < 0.45) {
    return 'UNCLEAR_LOW_CONFIDENCE';
  }

  if (
    finalScore >= 50 &&
    cexSummary.cexNetflow7d < 0 &&
    holderSummary.nonCexBalanceChange7d > 0
  ) {
    return 'ACCUMULATION';
  }

  if (
    finalScore <= -50 &&
    cexSummary.cexNetflow7d > 0 &&
    holderSummary.nonCexBalanceChange7d < 0
  ) {
    return 'DISTRIBUTION';
  }

  if (cexSummary.cexNetflow7d < 0) return 'CEX_SUPPLY_DRAIN';
  if (cexSummary.cexNetflow7d > 0) return 'CEX_SELL_PRESSURE';

  return 'NEUTRAL';
}

function buildExplanation({ regime, dataMode, cexFlowSource, holderSource }) {
  if (regime === 'MIXED_DATA_REVIEW_REQUIRED') {
    return `CEX flows and holder snapshots come from different data modes. CEX flow source=${cexFlowSource || 'default'}, holder source=${holderSource || 'default'}. This is useful for engineering validation, but it is not a real market signal.`;
  }

  if (regime === 'ACCUMULATION') {
    return 'CEX netflow is negative while non-CEX top holders are increasing balances. This suggests accumulation pressure.';
  }

  if (regime === 'DISTRIBUTION') {
    return 'CEX netflow is positive while non-CEX top holders are reducing balances. This suggests distribution pressure.';
  }

  if (regime === 'CEX_SUPPLY_DRAIN') {
    return 'CEX netflow is negative, which means more tokens are leaving exchanges than entering them.';
  }

  if (regime === 'CEX_SELL_PRESSURE') {
    return 'CEX netflow is positive, which means more tokens are entering exchanges than leaving them.';
  }

  if (regime === 'UNCLEAR_LOW_CONFIDENCE') {
    return 'Data is not strong enough to classify the token regime with confidence.';
  }

  return 'No strong regime detected.';
}

function getDefaultSources({ cexFlowSource, holderSource }) {
  return {
    effectiveCexFlowSource: cexFlowSource || 'calculated_from_manual_seed_fake_uni',
    effectiveHolderSource: holderSource || 'manual_seed_fake_uni_holders'
  };
}

async function calculateTokenMetrics({ symbol, cexFlowSource, holderSource }) {
  const token = await metricRepository.findTokenBySymbol(symbol);

  if (!token) {
    throw new NotFoundError(`Token ${symbol} not found`, 'TOKEN_NOT_FOUND', { symbol });
  }

  const { effectiveCexFlowSource, effectiveHolderSource } = getDefaultSources({
    cexFlowSource,
    holderSource
  });

  const cexFlowDataMode = getDataModeFromSource(effectiveCexFlowSource);
  const holderDataMode = getDataModeFromSource(effectiveHolderSource);
  const dataMode = combineDataModes(cexFlowDataMode, holderDataMode);

  const latestHolderDate = await metricRepository.findLatestHolderDate({
    tokenId: token.id,
    source: effectiveHolderSource
  });

  if (!latestHolderDate) {
    throw new BadRequestError('No holder snapshots found', 'NO_HOLDER_SNAPSHOTS_FOUND', {
      symbol,
      holderSource: effectiveHolderSource
    });
  }

  const holders = await metricRepository.findHolderSnapshotsByDate({
    tokenId: token.id,
    date: latestHolderDate,
    source: effectiveHolderSource
  });

  if (!holders.length) {
    throw new BadRequestError('No holder snapshots found for latest date', 'NO_HOLDER_SNAPSHOTS_FOUND', {
      symbol,
      date: latestHolderDate,
      holderSource: effectiveHolderSource
    });
  }

  let flows = [];

  if (cexFlowSource) {
    flows = await metricRepository.findCexFlowsBySource({
      tokenId: token.id,
      source: effectiveCexFlowSource
    });
  } else {
    const toDate = latestHolderDate;
    const fromDate = daysAgo(toDate, 7);

    flows = await metricRepository.findCexFlowsByDateRange({
      tokenId: token.id,
      fromDate,
      toDate,
      source: effectiveCexFlowSource
    });
  }

  if (!flows.length) {
    throw new BadRequestError('No CEX flows found. Calculate CEX flows first.', 'NO_CEX_FLOWS_FOUND', {
      symbol,
      cexFlowSource: effectiveCexFlowSource
    });
  }

  const metricDate = latestHolderDate;

  const cexSummary = buildCexSummary(flows);
  const holderSummary = buildHolderSummary(holders);

  const cexFlowScore = calculateCexFlowScore(cexSummary);
  const holderScore = calculateHolderScore(holderSummary);
  const finalScore = clamp(cexFlowScore + holderScore, -100, 100);

  const confidence = calculateConfidence({
    flows,
    holders,
    dataMode
  });

  const regime = detectRegime({
    finalScore,
    cexSummary,
    holderSummary,
    confidence,
    dataMode
  });

  const explanation = buildExplanation({
    regime,
    dataMode,
    cexFlowSource: effectiveCexFlowSource,
    holderSource: effectiveHolderSource
  });

  const sourceLabel = getSourceLabel({
    dataMode,
    cexFlowSource: effectiveCexFlowSource,
    holderSource: effectiveHolderSource
  });

  const sourceWarning = getSourceWarning({
    dataMode,
    cexFlowSource: effectiveCexFlowSource,
    holderSource: effectiveHolderSource
  });

  const row = {
    token_id: token.id,
    date: metricDate,

    cex_inflow_7d: String(cexSummary.cexInflow7d),
    cex_outflow_7d: String(cexSummary.cexOutflow7d),
    cex_netflow_7d: String(cexSummary.cexNetflow7d),
    cex_netflow_usd_7d: String(cexSummary.cexNetflowUsd7d),

    cex_balance_change_7d: String(holderSummary.cexBalanceChange7d),
    non_cex_balance_change_7d: String(holderSummary.nonCexBalanceChange7d),

    cex_flow_score: cexFlowScore,
    holder_score: holderScore,
    final_score: finalScore,
    confidence: String(confidence),
    regime,
    explanation,
    score_version: SCORE_VERSION,
    metrics_json: {
      dataMode,
      cexFlowDataMode,
      holderDataMode,
      source: dataMode === 'mixed' ? 'mixed_sources' : effectiveCexFlowSource,
      cexFlowSource: effectiveCexFlowSource,
      holderSource: effectiveHolderSource,
      sourceLabel,
      sourceWarning,
      isRealData: dataMode === 'real',
      cexSummary,
      holderSummary,
      score: {
        cexFlowScore,
        holderScore,
        finalScore,
        confidence,
        regime,
        scoreVersion: SCORE_VERSION
      }
    },
    created_at: new Date(),
    updated_at: new Date()
  };

  await metricRepository.deleteMetricForDate({
    tokenId: token.id,
    date: metricDate,
    scoreVersion: SCORE_VERSION
  });

  const metric = await metricRepository.createMetric(row);

  return mapMetric(metric, token);
}

function mapMetric(metric, tokenOverride = null) {
  const token = tokenOverride || metric.token;
  const metricsJson = metric.metrics_json || {};
  const dataMode = metricsJson.dataMode || 'fake';

  return {
    id: metric.id,
    token: {
      id: token.id,
      symbol: token.symbol,
      name: token.name
    },
    date: metric.date,

    dataMode,
    cexFlowDataMode: metricsJson.cexFlowDataMode || null,
    holderDataMode: metricsJson.holderDataMode || null,
    source: metricsJson.source || 'unknown',
    cexFlowSource: metricsJson.cexFlowSource || null,
    holderSource: metricsJson.holderSource || null,
    sourceLabel: metricsJson.sourceLabel || 'Unknown data source',
    sourceWarning: metricsJson.sourceWarning || null,
    isRealData: metricsJson.isRealData === true,

    cexInflow7d: numberValue(metric.cex_inflow_7d),
    cexOutflow7d: numberValue(metric.cex_outflow_7d),
    cexNetflow7d: numberValue(metric.cex_netflow_7d),
    cexNetflowUsd7d: numberValue(metric.cex_netflow_usd_7d),

    cexBalanceChange7d: numberValue(metric.cex_balance_change_7d),
    nonCexBalanceChange7d: numberValue(metric.non_cex_balance_change_7d),

    cexFlowScore: metric.cex_flow_score,
    holderScore: metric.holder_score,
    finalScore: metric.final_score,
    confidence: numberValue(metric.confidence),
    regime: metric.regime,
    explanation: metric.explanation,
    scoreVersion: metric.score_version,
    metrics: metricsJson
  };
}

async function getLatestMetric({ symbol }) {
  const metric = await metricRepository.findLatestMetricBySymbol(symbol);

  if (!metric) {
    throw new BadRequestError('No token metrics found. Calculate token metrics first.', 'NO_TOKEN_METRICS_FOUND', {
      symbol
    });
  }

  return mapMetric(metric);
}

module.exports = {
  calculateTokenMetrics,
  getLatestMetric
};

const signalRepository = require('./signal.repository');
const BadRequestError = require('../../errors/BadRequestError');

function numberValue(value) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function getSeverity({ score, confidence }) {
  const absScore = Math.abs(score);

  if (confidence >= 0.75 && absScore >= 80) {
    return 'high';
  }

  if (confidence >= 0.55 && absScore >= 50) {
    return 'medium';
  }

  return 'low';
}

function getSignalType(regime) {
  if (regime === 'ACCUMULATION') return 'accumulation_detected';
  if (regime === 'DISTRIBUTION') return 'distribution_detected';
  if (regime === 'CEX_SUPPLY_DRAIN') return 'cex_supply_drain';
  if (regime === 'CEX_SELL_PRESSURE') return 'cex_sell_pressure';
  if (regime === 'UNCLEAR_LOW_CONFIDENCE') return 'low_confidence_regime';

  return 'neutral_regime';
}

function getSummary({ symbol, regime }) {
  if (regime === 'ACCUMULATION') {
    return `${symbol} shows accumulation regime`;
  }

  if (regime === 'DISTRIBUTION') {
    return `${symbol} shows distribution regime`;
  }

  if (regime === 'CEX_SUPPLY_DRAIN') {
    return `${symbol} shows CEX supply drain`;
  }

  if (regime === 'CEX_SELL_PRESSURE') {
    return `${symbol} shows CEX sell pressure`;
  }

  return `${symbol} has no strong regime`;
}

function mapSignal(signal) {
  const metrics = signal.metrics_json || {};

  return {
    id: signal.id,
    token: {
      id: signal.token.id,
      symbol: signal.token.symbol,
      name: signal.token.name
    },
    timestamp: signal.timestamp,
    signalDate: signal.signal_date,
    signalType: signal.signal_type,
    severity: signal.severity,
    confidence: numberValue(signal.confidence),
    score: signal.score,
    regime: signal.regime,
    summary: signal.summary,
    explanation: signal.explanation,

    dataMode: metrics.dataMode || 'fake',
    source: metrics.source || 'unknown',
    sourceLabel: metrics.sourceLabel || 'Unknown data source',
    sourceWarning: metrics.sourceWarning || null,
    isRealData: metrics.isRealData === true,

    metrics,
    sourceMetricId: signal.source_metric_id
  };
}

async function generateSignalsForToken({ symbol }) {
  const metric = await signalRepository.findLatestMetricBySymbol(symbol);

  if (!metric) {
    throw new BadRequestError('No token metrics found. Calculate token metrics first.', 'NO_TOKEN_METRICS_FOUND', {
      symbol
    });
  }

  const score = metric.final_score;
  const confidence = numberValue(metric.confidence);
  const regime = metric.regime;
  const tokenSymbol = metric.token.symbol;

  const signalType = getSignalType(regime);
  const severity = getSeverity({ score, confidence });
  const signalDate = metric.date;

  await signalRepository.deleteDuplicateSignals({
    tokenId: metric.token_id,
    signalType,
    regime,
    signalDate
  });

  const signal = await signalRepository.createSignal({
    token_id: metric.token_id,
    timestamp: new Date(),
    signal_date: signalDate,
    signal_type: signalType,
    severity,
    confidence: String(confidence),
    score,
    regime,
    summary: getSummary({
      symbol: tokenSymbol,
      regime
    }),
    explanation: metric.explanation,
    metrics_json: {
      metricId: metric.id,
      scoreVersion: metric.score_version,
      metricDate: metric.date,
      ...(metric.metrics_json || {})
    },
    source_metric_id: metric.id,
    created_at: new Date(),
    updated_at: new Date()
  });

  signal.token = metric.token;

  return mapSignal(signal);
}

async function getSignalsByToken({ symbol, limit, offset }) {
  const result = await signalRepository.findSignalsByTokenSymbol({
    symbol,
    limit,
    offset
  });

  return {
    data: result.rows.map(mapSignal),
    meta: {
      limit,
      offset,
      total: result.count
    }
  };
}

async function getSignals({ limit, offset }) {
  const result = await signalRepository.findSignals({
    limit,
    offset
  });

  return {
    data: result.rows.map(mapSignal),
    meta: {
      limit,
      offset,
      total: result.count
    }
  };
}

module.exports = {
  generateSignalsForToken,
  getSignalsByToken,
  getSignals
};

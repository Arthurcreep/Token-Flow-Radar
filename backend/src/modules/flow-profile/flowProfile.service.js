const AppError = require('../../errors/AppError');

const flowProfileRepository = require('./flowProfile.repository');
const flowProfileAnalysis = require('./flowProfileAnalysis.service');
const flowDiagnosticsService = require('../flow-diagnostics/flowDiagnostics.service');

const DEFAULT_SOURCE = 'calculated_from_etherscan_v2_recent_cex_address_tokentx';

const RANGE_CONFIG = {
  '1d': {
    label: '1D',
    days: 1
  },
  '7d': {
    label: '7D',
    days: 7
  },
  '1m': {
    label: '1M',
    days: 30
  },
  '1y': {
    label: '1Y',
    days: 365
  },
  all: {
    label: 'ALL',
    days: null
  }
};

const makeAppError = (message, statusCode, code, details = null) => {
  const error = new AppError(message, statusCode, code, details);

  error.code = code;
  error.statusCode = statusCode;
  error.details = details;

  return error;
};

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  return Number(value);
};

const formatDate = (date) => {
  if (!date) return null;

  if (typeof date === 'string') {
    return date.slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
};

const addDays = (dateString, days) => {
  const date = new Date(`${dateString}T00:00:00.000Z`);

  date.setUTCDate(date.getUTCDate() + days);

  return formatDate(date);
};

const buildRangeWindow = ({
  range,
  latestDataDate,
  fromDate,
  toDate
}) => {
  if (fromDate || toDate) {
    return {
      selected: 'custom',
      label: 'CUSTOM',
      fromDate: fromDate || null,
      toDate: toDate || latestDataDate || null,
      latestDataDate,
      isAnchoredToLatestDataDate: false
    };
  }

  const selectedRange = RANGE_CONFIG[range] ? range : '1m';
  const config = RANGE_CONFIG[selectedRange];

  if (!latestDataDate) {
    return {
      selected: selectedRange,
      label: config.label,
      fromDate: null,
      toDate: null,
      latestDataDate: null,
      isAnchoredToLatestDataDate: true
    };
  }

  if (!config.days) {
    return {
      selected: selectedRange,
      label: config.label,
      fromDate: null,
      toDate: latestDataDate,
      latestDataDate,
      isAnchoredToLatestDataDate: true
    };
  }

  return {
    selected: selectedRange,
    label: config.label,
    fromDate: addDays(latestDataDate, -config.days + 1),
    toDate: latestDataDate,
    latestDataDate,
    isAnchoredToLatestDataDate: true
  };
};

const serializeToken = (token) => ({
  id: token.id,
  symbol: token.symbol,
  name: token.name,
  chain: token.chain,
  contractAddress: token.contract_address,
  decimals: token.decimals,
  coingeckoId: token.coingecko_id,
  isActive: token.is_active
});

const serializePriceContext = (row) => {
  if (!row) return null;

  return {
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
  };
};

const serializeDailyFlow = (row, token) => ({
  id: row.id,
  token: serializeToken(token),
  date: row.date,
  source: row.source,
  dataMode: row.data_mode,

  cexInflow: toNumber(row.cex_inflow),
  cexOutflow: toNumber(row.cex_outflow),
  cexNetflow: toNumber(row.cex_netflow),

  cexInflowUsd: toNumber(row.cex_inflow_usd),
  cexOutflowUsd: toNumber(row.cex_outflow_usd),
  cexNetflowUsd: toNumber(row.cex_netflow_usd),

  inflowTxCount: toNumber(row.inflow_tx_count),
  outflowTxCount: toNumber(row.outflow_tx_count),

  largeInflowCount: toNumber(row.large_inflow_count),
  largeOutflowCount: toNumber(row.large_outflow_count),

  largeInflowUsd: toNumber(row.large_inflow_usd),
  largeOutflowUsd: toNumber(row.large_outflow_usd),
  largeNetflowUsd: toNumber(row.large_netflow_usd),

  largeTransferThresholdUsd: toNumber(row.large_transfer_threshold_usd)
});

const summarizeRows = (rows) => {
  const summary = rows.reduce((acc, row) => {
    acc.cexInflow += toNumber(row.cex_inflow);
    acc.cexOutflow += toNumber(row.cex_outflow);
    acc.cexNetflow += toNumber(row.cex_netflow);

    acc.cexInflowUsd += toNumber(row.cex_inflow_usd);
    acc.cexOutflowUsd += toNumber(row.cex_outflow_usd);
    acc.cexNetflowUsd += toNumber(row.cex_netflow_usd);

    acc.inflowTxCount += toNumber(row.inflow_tx_count);
    acc.outflowTxCount += toNumber(row.outflow_tx_count);

    acc.largeInflowCount += toNumber(row.large_inflow_count);
    acc.largeOutflowCount += toNumber(row.large_outflow_count);

    acc.largeInflowUsd += toNumber(row.large_inflow_usd);
    acc.largeOutflowUsd += toNumber(row.large_outflow_usd);
    acc.largeNetflowUsd += toNumber(row.large_netflow_usd);

    acc.largeTransferThresholdUsd = Math.max(acc.largeTransferThresholdUsd, toNumber(row.large_transfer_threshold_usd));

    return acc;
  }, {
    cexInflow: 0,
    cexOutflow: 0,
    cexNetflow: 0,

    cexInflowUsd: 0,
    cexOutflowUsd: 0,
    cexNetflowUsd: 0,

    inflowTxCount: 0,
    outflowTxCount: 0,

    largeInflowCount: 0,
    largeOutflowCount: 0,

    largeInflowUsd: 0,
    largeOutflowUsd: 0,
    largeNetflowUsd: 0,

    largeTransferThresholdUsd: 0
  });

  const activeDays = rows.length;

  const regimeHint = flowProfileAnalysis.getRegimeHint({
    cexNetflowUsd: summary.cexNetflowUsd,
    cexNetflow: summary.cexNetflow
  });

  const largeFlowHint = flowProfileAnalysis.getLargeFlowHint({
    largeNetflowUsd: summary.largeNetflowUsd
  });

  const strength = flowProfileAnalysis.getStrength({
    cexNetflowUsd: summary.cexNetflowUsd,
    largeNetflowUsd: summary.largeNetflowUsd,
    activeDays
  });

  return {
    ...summary,
    activeDays,
    negativeNetflowDays: rows.filter((row) => toNumber(row.cex_netflow_usd) < 0).length,
    positiveNetflowDays: rows.filter((row) => toNumber(row.cex_netflow_usd) > 0).length,
    neutralDays: rows.filter((row) => toNumber(row.cex_netflow_usd) === 0).length,
    regimeHint,
    largeFlowHint,
    strength
  };
};

const getTokenFlowProfile = async ({
  symbol,
  range = '1m',
  source = DEFAULT_SOURCE,
  fromDate,
  toDate,
  limit = 500,
  offset = 0
}) => {
  const normalizedSymbol = String(symbol || '').toUpperCase();

  const token = await flowProfileRepository.findTokenBySymbol(normalizedSymbol);

  if (!token) {
    throw makeAppError(
      `Token ${normalizedSymbol} not found.`,
      404,
      'TOKEN_NOT_FOUND',
      {
        symbol: normalizedSymbol
      }
    );
  }

  const latestDataDate = await flowProfileRepository.findLatestFlowDate({
    tokenId: token.id,
    source
  });

  const rangeInfo = buildRangeWindow({
    range,
    latestDataDate,
    fromDate,
    toDate
  });

  const { rows, total } = await flowProfileRepository.findDailyFlows({
    tokenId: token.id,
    source,
    fromDate: rangeInfo.fromDate,
    toDate: rangeInfo.toDate,
    limit,
    offset
  });

  const priceContext = serializePriceContext(
    await flowProfileRepository.findPriceContext(token.id)
  );

  const diagnostics = await flowDiagnosticsService.getFlowDiagnostics({
    symbol: normalizedSymbol,
    range: rangeInfo.selected,
    source,
    fromDate: rangeInfo.fromDate,
    toDate: rangeInfo.toDate
  });

  const summary = summarizeRows(rows);

  const analysisProfile = flowProfileAnalysis.buildAnalysisProfile({
    tokenSymbol: token.symbol,
    regimeHint: summary.regimeHint,
    largeFlowHint: summary.largeFlowHint,
    strength: summary.strength,
    priceContext,
    activeDays: summary.activeDays,
    cexNetflowUsd: summary.cexNetflowUsd,
    largeNetflowUsd: summary.largeNetflowUsd,
    diagnostics
  });

  const scores = flowProfileAnalysis.buildScores({
    summary,
    priceContext,
    diagnostics
  });

  return {
    token: serializeToken(token),
    source,
    range: {
      ...rangeInfo,
      calendarWindow: rangeInfo.fromDate && rangeInfo.toDate
        ? `${rangeInfo.fromDate} → ${rangeInfo.toDate}`
        : '—',
      activeDays: summary.activeDays,
      activeFlowWindow: rows.length
        ? {
            fromDate: rows[rows.length - 1].date,
            toDate: rows[0].date,
            label: `${rows[rows.length - 1].date} → ${rows[0].date}`
          }
        : {
            fromDate: null,
            toDate: null,
            label: '—'
          },
      loadedRows: rows.length
    },
    summary,
    priceContext,
    analysisProfile,
    scores,
    diagnostics: diagnostics.diagnostics,
    dailyFlows: rows.map((row) => serializeDailyFlow(row, token)),
    meta: {
      limit,
      offset,
      total,
      version: 'v1-token-flow-profile'
    }
  };
};

module.exports = {
  getTokenFlowProfile
};

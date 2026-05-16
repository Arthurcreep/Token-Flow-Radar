const marketLeaderboardRepository = require('./marketLeaderboard.repository');

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

function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  return Number(value);
}

function formatDate(date) {
  if (!date) return null;

  if (typeof date === 'string') {
    return date.slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00.000Z`);

  date.setUTCDate(date.getUTCDate() + days);

  return formatDate(date);
}

function getRegimeHint({
  cexNetflowUsd,
  cexNetflow
}) {
  if (toNumber(cexNetflowUsd) > 0 || toNumber(cexNetflow) > 0) {
    return 'CEX_SELL_PRESSURE';
  }

  if (toNumber(cexNetflowUsd) < 0 || toNumber(cexNetflow) < 0) {
    return 'CEX_SUPPLY_DRAIN';
  }

  return 'NEUTRAL';
}

function getLargeFlowHint({
  largeNetflowUsd
}) {
  if (toNumber(largeNetflowUsd) > 0) {
    return 'LARGE_SELL_PRESSURE';
  }

  if (toNumber(largeNetflowUsd) < 0) {
    return 'LARGE_SUPPLY_DRAIN';
  }

  return 'NO_LARGE_FLOW';
}

function getStrength({
  cexNetflowUsd,
  largeNetflowUsd,
  activeDays
}) {
  const absNetflowUsd = Math.abs(toNumber(cexNetflowUsd));
  const absLargeNetflowUsd = Math.abs(toNumber(largeNetflowUsd));

  if (absNetflowUsd >= 5_000_000 && absLargeNetflowUsd >= 2_000_000) {
    return 'very_strong';
  }

  if (absNetflowUsd >= 1_000_000 && absLargeNetflowUsd >= 500_000) {
    return 'strong';
  }

  if (absNetflowUsd >= 250_000 || absLargeNetflowUsd >= 100_000) {
    return 'moderate';
  }

  if (absNetflowUsd > 0 || activeDays > 0) {
    return 'weak';
  }

  return 'none';
}

function buildRangeWindow({
  range,
  latestDataDate,
  fromDate,
  toDate
}) {
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
}

function normalizePriceContext(row) {
  if (row.current_price_usd === null || row.current_price_usd === undefined) {
    return null;
  }

  return {
    currentPriceUsd: toNumber(row.current_price_usd),
    athUsd: toNumber(row.ath_usd),
    athDate: row.ath_date || null,
    drawdownFromAthPct: toNumber(row.drawdown_from_ath_pct),
    upsideToAthPct: toNumber(row.upside_to_ath_pct),
    provider: row.price_provider || null,
    updatedAt: row.price_updated_at || null
  };
}

function getRecoveryContext(priceContext) {
  if (!priceContext) return 'unknown';

  const drawdown = toNumber(priceContext.drawdownFromAthPct);
  const upside = toNumber(priceContext.upsideToAthPct);

  if (drawdown <= -97 || upside >= 3000) {
    return 'extreme';
  }

  if (drawdown <= -90 || upside >= 1000) {
    return 'high';
  }

  if (drawdown <= -75 || upside >= 300) {
    return 'medium';
  }

  if (drawdown < 0 || upside > 0) {
    return 'low';
  }

  return 'none';
}

function getFlowSignal({
  regimeHint,
  largeFlowHint,
  strength
}) {
  if (regimeHint === 'CEX_SUPPLY_DRAIN' && largeFlowHint === 'LARGE_SUPPLY_DRAIN') {
    if (['very_strong', 'strong'].includes(strength)) {
      return 'strong_supply_drain';
    }

    if (strength === 'moderate') {
      return 'moderate_supply_drain';
    }

    return 'weak_supply_drain';
  }

  if (regimeHint === 'CEX_SELL_PRESSURE' && largeFlowHint === 'LARGE_SELL_PRESSURE') {
    if (['very_strong', 'strong'].includes(strength)) {
      return 'strong_sell_pressure';
    }

    if (strength === 'moderate') {
      return 'moderate_sell_pressure';
    }

    return 'weak_sell_pressure';
  }

  if (regimeHint === 'CEX_SUPPLY_DRAIN' && largeFlowHint === 'LARGE_SELL_PRESSURE') {
    return 'mixed_supply_drain_with_large_sell_pressure';
  }

  if (regimeHint === 'CEX_SELL_PRESSURE' && largeFlowHint === 'LARGE_SUPPLY_DRAIN') {
    return 'mixed_sell_pressure_with_large_supply_drain';
  }

  if (regimeHint === 'CEX_SUPPLY_DRAIN' && largeFlowHint === 'NO_LARGE_FLOW') {
    return 'unconfirmed_supply_drain';
  }

  if (regimeHint === 'CEX_SELL_PRESSURE' && largeFlowHint === 'NO_LARGE_FLOW') {
    return 'unconfirmed_sell_pressure';
  }

  return 'neutral';
}

function buildRiskFlags({
  regimeHint,
  largeFlowHint,
  strength,
  priceContext,
  activeDays,
  cexNetflowUsd,
  largeNetflowUsd
}) {
  const flags = [];
  const drawdown = priceContext ? toNumber(priceContext.drawdownFromAthPct) : null;
  const upside = priceContext ? toNumber(priceContext.upsideToAthPct) : null;

  if (regimeHint === 'CEX_SUPPLY_DRAIN' && largeFlowHint === 'LARGE_SELL_PRESSURE') {
    flags.push('large_layer_conflict');
  }

  if (regimeHint === 'CEX_SELL_PRESSURE' && largeFlowHint === 'LARGE_SUPPLY_DRAIN') {
    flags.push('large_layer_conflict');
  }

  if (largeFlowHint === 'NO_LARGE_FLOW') {
    flags.push('no_large_flow_confirmation');
  }

  if (strength === 'weak') {
    flags.push('weak_flow');
  }

  if (activeDays <= 2) {
    flags.push('thin_active_days');
  }

  if (drawdown !== null && drawdown <= -97) {
    flags.push('extreme_ath_drawdown');
  } else if (drawdown !== null && drawdown <= -90) {
    flags.push('deep_ath_drawdown');
  }

  if (upside !== null && upside >= 3000) {
    flags.push('extreme_recovery_distance');
  }

  if (Math.abs(toNumber(cexNetflowUsd)) < 100_000) {
    flags.push('low_usd_flow');
  }

  if (Math.abs(toNumber(largeNetflowUsd)) === 0) {
    flags.push('zero_large_netflow');
  }

  return flags;
}

function getProfileLabel({
  flowSignal,
  recoveryContext,
  riskFlags
}) {
  if (flowSignal === 'strong_supply_drain' && !riskFlags.includes('large_layer_conflict')) {
    return 'clean_supply_drain';
  }

  if (flowSignal === 'moderate_supply_drain' && ['high', 'extreme'].includes(recoveryContext)) {
    return 'speculative_recovery_candidate';
  }

  if (flowSignal.includes('mixed')) {
    return 'mixed_flow';
  }

  if (flowSignal.includes('sell_pressure')) {
    return 'sell_pressure_watch';
  }

  if (flowSignal.includes('unconfirmed')) {
    return 'unconfirmed_flow';
  }

  if (riskFlags.includes('weak_flow')) {
    return 'weak_signal';
  }

  return 'watchlist_candidate';
}

function getInterpretation({
  tokenSymbol,
  flowSignal,
  recoveryContext,
  riskFlags
}) {
  if (flowSignal === 'strong_supply_drain' && !riskFlags.includes('large_layer_conflict')) {
    return `${tokenSymbol} shows clean CEX supply drain with large-flow confirmation. Recovery context is ${recoveryContext}.`;
  }

  if (flowSignal === 'moderate_supply_drain' && ['high', 'extreme'].includes(recoveryContext)) {
    return `${tokenSymbol} shows confirmed CEX supply drain, but recovery context is ${recoveryContext}; treat it as a higher-risk recovery candidate.`;
  }

  if (flowSignal === 'mixed_supply_drain_with_large_sell_pressure') {
    return `${tokenSymbol} has general CEX supply drain, but large-flow layer points to sell pressure. Signal is mixed.`;
  }

  if (flowSignal === 'unconfirmed_supply_drain') {
    return `${tokenSymbol} shows CEX supply drain, but without large-flow confirmation. Signal is weak or incomplete.`;
  }

  if (flowSignal.includes('sell_pressure')) {
    return `${tokenSymbol} shows possible CEX sell pressure. This is not an accumulation-style flow profile.`;
  }

  if (riskFlags.includes('weak_flow')) {
    return `${tokenSymbol} has weak flow evidence. Do not over-interpret the current data.`;
  }

  return `${tokenSymbol} is a watchlist candidate, but the signal requires more context.`;
}

function buildAnalysisProfile({
  tokenSymbol,
  regimeHint,
  largeFlowHint,
  strength,
  priceContext,
  activeDays,
  cexNetflowUsd,
  largeNetflowUsd
}) {
  const recoveryContext = getRecoveryContext(priceContext);
  const flowSignal = getFlowSignal({
    regimeHint,
    largeFlowHint,
    strength
  });

  const riskFlags = buildRiskFlags({
    regimeHint,
    largeFlowHint,
    strength,
    priceContext,
    activeDays,
    cexNetflowUsd,
    largeNetflowUsd
  });

  const profileLabel = getProfileLabel({
    flowSignal,
    recoveryContext,
    riskFlags
  });

  const interpretation = getInterpretation({
    tokenSymbol,
    flowSignal,
    recoveryContext,
    riskFlags
  });

  return {
    profileLabel,
    flowSignal,
    recoveryContext,
    riskFlags,
    interpretation,
    version: 'v2-flow-recovery-profile'
  };
}

function normalizeRow(row) {
  const cexNetflowUsd = toNumber(row.cex_netflow_usd);
  const cexNetflow = toNumber(row.cex_netflow);
  const largeNetflowUsd = toNumber(row.large_netflow_usd);
  const activeDays = toNumber(row.active_days);

  const priceContext = normalizePriceContext(row);

  const regimeHint = getRegimeHint({
    cexNetflowUsd,
    cexNetflow
  });

  const largeFlowHint = getLargeFlowHint({
    largeNetflowUsd
  });

  const strength = getStrength({
    cexNetflowUsd,
    largeNetflowUsd,
    activeDays
  });

  return {
    token: {
      id: row.token_id,
      symbol: row.token_symbol,
      name: row.token_name,
      chain: row.token_chain,
      contractAddress: row.contract_address,
      coingeckoId: row.coingecko_id
    },

    dataMode: row.data_mode || 'unknown',

    activeDays,

    activeFlowWindow: {
      fromDate: row.active_from_date,
      toDate: row.active_to_date,
      label: row.active_from_date && row.active_to_date
        ? `${row.active_from_date} → ${row.active_to_date}`
        : '—'
    },

    cex: {
      inflow: toNumber(row.cex_inflow),
      outflow: toNumber(row.cex_outflow),
      netflow: cexNetflow,
      inflowUsd: toNumber(row.cex_inflow_usd),
      outflowUsd: toNumber(row.cex_outflow_usd),
      netflowUsd: cexNetflowUsd,
      inflowTxCount: toNumber(row.inflow_tx_count),
      outflowTxCount: toNumber(row.outflow_tx_count)
    },

    large: {
      inflowCount: toNumber(row.large_inflow_count),
      outflowCount: toNumber(row.large_outflow_count),
      inflowUsd: toNumber(row.large_inflow_usd),
      outflowUsd: toNumber(row.large_outflow_usd),
      netflowUsd: largeNetflowUsd,
      thresholdUsd: toNumber(row.large_transfer_threshold_usd)
    },

    priceContext,

    regimeHint,

    largeFlowHint,

    strength,

    analysisProfile: buildAnalysisProfile({
      tokenSymbol: row.token_symbol,
      regimeHint,
      largeFlowHint,
      strength,
      priceContext,
      activeDays,
      cexNetflowUsd,
      largeNetflowUsd
    })
  };
}

async function getCexFlowLeaderboard({
  source = DEFAULT_SOURCE,
  range = '1m',
  fromDate,
  toDate,
  limit = 50,
  offset = 0
}) {
  const latestDataDate = await marketLeaderboardRepository.findLatestDateBySource({
    source
  });

  const rangeInfo = buildRangeWindow({
    range,
    latestDataDate,
    fromDate,
    toDate
  });

  if (!latestDataDate) {
    return {
      data: {
        items: [],
        source,
        range: {
          ...rangeInfo,
          calendarWindow: '—',
          loadedTokens: 0
        },
        warning: 'No calculated CEX flow data found for selected source. Run ingestion, valuation, and CEX flow calculation first.'
      },
      meta: {
        limit,
        offset,
        total: 0
      }
    };
  }

  const { rows, total } = await marketLeaderboardRepository.findLeaderboardRows({
    source,
    fromDate: rangeInfo.fromDate,
    toDate: rangeInfo.toDate,
    limit,
    offset
  });

  const items = rows.map(normalizeRow);

  return {
    data: {
      items,
      source,
      range: {
        ...rangeInfo,
        calendarWindow: rangeInfo.fromDate && rangeInfo.toDate
          ? `${rangeInfo.fromDate} → ${rangeInfo.toDate}`
          : '—',
        loadedTokens: items.length
      }
    },
    meta: {
      limit,
      offset,
      total,
      range: rangeInfo.selected,
      source
    }
  };
}

module.exports = {
  getCexFlowLeaderboard
};

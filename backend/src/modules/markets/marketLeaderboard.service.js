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
  if (typeof date === 'string') return date.slice(0, 10);

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

function normalizeRow(row) {
  const cexNetflowUsd = toNumber(row.cex_netflow_usd);
  const cexNetflow = toNumber(row.cex_netflow);
  const largeNetflowUsd = toNumber(row.large_netflow_usd);
  const activeDays = toNumber(row.active_days);

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
    regimeHint: getRegimeHint({
      cexNetflowUsd,
      cexNetflow
    }),
    largeFlowHint: getLargeFlowHint({
      largeNetflowUsd
    }),
    strength: getStrength({
      cexNetflowUsd,
      largeNetflowUsd,
      activeDays
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

const cexFlowRepository = require('./cexFlow.repository');
const NotFoundError = require('../../errors/NotFoundError');

const DEFAULT_LARGE_TRANSFER_THRESHOLD_USD = 50000;

function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  return Number(value);
}

function toDateKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function getAddressEntityId(address) {
  return address?.entity_id || address?.entityId || address?.entity?.id || null;
}

function isSameEntity(from, to) {
  const fromEntityId = getAddressEntityId(from);
  const toEntityId = getAddressEntityId(to);

  if (!fromEntityId || !toEntityId) return false;

  return String(fromEntityId) === String(toEntityId);
}

function isCexAddress(address) {
  const type = address?.address_type || address?.addressType;
  return type === 'cex';
}

function getCalculatedSource(source) {
  if (!source) return 'calculated_from_all_sources';
  return `calculated_from_${source}`;
}

function getDataModeFromSource(source) {
  if (!source) return 'mixed';

  if (source.includes('etherscan')) return 'real';
  if (source.includes('manual_seed') || source.includes('fake')) return 'fake';

  return 'mixed';
}

function getRegimeHint(summary) {
  if (summary.cexNetflow > 0) return 'CEX_SELL_PRESSURE';
  if (summary.cexNetflow < 0) return 'CEX_SUPPLY_DRAIN';

  return 'NEUTRAL';
}

function emptyDailyRow(date) {
  return {
    date,
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
    largeNetflowUsd: 0
  };
}

function ensureDailyRow(map, date) {
  if (!map.has(date)) {
    map.set(date, emptyDailyRow(date));
  }

  return map.get(date);
}

function buildSummary(rows) {
  return rows.reduce(
    (acc, row) => {
      acc.cexInflow += toNumber(row.cexInflow);
      acc.cexOutflow += toNumber(row.cexOutflow);
      acc.cexNetflow += toNumber(row.cexNetflow);

      acc.cexInflowUsd += toNumber(row.cexInflowUsd);
      acc.cexOutflowUsd += toNumber(row.cexOutflowUsd);
      acc.cexNetflowUsd += toNumber(row.cexNetflowUsd);

      acc.inflowTxCount += toNumber(row.inflowTxCount);
      acc.outflowTxCount += toNumber(row.outflowTxCount);

      acc.largeInflowCount += toNumber(row.largeInflowCount);
      acc.largeOutflowCount += toNumber(row.largeOutflowCount);

      acc.largeInflowUsd += toNumber(row.largeInflowUsd);
      acc.largeOutflowUsd += toNumber(row.largeOutflowUsd);
      acc.largeNetflowUsd += toNumber(row.largeNetflowUsd);

      return acc;
    },
    {
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
      largeNetflowUsd: 0
    }
  );
}

function normalizeDailyRowForDb({
  tokenId,
  row,
  source,
  dataMode,
  largeTransferThresholdUsd
}) {
  return {
    token_id: tokenId,
    date: row.date,
    cex_inflow: String(row.cexInflow),
    cex_outflow: String(row.cexOutflow),
    cex_netflow: String(row.cexNetflow),
    cex_inflow_usd: String(row.cexInflowUsd),
    cex_outflow_usd: String(row.cexOutflowUsd),
    cex_netflow_usd: String(row.cexNetflowUsd),
    inflow_tx_count: row.inflowTxCount,
    outflow_tx_count: row.outflowTxCount,
    large_inflow_count: row.largeInflowCount,
    large_outflow_count: row.largeOutflowCount,
    large_inflow_usd: String(row.largeInflowUsd),
    large_outflow_usd: String(row.largeOutflowUsd),
    large_netflow_usd: String(row.largeNetflowUsd),
    large_transfer_threshold_usd: String(largeTransferThresholdUsd),
    source,
    data_mode: dataMode
  };
}

function normalizeDailyRowForApi(row) {
  const plain = row?.toJSON ? row.toJSON() : row;

  return {
    id: plain.id,
    token: plain.token
      ? {
          id: plain.token.id,
          symbol: plain.token.symbol,
          name: plain.token.name
        }
      : undefined,
    date: plain.date,
    cexInflow: toNumber(plain.cex_inflow ?? plain.cexInflow),
    cexOutflow: toNumber(plain.cex_outflow ?? plain.cexOutflow),
    cexNetflow: toNumber(plain.cex_netflow ?? plain.cexNetflow),
    cexInflowUsd: toNumber(plain.cex_inflow_usd ?? plain.cexInflowUsd),
    cexOutflowUsd: toNumber(plain.cex_outflow_usd ?? plain.cexOutflowUsd),
    cexNetflowUsd: toNumber(plain.cex_netflow_usd ?? plain.cexNetflowUsd),
    inflowTxCount: toNumber(plain.inflow_tx_count ?? plain.inflowTxCount),
    outflowTxCount: toNumber(plain.outflow_tx_count ?? plain.outflowTxCount),
    largeInflowCount: toNumber(plain.large_inflow_count ?? plain.largeInflowCount),
    largeOutflowCount: toNumber(plain.large_outflow_count ?? plain.largeOutflowCount),
    largeInflowUsd: toNumber(plain.large_inflow_usd ?? plain.largeInflowUsd),
    largeOutflowUsd: toNumber(plain.large_outflow_usd ?? plain.largeOutflowUsd),
    largeNetflowUsd: toNumber(plain.large_netflow_usd ?? plain.largeNetflowUsd),
    largeTransferThresholdUsd: toNumber(
      plain.large_transfer_threshold_usd ?? plain.largeTransferThresholdUsd
    ),
    source: plain.source,
    dataMode: plain.data_mode ?? plain.dataMode
  };
}

async function calculateCexFlows({
  symbol,
  fromDate,
  toDate,
  source,
  largeTransferThresholdUsd = DEFAULT_LARGE_TRANSFER_THRESHOLD_USD
}) {
  const token = await cexFlowRepository.findTokenBySymbol(symbol);

  if (!token) {
    throw new NotFoundError(`Token ${symbol} not found`, 'TOKEN_NOT_FOUND', {
      symbol
    });
  }

  const thresholdUsd = Number(largeTransferThresholdUsd || DEFAULT_LARGE_TRANSFER_THRESHOLD_USD);

  const transfers = await cexFlowRepository.findTransfersForCexFlow({
    tokenId: token.id,
    fromDate,
    toDate,
    source
  });

  const calculatedSource = getCalculatedSource(source);
  const dataMode = getDataModeFromSource(source);
  const dailyMap = new Map();

  let cexInflows = 0;
  let cexOutflows = 0;
  let sameEntityIgnored = 0;
  let cexToCexIgnored = 0;
  let ignored = 0;

  for (const transfer of transfers) {
    const from = transfer.fromAddress || transfer.from;
    const to = transfer.toAddress || transfer.to;

    const fromIsCex = isCexAddress(from);
    const toIsCex = isCexAddress(to);

    if (!fromIsCex && !toIsCex) {
      ignored += 1;
      continue;
    }

    if (fromIsCex && toIsCex) {
      cexToCexIgnored += 1;
      continue;
    }

    if (isSameEntity(from, to)) {
      sameEntityIgnored += 1;
      continue;
    }

    const date = toDateKey(transfer.timestamp);
    const row = ensureDailyRow(dailyMap, date);

    const amount = toNumber(transfer.amount_decimal);
    const amountUsd = toNumber(transfer.amount_usd);
    const isLarge = amountUsd >= thresholdUsd;

    if (toIsCex) {
      row.cexInflow += amount;
      row.cexInflowUsd += amountUsd;
      row.inflowTxCount += 1;
      cexInflows += 1;

      if (isLarge) {
        row.largeInflowCount += 1;
        row.largeInflowUsd += amountUsd;
      }

      continue;
    }

    if (fromIsCex) {
      row.cexOutflow += amount;
      row.cexOutflowUsd += amountUsd;
      row.outflowTxCount += 1;
      cexOutflows += 1;

      if (isLarge) {
        row.largeOutflowCount += 1;
        row.largeOutflowUsd += amountUsd;
      }
    }
  }

  const rows = [...dailyMap.values()]
    .map((row) => ({
      ...row,
      cexNetflow: row.cexInflow - row.cexOutflow,
      cexNetflowUsd: row.cexInflowUsd - row.cexOutflowUsd,
      largeNetflowUsd: row.largeInflowUsd - row.largeOutflowUsd
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  await cexFlowRepository.deleteDailyFlowsBySource({
    tokenId: token.id,
    source: calculatedSource
  });

  const dbRows = rows.map((row) => normalizeDailyRowForDb({
    tokenId: token.id,
    row,
    source: calculatedSource,
    dataMode,
    largeTransferThresholdUsd: thresholdUsd
  }));

  await cexFlowRepository.bulkCreateDailyFlows(dbRows);

  return {
    token: token.symbol,
    source,
    calculatedSource,
    dataMode,
    rowsCalculated: rows.length,
    largeTransferThresholdUsd: thresholdUsd,
    stats: {
      token: token.symbol,
      source,
      calculatedSource,
      dataMode,
      transfersProcessed: transfers.length,
      cexInflows,
      cexOutflows,
      sameEntityIgnored,
      cexToCexIgnored,
      ignored,
      largeTransferThresholdUsd: thresholdUsd
    }
  };
}

async function getCexFlows({
  symbol,
  source,
  limit = 30,
  offset = 0
}) {
  const token = await cexFlowRepository.findTokenBySymbol(symbol);

  if (!token) {
    throw new NotFoundError(`Token ${symbol} not found`, 'TOKEN_NOT_FOUND', {
      symbol
    });
  }

  const { rows, total } = await cexFlowRepository.findDailyFlows({
    tokenId: token.id,
    source,
    limit,
    offset
  });

  const items = rows.map(normalizeDailyRowForApi);
  const summary = buildSummary(items);

  summary.regimeHint = getRegimeHint(summary);
  summary.largeTransferThresholdUsd =
    items.find((item) => item.largeTransferThresholdUsd)?.largeTransferThresholdUsd || 0;

  return {
    data: {
      summary,
      items,
      source: source || 'all',
      dataMode: items.find((item) => item.dataMode)?.dataMode || 'unknown',
      largeTransferThresholdUsd: summary.largeTransferThresholdUsd
    },
    meta: {
      limit,
      offset,
      total
    }
  };
}

module.exports = {
  calculateCexFlows,
  getCexFlows
};

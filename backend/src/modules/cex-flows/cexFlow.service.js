const cexFlowRepository = require('./cexFlow.repository');
const NotFoundError = require('../../errors/NotFoundError');

function numberValue(value) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function getDateKey(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function isCexAddress(address) {
  if (!address) return false;

  return (
    address.address_type === 'cex' ||
    address.entity?.entity_type === 'cex'
  );
}

function getEntityId(address) {
  if (!address) return null;
  if (!address.entity_id) return null;
  return String(address.entity_id);
}

function getDataModeFromSource(source) {
  if (!source) return 'unknown';
  if (source.includes('manual_seed_fake')) return 'fake';
  if (source.includes('etherscan')) return 'real';
  if (source.includes('mixed')) return 'mixed';
  return 'unknown';
}

function getCalculatedSource(source) {
  if (!source) return 'calculated_mixed_or_all';
  return `calculated_from_${source}`;
}

function createEmptyDay({ tokenId, date, source }) {
  return {
    token_id: tokenId,
    date,
    cex_inflow: '0',
    cex_outflow: '0',
    cex_netflow: '0',
    cex_inflow_usd: '0',
    cex_outflow_usd: '0',
    cex_netflow_usd: '0',
    inflow_tx_count: 0,
    outflow_tx_count: 0,
    large_inflow_count: 0,
    large_outflow_count: 0,
    source,
    created_at: new Date(),
    updated_at: new Date()
  };
}

function addAmount(row, field, value) {
  const current = numberValue(row[field]);
  row[field] = String(current + numberValue(value));
}

function increment(row, field) {
  row[field] += 1;
}

function classifyTransfer(transfer) {
  const fromIsCex = isCexAddress(transfer.fromAddress);
  const toIsCex = isCexAddress(transfer.toAddress);

  if (!fromIsCex && !toIsCex) {
    return 'ignored';
  }

  if (fromIsCex && toIsCex) {
    const fromEntityId = getEntityId(transfer.fromAddress);
    const toEntityId = getEntityId(transfer.toAddress);

    if (fromEntityId && toEntityId && fromEntityId === toEntityId) {
      return 'same_entity_ignored';
    }

    return 'cex_to_cex_ignored';
  }

  if (!fromIsCex && toIsCex) {
    return 'inflow';
  }

  if (fromIsCex && !toIsCex) {
    return 'outflow';
  }

  return 'ignored';
}

function mapCexFlow(row) {
  return {
    id: row.id,
    token: {
      id: row.token.id,
      symbol: row.token.symbol,
      name: row.token.name
    },
    date: row.date,
    cexInflow: numberValue(row.cex_inflow),
    cexOutflow: numberValue(row.cex_outflow),
    cexNetflow: numberValue(row.cex_netflow),
    cexInflowUsd: numberValue(row.cex_inflow_usd),
    cexOutflowUsd: numberValue(row.cex_outflow_usd),
    cexNetflowUsd: numberValue(row.cex_netflow_usd),
    inflowTxCount: row.inflow_tx_count,
    outflowTxCount: row.outflow_tx_count,
    largeInflowCount: row.large_inflow_count,
    largeOutflowCount: row.large_outflow_count,
    source: row.source,
    dataMode: getDataModeFromSource(row.source)
  };
}

function summarizeFlows(items) {
  const summary = items.reduce(
    (acc, item) => {
      acc.cexInflow += item.cexInflow;
      acc.cexOutflow += item.cexOutflow;
      acc.cexNetflow += item.cexNetflow;
      acc.cexInflowUsd += item.cexInflowUsd;
      acc.cexOutflowUsd += item.cexOutflowUsd;
      acc.cexNetflowUsd += item.cexNetflowUsd;
      acc.inflowTxCount += item.inflowTxCount;
      acc.outflowTxCount += item.outflowTxCount;
      acc.largeInflowCount += item.largeInflowCount;
      acc.largeOutflowCount += item.largeOutflowCount;

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
      largeOutflowCount: 0
    }
  );

  if (summary.cexNetflow < 0) {
    summary.regimeHint = 'CEX_SUPPLY_DRAIN';
  } else if (summary.cexNetflow > 0) {
    summary.regimeHint = 'CEX_SELL_PRESSURE';
  } else {
    summary.regimeHint = 'NEUTRAL';
  }

  return summary;
}

async function calculateCexFlows({
  symbol,
  source,
  fromDate,
  toDate
}) {
  const token = await cexFlowRepository.findTokenBySymbol(symbol);

  if (!token) {
    throw new NotFoundError(`Token ${symbol} not found`, 'TOKEN_NOT_FOUND', {
      symbol
    });
  }

  const transfers = await cexFlowRepository.findTransfersForCexFlow({
    tokenId: token.id,
    source,
    fromDate,
    toDate
  });

  const calculatedSource = getCalculatedSource(source);
  const byDate = new Map();

  const stats = {
    token: token.symbol,
    source: source || 'all',
    calculatedSource,
    dataMode: getDataModeFromSource(calculatedSource),
    transfersProcessed: transfers.length,
    cexInflows: 0,
    cexOutflows: 0,
    sameEntityIgnored: 0,
    cexToCexIgnored: 0,
    ignored: 0
  };

  for (const transfer of transfers) {
    const date = getDateKey(transfer.timestamp);

    if (!byDate.has(date)) {
      byDate.set(
        date,
        createEmptyDay({
          tokenId: token.id,
          date,
          source: calculatedSource
        })
      );
    }

    const row = byDate.get(date);
    const classification = classifyTransfer(transfer);
    const amount = numberValue(transfer.amount_decimal);
    const amountUsd = numberValue(transfer.amount_usd);

    if (classification === 'inflow') {
      addAmount(row, 'cex_inflow', amount);
      addAmount(row, 'cex_netflow', amount);
      addAmount(row, 'cex_inflow_usd', amountUsd);
      addAmount(row, 'cex_netflow_usd', amountUsd);
      increment(row, 'inflow_tx_count');

      if (amountUsd >= 1000000 || amount >= 100000) {
        increment(row, 'large_inflow_count');
      }

      stats.cexInflows += 1;
    } else if (classification === 'outflow') {
      addAmount(row, 'cex_outflow', amount);
      addAmount(row, 'cex_netflow', -amount);
      addAmount(row, 'cex_outflow_usd', amountUsd);
      addAmount(row, 'cex_netflow_usd', -amountUsd);
      increment(row, 'outflow_tx_count');

      if (amountUsd >= 1000000 || amount >= 100000) {
        increment(row, 'large_outflow_count');
      }

      stats.cexOutflows += 1;
    } else if (classification === 'same_entity_ignored') {
      stats.sameEntityIgnored += 1;
    } else if (classification === 'cex_to_cex_ignored') {
      stats.cexToCexIgnored += 1;
    } else {
      stats.ignored += 1;
    }
  }

  await cexFlowRepository.deleteCexFlows({
    tokenId: token.id,
    source: calculatedSource
  });

  const rows = [...byDate.values()];
  const created = await cexFlowRepository.bulkCreateCexFlows(rows);

  return {
    token: token.symbol,
    source: source || 'all',
    calculatedSource,
    dataMode: getDataModeFromSource(calculatedSource),
    rowsCalculated: created.length,
    stats
  };
}

async function getCexFlows({
  symbol,
  source,
  limit,
  offset
}) {
  const result = await cexFlowRepository.findCexFlowsByToken({
    symbol,
    source,
    limit,
    offset
  });

  const items = result.rows.map(mapCexFlow);

  return {
    data: {
      summary: summarizeFlows(items),
      items,
      source: source || 'all',
      dataMode: source ? getDataModeFromSource(source) : 'mixed_or_all'
    },
    meta: {
      limit,
      offset,
      total: result.count
    }
  };
}

module.exports = {
  calculateCexFlows,
  getCexFlows,
  getDataModeFromSource,
  getCalculatedSource
};

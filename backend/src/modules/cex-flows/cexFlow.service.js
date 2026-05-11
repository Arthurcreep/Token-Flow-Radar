const cexFlowRepository = require('./cexFlow.repository');
const NotFoundError = require('../../errors/NotFoundError');
const BadRequestError = require('../../errors/BadRequestError');

const LARGE_TRANSFER_USD_THRESHOLD = 1_000_000;

function isCexAddress(addressModel) {
  return addressModel?.entity?.entity_type === 'cex' || addressModel?.address_type === 'cex';
}

function getEntityId(addressModel) {
  return addressModel?.entity?.id ? String(addressModel.entity.id) : null;
}

function isSameEntityTransfer(fromAddress, toAddress) {
  const fromEntityId = getEntityId(fromAddress);
  const toEntityId = getEntityId(toAddress);

  if (!fromEntityId || !toEntityId) return false;

  return fromEntityId === toEntityId;
}

function toDateKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function numberValue(value) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function createEmptyDailyFlow({ tokenId, date }) {
  return {
    token_id: tokenId,
    date,
    cex_inflow: 0,
    cex_outflow: 0,
    cex_netflow: 0,
    cex_inflow_usd: 0,
    cex_outflow_usd: 0,
    cex_netflow_usd: 0,
    inflow_tx_count: 0,
    outflow_tx_count: 0,
    large_inflow_count: 0,
    large_outflow_count: 0,
    source: 'calculated'
  };
}

function classifyTransfer(transfer) {
  const fromIsCex = isCexAddress(transfer.fromAddress);
  const toIsCex = isCexAddress(transfer.toAddress);
  const sameEntity = isSameEntityTransfer(transfer.fromAddress, transfer.toAddress);

  if (sameEntity) {
    return 'same_entity';
  }

  if (!fromIsCex && toIsCex) {
    return 'cex_inflow';
  }

  if (fromIsCex && !toIsCex) {
    return 'cex_outflow';
  }

  return 'ignored';
}

async function calculateCexFlows({ symbol, fromDate = null, toDate = null }) {
  const token = await cexFlowRepository.findTokenBySymbol(symbol);

  if (!token) {
    throw new NotFoundError(`Token ${symbol} not found`, 'TOKEN_NOT_FOUND', { symbol });
  }

  const transfers = await cexFlowRepository.findTransfersForCalculation({
    tokenId: token.id,
    fromDate,
    toDate
  });

  if (!transfers.length) {
    throw new BadRequestError('No transfers found for calculation', 'NO_TRANSFERS_FOUND', {
      symbol,
      fromDate,
      toDate
    });
  }

  const dailyMap = new Map();

  const stats = {
    token: token.symbol,
    transfersProcessed: transfers.length,
    cexInflows: 0,
    cexOutflows: 0,
    sameEntityIgnored: 0,
    ignored: 0
  };

  for (const transfer of transfers) {
    const date = toDateKey(transfer.timestamp);

    if (!dailyMap.has(date)) {
      dailyMap.set(
        date,
        createEmptyDailyFlow({
          tokenId: token.id,
          date
        })
      );
    }

    const daily = dailyMap.get(date);
    const classification = classifyTransfer(transfer);

    const amount = numberValue(transfer.amount_decimal);
    const amountUsd = numberValue(transfer.amount_usd);

    if (classification === 'cex_inflow') {
      daily.cex_inflow += amount;
      daily.cex_inflow_usd += amountUsd;
      daily.inflow_tx_count += 1;

      if (amountUsd >= LARGE_TRANSFER_USD_THRESHOLD) {
        daily.large_inflow_count += 1;
      }

      stats.cexInflows += 1;
    } else if (classification === 'cex_outflow') {
      daily.cex_outflow += amount;
      daily.cex_outflow_usd += amountUsd;
      daily.outflow_tx_count += 1;

      if (amountUsd >= LARGE_TRANSFER_USD_THRESHOLD) {
        daily.large_outflow_count += 1;
      }

      stats.cexOutflows += 1;
    } else if (classification === 'same_entity') {
      stats.sameEntityIgnored += 1;
    } else {
      stats.ignored += 1;
    }

    daily.cex_netflow = daily.cex_inflow - daily.cex_outflow;
    daily.cex_netflow_usd = daily.cex_inflow_usd - daily.cex_outflow_usd;
  }

  const rows = Array.from(dailyMap.values()).map((row) => ({
    ...row,
    cex_inflow: String(row.cex_inflow),
    cex_outflow: String(row.cex_outflow),
    cex_netflow: String(row.cex_netflow),
    cex_inflow_usd: String(row.cex_inflow_usd),
    cex_outflow_usd: String(row.cex_outflow_usd),
    cex_netflow_usd: String(row.cex_netflow_usd),
    created_at: new Date(),
    updated_at: new Date()
  }));

  await cexFlowRepository.deleteFlowsForToken({
    tokenId: token.id,
    fromDate,
    toDate
  });

  await cexFlowRepository.bulkInsertFlows(rows);

  return {
    token: token.symbol,
    rowsCalculated: rows.length,
    stats
  };
}

function mapFlow(row) {
  return {
    id: row.id,
    token: {
      id: row.token.id,
      symbol: row.token.symbol,
      name: row.token.name
    },
    date: row.date,
    cexInflow: Number(row.cex_inflow),
    cexOutflow: Number(row.cex_outflow),
    cexNetflow: Number(row.cex_netflow),
    cexInflowUsd: Number(row.cex_inflow_usd),
    cexOutflowUsd: Number(row.cex_outflow_usd),
    cexNetflowUsd: Number(row.cex_netflow_usd),
    inflowTxCount: row.inflow_tx_count,
    outflowTxCount: row.outflow_tx_count,
    largeInflowCount: row.large_inflow_count,
    largeOutflowCount: row.large_outflow_count,
    source: row.source
  };
}

function getRegimeHint(summary) {
  if (summary.cexNetflow > 0) {
    return 'CEX_SELL_PRESSURE';
  }

  if (summary.cexNetflow < 0) {
    return 'CEX_SUPPLY_DRAIN';
  }

  return 'NEUTRAL';
}

function buildFlowSummary(items) {
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

  return {
    ...summary,
    regimeHint: getRegimeHint(summary)
  };
}

async function getCexFlows({ symbol, limit, offset }) {
  const result = await cexFlowRepository.findFlowsByTokenSymbol({
    symbol,
    limit,
    offset
  });

  const items = result.rows.map(mapFlow);
  const summary = buildFlowSummary(items);

  return {
    data: {
      summary,
      items
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
  classifyTransfer
};
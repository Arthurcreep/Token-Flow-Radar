const holderRepository = require('./holder.repository');
const NotFoundError = require('../../errors/NotFoundError');
const BadRequestError = require('../../errors/BadRequestError');

function numberValue(value) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function isCexHolder(holder) {
  return holder.address?.entity?.entity_type === 'cex' || holder.address?.address_type === 'cex';
}

function mapAddress(addressModel, rawAddress) {
  if (!addressModel) {
    return {
      address: rawAddress,
      label: null,
      addressType: 'unknown',
      addressRole: 'unknown',
      entity: null
    };
  }

  return {
    id: addressModel.id,
    address: addressModel.address,
    label: addressModel.label,
    addressType: addressModel.address_type,
    addressRole: addressModel.address_role,
    entity: addressModel.entity
      ? {
          id: addressModel.entity.id,
          name: addressModel.entity.name,
          entityType: addressModel.entity.entity_type
        }
      : null
  };
}

function mapHolder(holder) {
  return {
    id: holder.id,
    token: {
      id: holder.token.id,
      symbol: holder.token.symbol,
      name: holder.token.name
    },
    date: holder.date,
    rank: holder.rank,
    address: mapAddress(holder.address, holder.address_raw),
    balanceDecimal: numberValue(holder.balance_decimal),
    balanceUsd: holder.balance_usd === null ? null : numberValue(holder.balance_usd),
    supplyShare: holder.supply_share === null ? null : numberValue(holder.supply_share),
    balanceChange1d: numberValue(holder.balance_change_1d),
    balanceChange7d: numberValue(holder.balance_change_7d),
    balanceChange30d: numberValue(holder.balance_change_30d),
    isCex: isCexHolder(holder),
    source: holder.source
  };
}

function buildHolderSummary(items) {
  const summary = items.reduce(
    (acc, item) => {
      acc.totalBalance += item.balanceDecimal;
      acc.totalBalanceUsd += item.balanceUsd || 0;
      acc.totalSupplyShare += item.supplyShare || 0;

      acc.balanceChange1d += item.balanceChange1d;
      acc.balanceChange7d += item.balanceChange7d;
      acc.balanceChange30d += item.balanceChange30d;

      if (item.balanceChange7d > 0) acc.accumulatingHolders += 1;
      if (item.balanceChange7d < 0) acc.distributingHolders += 1;
      if (item.balanceChange7d === 0) acc.neutralHolders += 1;

      if (item.isCex) {
        acc.cexHolderCount += 1;
        acc.cexBalance += item.balanceDecimal;
        acc.cexBalanceChange7d += item.balanceChange7d;
      } else {
        acc.nonCexHolderCount += 1;
        acc.nonCexBalance += item.balanceDecimal;
        acc.nonCexBalanceChange7d += item.balanceChange7d;
      }

      return acc;
    },
    {
      holderCount: items.length,
      totalBalance: 0,
      totalBalanceUsd: 0,
      totalSupplyShare: 0,
      balanceChange1d: 0,
      balanceChange7d: 0,
      balanceChange30d: 0,
      accumulatingHolders: 0,
      distributingHolders: 0,
      neutralHolders: 0,
      cexHolderCount: 0,
      nonCexHolderCount: 0,
      cexBalance: 0,
      nonCexBalance: 0,
      cexBalanceChange7d: 0,
      nonCexBalanceChange7d: 0
    }
  );

  return {
    ...summary,
    holderBehaviorHint:
      summary.nonCexBalanceChange7d > 0
        ? 'NON_CEX_HOLDERS_ACCUMULATING'
        : summary.nonCexBalanceChange7d < 0
          ? 'NON_CEX_HOLDERS_DISTRIBUTING'
          : 'NEUTRAL'
  };
}

async function getTopHolders({ symbol, limit, offset }) {
  const latestInfo = await holderRepository.findLatestDateByTokenSymbol(symbol);

  if (!latestInfo?.token) {
    throw new NotFoundError(`Token ${symbol} not found`, 'TOKEN_NOT_FOUND', { symbol });
  }

  if (!latestInfo.latestDate) {
    throw new BadRequestError('No holder snapshots found', 'NO_HOLDER_SNAPSHOTS_FOUND', {
      symbol
    });
  }

  const result = await holderRepository.findTopHoldersByTokenSymbol({
    symbol,
    date: latestInfo.latestDate,
    limit,
    offset
  });

  const items = result.rows.map(mapHolder);
  const summary = buildHolderSummary(items);

  return {
    data: {
      summary,
      items
    },
    meta: {
      limit,
      offset,
      total: result.count,
      date: latestInfo.latestDate
    }
  };
}

module.exports = {
  getTopHolders
};
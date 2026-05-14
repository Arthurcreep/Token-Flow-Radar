const transferRepository = require('./transfer.repository');
const NotFoundError = require('../../errors/NotFoundError');

function numberValue(value) {
  if (value === null || value === undefined) return null;
  return Number(value);
}

function mapEntity(entity) {
  if (!entity) return null;

  return {
    id: entity.id,
    name: entity.name,
    entityType: entity.entity_type
  };
}

function mapAddress(address, rawAddress) {
  if (!address) {
    return {
      address: rawAddress,
      label: null,
      addressType: 'unknown',
      addressRole: 'unknown',
      entity: null
    };
  }

  return {
    id: address.id,
    address: address.address,
    label: address.label,
    addressType: address.address_type,
    addressRole: address.address_role,
    entity: mapEntity(address.entity)
  };
}

function getDataModeFromSource(source) {
  if (!source) return 'unknown';
  if (source.startsWith('manual_seed_fake')) return 'fake';
  if (source.startsWith('etherscan')) return 'real';
  return 'unknown';
}

function mapTransfer(transfer) {
  return {
    id: transfer.id,
    token: {
      id: transfer.token.id,
      symbol: transfer.token.symbol,
      name: transfer.token.name
    },
    chain: transfer.chain,
    blockNumber: transfer.block_number,
    txHash: transfer.tx_hash,
    logIndex: transfer.log_index,
    from: mapAddress(transfer.fromAddress, transfer.from_address_raw),
    to: mapAddress(transfer.toAddress, transfer.to_address_raw),
    amountDecimal: numberValue(transfer.amount_decimal),
    amountUsd: numberValue(transfer.amount_usd),
    timestamp: transfer.timestamp,
    source: transfer.source,
    dataMode: getDataModeFromSource(transfer.source)
  };
}

async function getTransfers({
  token,
  source,
  limit,
  offset
}) {
  const tokenRow = await transferRepository.findTokenBySymbol(token);

  if (!tokenRow) {
    throw new NotFoundError(`Token ${token} not found`, 'TOKEN_NOT_FOUND', {
      token
    });
  }

  const result = await transferRepository.findTransfersByToken({
    tokenId: tokenRow.id,
    source,
    limit,
    offset
  });

  return {
    data: result.rows.map(mapTransfer),
    meta: {
      limit,
      offset,
      total: result.count,
      source: source || 'all',
      dataMode: source ? getDataModeFromSource(source) : 'mixed_or_all'
    }
  };
}

async function getTransferSources({ token }) {
  const tokenRow = await transferRepository.findTokenBySymbol(token);

  if (!tokenRow) {
    throw new NotFoundError(`Token ${token} not found`, 'TOKEN_NOT_FOUND', {
      token
    });
  }

  const sources = await transferRepository.findTransferSourcesByToken({
    tokenId: tokenRow.id
  });

  return sources.map((row) => ({
    source: row.source,
    dataMode: getDataModeFromSource(row.source)
  }));
}

module.exports = {
  getTransfers,
  getTransferSources,
  getDataModeFromSource
};

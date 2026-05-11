const transferRepository = require('./transfer.repository');

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
    amountDecimal: Number(transfer.amount_decimal),
    amountUsd: transfer.amount_usd === null ? null : Number(transfer.amount_usd),
    timestamp: transfer.timestamp,
    source: transfer.source
  };
}

async function getTransfers({ tokenSymbol, limit, offset }) {
  const result = await transferRepository.findTransfers({
    tokenSymbol,
    limit,
    offset
  });

  return {
    data: result.rows.map(mapTransfer),
    meta: {
      limit,
      offset,
      total: result.count
    }
  };
}

module.exports = {
  getTransfers
};
const labelRepository = require('./label.repository');
const NotFoundError = require('../../errors/NotFoundError');

function mapAddress(address) {
  return {
    id: address.id,
    chain: address.chain,
    address: address.address,
    addressType: address.address_type,
    addressRole: address.address_role,
    label: address.label,
    source: address.source,
    confidence: Number(address.confidence),
    isContract: address.is_contract,
    entity: address.entity
      ? {
          id: address.entity.id,
          name: address.entity.name,
          entityType: address.entity.entity_type
        }
      : null
  };
}

async function getLabels({ limit, offset, addressType }) {
  const result = await labelRepository.findAddresses({
    limit,
    offset,
    addressType
  });

  return {
    data: result.rows.map(mapAddress),
    meta: {
      limit,
      offset,
      total: result.count
    }
  };
}

async function getLabelByAddress(address, chain = 'ethereum') {
  const label = await labelRepository.findByAddress(address, chain);

  if (!label) {
    throw new NotFoundError('Address label not found', 'ADDRESS_LABEL_NOT_FOUND', {
      address,
      chain
    });
  }

  return mapAddress(label);
}

module.exports = {
  getLabels,
  getLabelByAddress
};
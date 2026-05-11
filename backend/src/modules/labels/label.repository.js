const { Address, Entity } = require('../../models');

async function findAddresses({ limit = 50, offset = 0, addressType }) {
  const where = {
    is_active: true
  };

  if (addressType) {
    where.address_type = addressType;
  }

  const { rows, count } = await Address.findAndCountAll({
    where,
    include: [
      {
        model: Entity,
        as: 'entity',
        required: false
      }
    ],
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });

  return { rows, count };
}

async function findByAddress(address, chain = 'ethereum') {
  return Address.findOne({
    where: {
      chain,
      address: address.toLowerCase(),
      is_active: true
    },
    include: [
      {
        model: Entity,
        as: 'entity',
        required: false
      }
    ]
  });
}

module.exports = {
  findAddresses,
  findByAddress
};
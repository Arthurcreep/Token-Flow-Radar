const { TokenTransfer, Token, Address, Entity } = require('../../models');

async function findTransfers({ tokenSymbol, limit = 50, offset = 0 }) {
  const where = {};

  const include = [
    {
      model: Token,
      as: 'token',
      required: true,
      where: {
        symbol: tokenSymbol.toUpperCase()
      }
    },
    {
      model: Address,
      as: 'fromAddress',
      required: false,
      include: [
        {
          model: Entity,
          as: 'entity',
          required: false
        }
      ]
    },
    {
      model: Address,
      as: 'toAddress',
      required: false,
      include: [
        {
          model: Entity,
          as: 'entity',
          required: false
        }
      ]
    }
  ];

  const { rows, count } = await TokenTransfer.findAndCountAll({
    where,
    include,
    limit,
    offset,
    order: [['timestamp', 'DESC']]
  });

  return { rows, count };
}

module.exports = {
  findTransfers
};
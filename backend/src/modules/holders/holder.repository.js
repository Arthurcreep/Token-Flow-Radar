const { Token, HolderSnapshot, Address, Entity } = require('../../models');

async function findLatestDateByTokenSymbol(symbol) {
  const token = await Token.findOne({
    where: {
      symbol: symbol.toUpperCase(),
      is_active: true
    }
  });

  if (!token) return null;

  const latest = await HolderSnapshot.max('date', {
    where: {
      token_id: token.id
    }
  });

  return {
    token,
    latestDate: latest
  };
}

async function findTopHoldersByTokenSymbol({ symbol, date, limit = 100, offset = 0 }) {
  const { rows, count } = await HolderSnapshot.findAndCountAll({
    include: [
      {
        model: Token,
        as: 'token',
        required: true,
        where: {
          symbol: symbol.toUpperCase()
        }
      },
      {
        model: Address,
        as: 'address',
        required: false,
        include: [{ model: Entity, as: 'entity', required: false }]
      }
    ],
    where: {
      date
    },
    limit,
    offset,
    order: [['rank', 'ASC']]
  });

  return { rows, count };
}

module.exports = {
  findLatestDateByTokenSymbol,
  findTopHoldersByTokenSymbol
};
const { Token } = require('../../models');

async function findAllActive() {
  return Token.findAll({
    where: {
      is_active: true
    },
    order: [['symbol', 'ASC']]
  });
}

async function findBySymbol(symbol) {
  return Token.findOne({
    where: {
      symbol: symbol.toUpperCase(),
      is_active: true
    }
  });
}

module.exports = {
  findAllActive,
  findBySymbol
};
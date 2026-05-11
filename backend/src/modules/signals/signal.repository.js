const { Token, Signal, TokenMetricDaily } = require('../../models');

async function findLatestMetricBySymbol(symbol) {
  return TokenMetricDaily.findOne({
    include: [
      {
        model: Token,
        as: 'token',
        required: true,
        where: {
          symbol: symbol.toUpperCase()
        }
      }
    ],
    order: [['date', 'DESC']]
  });
}

async function deleteDuplicateSignals({ tokenId, signalType, regime, signalDate }) {
  return Signal.destroy({
    where: {
      token_id: tokenId,
      signal_type: signalType,
      regime,
      signal_date: signalDate
    }
  });
}

async function createSignal(row) {
  return Signal.create(row);
}

async function findSignalsByTokenSymbol({ symbol, limit = 50, offset = 0 }) {
  const { rows, count } = await Signal.findAndCountAll({
    include: [
      {
        model: Token,
        as: 'token',
        required: true,
        where: {
          symbol: symbol.toUpperCase()
        }
      }
    ],
    limit,
    offset,
    order: [['timestamp', 'DESC']]
  });

  return { rows, count };
}

async function findSignals({ limit = 50, offset = 0 }) {
  const { rows, count } = await Signal.findAndCountAll({
    include: [
      {
        model: Token,
        as: 'token',
        required: true
      }
    ],
    limit,
    offset,
    order: [['timestamp', 'DESC']]
  });

  return { rows, count };
}

module.exports = {
  findLatestMetricBySymbol,
  deleteDuplicateSignals,
  createSignal,
  findSignalsByTokenSymbol,
  findSignals
};
const { Op } = require('sequelize');
const { Token, TokenTransfer, Address, Entity, CexFlowDaily } = require('../../models');

async function findTokenBySymbol(symbol) {
  return Token.findOne({
    where: {
      symbol: symbol.toUpperCase(),
      is_active: true
    }
  });
}

async function findTransfersForCalculation({ tokenId, fromDate, toDate }) {
  const where = {
    token_id: tokenId
  };

  if (fromDate || toDate) {
    where.timestamp = {};
    if (fromDate) where.timestamp[Op.gte] = fromDate;
    if (toDate) where.timestamp[Op.lte] = toDate;
  }

  return TokenTransfer.findAll({
    where,
    include: [
      {
        model: Address,
        as: 'fromAddress',
        required: false,
        include: [{ model: Entity, as: 'entity', required: false }]
      },
      {
        model: Address,
        as: 'toAddress',
        required: false,
        include: [{ model: Entity, as: 'entity', required: false }]
      }
    ],
    order: [['timestamp', 'ASC']]
  });
}

async function deleteFlowsForToken({ tokenId, fromDate, toDate }) {
  const where = {
    token_id: tokenId
  };

  if (fromDate || toDate) {
    where.date = {};
    if (fromDate) where.date[Op.gte] = fromDate.slice(0, 10);
    if (toDate) where.date[Op.lte] = toDate.slice(0, 10);
  }

  return CexFlowDaily.destroy({ where });
}

async function bulkInsertFlows(rows) {
  if (!rows.length) return [];

  return CexFlowDaily.bulkCreate(rows, {
    updateOnDuplicate: [
      'cex_inflow',
      'cex_outflow',
      'cex_netflow',
      'cex_inflow_usd',
      'cex_outflow_usd',
      'cex_netflow_usd',
      'inflow_tx_count',
      'outflow_tx_count',
      'large_inflow_count',
      'large_outflow_count',
      'source',
      'updated_at'
    ]
  });
}

async function findFlowsByTokenSymbol({ symbol, limit = 30, offset = 0 }) {
  const { rows, count } = await CexFlowDaily.findAndCountAll({
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
    order: [['date', 'DESC']]
  });

  return { rows, count };
}

module.exports = {
  findTokenBySymbol,
  findTransfersForCalculation,
  deleteFlowsForToken,
  bulkInsertFlows,
  findFlowsByTokenSymbol
};
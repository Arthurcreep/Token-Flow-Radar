const { Op } = require('sequelize');
const {
  Token,
  CexFlowDaily,
  HolderSnapshot,
  Address,
  Entity,
  TokenMetricDaily
} = require('../../models');

async function findTokenBySymbol(symbol) {
  return Token.findOne({
    where: {
      symbol: symbol.toUpperCase(),
      is_active: true
    }
  });
}

async function findCexFlowsByDateRange({ tokenId, fromDate, toDate }) {
  return CexFlowDaily.findAll({
    where: {
      token_id: tokenId,
      date: {
        [Op.gte]: fromDate,
        [Op.lte]: toDate
      }
    },
    order: [['date', 'ASC']]
  });
}

async function findLatestHolderDate({ tokenId }) {
  return HolderSnapshot.max('date', {
    where: {
      token_id: tokenId
    }
  });
}

async function findHolderSnapshotsByDate({ tokenId, date }) {
  return HolderSnapshot.findAll({
    where: {
      token_id: tokenId,
      date
    },
    include: [
      {
        model: Address,
        as: 'address',
        required: false,
        include: [{ model: Entity, as: 'entity', required: false }]
      }
    ],
    order: [['rank', 'ASC']]
  });
}

async function deleteMetricForDate({ tokenId, date, scoreVersion }) {
  return TokenMetricDaily.destroy({
    where: {
      token_id: tokenId,
      date,
      score_version: scoreVersion
    }
  });
}

async function createMetric(row) {
  return TokenMetricDaily.create(row);
}

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

module.exports = {
  findTokenBySymbol,
  findCexFlowsByDateRange,
  findLatestHolderDate,
  findHolderSnapshotsByDate,
  deleteMetricForDate,
  createMetric,
  findLatestMetricBySymbol
};
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

async function findLatestHolderDate({ tokenId, source }) {
  const where = {
    token_id: tokenId
  };

  if (source) {
    where.source = source;
  }

  return HolderSnapshot.max('date', {
    where
  });
}

async function findCexFlowsBySource({ tokenId, source }) {
  const where = {
    token_id: tokenId
  };

  if (source) {
    where.source = source;
  }

  return CexFlowDaily.findAll({
    where,
    order: [['date', 'ASC']]
  });
}

async function findCexFlowsByDateRange({
  tokenId,
  fromDate,
  toDate,
  source
}) {
  const { Op } = require('sequelize');

  const where = {
    token_id: tokenId,
    date: {
      [Op.gte]: fromDate,
      [Op.lte]: toDate
    }
  };

  if (source) {
    where.source = source;
  }

  return CexFlowDaily.findAll({
    where,
    order: [['date', 'ASC']]
  });
}

async function findHolderSnapshotsByDate({
  tokenId,
  date,
  source
}) {
  const where = {
    token_id: tokenId,
    date
  };

  if (source) {
    where.source = source;
  }

  return HolderSnapshot.findAll({
    where,
    include: [
      {
        model: Address,
        as: 'address',
        required: false,
        include: [
          {
            model: Entity,
            as: 'entity',
            required: false
          }
        ]
      }
    ],
    order: [['rank', 'ASC']]
  });
}

async function deleteMetricForDate({
  tokenId,
  date,
  scoreVersion
}) {
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
    order: [['date', 'DESC'], ['id', 'DESC']]
  });
}

module.exports = {
  findTokenBySymbol,
  findLatestHolderDate,
  findCexFlowsBySource,
  findCexFlowsByDateRange,
  findHolderSnapshotsByDate,
  deleteMetricForDate,
  createMetric,
  findLatestMetricBySymbol
};

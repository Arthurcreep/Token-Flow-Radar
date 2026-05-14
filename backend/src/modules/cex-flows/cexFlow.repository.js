const {
  Token,
  TokenTransfer,
  Address,
  Entity,
  CexFlowDaily
} = require('../../models');

async function findTokenBySymbol(symbol) {
  return Token.findOne({
    where: {
      symbol: symbol.toUpperCase(),
      is_active: true
    }
  });
}

function buildTransferWhere({
  tokenId,
  source,
  fromDate,
  toDate
}) {
  const where = {
    token_id: tokenId
  };

  if (source) {
    where.source = source;
  }

  if (fromDate || toDate) {
    where.timestamp = {};

    if (fromDate) {
      where.timestamp[require('sequelize').Op.gte] = new Date(`${fromDate}T00:00:00.000Z`);
    }

    if (toDate) {
      where.timestamp[require('sequelize').Op.lte] = new Date(`${toDate}T23:59:59.999Z`);
    }
  }

  return where;
}

async function findTransfersForCexFlow({
  tokenId,
  source,
  fromDate,
  toDate
}) {
  const where = buildTransferWhere({
    tokenId,
    source,
    fromDate,
    toDate
  });

  return TokenTransfer.findAll({
    where,
    include: [
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
    ],
    order: [['timestamp', 'ASC']]
  });
}

async function deleteCexFlows({
  tokenId,
  source
}) {
  const where = {
    token_id: tokenId
  };

  if (source) {
    where.source = source;
  }

  return CexFlowDaily.destroy({
    where
  });
}

async function bulkCreateCexFlows(rows) {
  if (!rows.length) return [];

  return CexFlowDaily.bulkCreate(rows);
}

async function findCexFlowsByToken({
  symbol,
  source,
  limit = 30,
  offset = 0
}) {
  const where = {};

  if (source) {
    where.source = source;
  }

  const { rows, count } = await CexFlowDaily.findAndCountAll({
    where,
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
    order: [['date', 'DESC']],
    limit,
    offset
  });

  return {
    rows,
    count
  };
}

module.exports = {
  findTokenBySymbol,
  findTransfersForCexFlow,
  deleteCexFlows,
  bulkCreateCexFlows,
  findCexFlowsByToken
};

const { Op } = require('sequelize');
const {
  Token,
  TokenTransfer,
  Address,
  Entity
} = require('../../models');

function buildTransferWhere({ tokenId, source }) {
  const where = {
    token_id: tokenId
  };

  if (source) {
    where.source = source;
  }

  return where;
}

async function findTokenBySymbol(symbol) {
  return Token.findOne({
    where: {
      symbol: symbol.toUpperCase(),
      is_active: true
    }
  });
}

async function findTransfersByToken({
  tokenId,
  source,
  limit = 50,
  offset = 0
}) {
  const where = buildTransferWhere({
    tokenId,
    source
  });

  const { rows, count } = await TokenTransfer.findAndCountAll({
    where,
    include: [
      {
        model: Token,
        as: 'token',
        required: true
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
    ],
    order: [['timestamp', 'DESC']],
    limit,
    offset
  });

  return {
    rows,
    count
  };
}

async function findTransferSourcesByToken({ tokenId }) {
  return TokenTransfer.findAll({
    where: {
      token_id: tokenId,
      source: {
        [Op.ne]: null
      }
    },
    attributes: ['source'],
    group: ['source'],
    order: [['source', 'ASC']]
  });
}

module.exports = {
  findTokenBySymbol,
  findTransfersByToken,
  findTransferSourcesByToken
};

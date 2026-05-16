const { Op } = require('sequelize');
const {
  Token,
  TokenTransfer
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
  force = false
}) {
  const where = {
    token_id: tokenId
  };

  if (source) {
    where.source = source;
  }

  if (!force) {
    where[Op.or] = [
      {
        amount_usd: null
      },
      {
        amount_usd: '0'
      }
    ];
  }

  return where;
}

async function findTransfersForValuation({
  tokenId,
  source,
  force = false,
  limit = 1000
}) {
  return TokenTransfer.findAll({
    where: buildTransferWhere({
      tokenId,
      source,
      force
    }),
    order: [['timestamp', 'DESC'], ['id', 'DESC']],
    limit
  });
}

async function updateTransferUsd({
  transferId,
  amountUsd
}) {
  return TokenTransfer.update(
    {
      amount_usd: String(amountUsd),
      updated_at: new Date()
    },
    {
      where: {
        id: transferId
      }
    }
  );
}

module.exports = {
  findTokenBySymbol,
  findTransfersForValuation,
  updateTransferUsd
};

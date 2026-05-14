const { Op } = require('sequelize');
const {
  Token,
  Address,
  Entity,
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

async function findCexAddresses({ chain = 'ethereum' }) {
  return Address.findAll({
    where: {
      chain,
      address_type: 'cex',
      is_active: true
    },
    include: [
      {
        model: Entity,
        as: 'entity',
        required: false
      }
    ],
    order: [['id', 'ASC']]
  });
}

async function findAddressByRaw({ chain = 'ethereum', address }) {
  if (!address) return null;

  return Address.findOne({
    where: {
      chain,
      address: address.toLowerCase()
    }
  });
}

async function findExistingTransfers({ tokenId, transferKeys = [] }) {
  if (!transferKeys.length) return [];

  const hashes = [...new Set(transferKeys.map((item) => item.txHash).filter(Boolean))];

  if (!hashes.length) return [];

  return TokenTransfer.findAll({
    where: {
      token_id: tokenId,
      tx_hash: {
        [Op.in]: hashes
      }
    }
  });
}

async function bulkCreateTransfers(rows = []) {
  if (!rows.length) return [];

  return TokenTransfer.bulkCreate(rows);
}

module.exports = {
  findTokenBySymbol,
  findCexAddresses,
  findAddressByRaw,
  findExistingTransfers,
  bulkCreateTransfers
};

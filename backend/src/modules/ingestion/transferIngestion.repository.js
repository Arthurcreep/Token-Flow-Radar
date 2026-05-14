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

async function findExistingTransfersByHashes({ tokenId, source, txHashes = [] }) {
  const uniqueHashes = [...new Set(txHashes.filter(Boolean))];

  if (!uniqueHashes.length) return [];

  return TokenTransfer.findAll({
    where: {
      token_id: tokenId,
      source,
      tx_hash: {
        [Op.in]: uniqueHashes
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
  findExistingTransfersByHashes,
  bulkCreateTransfers
};

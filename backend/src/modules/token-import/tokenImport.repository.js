const {
  Token
} = require('../../models');

async function findTokenByContractAddress({
  chain,
  contractAddress
}) {
  return Token.findOne({
    where: {
      chain,
      contract_address: contractAddress.toLowerCase()
    }
  });
}

async function findTokenBySymbol(symbol) {
  return Token.findOne({
    where: {
      symbol: symbol.toUpperCase()
    }
  });
}

async function createToken({
  symbol,
  name,
  chain,
  contractAddress,
  decimals,
  coingeckoId,
  isActive = true
}) {
  return Token.create({
    symbol: symbol.toUpperCase(),
    name,
    chain,
    contract_address: contractAddress.toLowerCase(),
    decimals,
    coingecko_id: coingeckoId || null,
    is_active: isActive
  });
}

module.exports = {
  findTokenByContractAddress,
  findTokenBySymbol,
  createToken
};

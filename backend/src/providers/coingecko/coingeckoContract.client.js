const AppError = require('../../errors/AppError');

const COINGECKO_API_URL = process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';

function makeAppError(message, statusCode, code, details = null) {
  const error = new AppError(message, statusCode, code, details);

  error.code = code;
  error.statusCode = statusCode;
  error.details = details;

  return error;
}

async function findCoinByEthereumContract(contractAddress) {
  const url = `${COINGECKO_API_URL}/coins/ethereum/contract/${contractAddress.toLowerCase()}`;

  const response = await fetch(url, {
    headers: {
      accept: 'application/json'
    }
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw makeAppError(
      'CoinGecko contract lookup failed',
      502,
      'COINGECKO_CONTRACT_LOOKUP_FAILED',
      {
        status: response.status
      }
    );
  }

  const payload = await response.json();

  return {
    id: payload.id,
    symbol: payload.symbol,
    name: payload.name,
    assetPlatformId: payload.asset_platform_id
  };
}

module.exports = {
  findCoinByEthereumContract
};

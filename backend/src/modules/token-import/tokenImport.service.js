const AppError = require('../../errors/AppError');
const tokenImportRepository = require('./tokenImport.repository');
const erc20MetadataClient = require('../../providers/ethereum/erc20Metadata.client');
const coingeckoContractClient = require('../../providers/coingecko/coingeckoContract.client');

function makeAppError(message, statusCode, code, details = null) {
  const error = new AppError(message, statusCode, code, details);

  error.code = code;
  error.statusCode = statusCode;
  error.details = details;

  return error;
}

function normalizeContractAddress(contractAddress) {
  return contractAddress.trim().toLowerCase();
}

function serializeToken(token) {
  const plain = token?.toJSON ? token.toJSON() : token;

  return {
    id: plain.id,
    symbol: plain.symbol,
    name: plain.name,
    chain: plain.chain,
    contractAddress: plain.contract_address || plain.contractAddress,
    decimals: plain.decimals,
    coingeckoId: plain.coingecko_id || plain.coingeckoId,
    isActive: plain.is_active ?? plain.isActive
  };
}

async function importEthereumToken({
  chain,
  contractAddress
}) {
  if (chain !== 'ethereum') {
    throw makeAppError(
      'Only ethereum chain is supported in this MVP token import.',
      422,
      'UNSUPPORTED_CHAIN',
      {
        chain
      }
    );
  }

  const normalizedAddress = normalizeContractAddress(contractAddress);

  const existingToken = await tokenImportRepository.findTokenByContractAddress({
    chain,
    contractAddress: normalizedAddress
  });

  if (existingToken) {
    return {
      token: serializeToken(existingToken),
      status: {
        alreadyExisted: true,
        metadataLoaded: true,
        coingeckoMatched: Boolean(existingToken.coingecko_id),
        readyForCexFlowAnalysis: true,
        warnings: []
      }
    };
  }

  const metadata = await erc20MetadataClient.fetchErc20Metadata(normalizedAddress);

  const symbolCollision = await tokenImportRepository.findTokenBySymbol(metadata.symbol);

  if (symbolCollision) {
    throw makeAppError(
      `Token symbol ${metadata.symbol} already exists in DB. Symbol collision handling is not enabled yet.`,
      409,
      'TOKEN_SYMBOL_COLLISION',
      {
        symbol: metadata.symbol,
        existingToken: serializeToken(symbolCollision),
        importedContractAddress: normalizedAddress
      }
    );
  }

  let coingeckoCoin = null;
  const warnings = [];

  try {
    coingeckoCoin = await coingeckoContractClient.findCoinByEthereumContract(normalizedAddress);
  } catch (error) {
    warnings.push({
      code: error.code || 'COINGECKO_LOOKUP_FAILED',
      message: error.message || 'CoinGecko lookup failed'
    });
  }

  if (!coingeckoCoin) {
    warnings.push({
      code: 'COINGECKO_NOT_MATCHED',
      message: 'CoinGecko id was not found by contract address. USD valuation may be unavailable.'
    });
  }

  const token = await tokenImportRepository.createToken({
    symbol: metadata.symbol,
    name: metadata.name,
    chain,
    contractAddress: normalizedAddress,
    decimals: metadata.decimals,
    coingeckoId: coingeckoCoin?.id || null,
    isActive: true
  });

  return {
    token: serializeToken(token),
    metadata: {
      totalSupplyRaw: metadata.totalSupplyRaw
    },
    coingecko: coingeckoCoin,
    status: {
      alreadyExisted: false,
      metadataLoaded: true,
      coingeckoMatched: Boolean(coingeckoCoin?.id),
      readyForCexFlowAnalysis: true,
      warnings
    }
  };
}

module.exports = {
  importEthereumToken
};

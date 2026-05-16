const AppError = require('../../errors/AppError');

const ETHERSCAN_API_URL = process.env.ETHERSCAN_API_URL || 'https://api.etherscan.io/v2/api';
const ETHERSCAN_CHAIN_ID = process.env.ETHERSCAN_CHAIN_ID || '1';
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || process.env.ETHERSCAN_TOKEN || '';

const SELECTORS = {
  name: '0x06fdde03',
  symbol: '0x95d89b41',
  decimals: '0x313ce567',
  totalSupply: '0x18160ddd'
};

function makeAppError(message, statusCode, code, details = null) {
  const error = new AppError(message, statusCode, code, details);

  error.code = code;
  error.statusCode = statusCode;
  error.details = details;

  return error;
}

function strip0x(value = '') {
  if (value === null || value === undefined) return '';

  const stringValue = String(value);

  return stringValue.startsWith('0x') ? stringValue.slice(2) : stringValue;
}

function isHex(value) {
  if (!value) return false;

  return /^[0-9a-fA-F]*$/.test(value);
}

function decodeUint256(hexValue) {
  const clean = strip0x(hexValue);

  if (!clean || !isHex(clean)) return null;

  try {
    return BigInt(`0x${clean}`).toString();
  } catch (error) {
    return null;
  }
}

function decodeString(hexValue) {
  const clean = strip0x(hexValue);

  if (!clean || !isHex(clean)) return null;

  try {
    const words = clean.match(/.{1,64}/g) || [];

    if (!words.length) return null;

    if (words.length >= 3) {
      const length = Number.parseInt(words[1], 16);

      if (Number.isFinite(length) && length > 0) {
        const dataHex = words.slice(2).join('').slice(0, length * 2);
        const buffer = Buffer.from(dataHex, 'hex');
        const value = buffer.toString('utf8').replace(/\u0000/g, '').trim();

        if (value) return value;
      }
    }

    const buffer = Buffer.from(clean, 'hex');
    const fallback = buffer.toString('utf8').replace(/\u0000/g, '').trim();

    return fallback || null;
  } catch (error) {
    return null;
  }
}

function decodeBytes32String(hexValue) {
  const clean = strip0x(hexValue);

  if (!clean || !isHex(clean)) return null;

  try {
    const buffer = Buffer.from(clean.slice(0, 64), 'hex');
    const value = buffer.toString('utf8').replace(/\u0000/g, '').trim();

    return value || null;
  } catch (error) {
    return null;
  }
}

function decodeStringLike(hexValue) {
  if (!hexValue) return null;

  return decodeString(hexValue) || decodeBytes32String(hexValue);
}

function decodeDecimals(hexValue) {
  const value = decodeUint256(hexValue);

  if (value === null) return null;

  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue < 0 || numberValue > 255) {
    return null;
  }

  return numberValue;
}

function buildEthCallUrl({
  contractAddress,
  data
}) {
  const url = new URL(ETHERSCAN_API_URL);

  url.searchParams.set('chainid', ETHERSCAN_CHAIN_ID);
  url.searchParams.set('module', 'proxy');
  url.searchParams.set('action', 'eth_call');
  url.searchParams.set('to', contractAddress);
  url.searchParams.set('data', data);
  url.searchParams.set('tag', 'latest');

  if (ETHERSCAN_API_KEY) {
    url.searchParams.set('apikey', ETHERSCAN_API_KEY);
  }

  return url;
}

async function ethCall({
  contractAddress,
  data,
  field
}) {
  const url = buildEthCallUrl({
    contractAddress,
    data
  });

  const response = await fetch(url);

  if (!response.ok) {
    throw makeAppError(
      `Etherscan eth_call failed for ${field}`,
      502,
      'ETHERSCAN_ETH_CALL_FAILED',
      {
        status: response.status,
        field
      }
    );
  }

  const payload = await response.json();

  if (payload.status === '0' && payload.message === 'NOTOK') {
    throw makeAppError(
      payload.result || `Etherscan eth_call returned NOTOK for ${field}`,
      502,
      'ETHERSCAN_ETH_CALL_NOTOK',
      {
        field,
        result: payload.result
      }
    );
  }

  if (!payload.result || payload.result === '0x') {
    return null;
  }

  return payload.result;
}

async function fetchErc20Metadata(contractAddress) {
  const [nameRaw, symbolRaw, decimalsRaw, totalSupplyRaw] = await Promise.all([
    ethCall({
      contractAddress,
      data: SELECTORS.name,
      field: 'name'
    }).catch(() => null),
    ethCall({
      contractAddress,
      data: SELECTORS.symbol,
      field: 'symbol'
    }).catch(() => null),
    ethCall({
      contractAddress,
      data: SELECTORS.decimals,
      field: 'decimals'
    }).catch(() => null),
    ethCall({
      contractAddress,
      data: SELECTORS.totalSupply,
      field: 'totalSupply'
    }).catch(() => null)
  ]);

  const name = decodeStringLike(nameRaw);
  const symbol = decodeStringLike(symbolRaw);
  const decimals = decodeDecimals(decimalsRaw);
  const totalSupplyRawValue = decodeUint256(totalSupplyRaw);

  if (!symbol || decimals === null) {
    throw makeAppError(
      'Contract does not look like a readable ERC-20 token. Could not load symbol/decimals.',
      422,
      'ERC20_METADATA_UNREADABLE',
      {
        contractAddress,
        metadataLoaded: false,
        nameLoaded: Boolean(name),
        symbolLoaded: Boolean(symbol),
        decimalsLoaded: decimals !== null,
        raw: {
          nameRaw: nameRaw ? 'loaded' : null,
          symbolRaw: symbolRaw ? 'loaded' : null,
          decimalsRaw: decimalsRaw ? 'loaded' : null,
          totalSupplyRaw: totalSupplyRaw ? 'loaded' : null
        }
      }
    );
  }

  return {
    name: name || symbol,
    symbol,
    decimals,
    totalSupplyRaw: totalSupplyRawValue
  };
}

module.exports = {
  fetchErc20Metadata
};

const etherscanClient = require('../../providers/etherscan/etherscan.client');
const transferIngestionRepository = require('./transferIngestion.repository');
const NotFoundError = require('../../errors/NotFoundError');
const BadRequestError = require('../../errors/BadRequestError');

const SOURCE = 'etherscan_v2_cex_address_tokentx';
const DEFAULT_REQUEST_DELAY_MS = 450;

function normalizeAddress(address) {
  if (!address) return null;
  return address.toLowerCase();
}

function numberValue(value) {
  if (value === null || value === undefined || value === '') return 0;
  return Number(value);
}

function toDecimalAmount(rawValue, decimals) {
  const raw = BigInt(rawValue || '0');
  const scale = BigInt(10) ** BigInt(decimals);

  const whole = raw / scale;
  const fraction = raw % scale;

  const fractionString = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');

  if (!fractionString) return whole.toString();

  return `${whole.toString()}.${fractionString}`;
}

function buildTransferKey({ txHash, logIndex }) {
  return `${txHash}:${logIndex}`;
}

function getLogIndex(item, fallbackIndex) {
  if (item.logIndex !== undefined && item.logIndex !== null && item.logIndex !== '') {
    return Number(item.logIndex);
  }

  if (item.transactionIndex !== undefined && item.transactionIndex !== null && item.transactionIndex !== '') {
    return Number(item.transactionIndex) * 100000 + fallbackIndex;
  }

  return fallbackIndex;
}

async function resolveAddressId({ rawAddress, cexAddressMap }) {
  const normalized = normalizeAddress(rawAddress);

  if (!normalized) return null;

  if (cexAddressMap.has(normalized)) {
    return cexAddressMap.get(normalized).id;
  }

  const address = await transferIngestionRepository.findAddressByRaw({
    chain: 'ethereum',
    address: normalized
  });

  return address?.id || null;
}

async function ingestTransfersForToken({
  symbol,
  startBlock,
  endBlock,
  offset = 100,
  maxPages = 1,
  maxAddresses
}) {
  const token = await transferIngestionRepository.findTokenBySymbol(symbol);

  if (!token) {
    throw new NotFoundError(`Token ${symbol} not found`, 'TOKEN_NOT_FOUND', { symbol });
  }

  if (!process.env.ETHERSCAN_API_KEY) {
    throw new BadRequestError(
      'ETHERSCAN_API_KEY is not configured',
      'ETHERSCAN_API_KEY_MISSING',
      {
        env: 'ETHERSCAN_API_KEY'
      }
    );
  }

  const cexAddressesAll = await transferIngestionRepository.findCexAddresses({
    chain: token.chain
  });

  if (!cexAddressesAll.length) {
    throw new BadRequestError(
      'No CEX addresses found for ingestion',
      'NO_CEX_ADDRESSES_FOUND',
      {
        chain: token.chain
      }
    );
  }

  const finalMaxAddresses = Number(
    maxAddresses || process.env.ETHERSCAN_INGEST_MAX_ADDRESSES || cexAddressesAll.length
  );

  const cexAddresses = cexAddressesAll.slice(0, finalMaxAddresses);

  const cexAddressMap = new Map(
    cexAddressesAll.map((address) => [address.address.toLowerCase(), address])
  );

  const finalStartBlock = startBlock || Number(process.env.ETHERSCAN_INGEST_START_BLOCK || 0);
  const finalEndBlock = endBlock || Number(process.env.ETHERSCAN_INGEST_END_BLOCK || 999999999);
  const requestDelayMs = Number(process.env.ETHERSCAN_REQUEST_DELAY_MS || DEFAULT_REQUEST_DELAY_MS);

  const rawTransfers = [];
  const addressStats = [];

  for (const cexAddress of cexAddresses) {
    let fetchedForAddress = 0;

    for (let page = 1; page <= maxPages; page += 1) {
      const result = await etherscanClient.fetchErc20TransfersByAddress({
        address: cexAddress.address,
        contractAddress: token.contract_address,
        startBlock: finalStartBlock,
        endBlock: finalEndBlock,
        page,
        offset,
        sort: 'asc'
      });

      fetchedForAddress += result.length;

      result.forEach((item, index) => {
        rawTransfers.push({
          item,
          fallbackIndex: index,
          cexAddress: cexAddress.address
        });
      });

      await etherscanClient.sleep(requestDelayMs);

      if (result.length < offset) {
        break;
      }
    }

    addressStats.push({
      address: cexAddress.address,
      label: cexAddress.label,
      entity: cexAddress.entity?.name || null,
      fetched: fetchedForAddress
    });
  }

  const transferCandidates = rawTransfers.map(({ item, fallbackIndex }) => {
    const txHash = item.hash;
    const logIndex = getLogIndex(item, fallbackIndex);

    return {
      txHash,
      logIndex,
      item
    };
  });

  const existing = await transferIngestionRepository.findExistingTransfers({
    tokenId: token.id,
    transferKeys: transferCandidates
  });

  const existingKeys = new Set(
    existing.map((transfer) => buildTransferKey({
      txHash: transfer.tx_hash,
      logIndex: transfer.log_index
    }))
  );

  const seenKeys = new Set();
  const rows = [];

  for (const candidate of transferCandidates) {
    const { item, txHash, logIndex } = candidate;
    const key = buildTransferKey({ txHash, logIndex });

    if (existingKeys.has(key) || seenKeys.has(key)) {
      continue;
    }

    seenKeys.add(key);

    const fromRaw = normalizeAddress(item.from);
    const toRaw = normalizeAddress(item.to);
    const decimals = Number(item.tokenDecimal || token.decimals || 18);
    const amountDecimal = toDecimalAmount(item.value || '0', decimals);

    const fromAddressId = await resolveAddressId({
      rawAddress: fromRaw,
      cexAddressMap
    });

    const toAddressId = await resolveAddressId({
      rawAddress: toRaw,
      cexAddressMap
    });

    rows.push({
      token_id: token.id,
      chain: token.chain,
      block_number: String(item.blockNumber),
      tx_hash: txHash,
      log_index: logIndex,
      from_address_id: fromAddressId,
      to_address_id: toAddressId,
      from_address_raw: fromRaw,
      to_address_raw: toRaw,
      amount_raw: String(item.value || '0'),
      amount_decimal: amountDecimal,
      amount_usd: null,
      timestamp: new Date(Number(item.timeStamp) * 1000),
      source: SOURCE,
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  const inserted = await transferIngestionRepository.bulkCreateTransfers(rows);

  return {
    token: {
      id: token.id,
      symbol: token.symbol,
      name: token.name
    },
    provider: 'etherscan',
    dataMode: 'real',
    source: SOURCE,
    cexAddressesAvailable: cexAddressesAll.length,
    cexAddressesChecked: cexAddresses.length,
    fetchedRaw: rawTransfers.length,
    inserted: inserted.length,
    skippedDuplicates: rawTransfers.length - inserted.length,
    startBlock: finalStartBlock,
    endBlock: finalEndBlock,
    offset,
    maxPages,
    maxAddresses: finalMaxAddresses,
    requestDelayMs,
    addressStats
  };
}

module.exports = {
  ingestTransfersForToken
};

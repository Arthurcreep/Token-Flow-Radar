const etherscanClient = require('../../providers/etherscan/etherscan.client');
const transferIngestionRepository = require('./transferIngestion.repository');
const NotFoundError = require('../../errors/NotFoundError');
const BadRequestError = require('../../errors/BadRequestError');

const HISTORICAL_SOURCE = 'etherscan_v2_cex_address_tokentx';
const RECENT_SOURCE = 'etherscan_v2_recent_cex_address_tokentx';
const DEFAULT_REQUEST_DELAY_MS = 450;

function normalizeAddress(address) {
  if (!address) return null;
  return address.toLowerCase();
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

function getLogIndex(item, fallbackIndex) {
  if (item.logIndex !== undefined && item.logIndex !== null && item.logIndex !== '') {
    return Number(item.logIndex);
  }

  if (item.transactionIndex !== undefined && item.transactionIndex !== null && item.transactionIndex !== '') {
    return Number(item.transactionIndex) * 100000 + fallbackIndex;
  }

  return fallbackIndex;
}

function buildStableFingerprint({ source, txHash, blockNumber, fromAddressRaw, toAddressRaw, amountRaw }) {
  return [
    source,
    String(txHash || '').toLowerCase(),
    String(blockNumber || ''),
    String(fromAddressRaw || '').toLowerCase(),
    String(toAddressRaw || '').toLowerCase(),
    String(amountRaw || '0')
  ].join('|');
}

function buildFingerprintFromExistingTransfer(transfer) {
  return buildStableFingerprint({
    source: transfer.source,
    txHash: transfer.tx_hash,
    blockNumber: transfer.block_number,
    fromAddressRaw: transfer.from_address_raw,
    toAddressRaw: transfer.to_address_raw,
    amountRaw: transfer.amount_raw
  });
}

function buildCandidateFromEtherscanItem({ item, fallbackIndex, source }) {
  const fromAddressRaw = normalizeAddress(item.from);
  const toAddressRaw = normalizeAddress(item.to);
  const txHash = item.hash;
  const blockNumber = String(item.blockNumber);
  const amountRaw = String(item.value || '0');

  return {
    item,
    source,
    txHash,
    blockNumber,
    logIndex: getLogIndex(item, fallbackIndex),
    fromAddressRaw,
    toAddressRaw,
    amountRaw,
    fingerprint: buildStableFingerprint({
      source,
      txHash,
      blockNumber,
      fromAddressRaw,
      toAddressRaw,
      amountRaw
    })
  };
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

function normalizeIngestionOptions({
  startBlock,
  endBlock,
  offset,
  maxPages,
  maxAddresses,
  source,
  latestBlock,
  blocksBack
}) {
  const finalEndBlock = endBlock || latestBlock || Number(process.env.ETHERSCAN_INGEST_END_BLOCK || 999999999);

  let finalStartBlock = startBlock;

  if (latestBlock && blocksBack) {
    finalStartBlock = Math.max(0, latestBlock - blocksBack);
  }

  if (!finalStartBlock && finalStartBlock !== 0) {
    finalStartBlock = Number(process.env.ETHERSCAN_INGEST_START_BLOCK || 0);
  }

  return {
    startBlock: finalStartBlock,
    endBlock: finalEndBlock,
    offset: offset || 100,
    maxPages: maxPages || 1,
    maxAddresses,
    source
  };
}

async function ingestTransfersCore({ symbol, startBlock, endBlock, offset = 100, maxPages = 1, maxAddresses, source }) {
  const token = await transferIngestionRepository.findTokenBySymbol(symbol);

  if (!token) {
    throw new NotFoundError(`Token ${symbol} not found`, 'TOKEN_NOT_FOUND', { symbol });
  }

  if (!process.env.ETHERSCAN_API_KEY) {
    throw new BadRequestError('ETHERSCAN_API_KEY is not configured', 'ETHERSCAN_API_KEY_MISSING', {
      env: 'ETHERSCAN_API_KEY'
    });
  }

  const cexAddressesAll = await transferIngestionRepository.findCexAddresses({
    chain: token.chain
  });

  if (!cexAddressesAll.length) {
    throw new BadRequestError('No CEX addresses found for ingestion', 'NO_CEX_ADDRESSES_FOUND', {
      chain: token.chain
    });
  }

  const finalMaxAddresses = Number(
    maxAddresses || process.env.ETHERSCAN_INGEST_MAX_ADDRESSES || cexAddressesAll.length
  );

  const cexAddresses = cexAddressesAll.slice(0, finalMaxAddresses);

  const cexAddressMap = new Map(
    cexAddressesAll.map((address) => [address.address.toLowerCase(), address])
  );

  const requestDelayMs = Number(process.env.ETHERSCAN_REQUEST_DELAY_MS || DEFAULT_REQUEST_DELAY_MS);

  const rawTransfers = [];
  const addressStats = [];

  for (const cexAddress of cexAddresses) {
    let fetchedForAddress = 0;

    for (let page = 1; page <= maxPages; page += 1) {
      const result = await etherscanClient.fetchErc20TransfersByAddress({
        address: cexAddress.address,
        contractAddress: token.contract_address,
        startBlock,
        endBlock,
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

  const candidates = rawTransfers.map(({ item, fallbackIndex }) => buildCandidateFromEtherscanItem({
    item,
    fallbackIndex,
    source
  }));

  const txHashes = candidates.map((candidate) => candidate.txHash);

  const existing = await transferIngestionRepository.findExistingTransfersByHashes({
    tokenId: token.id,
    source,
    txHashes
  });

  const existingFingerprints = new Set(existing.map(buildFingerprintFromExistingTransfer));
  const seenFingerprints = new Set();
  const rows = [];

  let skippedExistingDuplicates = 0;
  let skippedBatchDuplicates = 0;

  for (const candidate of candidates) {
    if (existingFingerprints.has(candidate.fingerprint)) {
      skippedExistingDuplicates += 1;
      continue;
    }

    if (seenFingerprints.has(candidate.fingerprint)) {
      skippedBatchDuplicates += 1;
      continue;
    }

    seenFingerprints.add(candidate.fingerprint);

    const { item } = candidate;
    const decimals = Number(item.tokenDecimal || token.decimals || 18);
    const amountDecimal = toDecimalAmount(candidate.amountRaw, decimals);

    const fromAddressId = await resolveAddressId({
      rawAddress: candidate.fromAddressRaw,
      cexAddressMap
    });

    const toAddressId = await resolveAddressId({
      rawAddress: candidate.toAddressRaw,
      cexAddressMap
    });

    rows.push({
      token_id: token.id,
      chain: token.chain,
      block_number: candidate.blockNumber,
      tx_hash: candidate.txHash,
      log_index: candidate.logIndex,
      from_address_id: fromAddressId,
      to_address_id: toAddressId,
      from_address_raw: candidate.fromAddressRaw,
      to_address_raw: candidate.toAddressRaw,
      amount_raw: candidate.amountRaw,
      amount_decimal: amountDecimal,
      amount_usd: null,
      timestamp: new Date(Number(item.timeStamp) * 1000),
      source,
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  const inserted = await transferIngestionRepository.bulkCreateTransfers(rows);
  const skippedDuplicates = skippedExistingDuplicates + skippedBatchDuplicates;

  return {
    token: {
      id: token.id,
      symbol: token.symbol,
      name: token.name
    },
    provider: 'etherscan',
    dataMode: 'real',
    source,
    cexAddressesAvailable: cexAddressesAll.length,
    cexAddressesChecked: cexAddresses.length,
    fetchedRaw: rawTransfers.length,
    inserted: inserted.length,
    skippedDuplicates,
    skippedExistingDuplicates,
    skippedBatchDuplicates,
    startBlock,
    endBlock,
    offset,
    maxPages,
    maxAddresses: finalMaxAddresses,
    requestDelayMs,
    dedupeKey: 'source|txHash|blockNumber|from|to|amountRaw',
    addressStats
  };
}

async function ingestTransfersForToken({ symbol, startBlock, endBlock, offset = 100, maxPages = 1, maxAddresses }) {
  const options = normalizeIngestionOptions({
    startBlock,
    endBlock,
    offset,
    maxPages,
    maxAddresses,
    source: HISTORICAL_SOURCE
  });

  return ingestTransfersCore({
    symbol,
    ...options
  });
}

async function ingestRecentTransfersForToken({ symbol, blocksBack, offset = 100, maxPages = 1, maxAddresses }) {
  const finalBlocksBack = Number(blocksBack || process.env.ETHERSCAN_RECENT_BLOCKS_BACK || 500000);

  if (!Number.isInteger(finalBlocksBack) || finalBlocksBack <= 0) {
    throw new BadRequestError('blocksBack must be a positive integer', 'INVALID_BLOCKS_BACK', {
      blocksBack
    });
  }

  const latestBlock = await etherscanClient.fetchLatestBlockNumber();

  const options = normalizeIngestionOptions({
    latestBlock,
    blocksBack: finalBlocksBack,
    offset,
    maxPages,
    maxAddresses,
    source: RECENT_SOURCE
  });

  const result = await ingestTransfersCore({
    symbol,
    ...options
  });

  return {
    ...result,
    latestBlock,
    blocksBack: finalBlocksBack
  };
}

module.exports = {
  ingestTransfersForToken,
  ingestRecentTransfersForToken
};

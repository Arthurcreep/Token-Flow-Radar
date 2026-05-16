require('dotenv').config();

const {
  sequelize
} = require('../models');

const tokenImportService = require('../modules/token-import/tokenImport.service');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const TOKEN_UNIVERSE = [
  {
    symbol: 'MKR',
    name: 'Maker',
    contractAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
    category: 'defi_blue_chip'
  },
  {
    symbol: 'LDO',
    name: 'Lido DAO',
    contractAddress: '0x5a98fcbea516cf06857215779fd812ca3bef1b32',
    category: 'liquid_staking'
  },
  {
    symbol: 'PENDLE',
    name: 'Pendle',
    contractAddress: '0x808507121b80c02388fad14726482e061b8da827',
    category: 'defi_yield'
  },
  {
    symbol: 'ENA',
    name: 'Ethena',
    contractAddress: '0x57e114b691db790c35207b2e685d4a43181e6061',
    category: 'defi_synthetic_dollar'
  },
  {
    symbol: 'COMP',
    name: 'Compound',
    contractAddress: '0xc00e94cb662c3520282e6f5717214004a7f26888',
    category: 'defi_lending'
  },
  {
    symbol: 'SNX',
    name: 'Synthetix',
    contractAddress: '0xc011a72400e58ecd99ee497cf89e3775d4bd732f',
    category: 'defi_derivatives'
  },
  {
    symbol: 'BAL',
    name: 'Balancer',
    contractAddress: '0xba100000625a3754423978a60c9317c58a424e3d',
    category: 'defi_dex'
  },
  {
    symbol: 'CVX',
    name: 'Convex Finance',
    contractAddress: '0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b',
    category: 'defi_yield'
  },
  {
    symbol: 'ENS',
    name: 'Ethereum Name Service',
    contractAddress: '0xc18360217d8f7ab5e7c516566761ea12ce7f9d72',
    category: 'infra'
  },
  {
    symbol: 'GRT',
    name: 'The Graph',
    contractAddress: '0xc944e90c64b2c07662a292be6244bdf05cda44a7',
    category: 'data_infra'
  },
  {
    symbol: 'FET',
    name: 'Fetch.ai',
    contractAddress: '0xaea46a60368a7bd060eec7df8cba43b7ef41ad85',
    category: 'ai'
  },
  {
    symbol: 'RNDR',
    name: 'Render',
    contractAddress: '0x6de037ef9ad2725eb40118bb1702ebb27e4aeb24',
    category: 'ai_compute'
  },
  {
    symbol: 'PEPE',
    name: 'Pepe',
    contractAddress: '0x6982508145454ce325ddbe47a25d4ec3d2311933',
    category: 'meme_high_beta'
  },
  {
    symbol: 'SHIB',
    name: 'Shiba Inu',
    contractAddress: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce',
    category: 'meme_large_cap'
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    contractAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    category: 'wrapped_liquidity'
  }
];

function normalizeAddress(address) {
  return String(address || '').trim().toLowerCase();
}

function validateUniverse() {
  const seenSymbols = new Set();
  const seenContracts = new Set();

  for (const token of TOKEN_UNIVERSE) {
    const symbol = String(token.symbol || '').trim().toUpperCase();
    const contractAddress = normalizeAddress(token.contractAddress);

    if (!/^[A-Z0-9]{2,32}$/.test(symbol)) {
      throw new Error(`Invalid symbol in universe: ${token.symbol}`);
    }

    if (!/^0x[a-f0-9]{40}$/.test(contractAddress)) {
      throw new Error(`Invalid contract address for ${symbol}: ${token.contractAddress}`);
    }

    if (seenSymbols.has(symbol)) {
      throw new Error(`Duplicate symbol in universe: ${symbol}`);
    }

    if (seenContracts.has(contractAddress)) {
      throw new Error(`Duplicate contract in universe: ${contractAddress}`);
    }

    seenSymbols.add(symbol);
    seenContracts.add(contractAddress);
  }
}

async function importOneToken(token) {
  const startedAt = Date.now();

  try {
    const result = await tokenImportService.resolveToken({
      chain: 'ethereum',
      query: token.contractAddress
    });

    return {
      symbol: result.token.symbol,
      expectedSymbol: token.symbol,
      name: result.token.name,
      contractAddress: result.token.contractAddress,
      coingeckoId: result.token.coingeckoId,
      inputType: result.inputType,
      alreadyExisted: result.status.alreadyExisted,
      coingeckoMatched: result.status.coingeckoMatched,
      readyForCexFlowAnalysis: result.status.readyForCexFlowAnalysis,
      category: token.category,
      status: 'success',
      durationMs: Date.now() - startedAt,
      warnings: result.status.warnings || []
    };
  } catch (error) {
    return {
      symbol: token.symbol,
      name: token.name,
      contractAddress: normalizeAddress(token.contractAddress),
      category: token.category,
      status: 'failed',
      durationMs: Date.now() - startedAt,
      error: {
        code: error.code || 'IMPORT_FAILED',
        message: error.message,
        details: error.details || null
      }
    };
  }
}

async function main() {
  validateUniverse();

  const requestDelayMs = Number(process.env.UNIVERSE_IMPORT_DELAY_MS || 1200);
  const results = [];

  console.log('=== Token Universe Import ===');
  console.log(`tokens=${TOKEN_UNIVERSE.length}`);
  console.log(`delayMs=${requestDelayMs}`);
  console.log('');

  await sequelize.authenticate();

  for (let index = 0; index < TOKEN_UNIVERSE.length; index += 1) {
    const token = TOKEN_UNIVERSE[index];

    console.log(`[${index + 1}/${TOKEN_UNIVERSE.length}] ${token.symbol} ${token.contractAddress}`);

    const result = await importOneToken(token);

    results.push(result);

    if (result.status === 'success') {
      console.log(
        `  ok symbol=${result.symbol} existed=${result.alreadyExisted} coingecko=${result.coingeckoId || 'null'}`
      );
    } else {
      console.log(
        `  failed code=${result.error.code} message=${result.error.message}`
      );
    }

    if (index < TOKEN_UNIVERSE.length - 1) {
      await sleep(requestDelayMs);
    }
  }

  const summary = {
    total: results.length,
    success: results.filter((item) => item.status === 'success').length,
    failed: results.filter((item) => item.status === 'failed').length,
    existing: results.filter((item) => item.status === 'success' && item.alreadyExisted).length,
    imported: results.filter((item) => item.status === 'success' && !item.alreadyExisted).length,
    coingeckoMatched: results.filter((item) => item.status === 'success' && item.coingeckoMatched).length
  };

  console.log('');
  console.log('=== Summary ===');
  console.table(summary);

  console.log('');
  console.log('=== Results ===');
  console.table(
    results.map((item) => ({
      symbol: item.symbol,
      status: item.status,
      existed: item.alreadyExisted ?? false,
      coingecko: item.coingeckoId || '',
      category: item.category,
      error: item.error?.code || ''
    }))
  );

  if (summary.failed > 0) {
    console.log('');
    console.log('=== Failed Details ===');
    console.dir(
      results.filter((item) => item.status === 'failed'),
      {
        depth: 5
      }
    );
  }

  await sequelize.close();
}

main().catch(async (error) => {
  console.error('Fatal universe import error:', error);

  try {
    await sequelize.close();
  } catch (closeError) {
    console.error('Failed to close sequelize:', closeError);
  }

  process.exit(1);
});

require('dotenv').config();

const {
  sequelize,
  Token
} = require('../models');

const TRUSTED_TOKEN_METADATA = [
  {
    symbol: 'COMP',
    name: 'Compound',
    chain: 'ethereum',
    contractAddress: '0xc00e94cb662c3520282e6f5717214004a7f26888',
    decimals: 18,
    coingeckoId: 'compound-governance-token'
  },
  {
    symbol: 'SNX',
    name: 'Synthetix',
    chain: 'ethereum',
    contractAddress: '0xc011a72400e58ecd99ee497cf89e3775d4bd732f',
    decimals: 18,
    coingeckoId: 'synthetix-network-token'
  },
  {
    symbol: 'CVX',
    name: 'Convex Finance',
    chain: 'ethereum',
    contractAddress: '0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b',
    decimals: 18,
    coingeckoId: 'convex-finance'
  },
  {
    symbol: 'ENS',
    name: 'Ethereum Name Service',
    chain: 'ethereum',
    contractAddress: '0xc18360217d8f7ab5e7c516566761ea12ce7f9d72',
    decimals: 18,
    coingeckoId: 'ethereum-name-service'
  },
  {
    symbol: 'GRT',
    name: 'The Graph',
    chain: 'ethereum',
    contractAddress: '0xc944e90c64b2c07662a292be6244bdf05cda44a7',
    decimals: 18,
    coingeckoId: 'the-graph'
  },
  {
    symbol: 'FET',
    name: 'Artificial Superintelligence Alliance',
    chain: 'ethereum',
    contractAddress: '0xaea46a60368a7bd060eec7df8cba43b7ef41ad85',
    decimals: 18,
    coingeckoId: 'artificial-superintelligence-alliance'
  },
  {
    symbol: 'RNDR',
    name: 'Render',
    chain: 'ethereum',
    contractAddress: '0x6de037ef9ad2725eb40118bb1702ebb27e4aeb24',
    decimals: 18,
    coingeckoId: 'render'
  },
  {
    symbol: 'PEPE',
    name: 'Pepe',
    chain: 'ethereum',
    contractAddress: '0x6982508145454ce325ddbe47a25d4ec3d2311933',
    decimals: 18,
    coingeckoId: 'pepe'
  },
  {
    symbol: 'SHIB',
    name: 'Shiba Inu',
    chain: 'ethereum',
    contractAddress: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce',
    decimals: 18,
    coingeckoId: 'shiba-inu'
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    chain: 'ethereum',
    contractAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    decimals: 8,
    coingeckoId: 'wrapped-bitcoin'
  }
];

function normalizeContractAddress(value) {
  return String(value || '').trim().toLowerCase();
}

async function upsertTrustedToken(token) {
  const symbol = token.symbol.toUpperCase();
  const contractAddress = normalizeContractAddress(token.contractAddress);

  const byContract = await Token.findOne({
    where: {
      chain: token.chain,
      contract_address: contractAddress
    }
  });

  if (byContract) {
    await byContract.update({
      symbol,
      name: token.name,
      decimals: token.decimals,
      coingecko_id: token.coingeckoId,
      is_active: true
    });

    return {
      symbol,
      status: 'updated_by_contract',
      id: byContract.id,
      coingeckoId: token.coingeckoId
    };
  }

  const bySymbol = await Token.findOne({
    where: {
      symbol
    }
  });

  if (bySymbol) {
    await bySymbol.update({
      name: token.name,
      chain: token.chain,
      contract_address: contractAddress,
      decimals: token.decimals,
      coingecko_id: token.coingeckoId,
      is_active: true
    });

    return {
      symbol,
      status: 'updated_by_symbol',
      id: bySymbol.id,
      coingeckoId: token.coingeckoId
    };
  }

  const created = await Token.create({
    symbol,
    name: token.name,
    chain: token.chain,
    contract_address: contractAddress,
    decimals: token.decimals,
    coingecko_id: token.coingeckoId,
    is_active: true
  });

  return {
    symbol,
    status: 'created',
    id: created.id,
    coingeckoId: token.coingeckoId
  };
}

async function main() {
  console.log('=== Patch Token Universe Metadata ===');
  console.log(`tokens=${TRUSTED_TOKEN_METADATA.length}`);
  console.log('');

  await sequelize.authenticate();

  const results = [];

  for (const token of TRUSTED_TOKEN_METADATA) {
    try {
      const result = await upsertTrustedToken(token);

      results.push(result);

      console.log(
        `ok ${result.symbol} status=${result.status} coingecko=${result.coingeckoId}`
      );
    } catch (error) {
      const failed = {
        symbol: token.symbol,
        status: 'failed',
        error: {
          code: error.code || 'PATCH_FAILED',
          message: error.message,
          details: error.details || null
        }
      };

      results.push(failed);

      console.log(
        `failed ${failed.symbol} code=${failed.error.code} message=${failed.error.message}`
      );
    }
  }

  const summary = {
    total: results.length,
    success: results.filter((item) => item.status !== 'failed').length,
    failed: results.filter((item) => item.status === 'failed').length,
    created: results.filter((item) => item.status === 'created').length,
    updatedByContract: results.filter((item) => item.status === 'updated_by_contract').length,
    updatedBySymbol: results.filter((item) => item.status === 'updated_by_symbol').length
  };

  console.log('');
  console.log('=== Summary ===');
  console.table(summary);

  console.log('');
  console.log('=== Results ===');
  console.table(results);

  await sequelize.close();
}

main().catch(async (error) => {
  console.error('Fatal metadata patch error:', error);

  try {
    await sequelize.close();
  } catch (closeError) {
    console.error('Failed to close sequelize:', closeError);
  }

  process.exit(1);
});

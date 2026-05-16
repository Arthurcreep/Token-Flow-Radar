require('dotenv').config();

const {
  sequelize,
  Token
} = require('../models');

const FIXES = [
  {
    symbol: 'FET',
    coingeckoId: 'fetch-ai',
    name: 'Artificial Superintelligence Alliance'
  },
  {
    symbol: 'RNDR',
    coingeckoId: 'render-token',
    name: 'Render'
  },
  {
    symbol: 'SNX',
    coingeckoId: 'havven',
    name: 'Synthetix'
  }
];

async function main() {
  await sequelize.authenticate();

  for (const fix of FIXES) {
    const token = await Token.findOne({
      where: {
        symbol: fix.symbol
      }
    });

    if (!token) {
      console.log(`missing ${fix.symbol}`);
      continue;
    }

    await token.update({
      name: fix.name,
      coingecko_id: fix.coingeckoId,
      is_active: true
    });

    console.log(`ok ${fix.symbol} -> ${fix.coingeckoId}`);
  }

  await sequelize.close();
}

main().catch(async (error) => {
  console.error(error);

  try {
    await sequelize.close();
  } catch (closeError) {
    console.error(closeError);
  }

  process.exit(1);
});

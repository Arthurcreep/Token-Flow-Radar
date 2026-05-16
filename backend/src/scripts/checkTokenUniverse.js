require('dotenv').config();

const {
  sequelize,
  Token
} = require('../models');

async function main() {
  await sequelize.authenticate();

  const tokens = await Token.findAll({
    where: {
      chain: 'ethereum',
      is_active: true
    },
    order: [['symbol', 'ASC']]
  });

  const rows = tokens.map((token) => ({
    symbol: token.symbol,
    name: token.name,
    contract: token.contract_address,
    decimals: token.decimals,
    coingeckoId: token.coingecko_id || '',
    active: token.is_active
  }));

  console.table(rows);

  const summary = {
    total: rows.length,
    withCoingecko: rows.filter((row) => Boolean(row.coingeckoId)).length,
    missingCoingecko: rows.filter((row) => !row.coingeckoId).length
  };

  console.log('');
  console.log('=== Summary ===');
  console.table(summary);

  await sequelize.close();
}

main().catch(async (error) => {
  console.error('Fatal token universe check error:', error);

  try {
    await sequelize.close();
  } catch (closeError) {
    console.error('Failed to close sequelize:', closeError);
  }

  process.exit(1);
});

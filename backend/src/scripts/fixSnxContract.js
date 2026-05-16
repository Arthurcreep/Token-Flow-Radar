require('dotenv').config();

const {
  sequelize,
  Token
} = require('../models');

async function main() {
  await sequelize.authenticate();

  const token = await Token.findOne({
    where: {
      symbol: 'SNX'
    }
  });

  if (!token) {
    console.log('SNX not found');
    await sequelize.close();
    return;
  }

  await token.update({
    name: 'Synthetix',
    chain: 'ethereum',
    contract_address: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
    decimals: 18,
    coingecko_id: 'havven',
    is_active: true
  });

  console.log('SNX contract fixed');
  console.log({
    id: token.id,
    symbol: token.symbol,
    contractAddress: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
    coingeckoId: 'havven'
  });

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

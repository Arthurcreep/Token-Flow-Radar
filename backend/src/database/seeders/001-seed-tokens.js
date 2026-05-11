'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkDelete('tokens', {
      symbol: ['ARB', '1INCH', 'UNI', 'AAVE', 'LINK']
    });

    await queryInterface.bulkInsert('tokens', [
      {
        symbol: 'ARB',
        name: 'Arbitrum',
        chain: 'ethereum',
        contract_address: '0xb50721bcf8d664c30412cfbc6cf7a15145234ad1',
        decimals: 18,
        coingecko_id: 'arbitrum',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        symbol: '1INCH',
        name: '1inch',
        chain: 'ethereum',
        contract_address: '0x111111111117dc0aa78b770fa6a738034120c302',
        decimals: 18,
        coingecko_id: '1inch',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        symbol: 'UNI',
        name: 'Uniswap',
        chain: 'ethereum',
        contract_address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        decimals: 18,
        coingecko_id: 'uniswap',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        symbol: 'AAVE',
        name: 'Aave',
        chain: 'ethereum',
        contract_address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
        decimals: 18,
        coingecko_id: 'aave',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        symbol: 'LINK',
        name: 'Chainlink',
        chain: 'ethereum',
        contract_address: '0x514910771af9ca656af840dff83e8264ecf986ca',
        decimals: 18,
        coingecko_id: 'chainlink',
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('tokens', {
      symbol: ['ARB', '1INCH', 'UNI', 'AAVE', 'LINK']
    });
  }
};
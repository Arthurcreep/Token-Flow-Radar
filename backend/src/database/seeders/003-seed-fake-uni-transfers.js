'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkDelete('token_transfers', {
      source: 'manual_seed_fake_uni'
    });

    const [uni] = await queryInterface.sequelize.query(
      `SELECT id FROM tokens WHERE symbol = 'UNI' LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!uni) {
      throw new Error('UNI token not found. Run token seed first.');
    }

    const addresses = await queryInterface.sequelize.query(
      `SELECT id, address, label FROM addresses WHERE address IN (
        '0x28c6c06298d514db089934071355e5743bf21d60',
        '0x21a31ee1afc51d94c2efccaa2092ad1028285549',
        '0xdfd5293d8e347dfe59e90efd55b2956a1343963d',
        '0x503828976d22510aad0201ac7ec88293211d23da'
      )`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const addressByValue = {};
    for (const item of addresses) {
      addressByValue[item.address] = item.id;
    }

    const whaleA = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const whaleB = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    const whaleC = '0xcccccccccccccccccccccccccccccccccccccccc';

    const binance14 = '0x28c6c06298d514db089934071355e5743bf21d60';
    const binance15 = '0x21a31ee1afc51d94c2efccaa2092ad1028285549';
    const binance16 = '0xdfd5293d8e347dfe59e90efd55b2956a1343963d';
    const coinbase1 = '0x503828976d22510aad0201ac7ec88293211d23da';

    await queryInterface.bulkInsert('token_transfers', [
      {
        token_id: uni.id,
        chain: 'ethereum',
        block_number: 19000001,
        tx_hash: '0xfakeuni000000000000000000000000000000000000000000000000000000000001',
        log_index: 1,
        from_address_id: null,
        to_address_id: addressByValue[binance14],
        from_address_raw: whaleA,
        to_address_raw: binance14,
        amount_raw: '250000000000000000000000',
        amount_decimal: '250000',
        amount_usd: '2500000',
        timestamp: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
        source: 'manual_seed_fake_uni',
        created_at: now,
        updated_at: now
      },
      {
        token_id: uni.id,
        chain: 'ethereum',
        block_number: 19000002,
        tx_hash: '0xfakeuni000000000000000000000000000000000000000000000000000000000002',
        log_index: 2,
        from_address_id: addressByValue[binance15],
        to_address_id: null,
        from_address_raw: binance15,
        to_address_raw: whaleB,
        amount_raw: '420000000000000000000000',
        amount_decimal: '420000',
        amount_usd: '4200000',
        timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        source: 'manual_seed_fake_uni',
        created_at: now,
        updated_at: now
      },
      {
        token_id: uni.id,
        chain: 'ethereum',
        block_number: 19000003,
        tx_hash: '0xfakeuni000000000000000000000000000000000000000000000000000000000003',
        log_index: 3,
        from_address_id: null,
        to_address_id: addressByValue[coinbase1],
        from_address_raw: whaleC,
        to_address_raw: coinbase1,
        amount_raw: '120000000000000000000000',
        amount_decimal: '120000',
        amount_usd: '1200000',
        timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        source: 'manual_seed_fake_uni',
        created_at: now,
        updated_at: now
      },
      {
        token_id: uni.id,
        chain: 'ethereum',
        block_number: 19000004,
        tx_hash: '0xfakeuni000000000000000000000000000000000000000000000000000000000004',
        log_index: 4,
        from_address_id: addressByValue[binance16],
        to_address_id: null,
        from_address_raw: binance16,
        to_address_raw: whaleA,
        amount_raw: '600000000000000000000000',
        amount_decimal: '600000',
        amount_usd: '6000000',
        timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        source: 'manual_seed_fake_uni',
        created_at: now,
        updated_at: now
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('token_transfers', {
      source: 'manual_seed_fake_uni'
    });
  }
};
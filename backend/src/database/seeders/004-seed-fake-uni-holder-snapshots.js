'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const snapshotDate = now.toISOString().slice(0, 10);

    await queryInterface.bulkDelete('holder_snapshots', {
      source: 'manual_seed_fake_uni_holders'
    });

    const [uni] = await queryInterface.sequelize.query(
      `SELECT id FROM tokens WHERE symbol = 'UNI' LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!uni) {
      throw new Error('UNI token not found. Run token seed first.');
    }

    const addresses = await queryInterface.sequelize.query(
      `SELECT id, address FROM addresses WHERE address IN (
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

    const binance14 = '0x28c6c06298d514db089934071355e5743bf21d60';
    const binance15 = '0x21a31ee1afc51d94c2efccaa2092ad1028285549';
    const binance16 = '0xdfd5293d8e347dfe59e90efd55b2956a1343963d';
    const coinbase1 = '0x503828976d22510aad0201ac7ec88293211d23da';

    const whaleA = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const whaleB = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    const whaleC = '0xcccccccccccccccccccccccccccccccccccccccc';
    const fundA = '0xdddddddddddddddddddddddddddddddddddddddd';
    const whaleD = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    const whaleE = '0xffffffffffffffffffffffffffffffffffffffff';

    await queryInterface.bulkInsert('holder_snapshots', [
      {
        token_id: uni.id,
        date: snapshotDate,
        rank: 1,
        address_id: addressByValue[binance14],
        address_raw: binance14,
        balance_decimal: '35000000',
        balance_usd: '350000000',
        supply_share: '0.035',
        balance_change_1d: '-200000',
        balance_change_7d: '-600000',
        balance_change_30d: '-1200000',
        source: 'manual_seed_fake_uni_holders',
        created_at: now,
        updated_at: now
      },
      {
        token_id: uni.id,
        date: snapshotDate,
        rank: 2,
        address_id: addressByValue[binance15],
        address_raw: binance15,
        balance_decimal: '27000000',
        balance_usd: '270000000',
        supply_share: '0.027',
        balance_change_1d: '-100000',
        balance_change_7d: '-420000',
        balance_change_30d: '-900000',
        source: 'manual_seed_fake_uni_holders',
        created_at: now,
        updated_at: now
      },
      {
        token_id: uni.id,
        date: snapshotDate,
        rank: 3,
        address_id: null,
        address_raw: whaleA,
        balance_decimal: '15000000',
        balance_usd: '150000000',
        supply_share: '0.015',
        balance_change_1d: '200000',
        balance_change_7d: '850000',
        balance_change_30d: '1300000',
        source: 'manual_seed_fake_uni_holders',
        created_at: now,
        updated_at: now
      },
      {
        token_id: uni.id,
        date: snapshotDate,
        rank: 4,
        address_id: null,
        address_raw: whaleB,
        balance_decimal: '12000000',
        balance_usd: '120000000',
        supply_share: '0.012',
        balance_change_1d: '120000',
        balance_change_7d: '420000',
        balance_change_30d: '900000',
        source: 'manual_seed_fake_uni_holders',
        created_at: now,
        updated_at: now
      },
      {
        token_id: uni.id,
        date: snapshotDate,
        rank: 5,
        address_id: addressByValue[coinbase1],
        address_raw: coinbase1,
        balance_decimal: '11000000',
        balance_usd: '110000000',
        supply_share: '0.011',
        balance_change_1d: '120000',
        balance_change_7d: '120000',
        balance_change_30d: '-200000',
        source: 'manual_seed_fake_uni_holders',
        created_at: now,
        updated_at: now
      },
      {
        token_id: uni.id,
        date: snapshotDate,
        rank: 6,
        address_id: null,
        address_raw: whaleC,
        balance_decimal: '8500000',
        balance_usd: '85000000',
        supply_share: '0.0085',
        balance_change_1d: '50000',
        balance_change_7d: '300000',
        balance_change_30d: '500000',
        source: 'manual_seed_fake_uni_holders',
        created_at: now,
        updated_at: now
      },
      {
        token_id: uni.id,
        date: snapshotDate,
        rank: 7,
        address_id: null,
        address_raw: fundA,
        balance_decimal: '7200000',
        balance_usd: '72000000',
        supply_share: '0.0072',
        balance_change_1d: '300000',
        balance_change_7d: '900000',
        balance_change_30d: '1500000',
        source: 'manual_seed_fake_uni_holders',
        created_at: now,
        updated_at: now
      },
      {
        token_id: uni.id,
        date: snapshotDate,
        rank: 8,
        address_id: addressByValue[binance16],
        address_raw: binance16,
        balance_decimal: '6800000',
        balance_usd: '68000000',
        supply_share: '0.0068',
        balance_change_1d: '-600000',
        balance_change_7d: '-600000',
        balance_change_30d: '-600000',
        source: 'manual_seed_fake_uni_holders',
        created_at: now,
        updated_at: now
      },
      {
        token_id: uni.id,
        date: snapshotDate,
        rank: 9,
        address_id: null,
        address_raw: whaleD,
        balance_decimal: '5200000',
        balance_usd: '52000000',
        supply_share: '0.0052',
        balance_change_1d: '0',
        balance_change_7d: '-250000',
        balance_change_30d: '-400000',
        source: 'manual_seed_fake_uni_holders',
        created_at: now,
        updated_at: now
      },
      {
        token_id: uni.id,
        date: snapshotDate,
        rank: 10,
        address_id: null,
        address_raw: whaleE,
        balance_decimal: '4100000',
        balance_usd: '41000000',
        supply_share: '0.0041',
        balance_change_1d: '80000',
        balance_change_7d: '200000',
        balance_change_30d: '260000',
        source: 'manual_seed_fake_uni_holders',
        created_at: now,
        updated_at: now
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('holder_snapshots', {
      source: 'manual_seed_fake_uni_holders'
    });
  }
};
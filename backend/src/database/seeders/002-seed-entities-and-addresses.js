'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkDelete('addresses', {
      source: 'manual_seed'
    });

    await queryInterface.bulkDelete('entities', {
      name: ['Binance', 'Coinbase', 'Kraken', 'OKX', 'Bybit']
    });

    await queryInterface.bulkInsert('entities', [
      {
        name: 'Binance',
        entity_type: 'cex',
        website: 'https://www.binance.com',
        notes: 'Centralized exchange',
        created_at: now,
        updated_at: now
      },
      {
        name: 'Coinbase',
        entity_type: 'cex',
        website: 'https://www.coinbase.com',
        notes: 'Centralized exchange',
        created_at: now,
        updated_at: now
      },
      {
        name: 'Kraken',
        entity_type: 'cex',
        website: 'https://www.kraken.com',
        notes: 'Centralized exchange',
        created_at: now,
        updated_at: now
      },
      {
        name: 'OKX',
        entity_type: 'cex',
        website: 'https://www.okx.com',
        notes: 'Centralized exchange',
        created_at: now,
        updated_at: now
      },
      {
        name: 'Bybit',
        entity_type: 'cex',
        website: 'https://www.bybit.com',
        notes: 'Centralized exchange',
        created_at: now,
        updated_at: now
      }
    ]);

    const entities = await queryInterface.sequelize.query(
      `SELECT id, name FROM entities WHERE name IN ('Binance', 'Coinbase', 'Kraken', 'OKX', 'Bybit')`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const entityByName = {};
    for (const entity of entities) {
      entityByName[entity.name] = entity.id;
    }

    await queryInterface.bulkInsert('addresses', [
      {
        chain: 'ethereum',
        address: '0x28c6c06298d514db089934071355e5743bf21d60',
        entity_id: entityByName.Binance,
        address_type: 'cex',
        address_role: 'hot_wallet',
        label: 'Binance 14',
        source: 'manual_seed',
        confidence: 1.0,
        is_contract: false,
        is_active: true,
        notes: 'Known Binance hot wallet',
        created_at: now,
        updated_at: now
      },
      {
        chain: 'ethereum',
        address: '0x21a31ee1afc51d94c2efccaa2092ad1028285549',
        entity_id: entityByName.Binance,
        address_type: 'cex',
        address_role: 'hot_wallet',
        label: 'Binance 15',
        source: 'manual_seed',
        confidence: 1.0,
        is_contract: false,
        is_active: true,
        notes: 'Known Binance hot wallet',
        created_at: now,
        updated_at: now
      },
      {
        chain: 'ethereum',
        address: '0xdfd5293d8e347dfe59e90efd55b2956a1343963d',
        entity_id: entityByName.Binance,
        address_type: 'cex',
        address_role: 'hot_wallet',
        label: 'Binance 16',
        source: 'manual_seed',
        confidence: 1.0,
        is_contract: false,
        is_active: true,
        notes: 'Known Binance hot wallet',
        created_at: now,
        updated_at: now
      },
      {
        chain: 'ethereum',
        address: '0x503828976d22510aad0201ac7ec88293211d23da',
        entity_id: entityByName.Coinbase,
        address_type: 'cex',
        address_role: 'hot_wallet',
        label: 'Coinbase 1',
        source: 'manual_seed',
        confidence: 1.0,
        is_contract: false,
        is_active: true,
        notes: 'Known Coinbase wallet',
        created_at: now,
        updated_at: now
      },
      {
        chain: 'ethereum',
        address: '0x71660c4005ba85c37ccec55d0c4493e66fe775d3',
        entity_id: entityByName.Coinbase,
        address_type: 'cex',
        address_role: 'hot_wallet',
        label: 'Coinbase 2',
        source: 'manual_seed',
        confidence: 1.0,
        is_contract: false,
        is_active: true,
        notes: 'Known Coinbase wallet',
        created_at: now,
        updated_at: now
      },
      {
        chain: 'ethereum',
        address: '0x267be1c1d684f78cb4f6a176c4911b741e4ffdc0',
        entity_id: entityByName.Kraken,
        address_type: 'cex',
        address_role: 'hot_wallet',
        label: 'Kraken 4',
        source: 'manual_seed',
        confidence: 1.0,
        is_contract: false,
        is_active: true,
        notes: 'Known Kraken wallet',
        created_at: now,
        updated_at: now
      },
      {
        chain: 'ethereum',
        address: '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b',
        entity_id: entityByName.OKX,
        address_type: 'cex',
        address_role: 'hot_wallet',
        label: 'OKX',
        source: 'manual_seed',
        confidence: 0.9,
        is_contract: false,
        is_active: true,
        notes: 'Known OKX wallet',
        created_at: now,
        updated_at: now
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('addresses', {
      source: 'manual_seed'
    });

    await queryInterface.bulkDelete('entities', {
      name: ['Binance', 'Coinbase', 'Kraken', 'OKX', 'Bybit']
    });
  }
};
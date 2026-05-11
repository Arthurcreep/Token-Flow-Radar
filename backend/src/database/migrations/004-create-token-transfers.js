'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('token_transfers', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      token_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'tokens',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      chain: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'ethereum'
      },
      block_number: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      tx_hash: {
        type: Sequelize.STRING(128),
        allowNull: false
      },
      log_index: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      from_address_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'addresses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      to_address_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'addresses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      from_address_raw: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      to_address_raw: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      amount_raw: {
        type: Sequelize.DECIMAL(78, 0),
        allowNull: false
      },
      amount_decimal: {
        type: Sequelize.DECIMAL(36, 18),
        allowNull: false
      },
      amount_usd: {
        type: Sequelize.DECIMAL(36, 8),
        allowNull: true
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false
      },
      source: {
        type: Sequelize.STRING(64),
        allowNull: false,
        defaultValue: 'manual_seed'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.addConstraint('token_transfers', {
      fields: ['tx_hash', 'log_index'],
      type: 'unique',
      name: 'token_transfers_tx_hash_log_index_unique'
    });

    await queryInterface.addIndex('token_transfers', ['token_id']);
    await queryInterface.addIndex('token_transfers', ['timestamp']);
    await queryInterface.addIndex('token_transfers', ['from_address_id']);
    await queryInterface.addIndex('token_transfers', ['to_address_id']);
    await queryInterface.addIndex('token_transfers', ['from_address_raw']);
    await queryInterface.addIndex('token_transfers', ['to_address_raw']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('token_transfers');
  }
};
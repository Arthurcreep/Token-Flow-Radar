'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('holder_snapshots', {
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
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      rank: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      address_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'addresses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      address_raw: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      balance_decimal: {
        type: Sequelize.DECIMAL(36, 18),
        allowNull: false
      },
      balance_usd: {
        type: Sequelize.DECIMAL(36, 8),
        allowNull: true
      },
      supply_share: {
        type: Sequelize.DECIMAL(18, 10),
        allowNull: true
      },
      balance_change_1d: {
        type: Sequelize.DECIMAL(36, 18),
        allowNull: false,
        defaultValue: 0
      },
      balance_change_7d: {
        type: Sequelize.DECIMAL(36, 18),
        allowNull: false,
        defaultValue: 0
      },
      balance_change_30d: {
        type: Sequelize.DECIMAL(36, 18),
        allowNull: false,
        defaultValue: 0
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

    await queryInterface.addConstraint('holder_snapshots', {
      fields: ['token_id', 'date', 'rank'],
      type: 'unique',
      name: 'holder_snapshots_token_date_rank_unique'
    });

    await queryInterface.addIndex('holder_snapshots', ['token_id']);
    await queryInterface.addIndex('holder_snapshots', ['date']);
    await queryInterface.addIndex('holder_snapshots', ['rank']);
    await queryInterface.addIndex('holder_snapshots', ['address_id']);
    await queryInterface.addIndex('holder_snapshots', ['address_raw']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('holder_snapshots');
  }
};
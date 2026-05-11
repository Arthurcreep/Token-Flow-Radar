'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cex_flow_daily', {
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
      cex_inflow: {
        type: Sequelize.DECIMAL(36, 18),
        allowNull: false,
        defaultValue: 0
      },
      cex_outflow: {
        type: Sequelize.DECIMAL(36, 18),
        allowNull: false,
        defaultValue: 0
      },
      cex_netflow: {
        type: Sequelize.DECIMAL(36, 18),
        allowNull: false,
        defaultValue: 0
      },
      cex_inflow_usd: {
        type: Sequelize.DECIMAL(36, 8),
        allowNull: false,
        defaultValue: 0
      },
      cex_outflow_usd: {
        type: Sequelize.DECIMAL(36, 8),
        allowNull: false,
        defaultValue: 0
      },
      cex_netflow_usd: {
        type: Sequelize.DECIMAL(36, 8),
        allowNull: false,
        defaultValue: 0
      },
      inflow_tx_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      outflow_tx_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      large_inflow_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      large_outflow_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      source: {
        type: Sequelize.STRING(64),
        allowNull: false,
        defaultValue: 'calculated'
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

    await queryInterface.addConstraint('cex_flow_daily', {
      fields: ['token_id', 'date'],
      type: 'unique',
      name: 'cex_flow_daily_token_date_unique'
    });

    await queryInterface.addIndex('cex_flow_daily', ['token_id']);
    await queryInterface.addIndex('cex_flow_daily', ['date']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('cex_flow_daily');
  }
};
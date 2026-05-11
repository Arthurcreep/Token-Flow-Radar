'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('token_metrics_daily', {
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

      cex_inflow_7d: {
        type: Sequelize.DECIMAL(36, 18),
        allowNull: false,
        defaultValue: 0
      },
      cex_outflow_7d: {
        type: Sequelize.DECIMAL(36, 18),
        allowNull: false,
        defaultValue: 0
      },
      cex_netflow_7d: {
        type: Sequelize.DECIMAL(36, 18),
        allowNull: false,
        defaultValue: 0
      },
      cex_netflow_usd_7d: {
        type: Sequelize.DECIMAL(36, 8),
        allowNull: false,
        defaultValue: 0
      },

      cex_balance_change_7d: {
        type: Sequelize.DECIMAL(36, 18),
        allowNull: false,
        defaultValue: 0
      },
      non_cex_balance_change_7d: {
        type: Sequelize.DECIMAL(36, 18),
        allowNull: false,
        defaultValue: 0
      },

      cex_flow_score: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      holder_score: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      final_score: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      confidence: {
        type: Sequelize.DECIMAL(5, 4),
        allowNull: false,
        defaultValue: 0
      },
      regime: {
        type: Sequelize.STRING(64),
        allowNull: false,
        defaultValue: 'UNCLEAR'
      },
      explanation: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      score_version: {
        type: Sequelize.STRING(64),
        allowNull: false,
        defaultValue: 'v1-simple-cex-holder-score'
      },
      metrics_json: {
        type: Sequelize.JSONB,
        allowNull: true
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

    await queryInterface.addConstraint('token_metrics_daily', {
      fields: ['token_id', 'date', 'score_version'],
      type: 'unique',
      name: 'token_metrics_daily_token_date_version_unique'
    });

    await queryInterface.addIndex('token_metrics_daily', ['token_id']);
    await queryInterface.addIndex('token_metrics_daily', ['date']);
    await queryInterface.addIndex('token_metrics_daily', ['regime']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('token_metrics_daily');
  }
};
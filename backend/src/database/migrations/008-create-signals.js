'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('signals', {
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
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false
      },
      signal_type: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      severity: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'medium'
      },
      confidence: {
        type: Sequelize.DECIMAL(5, 4),
        allowNull: false,
        defaultValue: 0
      },
      score: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      regime: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      summary: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      explanation: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metrics_json: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      source_metric_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'token_metrics_daily',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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

    await queryInterface.addIndex('signals', ['token_id']);
    await queryInterface.addIndex('signals', ['timestamp']);
    await queryInterface.addIndex('signals', ['signal_type']);
    await queryInterface.addIndex('signals', ['regime']);
    await queryInterface.addIndex('signals', ['severity']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('signals');
  }
};
const { DataTypes } = require('sequelize');
const sequelize = require('../database/sequelize');

const TokenMetricDaily = sequelize.define(
  'TokenMetricDaily',
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    token_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },

    cex_inflow_7d: {
      type: DataTypes.DECIMAL(36, 18),
      allowNull: false,
      defaultValue: 0
    },
    cex_outflow_7d: {
      type: DataTypes.DECIMAL(36, 18),
      allowNull: false,
      defaultValue: 0
    },
    cex_netflow_7d: {
      type: DataTypes.DECIMAL(36, 18),
      allowNull: false,
      defaultValue: 0
    },
    cex_netflow_usd_7d: {
      type: DataTypes.DECIMAL(36, 8),
      allowNull: false,
      defaultValue: 0
    },

    cex_balance_change_7d: {
      type: DataTypes.DECIMAL(36, 18),
      allowNull: false,
      defaultValue: 0
    },
    non_cex_balance_change_7d: {
      type: DataTypes.DECIMAL(36, 18),
      allowNull: false,
      defaultValue: 0
    },

    cex_flow_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    holder_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    final_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    confidence: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      defaultValue: 0
    },
    regime: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'UNCLEAR'
    },
    explanation: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    score_version: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'v1-simple-cex-holder-score'
    },
    metrics_json: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  },
  {
    tableName: 'token_metrics_daily',
    underscored: true,
    timestamps: true
  }
);

module.exports = TokenMetricDaily;
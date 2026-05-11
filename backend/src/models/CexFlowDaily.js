const { DataTypes } = require('sequelize');
const sequelize = require('../database/sequelize');

const CexFlowDaily = sequelize.define(
  'CexFlowDaily',
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
    cex_inflow: {
      type: DataTypes.DECIMAL(36, 18),
      allowNull: false,
      defaultValue: 0
    },
    cex_outflow: {
      type: DataTypes.DECIMAL(36, 18),
      allowNull: false,
      defaultValue: 0
    },
    cex_netflow: {
      type: DataTypes.DECIMAL(36, 18),
      allowNull: false,
      defaultValue: 0
    },
    cex_inflow_usd: {
      type: DataTypes.DECIMAL(36, 8),
      allowNull: false,
      defaultValue: 0
    },
    cex_outflow_usd: {
      type: DataTypes.DECIMAL(36, 8),
      allowNull: false,
      defaultValue: 0
    },
    cex_netflow_usd: {
      type: DataTypes.DECIMAL(36, 8),
      allowNull: false,
      defaultValue: 0
    },
    inflow_tx_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    outflow_tx_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    large_inflow_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    large_outflow_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    source: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'calculated'
    }
  },
  {
    tableName: 'cex_flow_daily',
    underscored: true,
    timestamps: true
  }
);

module.exports = CexFlowDaily;
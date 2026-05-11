const { DataTypes } = require('sequelize');
const sequelize = require('../database/sequelize');

const HolderSnapshot = sequelize.define(
  'HolderSnapshot',
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
    rank: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    address_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    address_raw: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    balance_decimal: {
      type: DataTypes.DECIMAL(36, 18),
      allowNull: false
    },
    balance_usd: {
      type: DataTypes.DECIMAL(36, 8),
      allowNull: true
    },
    supply_share: {
      type: DataTypes.DECIMAL(18, 10),
      allowNull: true
    },
    balance_change_1d: {
      type: DataTypes.DECIMAL(36, 18),
      allowNull: false,
      defaultValue: 0
    },
    balance_change_7d: {
      type: DataTypes.DECIMAL(36, 18),
      allowNull: false,
      defaultValue: 0
    },
    balance_change_30d: {
      type: DataTypes.DECIMAL(36, 18),
      allowNull: false,
      defaultValue: 0
    },
    source: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'manual_seed'
    }
  },
  {
    tableName: 'holder_snapshots',
    underscored: true,
    timestamps: true
  }
);

module.exports = HolderSnapshot;
const { DataTypes } = require('sequelize');
const sequelize = require('../database/sequelize');

const TokenTransfer = sequelize.define(
  'TokenTransfer',
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
    chain: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'ethereum'
    },
    block_number: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    tx_hash: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    log_index: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    from_address_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    to_address_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    from_address_raw: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    to_address_raw: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    amount_raw: {
      type: DataTypes.DECIMAL(78, 0),
      allowNull: false
    },
    amount_decimal: {
      type: DataTypes.DECIMAL(36, 18),
      allowNull: false
    },
    amount_usd: {
      type: DataTypes.DECIMAL(36, 8),
      allowNull: true
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false
    },
    source: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'manual_seed'
    }
  },
  {
    tableName: 'token_transfers',
    underscored: true,
    timestamps: true
  }
);

module.exports = TokenTransfer;
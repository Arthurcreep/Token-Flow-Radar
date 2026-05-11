const { DataTypes } = require('sequelize');
const sequelize = require('../database/sequelize');

const Token = sequelize.define(
  'Token',
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    symbol: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    chain: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'ethereum'
    },
    contract_address: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true
    },
    decimals: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    coingecko_id: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    tableName: 'tokens',
    underscored: true,
    timestamps: true
  }
);

module.exports = Token;
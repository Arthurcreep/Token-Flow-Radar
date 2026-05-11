const { DataTypes } = require('sequelize');
const sequelize = require('../database/sequelize');

const Address = sequelize.define(
  'Address',
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    chain: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'ethereum'
    },
    address: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    entity_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    address_type: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'unknown'
    },
    address_role: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'unknown'
    },
    label: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    source: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    confidence: {
      type: DataTypes.DECIMAL(4, 3),
      allowNull: false,
      defaultValue: 0
    },
    is_contract: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    tableName: 'addresses',
    underscored: true,
    timestamps: true
  }
);

module.exports = Address;
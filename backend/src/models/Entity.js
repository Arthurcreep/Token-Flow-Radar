const { DataTypes } = require('sequelize');
const sequelize = require('../database/sequelize');

const Entity = sequelize.define(
  'Entity',
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true
    },
    entity_type: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    tableName: 'entities',
    underscored: true,
    timestamps: true
  }
);

module.exports = Entity;
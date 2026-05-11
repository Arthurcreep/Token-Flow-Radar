const { DataTypes } = require('sequelize');
const sequelize = require('../database/sequelize');

const Signal = sequelize.define(
  'Signal',
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
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false
    },
    signal_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    signal_type: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    severity: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'medium'
    },
    confidence: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      defaultValue: 0
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    regime: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    summary: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    explanation: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metrics_json: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    source_metric_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    }
  },
  {
    tableName: 'signals',
    underscored: true,
    timestamps: true
  }
);

module.exports = Signal;
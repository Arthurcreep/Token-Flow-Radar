const sequelize = require('../database/sequelize');

const Token = require('./Token');
const Entity = require('./Entity');
const Address = require('./Address');
const TokenTransfer = require('./TokenTransfer');
const CexFlowDaily = require('./CexFlowDaily');
const HolderSnapshot = require('./HolderSnapshot');
const TokenMetricDaily = require('./TokenMetricDaily');
const Signal = require('./Signal');

Entity.hasMany(Address, {
  foreignKey: 'entity_id',
  as: 'addresses'
});

Address.belongsTo(Entity, {
  foreignKey: 'entity_id',
  as: 'entity'
});

Token.hasMany(TokenTransfer, {
  foreignKey: 'token_id',
  as: 'transfers'
});

TokenTransfer.belongsTo(Token, {
  foreignKey: 'token_id',
  as: 'token'
});

Token.hasMany(CexFlowDaily, {
  foreignKey: 'token_id',
  as: 'cexFlows'
});

CexFlowDaily.belongsTo(Token, {
  foreignKey: 'token_id',
  as: 'token'
});

Token.hasMany(HolderSnapshot, {
  foreignKey: 'token_id',
  as: 'holderSnapshots'
});

HolderSnapshot.belongsTo(Token, {
  foreignKey: 'token_id',
  as: 'token'
});

Token.hasMany(TokenMetricDaily, {
  foreignKey: 'token_id',
  as: 'metrics'
});

TokenMetricDaily.belongsTo(Token, {
  foreignKey: 'token_id',
  as: 'token'
});

Address.hasMany(TokenTransfer, {
  foreignKey: 'from_address_id',
  as: 'outgoingTransfers'
});

Address.hasMany(TokenTransfer, {
  foreignKey: 'to_address_id',
  as: 'incomingTransfers'
});

TokenTransfer.belongsTo(Address, {
  foreignKey: 'from_address_id',
  as: 'fromAddress'
});

TokenTransfer.belongsTo(Address, {
  foreignKey: 'to_address_id',
  as: 'toAddress'
});

Address.hasMany(HolderSnapshot, {
  foreignKey: 'address_id',
  as: 'holderSnapshots'
});

HolderSnapshot.belongsTo(Address, {
  foreignKey: 'address_id',
  as: 'address'
});
Token.hasMany(Signal, {
  foreignKey: 'token_id',
  as: 'signals'
});

Signal.belongsTo(Token, {
  foreignKey: 'token_id',
  as: 'token'
});

TokenMetricDaily.hasMany(Signal, {
  foreignKey: 'source_metric_id',
  as: 'signals'
});

Signal.belongsTo(TokenMetricDaily, {
  foreignKey: 'source_metric_id',
  as: 'sourceMetric'
});
const db = {
  sequelize,
  Token,
  Entity,
  Address,
  TokenTransfer,
  CexFlowDaily,
  HolderSnapshot,
  TokenMetricDaily,
  Signal
};

module.exports = db;
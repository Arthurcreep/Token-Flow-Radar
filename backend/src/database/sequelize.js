const { Sequelize } = require('sequelize');
const env = require('../config/env');
const logger = require('../utils/logger');

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'postgres',
  logging: env.nodeEnv === 'development' ? (msg) => logger.debug(msg) : false
});

module.exports = sequelize;
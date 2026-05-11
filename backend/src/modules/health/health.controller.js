const { sequelize } = require('../../models');

async function getHealth(req, res) {
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'token-flow-radar-backend',
      timestamp: new Date().toISOString()
    },
    meta: {}
  });
}

async function getDbHealth(req, res) {
  await sequelize.authenticate();

  res.json({
    success: true,
    data: {
      database: 'connected',
      timestamp: new Date().toISOString()
    },
    meta: {}
  });
}

module.exports = {
  getHealth,
  getDbHealth
};
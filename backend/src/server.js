const app = require('./app');
const env = require('./config/env');
const { sequelize } = require('./models');
const logger = require('./utils/logger');

async function startServer() {
  try {
    await sequelize.authenticate();

    logger.info('Database connection established');

    app.listen(env.port, () => {
      logger.info(`Server is running on port ${env.port}`);
    });
  } catch (error) {
    logger.error({
      message: 'Failed to start server',
      error: error.message,
      stack: error.stack
    });

    process.exit(1);
  }
}

startServer();
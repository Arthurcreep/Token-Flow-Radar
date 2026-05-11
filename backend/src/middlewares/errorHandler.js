const { ValidationError, UniqueConstraintError, DatabaseError, ForeignKeyConstraintError } = require('sequelize');
const AppError = require('../errors/AppError');
const env = require('../config/env');
const logger = require('../utils/logger');

function normalizeSequelizeError(error) {
  if (error instanceof UniqueConstraintError) {
    return new AppError('Unique constraint violation', 409, 'DB_UNIQUE_CONSTRAINT', error.errors);
  }

  if (error instanceof ForeignKeyConstraintError) {
    return new AppError('Foreign key constraint violation', 409, 'DB_FOREIGN_KEY_CONSTRAINT', {
      table: error.table,
      fields: error.fields
    });
  }

  if (error instanceof ValidationError) {
    return new AppError('Database validation error', 400, 'DB_VALIDATION_ERROR', error.errors);
  }

  if (error instanceof DatabaseError) {
    return new AppError('Database error', 500, 'DB_ERROR', {
      message: error.message
    });
  }

  return error;
}

function errorHandler(err, req, res, next) {
  const error = normalizeSequelizeError(err);

  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';
  const message = error.isOperational ? error.message : 'Internal server error';

  logger.error({
    message: error.message,
    code,
    statusCode,
    path: req.originalUrl,
    method: req.method,
    stack: error.stack
  });

  const response = {
    success: false,
    error: {
      code,
      message,
      details: error.details || null
    }
  };

  if (env.nodeEnv === 'development') {
    response.error.stack = error.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
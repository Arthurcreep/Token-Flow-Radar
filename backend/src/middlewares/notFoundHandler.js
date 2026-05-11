const NotFoundError = require('../errors/NotFoundError');

function notFoundHandler(req, res, next) {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND'));
}

module.exports = notFoundHandler;
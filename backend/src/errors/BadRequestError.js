const AppError = require('./AppError');

class BadRequestError extends AppError {
  constructor(message = 'Bad request', code = 'BAD_REQUEST', details = null) {
    super(message, 400, code, details);
  }
}

module.exports = BadRequestError;
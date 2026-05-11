const AppError = require('./AppError');

class ExternalApiError extends AppError {
  constructor(message = 'External API error', code = 'EXTERNAL_API_ERROR', details = null) {
    super(message, 502, code, details);
  }
}

module.exports = ExternalApiError;
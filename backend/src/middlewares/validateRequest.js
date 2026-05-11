const BadRequestError = require('../errors/BadRequestError');

function validateRequest(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      params: req.params,
      query: req.query,
      body: req.body
    });

    if (!result.success) {
      return next(
        new BadRequestError('Invalid request data', 'VALIDATION_ERROR', result.error.flatten())
      );
    }

    req.validated = result.data;
    next();
  };
}

module.exports = validateRequest;
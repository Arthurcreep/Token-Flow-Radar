const express = require('express');

const tokenController = require('./token.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validateRequest = require('../../middlewares/validateRequest');
const { symbolParamSchema } = require('./token.validators');

const router = express.Router();

router.get('/', asyncHandler(tokenController.getTokens));

router.get(
  '/:symbol',
  validateRequest(symbolParamSchema),
  asyncHandler(tokenController.getTokenBySymbol)
);

router.get(
  '/:symbol/overview',
  validateRequest(symbolParamSchema),
  asyncHandler(tokenController.getTokenOverview)
);

module.exports = router;
const express = require('express');

const priceContextController = require('./priceContext.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validateRequest = require('../../middlewares/validateRequest');
const {
  updatePriceContextSchema,
  getPriceContextSchema
} = require('./priceContext.validators');

const router = express.Router();

router.post(
  '/update',
  validateRequest(updatePriceContextSchema),
  asyncHandler(priceContextController.updatePriceContext)
);

router.get(
  '/:symbol',
  validateRequest(getPriceContextSchema),
  asyncHandler(priceContextController.getTokenPriceContext)
);

module.exports = router;

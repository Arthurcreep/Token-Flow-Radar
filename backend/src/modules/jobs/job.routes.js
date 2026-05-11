const express = require('express');

const jobController = require('./job.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validateRequest = require('../../middlewares/validateRequest');
const {
  calculateCexFlowsSchema,
  calculateTokenMetricsSchema,
  generateSignalsSchema
} = require('./job.validators');

const router = express.Router();

router.post(
  '/calculate-cex-flows/:symbol',
  validateRequest(calculateCexFlowsSchema),
  asyncHandler(jobController.calculateCexFlows)
);

router.post(
  '/calculate-token-metrics/:symbol',
  validateRequest(calculateTokenMetricsSchema),
  asyncHandler(jobController.calculateTokenMetrics)
);

router.post(
  '/generate-signals/:symbol',
  validateRequest(generateSignalsSchema),
  asyncHandler(jobController.generateSignals)
);
module.exports = router;
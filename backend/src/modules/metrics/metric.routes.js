const express = require('express');

const metricController = require('./metric.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validateRequest = require('../../middlewares/validateRequest');
const { latestMetricSchema } = require('./metric.validators');

const router = express.Router();

router.get(
  '/tokens/:symbol/metrics/latest',
  validateRequest(latestMetricSchema),
  asyncHandler(metricController.getLatestMetric)
);

module.exports = router;
const express = require('express');

const metricController = require('./metric.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validateRequest = require('../../middlewares/validateRequest');
const {
  getLatestMetricSchema
} = require('./metric.validators');

const router = express.Router();

router.get(
  '/:symbol/metrics/latest',
  validateRequest(getLatestMetricSchema),
  asyncHandler(metricController.getLatestMetric)
);

module.exports = router;

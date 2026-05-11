const express = require('express');

const signalController = require('./signal.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validateRequest = require('../../middlewares/validateRequest');
const {
  getSignalsByTokenSchema,
  getSignalsSchema
} = require('./signal.validators');

const router = express.Router();

router.get(
  '/signals',
  validateRequest(getSignalsSchema),
  asyncHandler(signalController.getSignals)
);

router.get(
  '/tokens/:symbol/signals',
  validateRequest(getSignalsByTokenSchema),
  asyncHandler(signalController.getSignalsByToken)
);

module.exports = router;
const express = require('express');

const cexFlowController = require('./cexFlow.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validateRequest = require('../../middlewares/validateRequest');
const {
  getCexFlowsSchema
} = require('./cexFlow.validators');

const router = express.Router();

router.get(
  '/:symbol/cex-flows',
  validateRequest(getCexFlowsSchema),
  asyncHandler(cexFlowController.getCexFlows)
);

module.exports = router;

const express = require('express');

const asyncHandler = require('../../utils/asyncHandler');
const flowProfileController = require('./flowProfile.controller');

const router = express.Router();

router.get(
  '/tokens/:symbol/flow-profile',
  asyncHandler(flowProfileController.getTokenFlowProfile)
);

module.exports = router;

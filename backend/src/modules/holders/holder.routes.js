const express = require('express');

const holderController = require('./holder.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validateRequest = require('../../middlewares/validateRequest');
const { getTopHoldersSchema } = require('./holder.validators');

const router = express.Router();

router.get(
  '/tokens/:symbol/holders/top',
  validateRequest(getTopHoldersSchema),
  asyncHandler(holderController.getTopHolders)
);

module.exports = router;
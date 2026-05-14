const express = require('express');

const transferController = require('./transfer.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validateRequest = require('../../middlewares/validateRequest');
const {
  getTransfersSchema,
  getTransferSourcesSchema
} = require('./transfer.validators');

const router = express.Router();

router.get(
  '/',
  validateRequest(getTransfersSchema),
  asyncHandler(transferController.getTransfers)
);

router.get(
  '/sources',
  validateRequest(getTransferSourcesSchema),
  asyncHandler(transferController.getTransferSources)
);

module.exports = router;

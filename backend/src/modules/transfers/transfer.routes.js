const express = require('express');

const transferController = require('./transfer.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validateRequest = require('../../middlewares/validateRequest');
const { getTransfersSchema } = require('./transfer.validators');

const router = express.Router();

router.get('/', validateRequest(getTransfersSchema), asyncHandler(transferController.getTransfers));

module.exports = router;
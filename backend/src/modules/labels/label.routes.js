const express = require('express');

const labelController = require('./label.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validateRequest = require('../../middlewares/validateRequest');
const { getLabelsSchema, getLabelByAddressSchema } = require('./label.validators');

const router = express.Router();

router.get('/', validateRequest(getLabelsSchema), asyncHandler(labelController.getLabels));

router.get(
  '/:address',
  validateRequest(getLabelByAddressSchema),
  asyncHandler(labelController.getLabelByAddress)
);

module.exports = router;
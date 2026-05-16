const express = require('express');

const tokenImportController = require('./tokenImport.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validateRequest = require('../../middlewares/validateRequest');
const {
  importTokenSchema
} = require('./tokenImport.validators');

const router = express.Router();

router.post(
  '/import',
  validateRequest(importTokenSchema),
  asyncHandler(tokenImportController.importToken)
);

module.exports = router;

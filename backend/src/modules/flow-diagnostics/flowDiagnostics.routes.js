const express = require('express');

const asyncHandler = require('../../utils/asyncHandler');
const flowDiagnosticsController = require('./flowDiagnostics.controller');

const router = express.Router();

router.get(
  '/tokens/:symbol/flow-diagnostics',
  asyncHandler(flowDiagnosticsController.getFlowDiagnostics)
);

module.exports = router;

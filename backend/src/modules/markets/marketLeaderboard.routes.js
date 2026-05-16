const express = require('express');

const marketLeaderboardController = require('./marketLeaderboard.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validateRequest = require('../../middlewares/validateRequest');
const {
  getCexFlowLeaderboardSchema
} = require('./marketLeaderboard.validators');

const router = express.Router();

router.get(
  '/cex-flow-leaderboard',
  validateRequest(getCexFlowLeaderboardSchema),
  asyncHandler(marketLeaderboardController.getCexFlowLeaderboard)
);

module.exports = router;

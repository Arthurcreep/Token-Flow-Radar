const marketLeaderboardService = require('./marketLeaderboard.service');

async function getCexFlowLeaderboard(req, res) {
  const {
    source,
    range,
    fromDate,
    toDate,
    limit,
    offset
  } = req.validated.query;

  const result = await marketLeaderboardService.getCexFlowLeaderboard({
    source,
    range,
    fromDate,
    toDate,
    limit,
    offset
  });

  res.json({
    success: true,
    data: result.data,
    meta: result.meta
  });
}

module.exports = {
  getCexFlowLeaderboard
};

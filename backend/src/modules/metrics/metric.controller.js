const metricService = require('./metric.service');

async function getLatestMetric(req, res) {
  const { symbol } = req.validated.params;

  const data = await metricService.getLatestMetric({
    symbol
  });

  res.json({
    success: true,
    data,
    meta: {}
  });
}

module.exports = {
  getLatestMetric
};
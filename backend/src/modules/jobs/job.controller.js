const cexFlowService = require('../cex-flows/cexFlow.service');
const metricService = require('../metrics/metric.service');
const signalService = require('../signals/signal.service');

async function calculateCexFlows(req, res) {
  const { symbol } = req.validated.params;
  const { fromDate, toDate } = req.validated.query;

  const data = await cexFlowService.calculateCexFlows({
    symbol,
    fromDate,
    toDate
  });

  res.json({
    success: true,
    data,
    meta: {}
  });
}

async function calculateTokenMetrics(req, res) {
  const { symbol } = req.validated.params;

  const data = await metricService.calculateTokenMetrics({
    symbol
  });

  res.json({
    success: true,
    data,
    meta: {}
  });
}

async function generateSignals(req, res) {
  const { symbol } = req.validated.params;

  const data = await signalService.generateSignalsForToken({
    symbol
  });

  res.json({
    success: true,
    data,
    meta: {}
  });
}

module.exports = {
  calculateCexFlows,
  calculateTokenMetrics,
  generateSignals
};
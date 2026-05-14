const cexFlowService = require('../cex-flows/cexFlow.service');
const metricService = require('../metrics/metric.service');
const signalService = require('../signals/signal.service');
const transferIngestionService = require('../ingestion/transferIngestion.service');

async function calculateCexFlows(req, res) {
  const { symbol } = req.validated.params;
  const { fromDate, toDate, source } = req.validated.query;

  const data = await cexFlowService.calculateCexFlows({
    symbol,
    fromDate,
    toDate,
    source
  });

  res.json({
    success: true,
    data,
    meta: {}
  });
}

async function calculateTokenMetrics(req, res) {
  const { symbol } = req.validated.params;
  const { cexFlowSource, holderSource } = req.validated.query;

  const data = await metricService.calculateTokenMetrics({
    symbol,
    cexFlowSource,
    holderSource
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

async function ingestTransfers(req, res) {
  const { symbol } = req.validated.params;
  const { startBlock, endBlock, offset, maxPages } = req.validated.query;

  const data = await transferIngestionService.ingestTransfersForToken({
    symbol,
    startBlock,
    endBlock,
    offset,
    maxPages
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
  generateSignals,
  ingestTransfers
};

const flowDiagnosticsService = require('./flowDiagnostics.service');

async function getFlowDiagnostics(req, res) {
  const result = await flowDiagnosticsService.getFlowDiagnostics({
    symbol: req.params.symbol,
    range: req.query.range,
    source: req.query.source,
    rawSource: req.query.rawSource,
    fromDate: req.query.fromDate,
    toDate: req.query.toDate
  });

  return res.json({
    success: true,
    data: result,
    meta: {}
  });
}

module.exports = {
  getFlowDiagnostics
};

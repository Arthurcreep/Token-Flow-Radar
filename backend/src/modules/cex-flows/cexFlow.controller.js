const cexFlowService = require('./cexFlow.service');

async function getCexFlows(req, res) {
  const { symbol } = req.validated.params;
  const { source, limit, offset } = req.validated.query;

  const result = await cexFlowService.getCexFlows({
    symbol,
    source,
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
  getCexFlows
};

const flowProfileService = require('./flowProfile.service');

const getTokenFlowProfile = async (req, res) => {
  const result = await flowProfileService.getTokenFlowProfile({
    symbol: req.params.symbol,
    range: req.query.range,
    source: req.query.source,
    fromDate: req.query.fromDate,
    toDate: req.query.toDate,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    offset: req.query.offset ? Number(req.query.offset) : undefined
  });

  return res.json({
    success: true,
    data: result,
    meta: result.meta || {}
  });
};

module.exports = {
  getTokenFlowProfile
};

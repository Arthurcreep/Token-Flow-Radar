const labelService = require('./label.service');

async function getLabels(req, res) {
  const { limit, offset, addressType } = req.validated.query;

  const result = await labelService.getLabels({
    limit,
    offset,
    addressType
  });

  res.json({
    success: true,
    data: result.data,
    meta: result.meta
  });
}

async function getLabelByAddress(req, res) {
  const { address } = req.validated.params;
  const { chain } = req.validated.query;

  const data = await labelService.getLabelByAddress(address, chain);

  res.json({
    success: true,
    data,
    meta: {}
  });
}

module.exports = {
  getLabels,
  getLabelByAddress
};
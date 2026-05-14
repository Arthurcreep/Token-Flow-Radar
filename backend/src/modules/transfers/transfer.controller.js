const transferService = require('./transfer.service');

async function getTransfers(req, res) {
  const { token, source, limit, offset } = req.validated.query;

  const result = await transferService.getTransfers({
    token,
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

async function getTransferSources(req, res) {
  const { token } = req.validated.query;

  const data = await transferService.getTransferSources({
    token
  });

  res.json({
    success: true,
    data,
    meta: {}
  });
}

module.exports = {
  getTransfers,
  getTransferSources
};

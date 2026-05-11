const transferService = require('./transfer.service');

async function getTransfers(req, res) {
  const { token, limit, offset } = req.validated.query;

  const result = await transferService.getTransfers({
    tokenSymbol: token,
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
  getTransfers
};
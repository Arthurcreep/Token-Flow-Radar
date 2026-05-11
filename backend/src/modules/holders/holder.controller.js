const holderService = require('./holder.service');

async function getTopHolders(req, res) {
  const { symbol } = req.validated.params;
  const { limit, offset } = req.validated.query;

  const result = await holderService.getTopHolders({
    symbol,
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
  getTopHolders
};
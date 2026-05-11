const signalService = require('./signal.service');

async function getSignalsByToken(req, res) {
  const { symbol } = req.validated.params;
  const { limit, offset } = req.validated.query;

  const result = await signalService.getSignalsByToken({
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

async function getSignals(req, res) {
  const { limit, offset } = req.validated.query;

  const result = await signalService.getSignals({
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
  getSignalsByToken,
  getSignals
};
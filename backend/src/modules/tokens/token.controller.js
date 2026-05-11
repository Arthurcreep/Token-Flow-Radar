const tokenService = require('./token.service');

async function getTokens(req, res) {
  const data = await tokenService.getTokens();

  res.json({
    success: true,
    data,
    meta: {
      count: data.length
    }
  });
}

async function getTokenBySymbol(req, res) {
  const { symbol } = req.validated.params;

  const data = await tokenService.getTokenBySymbol(symbol);

  res.json({
    success: true,
    data,
    meta: {}
  });
}

async function getTokenOverview(req, res) {
  const { symbol } = req.validated.params;

  const data = await tokenService.getTokenOverview(symbol);

  res.json({
    success: true,
    data,
    meta: {}
  });
}

module.exports = {
  getTokens,
  getTokenBySymbol,
  getTokenOverview
};
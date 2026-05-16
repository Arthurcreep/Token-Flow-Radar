const priceContextService = require('./priceContext.service');

async function updatePriceContext(req, res) {
  const {
    symbols
  } = req.validated.query;

  const data = await priceContextService.updateTokenPriceContext({
    symbols
  });

  res.json({
    success: true,
    data,
    meta: {}
  });
}

async function getTokenPriceContext(req, res) {
  const {
    symbol
  } = req.validated.params;

  const data = await priceContextService.getTokenPriceContext(symbol);

  res.json({
    success: true,
    data,
    meta: {}
  });
}

module.exports = {
  updatePriceContext,
  getTokenPriceContext
};

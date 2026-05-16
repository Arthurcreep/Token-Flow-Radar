const tokenImportService = require('./tokenImport.service');

async function importToken(req, res) {
  const {
    chain,
    contractAddress
  } = req.validated.body;

  const data = await tokenImportService.importEthereumToken({
    chain,
    contractAddress
  });

  res.status(data.status.alreadyExisted ? 200 : 201).json({
    success: true,
    data,
    meta: {}
  });
}

module.exports = {
  importToken
};

const { z } = require('zod');

const supportedSymbols = ['ARB', '1INCH', 'UNI', 'AAVE', 'LINK'];

const symbolParam = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .refine((value) => supportedSymbols.includes(value), {
    message: 'Unsupported token symbol'
  });

const getLatestMetricSchema = z.object({
  params: z.object({
    symbol: symbolParam
  }),
  query: z.object({}).passthrough(),
  body: z.object({}).passthrough()
});

module.exports = {
  getLatestMetricSchema
};

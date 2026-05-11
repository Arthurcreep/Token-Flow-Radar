const { z } = require('zod');

const supportedSymbols = ['ARB', '1INCH', 'UNI', 'AAVE', 'LINK'];

const symbolParamSchema = z.object({
  params: z.object({
    symbol: z
      .string()
      .trim()
      .transform((value) => value.toUpperCase())
      .refine((value) => supportedSymbols.includes(value), {
        message: 'Unsupported token symbol'
      })
  }),
  query: z.object({}).passthrough(),
  body: z.object({}).passthrough()
});

module.exports = {
  symbolParamSchema
};
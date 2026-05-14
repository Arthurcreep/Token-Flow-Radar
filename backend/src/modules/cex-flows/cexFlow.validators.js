const { z } = require('zod');

const supportedSymbols = ['ARB', '1INCH', 'UNI', 'AAVE', 'LINK'];

const symbolParam = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .refine((value) => supportedSymbols.includes(value), {
    message: 'Unsupported token symbol'
  });

const sourceQuery = z
  .string()
  .trim()
  .optional()
  .transform((value) => {
    if (!value) return undefined;
    return value;
  });

const limitQuery = z
  .string()
  .optional()
  .default('30')
  .transform((value) => Number(value))
  .refine((value) => Number.isInteger(value) && value > 0 && value <= 500, {
    message: 'limit must be between 1 and 500'
  });

const offsetQuery = z
  .string()
  .optional()
  .default('0')
  .transform((value) => Number(value))
  .refine((value) => Number.isInteger(value) && value >= 0, {
    message: 'offset must be a non-negative integer'
  });

const getCexFlowsSchema = z.object({
  params: z.object({
    symbol: symbolParam
  }),
  query: z.object({
    source: sourceQuery,
    limit: limitQuery,
    offset: offsetQuery
  }),
  body: z.object({}).passthrough()
});

module.exports = {
  getCexFlowsSchema
};

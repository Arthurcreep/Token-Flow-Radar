const { z } = require('zod');

const supportedSymbols = ['ARB', '1INCH', 'UNI', 'AAVE', 'LINK'];

const symbolParam = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .refine((value) => supportedSymbols.includes(value), {
    message: 'Unsupported token symbol'
  });

const optionalDate = z
  .string()
  .optional()
  .refine((value) => {
    if (!value) return true;
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
  }, {
    message: 'Date must be in YYYY-MM-DD format'
  });

const calculateCexFlowsSchema = z.object({
  params: z.object({
    symbol: symbolParam
  }),
  query: z.object({
    fromDate: optionalDate,
    toDate: optionalDate
  }),
  body: z.object({}).passthrough()
});

const calculateTokenMetricsSchema = z.object({
  params: z.object({
    symbol: symbolParam
  }),
  query: z.object({}).passthrough(),
  body: z.object({}).passthrough()
});

const generateSignalsSchema = z.object({
  params: z.object({
    symbol: symbolParam
  }),
  query: z.object({}).passthrough(),
  body: z.object({}).passthrough()
});

module.exports = {
  calculateCexFlowsSchema,
  calculateTokenMetricsSchema,
  generateSignalsSchema
};
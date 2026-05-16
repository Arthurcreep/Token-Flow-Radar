const { z } = require('zod');

const supportedSymbols = ['ARB', '1INCH', 'UNI', 'AAVE', 'LINK'];
const supportedRanges = ['1d', '7d', '1m', '1y', 'all'];

const symbolParam = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .refine((value) => supportedSymbols.includes(value), {
    message: 'Unsupported token symbol'
  });

const optionalSource = z
  .string()
  .trim()
  .optional()
  .transform((value) => {
    if (!value) return undefined;
    return value;
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

const optionalRange = z
  .string()
  .optional()
  .default('1m')
  .transform((value) => value.toLowerCase())
  .refine((value) => supportedRanges.includes(value), {
    message: 'range must be one of 1d, 7d, 1m, 1y, all'
  });

const optionalLimit = z
  .string()
  .optional()
  .default('500')
  .transform((value) => Number(value))
  .refine((value) => Number.isInteger(value) && value > 0 && value <= 1000, {
    message: 'limit must be between 1 and 1000'
  });

const optionalOffset = z
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
    source: optionalSource,
    range: optionalRange,
    fromDate: optionalDate,
    toDate: optionalDate,
    limit: optionalLimit,
    offset: optionalOffset
  }),
  body: z.object({}).passthrough()
});

module.exports = {
  getCexFlowsSchema
};

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

const optionalSource = z
  .string()
  .trim()
  .optional()
  .transform((value) => {
    if (!value) return undefined;
    return value;
  });

const optionalPositiveInteger = z
  .string()
  .optional()
  .transform((value) => {
    if (value === undefined || value === '') return undefined;
    return Number(value);
  })
  .refine((value) => value === undefined || (Number.isInteger(value) && value >= 0), {
    message: 'must be a non-negative integer'
  });

const optionalStrictPositiveInteger = z
  .string()
  .optional()
  .transform((value) => {
    if (value === undefined || value === '') return undefined;
    return Number(value);
  })
  .refine((value) => value === undefined || (Number.isInteger(value) && value > 0), {
    message: 'must be a positive integer'
  });

const optionalOffset = z
  .string()
  .optional()
  .default('100')
  .transform((value) => Number(value))
  .refine((value) => Number.isInteger(value) && value > 0 && value <= 1000, {
    message: 'offset must be between 1 and 1000'
  });

const optionalMaxPages = z
  .string()
  .optional()
  .default('1')
  .transform((value) => Number(value))
  .refine((value) => Number.isInteger(value) && value > 0 && value <= 10, {
    message: 'maxPages must be between 1 and 10'
  });

const optionalMaxAddresses = z
  .string()
  .optional()
  .transform((value) => {
    if (value === undefined || value === '') return undefined;
    return Number(value);
  })
  .refine((value) => value === undefined || (Number.isInteger(value) && value > 0 && value <= 100), {
    message: 'maxAddresses must be between 1 and 100'
  });

const calculateCexFlowsSchema = z.object({
  params: z.object({
    symbol: symbolParam
  }),
  query: z.object({
    fromDate: optionalDate,
    toDate: optionalDate,
    source: optionalSource
  }),
  body: z.object({}).passthrough()
});

const calculateTokenMetricsSchema = z.object({
  params: z.object({
    symbol: symbolParam
  }),
  query: z.object({
    cexFlowSource: optionalSource,
    holderSource: optionalSource
  }),
  body: z.object({}).passthrough()
});

const generateSignalsSchema = z.object({
  params: z.object({
    symbol: symbolParam
  }),
  query: z.object({}).passthrough(),
  body: z.object({}).passthrough()
});

const ingestTransfersSchema = z.object({
  params: z.object({
    symbol: symbolParam
  }),
  query: z.object({
    startBlock: optionalPositiveInteger,
    endBlock: optionalPositiveInteger,
    offset: optionalOffset,
    maxPages: optionalMaxPages,
    maxAddresses: optionalMaxAddresses
  }),
  body: z.object({}).passthrough()
});

const ingestRecentTransfersSchema = z.object({
  params: z.object({
    symbol: symbolParam
  }),
  query: z.object({
    blocksBack: optionalStrictPositiveInteger,
    offset: optionalOffset,
    maxPages: optionalMaxPages,
    maxAddresses: optionalMaxAddresses
  }),
  body: z.object({}).passthrough()
});

module.exports = {
  calculateCexFlowsSchema,
  calculateTokenMetricsSchema,
  generateSignalsSchema,
  ingestTransfersSchema,
  ingestRecentTransfersSchema
};

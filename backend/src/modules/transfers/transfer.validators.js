const { z } = require('zod');

const supportedSymbols = ['ARB', '1INCH', 'UNI', 'AAVE', 'LINK'];

const getTransfersSchema = z.object({
  params: z.object({}).passthrough(),
  query: z.object({
    token: z
      .string()
      .trim()
      .transform((value) => value.toUpperCase())
      .refine((value) => supportedSymbols.includes(value), {
        message: 'Unsupported token symbol'
      }),
    limit: z
      .string()
      .optional()
      .default('50')
      .transform((value) => Number(value))
      .refine((value) => Number.isInteger(value) && value > 0 && value <= 500, {
        message: 'limit must be between 1 and 500'
      }),
    offset: z
      .string()
      .optional()
      .default('0')
      .transform((value) => Number(value))
      .refine((value) => Number.isInteger(value) && value >= 0, {
        message: 'offset must be a non-negative integer'
      })
  }),
  body: z.object({}).passthrough()
});

module.exports = {
  getTransfersSchema
};
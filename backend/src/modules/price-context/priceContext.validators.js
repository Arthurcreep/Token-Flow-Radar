const { z } = require('zod');

const symbolList = z
  .string()
  .optional()
  .transform((value) => {
    if (!value) return undefined;

    return value
      .split(',')
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean);
  })
  .refine((value) => {
    if (!value) return true;
    return value.every((symbol) => /^[A-Z0-9]{2,32}$/.test(symbol));
  }, {
    message: 'symbols must be comma-separated token symbols'
  });

const symbolParam = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .refine((value) => /^[A-Z0-9]{2,32}$/.test(value), {
    message: 'Token symbol must contain 2-32 uppercase letters or numbers'
  });

const updatePriceContextSchema = z.object({
  params: z.object({}).passthrough(),
  query: z.object({
    symbols: symbolList
  }),
  body: z.object({}).passthrough()
});

const getPriceContextSchema = z.object({
  params: z.object({
    symbol: symbolParam
  }),
  query: z.object({}).passthrough(),
  body: z.object({}).passthrough()
});

module.exports = {
  updatePriceContextSchema,
  getPriceContextSchema
};

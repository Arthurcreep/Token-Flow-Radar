const { z } = require('zod');

const ethAddressSchema = z
  .string()
  .trim()
  .transform((value) => value.toLowerCase())
  .refine((value) => /^0x[a-fA-F0-9]{40}$/.test(value), {
    message: 'Invalid Ethereum address'
  });

const getLabelsSchema = z.object({
  params: z.object({}).passthrough(),
  query: z.object({
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
      }),
    addressType: z
      .enum(['cex', 'contract', 'whale', 'fund', 'bridge', 'treasury', 'vesting', 'market_maker', 'unknown'])
      .optional()
  }),
  body: z.object({}).passthrough()
});

const getLabelByAddressSchema = z.object({
  params: z.object({
    address: ethAddressSchema
  }),
  query: z.object({
    chain: z.string().optional().default('ethereum')
  }),
  body: z.object({}).passthrough()
});

module.exports = {
  getLabelsSchema,
  getLabelByAddressSchema
};
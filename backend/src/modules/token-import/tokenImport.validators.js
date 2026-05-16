const { z } = require('zod');

const ethereumAddress = z
  .string()
  .trim()
  .transform((value) => value.toLowerCase())
  .refine((value) => /^0x[a-f0-9]{40}$/.test(value), {
    message: 'contractAddress must be a valid Ethereum address'
  });

const chainField = z
  .string()
  .trim()
  .default('ethereum')
  .transform((value) => value.toLowerCase())
  .refine((value) => value === 'ethereum', {
    message: 'Only ethereum is supported'
  });

const importTokenSchema = z.object({
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  body: z.object({
    chain: chainField,
    contractAddress: ethereumAddress
  })
});

const resolveTokenSchema = z.object({
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  body: z.object({
    chain: chainField,
    query: z
      .string()
      .trim()
      .min(2, 'query must contain at least 2 characters')
      .max(128, 'query is too long')
  })
});

module.exports = {
  importTokenSchema,
  resolveTokenSchema
};

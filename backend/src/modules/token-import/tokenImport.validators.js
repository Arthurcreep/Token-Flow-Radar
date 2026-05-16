const { z } = require('zod');

const ethereumAddress = z
  .string()
  .trim()
  .transform((value) => value.toLowerCase())
  .refine((value) => /^0x[a-f0-9]{40}$/.test(value), {
    message: 'contractAddress must be a valid Ethereum address'
  });

const importTokenSchema = z.object({
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  body: z.object({
    chain: z
      .string()
      .trim()
      .default('ethereum')
      .transform((value) => value.toLowerCase())
      .refine((value) => value === 'ethereum', {
        message: 'Only ethereum is supported'
      }),
    contractAddress: ethereumAddress
  })
});

module.exports = {
  importTokenSchema
};

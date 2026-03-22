import { z } from 'zod';

const storedBlockSchema = z.record(z.string(), z.unknown());

export const entryBodySchema = z.object({
  format: z.literal('blocknote@0.47'),
  blocks: z.array(storedBlockSchema),
});

export const corpusEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().default(''),
  product: z.string().default('General'),
  category: z.string().default('Reference'),
  tags: z.array(z.string()).default([]),
  aliases: z.array(z.string()).default([]),
  pinned: z.boolean().default(false),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  body: entryBodySchema,
});

export const corpusSchema = z.object({
  version: z.literal('1.1'),
  owner: z.object({
    name: z.string().optional(),
    team: z.string().optional(),
  }),
  entries: z.array(corpusEntrySchema),
});

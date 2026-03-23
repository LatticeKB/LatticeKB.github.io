import { z } from 'zod';
import type { CorpusInput } from './types';

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

export const searchMetricEntrySchema = z.object({
  openCount: z.number().int().nonnegative().default(0),
  qualifiedViewCount: z.number().int().nonnegative().default(0),
  shortAbandonCount: z.number().int().nonnegative().default(0),
  totalQualifiedDwellSeconds: z.number().int().nonnegative().default(0),
  longViewCount: z.number().int().nonnegative().default(0),
  lastViewedAt: z.string().datetime({ offset: true }).optional(),
});

export const searchMetricsSchema = z.object({
  entries: z.record(z.string(), searchMetricEntrySchema).default({}),
});

const corpusBaseSchema = z.object({
  owner: z.object({
    name: z.string().optional(),
    team: z.string().optional(),
  }),
  entries: z.array(corpusEntrySchema),
});

const legacyCorpusSchema = corpusBaseSchema.extend({
  version: z.literal('1.1'),
});

const currentCorpusSchema = corpusBaseSchema.extend({
  version: z.literal('1.2'),
  searchMetrics: searchMetricsSchema,
});

export const corpusSchema = z.union([legacyCorpusSchema, currentCorpusSchema]) satisfies z.ZodType<CorpusInput>;
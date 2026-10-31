import { z } from 'zod';

const nonempty = z.string().min(1, 'Must not be empty');
export const itemIdSchema = nonempty.regex(/^[\p{L}\p{Nd}_-]+$/u,
  'Item id must contain only Unicode letters, digits, hyphens or underscores (no dots or spaces)');
const localizedTextSchema = z.record(nonempty, nonempty).refine(
  (value) => Object.keys(value).length > 0, 'At least one language is required');
const explanationSchema = z.object({ meaning: nonempty, example: z.string().optional() });
const explanationsSchema = z.record(nonempty, explanationSchema);

export const packSchema = z.object({
  schemaVersion: z.literal(1, { errorMap: () => ({ message: 'Unsupported schemaVersion; supported version is 1' }) }),
  id: nonempty.regex(/^[a-z0-9-]+$/, 'Pack id must match [a-z0-9-]+'),
  title: localizedTextSchema,
  lang: nonempty,
  dir: z.enum(['ltr', 'rtl']),
  author: nonempty,
  license: nonempty,
  source: nonempty,
  description: z.string().optional(),
});
export const itemSchema = z.object({
  id: itemIdSchema,
  term: nonempty,
  forms: z.array(z.string()).optional(),
  group: z.string().optional(),
  level: z.number().finite().optional(),
  explain: explanationsSchema,
});
export const itemsSchema = z.array(itemSchema);
export const segmentSchema = z.object({
  id: nonempty, ref: z.string().optional(), text: z.string(),
});
export const textSchema = z.object({
  id: nonempty,
  title: localizedTextSchema,
  ref: z.string().optional(),
  segments: z.array(segmentSchema),
});
export const annotationSchema = z.object({
  segment: nonempty,
  start: z.number().int('Offset must be an integer').nonnegative('Offset must be non-negative'),
  end: z.number().int('Offset must be an integer').nonnegative('Offset must be non-negative'),
  text: z.string().optional(),
  item: itemIdSchema,
  override: z.object({ explain: explanationsSchema }).optional(),
});
export const annotationsSchema = z.array(annotationSchema);
export const bindingSchema = z.object({
  path: nonempty,
  item: itemIdSchema.optional(),
  role: z.enum(['image', 'pronunciation', 'explanation', 'puzzle']),
  order: z.number().int().nonnegative().optional(),
  credit: z.string().optional(),
  license: z.string().optional(),
});
export const bindingsSchema = z.array(bindingSchema);
export const packContentsSchema = z.object({
  pack: packSchema,
  items: itemsSchema,
  texts: z.record(textSchema).default({}),
  annotations: z.record(annotationsSchema).default({}),
  bindings: bindingsSchema.default([]),
  assets: z.array(z.string()),
});

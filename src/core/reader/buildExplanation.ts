import { z } from 'zod';
import type { Annotation, Item, Segment } from '../pack/types';
import { annotationSchema, itemIdSchema, itemSchema } from '../pack/schema';
import { normalizeText } from '../binding/normalizeText';
import { alignAnnotations } from './annotations';
import { overlaps } from './spans';
import { tokenize } from './tokenize';
import type { ReaderAnnotation } from './linkTokens';
import type { Token } from './tokenize';

export interface ExplanationInput {
  segment: Segment;
  token: Token;
  items: readonly Item[];
  annotations: readonly ReaderAnnotation[];
  language: string;
  meaning: string;
  generateId?: (normalizedTerm: string) => string;
}
export type ExplanationError = 'emptyTerm' | 'duplicateTerm' | 'overlap' | 'invalid';
export type ExplanationResult = { ok: true; value: { item: Item; annotation: Annotation } }
  | { ok: false; errors: ExplanationError[] };

const formSchema = z.object({ language: z.string().trim().min(1), meaning: z.string().trim().min(1) });

export function buildExplanation(input: ExplanationInput): ExplanationResult {
  const { segment, token, items, annotations } = input;
  const form = formSchema.safeParse(input);
  const tokens = tokenize(segment.text);
  const original = tokens.find(entry => entry.start === token.start && entry.end === token.end);
  if (!form.success || !original || original.coreStart !== token.coreStart
    || original.coreEnd !== token.coreEnd || original.text !== token.text || original.kind !== token.kind) {
    return { ok: false, errors: ['invalid'] };
  }
  const term = segment.text.slice(token.coreStart, token.coreEnd);
  const normalized = normalizeText(term);
  if (!normalized) return { ok: false, errors: ['emptyTerm'] };
  if (token.kind !== 'word') return { ok: false, errors: ['invalid'] };
  if (items.some(item => [item.term, ...item.forms ?? []].some(value => normalizeText(value) === normalized))) {
    return { ok: false, errors: ['duplicateTerm'] };
  }
  // D036: copy tokenizer core boundaries; never derive offsets from trimmed text.
  const span = { start: token.coreStart, end: token.coreEnd };
  if (alignAnnotations(segment, tokens, annotations).aligned.some(entry => overlaps(entry.annotation, span))) {
    return { ok: false, errors: ['overlap'] };
  }
  try {
    const base = input.generateId?.(normalized) ?? (normalized.replace(/[^\p{L}\p{Nd}_-]+/gu, '-') || 'item');
    if (!itemIdSchema.safeParse(base).success) return { ok: false, errors: ['invalid'] };
    const ids = new Set(items.map(item => item.id));
    let id = base;
    for (let suffix = 2; ids.has(id); suffix++) id = `${base}-${suffix}`;
    const { language, meaning } = form.data;
    const item = itemSchema.safeParse({ id, term, explain: { [language]: { meaning } } });
    const annotation = annotationSchema.safeParse({ segment: segment.id, ...span, item: id });
    return item.success && annotation.success
      ? { ok: true, value: { item: item.data, annotation: annotation.data } }
      : { ok: false, errors: ['invalid'] };
  } catch {
    return { ok: false, errors: ['invalid'] };
  }
}

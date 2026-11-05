import type { Annotation, Item, Segment } from '../pack/types';
import { normalizeText } from '../binding/normalizeText';
import { tokenize, type Token } from './tokenize';
import { alignAnnotations } from './annotations';

export type ReaderAnnotation = Omit<Annotation, 'item'> & { item?: string };
export interface LinkedToken extends Token {
  itemId: string | null;
  override?: Annotation['override'];
}
export interface Collision { start: number; end: number; itemIds: string[] }
export interface ReaderWarning {
  start: number;
  end: number;
  reason: 'misaligned' | 'overlapping' | 'override-without-link';
}
export interface ReaderResult {
  tokens: LinkedToken[];
  collisions: Collision[];
  warnings: ReaderWarning[];
}

export function linkTokens(
  segment: Segment, items: readonly Item[], annotations: readonly ReaderAnnotation[] = [],
): ReaderResult {
  const collisions: Collision[] = [];
  const index = new Map<string, Set<string>>();
  for (const item of items) {
    for (const term of [item.term, ...item.forms ?? []]) {
      const key = normalizeText(term);
      if (!key) continue;
      const ids = index.get(key) ?? new Set<string>();
      ids.add(item.id);
      index.set(key, ids);
    }
  }
  const base = tokenize(segment.text);
  const { aligned, warnings } = alignAnnotations(segment, base, annotations);
  const tokens: LinkedToken[] = [];
  for (let i = 0; i < base.length; i++) {
    const entry = aligned.find((a) => a.first === i);
    const annotation = entry?.annotation;
    const first = base[i]!;
    const last = base[entry?.last ?? i]!;
    const token: Token = { ...first, end: last.end, coreEnd: last.coreEnd,
      text: segment.text.slice(first.start, last.end),
      kind: entry && entry.last > i ? 'phrase' : first.kind };
    // Core offsets serve annotation alignment; matching must retain meaningful marks.
    const key = normalizeText(token.text.replace(
      /^[\s\p{White_Space}\p{P}]+|[\s\p{White_Space}\p{P}]+$/gu, '',
    ));
    const ids = token.kind === 'mark' || !key ? [] : [...index.get(key) ?? []];
    const itemId = token.kind === 'mark' ? null
      : annotation?.item ?? (ids.length === 1 ? ids[0]! : null);
    if (!annotation?.item && ids.length > 1) {
      collisions.push({ start: token.start, end: token.end, itemIds: ids });
    }
    if (annotation?.override && !itemId) {
      warnings.push({ start: annotation.start, end: annotation.end, reason: 'override-without-link' });
    }
    tokens.push({ ...token, itemId, ...(annotation?.override ? { override: annotation.override } : {}) });
    i = entry?.last ?? i;
  }
  return { tokens, collisions, warnings };
}

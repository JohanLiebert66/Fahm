import type { Segment } from '../pack/types';
import type { ReaderAnnotation, ReaderWarning } from './linkTokens';
import { alignedRange, overlaps, validSpan } from './spans';
import type { Token } from './tokenize';

export interface AlignedAnnotation {
  first: number;
  last: number;
  annotation: ReaderAnnotation;
}

/** Work only on this segment; stable sorting preserves input order for tied starts. */
export function alignAnnotations(
  segment: Segment, tokens: readonly Token[], annotations: readonly ReaderAnnotation[],
): { aligned: AlignedAnnotation[]; warnings: ReaderWarning[] } {
  const aligned: AlignedAnnotation[] = [];
  const warnings: ReaderWarning[] = [];
  const candidates = annotations.filter((a) => a.segment === segment.id);
  for (const annotation of candidates.slice().sort((a, b) => a.start - b.start)) {
    const { start, end } = annotation;
    if (!validSpan(annotation, segment.text.length)) {
      warnings.push({ start, end, reason: 'misaligned' });
      continue;
    }
    if (aligned.some((a) => overlaps(a.annotation, annotation))) {
      warnings.push({ start, end, reason: 'overlapping' });
      continue;
    }
    const range = alignedRange(tokens, annotation);
    if (!range || annotation.text !== undefined && annotation.text !== segment.text.slice(start, end)) {
      warnings.push({ start, end, reason: 'misaligned' });
      continue;
    }
    // Disjoint source spans can still claim the same token through full/core edges.
    if (aligned.some((a) => range.first <= a.last && a.first <= range.last)) {
      warnings.push({ start, end, reason: 'overlapping' });
      continue;
    }
    aligned.push({ ...range, annotation });
  }
  return { aligned, warnings };
}

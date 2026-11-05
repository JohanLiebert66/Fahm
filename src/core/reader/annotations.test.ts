import { describe, expect, it } from 'vitest';
import enItems from '../../../tests/fixtures/en-vocab/items.json';
import arItems from '../../../tests/fixtures/ar-sample-text/items.json';
import { linkTokens, type ReaderAnnotation } from './linkTokens';

const segment = (text: string) => ({ id: '1', text });
const annotation = (start: number, end: number, item = 'chosen'): ReaderAnnotation =>
  ({ segment: '1', start, end, item });
const override = { explain: { en: { meaning: 'Invented occurrence explanation.' } } };

describe('reader annotations', () => {
  it('lets a quoted English core span win over a matching collision', () => {
    const result = linkTokens(segment('“pencil!”'), [...enItems,
      { id: 'duplicate', term: 'pencil', explain: {} }], [annotation(1, 7, 'bag')]);
    expect(result.tokens[0]).toMatchObject({ start: 0, end: 9, coreStart: 1, coreEnd: 7, itemId: 'bag' });
    expect(result.collisions).toEqual([]);
    expect(result.warnings).toEqual([]);
  });
  it.each(['core', 'full'])('accepts an Arabic word with attached pause sign by %s span', (span) => {
    const text = 'دفتري \u06dd';
    const end = span === 'core' ? text.indexOf(' ') : text.length;
    const result = linkTokens(segment(text), arItems, [annotation(0, end, 'طاولة')]);
    expect(result.tokens).toHaveLength(1);
    expect(result.tokens[0]).toMatchObject({ text, itemId: 'طاولة', coreEnd: 5 });
    expect(result.warnings).toEqual([]);
  });
  it.each([[0, 11], [1, 9], [0, 9], [1, 11]])(
    'merges a whole phrase with full/core boundaries %i..%i', (start, end) => {
      const text = '“red blue!” next';
      const result = linkTokens(segment(text), [], [annotation(start, end)]);
      expect(result.tokens).toHaveLength(2);
      expect(result.tokens[0]).toMatchObject({ start: 0, end: 11, coreStart: 1,
        coreEnd: 9, kind: 'phrase', text: text.slice(0, 11), itemId: 'chosen' });
      expect(result.warnings).toEqual([]);
    },
  );
  it('ignores cuts through words and reports the original offsets', () => {
    const result = linkTokens(segment('pencil bag'), enItems, [annotation(1, 6)]);
    expect(result.tokens.map((t) => t.itemId)).toEqual(['pencil', 'bag']);
    expect(result.warnings).toEqual([{ start: 1, end: 6, reason: 'misaligned' }]);
  });
  it('sorts without mutation, retaining the earlier overlapping annotation', () => {
    const annotations = [annotation(7, 10, 'bag'), annotation(0, 10, 'pencil')];
    const before = structuredClone(annotations);
    const result = linkTokens(segment('pencil bag'), enItems, annotations);
    expect(result.tokens).toHaveLength(1);
    expect(result.tokens[0]?.itemId).toBe('pencil');
    expect(result.warnings).toEqual([{ start: 7, end: 10, reason: 'overlapping' }]);
    expect(annotations).toEqual(before);
  });
  it('links an override-only annotation by normal matching', () => {
    const result = linkTokens(segment('pencil'), enItems, [{ segment: '1', start: 0, end: 6, override }]);
    expect(result.tokens[0]?.itemId).toBe('pencil');
    expect(result.tokens[0]?.override).toBe(override);
    expect(result.warnings).toEqual([]);
  });
  it.each([false, true])('reports override without a unique link (collision=%s)', (collision) => {
    const items = collision ? [{ id: 'a', term: 'invented', explain: {} },
      { id: 'b', term: 'invented', explain: {} }] : [];
    const result = linkTokens(segment('invented'), items, [{ segment: '1', start: 0, end: 8, override }]);
    expect(result.tokens[0]?.itemId).toBeNull();
    expect(result.tokens[0]?.override).toBe(override);
    expect(result.warnings).toEqual([{ start: 0, end: 8, reason: 'override-without-link' }]);
    expect(result.collisions).toHaveLength(collision ? 1 : 0);
  });
  it.each([[-1, 2], [0, 99], [2, 1], [0, 0], [0.5, 2], [NaN, 2], [0, Infinity]])(
    'ignores invalid offsets %s..%s without throwing', (start, end) => {
      const result = linkTokens(segment('pencil'), enItems, [annotation(start, end)]);
      expect(result.tokens[0]?.itemId).toBe('pencil');
      expect(result.warnings).toEqual([{ start, end, reason: 'misaligned' }]);
    },
  );
  it('keeps the first input annotation for tied starts and rejects later overlaps', () => {
    const result = linkTokens(segment('pencil bag'), enItems,
      [annotation(0, 6, 'bag'), annotation(0, 10, 'pencil')]);
    expect(result.tokens.map((t) => t.itemId)).toEqual(['bag', 'bag']);
    expect(result.warnings).toEqual([{ start: 0, end: 10, reason: 'overlapping' }]);
  });
  it('ignores foreign segments and bad source text without blocking a later valid annotation', () => {
    const result = linkTokens(segment('pencil'), enItems, [
      { ...annotation(0, 6), segment: 'other' },
      { ...annotation(0, 6), text: 'incorrect' }, annotation(0, 6, 'bag'),
    ]);
    expect(result.tokens[0]?.itemId).toBe('bag');
    expect(result.warnings).toEqual([{ start: 0, end: 6, reason: 'misaligned' }]);
  });
  it.each([[0, 7], [1, 9]])('rejects mixed full/core edges on one token: %i..%i', (start, end) => {
    const result = linkTokens(segment('“pencil!”'), enItems, [annotation(start, end)]);
    expect(result.tokens[0]?.itemId).toBe('pencil');
    expect(result.warnings).toEqual([{ start, end, reason: 'misaligned' }]);
  });
  it('keeps a first marks-only token non-linkable even with an explicit annotation', () => {
    const result = linkTokens(segment('! pencil'), enItems, [annotation(0, 1, 'bag')]);
    expect(result.tokens[0]).toMatchObject({ kind: 'mark', itemId: null, coreStart: 1, coreEnd: 1 });
  });
});

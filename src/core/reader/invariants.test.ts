import { describe, expect, it } from 'vitest';
import enItems from '../../../tests/fixtures/en-vocab/items.json';
import arItems from '../../../tests/fixtures/ar-sample-text/items.json';
import enText from '../../../tests/fixtures/en-vocab/texts/classroom.json';
import arText from '../../../tests/fixtures/ar-sample-text/texts/everyday.json';
import { linkTokens, type ReaderAnnotation } from './linkTokens';
import { tokenize } from './tokenize';
import type { Item, Segment } from '../pack/types';

function assertCoverage(text: string, tokens: ReturnType<typeof tokenize>) {
  const counts = Array<number>(text.length).fill(0);
  let previousEnd = 0;
  for (const token of tokens) {
    expect(token.text).toBe(text.slice(token.start, token.end));
    expect(token.start).toBeGreaterThanOrEqual(previousEnd);
    expect(token.end).toBeGreaterThan(token.start);
    expect(token.coreStart).toBeGreaterThanOrEqual(token.start);
    expect(token.coreEnd).toBeGreaterThanOrEqual(token.coreStart);
    expect(token.coreEnd).toBeLessThanOrEqual(token.end);
    for (let i = token.start; i < token.end; i++) counts[i]!++;
    previousEnd = token.end;
  }
  for (let i = 0; i < text.length; i++) {
    expect(counts[i]).toBeLessThanOrEqual(1);
    if (!/[\s\p{White_Space}]/u.test(text[i]!)) expect(counts[i]).toBe(1);
  }
}

function freezeInputs(value: object) {
  for (const child of Object.values(value)) {
    if (child && typeof child === 'object') freezeInputs(child);
  }
  Object.freeze(value);
}

describe('reader invariants', () => {
  it.each([enText, arText])('preserves all source characters in fixture $id', (text) => {
    for (const segment of text.segments) {
      assertCoverage(segment.text, tokenize(segment.text));
      assertCoverage(segment.text, linkTokens(segment, [...enItems, ...arItems]).tokens);
    }
  });
  it('covers deterministic Unicode combinations before and after phrase merging', () => {
    const words = ['pencil', 'دفتري', 'ab\u200bcd', '𐐀x', 'e\u0301'];
    const spaces = [' ', '\t', '\u00a0', '\u0085', '\u2003', '\u2028'];
    const suffixes = ['', '!', ' \u06dd', ' 🙂', ' \u0301', ' \u06d6 !'];
    for (const word of words) for (const space of spaces) for (const suffix of suffixes) {
      const text = `!${space}“${word}”${suffix}${space}next${space}`;
      const base = tokenize(text);
      assertCoverage(text, base);
      const first = base[1]!;
      const last = base.at(-1)!;
      const annotations = [{ segment: '1', start: first.coreStart, end: last.coreEnd, item: 'phrase' }];
      const result = linkTokens({ id: '1', text }, [], annotations);
      expect(result.tokens).toHaveLength(2);
      expect(result.warnings).toEqual([]);
      assertCoverage(text, result.tokens);
    }
  });
  it('uses identical logical offsets and behavior for equivalent LTR/RTL inputs', () => {
    const run = (word: string) => {
      const text = `“${word}!”\u00a0${word} \u06dd`;
      const result = linkTokens({ id: '1', text }, [{ id: 'same', term: word, explain: {} }]);
      assertCoverage(text, result.tokens);
      return result.tokens.map(({ text: _text, ...token }) => { void _text; return token; });
    };
    expect(run('abcde')).toEqual(run('دفتري'));
  });
  it('does not mutate frozen segment, items, annotation order or overrides', () => {
    const segment: Segment = { id: '1', text: '“pencil!” bag' };
    const items: Item[] = structuredClone(enItems);
    const annotations: ReaderAnnotation[] = [{ segment: '1', start: 10, end: 13, item: 'bag' },
      { segment: '1', start: 1, end: 7, override: { explain: { en: { meaning: 'Invented.' } } } }];
    const inputs = { segment, items, annotations };
    const before = structuredClone(inputs);
    freezeInputs(inputs);
    const first = linkTokens(segment, items, annotations);
    expect(linkTokens(segment, items, annotations)).toEqual(first);
    expect(inputs).toEqual(before);
    expect(first.tokens[0]?.override).toBe(annotations[1]?.override);
    assertCoverage(segment.text, first.tokens);
  });
  it('returns an empty result for a whitespace-only segment', () => {
    expect(linkTokens({ id: '1', text: '\u00a0\t\u0085' }, enItems)).toEqual({
      tokens: [], collisions: [], warnings: [],
    });
  });
});

import { describe, expect, it } from 'vitest';
import enItems from '../../../tests/fixtures/en-vocab/items.json';
import arItems from '../../../tests/fixtures/ar-sample-text/items.json';
import enText from '../../../tests/fixtures/en-vocab/texts/classroom.json';
import arText from '../../../tests/fixtures/ar-sample-text/texts/everyday.json';
import enAnnotations from '../../../tests/fixtures/en-vocab/annotations/classroom.json';
import arAnnotations from '../../../tests/fixtures/ar-sample-text/annotations/everyday.json';
import { linkTokens } from './linkTokens';

const segment = (text: string) => ({ id: '1', text });

describe('linkTokens matching', () => {
  it('links fixture terms and forms after edge stripping and normalization', () => {
    expect(linkTokens(enText.segments[0]!, enItems).tokens.map((t) => t.itemId))
      .toEqual([null, 'pencil', null, null, 'bag']);
    expect(linkTokens(arText.segments[0]!, arItems).tokens.map((t) => t.itemId))
      .toEqual(['دفتر', null, 'طاولة']);
    expect(linkTokens(segment('“PENCILS!” دفتري'), [...enItems, ...arItems]).tokens.map((t) => t.itemId))
      .toEqual(['pencil', 'دفتر']);
  });
  it('reports competing ids with full offsets, deduplicating term/forms for one item', () => {
    const items = [{ id: 'a', term: 'Café', forms: ['café', 'CAFÉ'], explain: {} },
      { id: 'b', term: 'other', forms: ['cafe\u0301'], explain: {} }];
    expect(linkTokens(segment('“CAFÉ!”'), items)).toMatchObject({
      tokens: [{ start: 0, end: 7, itemId: null }],
      collisions: [{ start: 0, end: 7, itemIds: ['a', 'b'] }], warnings: [],
    });
    expect(linkTokens(segment('CAFÉ'), items.slice(0, 1)).tokens[0]?.itemId).toBe('a');
  });
  it('never matches empty normalized text or an initial mark', () => {
    const result = linkTokens(segment('! \u0640 \u200b'), [{ id: 'empty', term: '\u0640', explain: {} }]);
    expect(result.tokens.every((token) => token.itemId === null)).toBe(true);
    expect(result.collisions).toEqual([]);
  });
  it('normalizes the display token for matching, not its mark-trimmed core', () => {
    const result = linkTokens(segment('“cafe\u0301!”'), [{ id: 'accent', term: 'café', explain: {} }]);
    expect(result.tokens[0]?.itemId).toBe('accent');
  });
  it('strips punctuation for matching without erasing meaningful symbols', () => {
    expect(linkTokens(segment('$pencil'), enItems).tokens[0]?.itemId).toBeNull();
    expect(linkTokens(segment('$pencil'), [{ id: 'priced', term: '$pencil', explain: {} }])
      .tokens[0]?.itemId).toBe('priced');
  });
  it('honors existing fixture annotations and preserves overrides unchanged', () => {
    const result = linkTokens(enText.segments[0]!, enItems, enAnnotations);
    expect(result.tokens.at(-1)?.override).toBe(enAnnotations[1]?.override);
    expect(result.warnings).toEqual([]);
    expect(linkTokens(arText.segments[0]!, arItems, arAnnotations).warnings).toEqual([]);
  });
});

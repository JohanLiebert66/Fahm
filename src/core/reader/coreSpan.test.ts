import { describe, expect, it } from 'vitest';
import { normalizeText } from '../binding/normalizeText';
import { linkTokens } from './linkTokens';
import { tokenize } from './tokenize';

const word = 'زوفل'; // Invented, non-religious word.
const attachedMarks = [
  ['dagger alef', '\u0670'], ['small high sign U+06E1', '\u06e1'],
  ['small high letter U+06E2', '\u06e2'], ['spacing mark Mc', '\u093e'],
  ['shadda and damma', '\u0651\u064f'],
] as const;

function coreText(text: string): string {
  const token = tokenize(text)[0]!;
  return text.slice(token.coreStart, token.coreEnd);
}

describe('reader core spans', () => {
  it.each(attachedMarks)('retains letter-attached %s inside the core', (_name, marks) => {
    expect(coreText(`${word}${marks}`)).toBe(`${word}${marks}`);
    expect(coreText(`${word}${marks} \u06dd`)).toBe(`${word}${marks}`);
  });
  it('excludes a directly attached U+06D6 pause sign but retains the vowel before it', () => {
    const text = `${word}\u064e\u06d6`;
    expect(coreText(text)).toBe(`${word}\u064e`);
    expect(tokenize(text)[0]).toMatchObject({ start: 0, end: text.length, coreEnd: text.length - 1 });
  });
  it('excludes every U+06D6–U+06DE sign directly attached to a vowel-final word', () => {
    for (let code = 0x06d6; code <= 0x06de; code++) {
      expect(coreText(`${word}\u064e${String.fromCodePoint(code)}`)).toBe(`${word}\u064e`);
    }
  });
  it('counts a supplementary base letter and its accent in UTF-16 units', () => {
    const text = '“𐐀\u0301!”';
    expect(coreText(text)).toBe('𐐀\u0301');
    expect(tokenize(text)[0]).toMatchObject({ coreStart: 1, coreEnd: 4 });
  });
  it.each(['\u064e', '\u0301', '\u093e'])(
    'trims a leading mark without a preceding base letter: %j', (mark) => {
      const text = `${mark}${word}\u064f`;
      expect(coreText(text)).toBe(`${word}\u064f`);
      expect(tokenize(text)[0]?.coreStart).toBe(mark.length);
    },
  );
  it('keeps a decomposed Latin accent inside the core after trimming punctuation', () => {
    expect(coreText('“zofle\u0301!”')).toBe('zofle\u0301');
  });
  it('attaches standalone combining marks to the full span only', () => {
    const text = `${word}\u064e \u0301 \u064f`;
    expect(coreText(text)).toBe(`${word}\u064e`);
    expect(tokenize(text)[0]).toMatchObject({ end: text.length, text });
  });
  it('does not attach a trailing mark across punctuation or a digit', () => {
    expect(coreText(`${word}!\u0301`)).toBe(word);
    expect(coreText('zofl7\u0301')).toBe('zofl7');
  });
  it('aligns an Arabic vowel-final core annotation before a standalone verse sign', () => {
    const text = `“${word}\u064e!” \u06dd`;
    const result = linkTokens({ id: '1', text }, [], [
      { segment: '1', start: 1, end: 1 + word.length + 1, item: 'explicit' },
    ]);
    expect(result.warnings).toEqual([]);
    expect(result.tokens[0]).toMatchObject({ itemId: 'explicit', coreStart: 1,
      coreEnd: 1 + word.length + 1, text });
  });
  it('rejects a former core annotation that now cuts off a word-final vowel', () => {
    const text = `${word}\u064e \u06dd`;
    const result = linkTokens({ id: '1', text }, [], [
      { segment: '1', start: 0, end: word.length, item: 'explicit' },
    ]);
    expect(result.tokens[0]?.itemId).toBeNull();
    expect(result.warnings).toEqual([{ start: 0, end: word.length, reason: 'misaligned' }]);
  });
});

const matchingCases = [
  { name: 'Arabic with directly attached pause', text: `${word}\u06d6`, term: word },
  { name: 'Arabic with standalone verse sign', text: `${word} \u06dd`, term: word },
  ...['\u064b', '\u064c', '\u064d', '\u064e', '\u064f', '\u0650', '\u0651', '\u0652']
    .map((mark) => ({ name: `Arabic final mark U+${mark.codePointAt(0)!.toString(16)}`,
      text: `${word}${mark}`, term: word })),
  { name: 'Latin edge punctuation', text: '“zofle!”', term: 'zofle' },
  { name: 'Latin decomposed accent', text: '“zofle\u0301!”', term: 'zoflé' },
];

describe('unchanged reader matching path', () => {
  it.each(matchingCases)('agrees with normalizeText(coreText) for $name', ({ text, term }) => {
    const items = [{ id: 'expected', term, explain: {} }];
    const expected = items.find((item) => normalizeText(item.term) === normalizeText(coreText(text)));
    expect(expected?.id).toBe('expected');
    expect(linkTokens({ id: '1', text }, items).tokens[0]?.itemId).toBe(expected?.id);
  });
});

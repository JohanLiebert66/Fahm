import { describe, expect, it } from 'vitest';
import { tokenize } from './tokenize';

const vowelEndings = [
  ['fatha', '\u064e'], ['damma', '\u064f'], ['kasra', '\u0650'],
  ['fathatan', '\u064b'], ['dammatan', '\u064c'], ['kasratan', '\u064d'],
  ['sukun', '\u0652'], ['shadda', '\u0651'],
] as const;
const standaloneSigns = [
  ['pause U+06D6', '\u06d6'], ['end-of-verse U+06DD', '\u06dd'],
  ['symbol U+06DE', '\u06de'],
] as const;

export function expectCoverage(text: string, tokens: { start: number; end: number; text: string }[]) {
  const counts = Array<number>(text.length).fill(0);
  for (const token of tokens) {
    expect(token.text).toBe(text.slice(token.start, token.end));
    for (let i = token.start; i < token.end; i++) counts[i]!++;
  }
  for (let i = 0; i < text.length; i++) {
    expect(counts[i]).toBeLessThanOrEqual(1);
    if (!/[\s\p{White_Space}]/u.test(text[i]!)) expect(counts[i]).toBe(1);
  }
}

describe('tokenize', () => {
  it.each(vowelEndings)('keeps word-final %s inside the core span', (_name, vowel) => {
    const word = `زوفل${vowel}`; // Invented, non-religious word.
    const tokens = tokenize(word);
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toMatchObject({ start: 0, end: word.length,
      coreStart: 0, coreEnd: word.length, text: word, kind: 'word' });
    expectCoverage(word, tokens);
  });
  it.each(vowelEndings.flatMap(([name, vowel]) => standaloneSigns.map(([signName, sign]) =>
    ({ name, vowel, signName, sign }))))(
    'keeps word-final $name inside the core while excluding attached standalone $signName',
    ({ vowel, sign }) => {
      const word = `زوفل${vowel}`; // Invented, non-religious word.
      const text = `${word} ${sign}`;
      const tokens = tokenize(text);
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toMatchObject({ start: 0, end: text.length,
        coreStart: 0, coreEnd: word.length, text, kind: 'word' });
      expect(text.slice(tokens[0]!.coreStart, tokens[0]!.coreEnd)).toBe(word);
      expect(text.slice(tokens[0]!.coreEnd)).toBe(` ${sign}`);
      expectCoverage(text, tokens);
    },
  );
  it('preserves UTF-16 slices, Unicode whitespace and interior zero-width characters', () => {
    const text = '  “ab\u200Bcd!”\u00A0\u0085𐐀z\nnext';
    const tokens = tokenize(text);
    expect(tokens.map((token) => token.text)).toEqual(['“ab\u200Bcd!”', '𐐀z', 'next']);
    expect(tokens[0]).toMatchObject({ start: 2, coreStart: 3, coreEnd: 8, kind: 'word' });
    expectCoverage(text, tokens);
  });
  it('attaches marks and symbols including every U+06D6–U+06DE sign', () => {
    for (let code = 0x06d6; code <= 0x06de; code++) {
      const text = `! دفتر ${String.fromCodePoint(code)} 🙂 \u0301 next`;
      const tokens = tokenize(text);
      expect(tokens.map((token) => token.kind)).toEqual(['mark', 'word', 'word']);
      expect(tokens[1]).toMatchObject({ start: 2, coreStart: 2, coreEnd: 6, end: 13 });
      expectCoverage(text, tokens);
    }
  });
  it.each(['', ' \t\r\n\u00a0\u0085\u2003\u2028\u2029\ufeff'])('has no whitespace tokens: %j', (text) => {
    expect(tokenize(text)).toEqual([]);
  });
});

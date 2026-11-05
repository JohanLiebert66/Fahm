import { describe, expect, it } from 'vitest';
import { normalizeFilenameStem, normalizeText } from './normalizeText';

// All word-like inputs are synthetic; no source texts or religious phrases.
const ARABIC_DIACRITICS = { start: 0x064b, end: 0x065f }; // Inclusive removal range.
const QURANIC_MARKS = { start: 0x06d6, end: 0x06ed }; // Inclusive removal range.
const DAGGER_ALEF = '\u0670'; // Arabic letter superscript alef.
const TATWEEL = '\u0640'; // Arabic elongation character.
const FATHA = '\u064e'; // Arabic vowel mark.
const DAMMA = '\u064f'; // Arabic vowel mark.
const KASRA = '\u0650'; // Arabic vowel mark.
const SHADDA = '\u0651'; // Arabic consonant-doubling mark.
const SUKUN = '\u0652'; // Arabic absence-of-vowel mark.
const ALEF_HAMZA_ABOVE = '\u0623'; // Alef with hamza above.
const ALEF_HAMZA_BELOW = '\u0625'; // Alef with hamza below.
const ALEF_MADDA = '\u0622'; // Alef with madda above.
const ALEF_WASLA = '\u0671'; // Alef wasla.
const HAMZA_ABOVE = '\u0654'; // Combining hamza above.
const HAMZA_BELOW = '\u0655'; // Combining hamza below.
const MADDA_ABOVE = '\u0653'; // Combining madda above.
const WAW_HAMZA = '\u0624'; // Waw with hamza above; not unified.
const ACUTE_ACCENT = '\u0301'; // Combining acute, retained via NFC composition.
const ALEF_VARIANTS = [ALEF_HAMZA_ABOVE, ALEF_HAMZA_BELOW, ALEF_MADDA, ALEF_WASLA];
const WHITESPACE_CONTROLS = { start: 0x0009, end: 0x000d }; // Tab through carriage return.
const UNICODE_SPACES = { start: 0x2000, end: 0x200a }; // En quad through hair space.
const OTHER_WHITESPACE = {
  SPACE: ' ', NEXT_LINE: '\u0085', NO_BREAK_SPACE: '\u00a0', OGHAM_SPACE: '\u1680',
  LINE_SEPARATOR: '\u2028', PARAGRAPH_SEPARATOR: '\u2029', NARROW_NO_BREAK_SPACE: '\u202f',
  MEDIUM_MATH_SPACE: '\u205f', IDEOGRAPHIC_SPACE: '\u3000',
}; // Named Unicode White_Space characters; BOM is stripped before separator collapsing.
const ARABIC_LETTER_MARK = '\u061c'; // Invisible Arabic direction mark.
const ZERO_WIDTH_AND_DIRECTION_MARKS = { start: 0x200b, end: 0x200f }; // Inclusive format range.
const BIDI_EMBEDDINGS_AND_OVERRIDES = { start: 0x202a, end: 0x202e }; // Inclusive format range.
const BIDI_ISOLATES = { start: 0x2066, end: 0x2069 }; // Inclusive format range.
const BOM = '\ufeff'; // Byte order mark / zero-width no-break space; stripped, not a separator.
const UNDERSCORE = '_'; // U+005F, a separator.
const HYPHEN = '-'; // U+002D, a separator and the canonical replacement.
const OUT_OF_SPEC_MARKS = { start: 0x0610, end: 0x061a }; // Deliberately retained Arabic marks.
const RETAINED_HIGH_ZAIN = '\u0617'; // Arabic small high zain; retained by the spec.
const RETAINED_SMALL_DAMMA = '\u0619'; // Arabic small damma; retained by the spec.
const REMOVED_SMALL_WAW = '\u06e5'; // Arabic small waw; inside the removal range.
const ARABIC_INDIC_DIGITS = { start: 0x0660, end: 0x0669 }; // Not converted to Latin digits.
const REMOVAL_BOUNDARIES = {
  YEH: '\u064a', DOTLESS_QAF: '\u066f', AE: '\u06d5', DAL_WITH_INVERTED_V: '\u06ee',
}; // Characters immediately outside removal ranges; alef wasla is tested separately.
const OTHER_RETAINED_CHARACTERS = {
  WORD_JOINER: '\u2060', INHIBIT_SYMMETRIC_SWAPPING: '\u206a',
  ARABIC_OPEN_FATHATAN: '\u08f0', EN_DASH: '\u2013',
}; // Not whitespace/separators or members of the specified removal ranges.

function charactersIn({ start, end }: { start: number; end: number }): string[] {
  return Array.from({ length: end - start + 1 }, (_, index) => String.fromCodePoint(start + index));
}

const INVISIBLE_FORMAT_CHARACTERS = [
  ARABIC_LETTER_MARK, ...charactersIn(ZERO_WIDTH_AND_DIRECTION_MARKS),
  ...charactersIn(BIDI_EMBEDDINGS_AND_OVERRIDES), ...charactersIn(BIDI_ISOLATES), BOM,
];
const REMOVED_CHARACTERS = [
  ...charactersIn(ARABIC_DIACRITICS), DAGGER_ALEF, ...charactersIn(QURANIC_MARKS), TATWEEL,
  ...INVISIBLE_FORMAT_CHARACTERS,
];
const SEPARATORS = [
  ...charactersIn(WHITESPACE_CONTROLS), ...charactersIn(UNICODE_SPACES),
  ...Object.values(OTHER_WHITESPACE), UNDERSCORE, HYPHEN,
];
const RETAINED_CHARACTERS = [
  ...charactersIn(OUT_OF_SPEC_MARKS), ...charactersIn(ARABIC_INDIC_DIGITS),
  ...Object.values(REMOVAL_BOUNDARIES), ...Object.values(OTHER_RETAINED_CHARACTERS),
];

function generatedInputs(): string[] {
  const alphabet = [...'بزوفيىهةاBEXZUPbexzupIÉé0123456789', ...REMOVED_CHARACTERS,
    ...ALEF_VARIANTS, ...SEPARATORS, ...RETAINED_CHARACTERS];
  const SAMPLE_COUNT = 1024;
  const MAX_LENGTH = 64;
  const LCG_MULTIPLIER = 1664525; // Fixed 32-bit linear congruential generator parameters.
  const LCG_INCREMENT = 1013904223;
  let seed = 0x008fa; // Fixed deterministic seed for reproducible synthetic inputs.
  const next = (limit: number) => {
    seed = (Math.imul(seed, LCG_MULTIPLIER) + LCG_INCREMENT) >>> 0;
    return seed % limit;
  };
  return Array.from({ length: SAMPLE_COUNT }, (_, index) => {
    // Cycling the prefix guarantees coverage of EVERY alphabet member, not just likely coverage.
    const prefix = alphabet[index % alphabet.length]!;
    return prefix + Array.from({ length: next(MAX_LENGTH) }, () => alphabet[next(alphabet.length)]!).join('');
  });
}

describe.each([
  { name: 'normalizeText', normalize: normalizeText },
  { name: 'normalizeFilenameStem', normalize: normalizeFilenameStem },
])('$name', ({ normalize }) => {
  it.each(REMOVED_CHARACTERS.map((mark) => ({ codepoint: mark.codePointAt(0), mark })))(
    'removes specified character $codepoint inside an invented word', ({ mark }) => {
      expect(normalize(`ب${mark}زو`)).toBe(normalize('بزو'));
      expect(normalize(`BEX${mark}ZUP`)).toBe('bexzup');
      expect(normalize(`a ${mark} b`)).toBe('a-b');
      expect(normalize(mark)).toBe('');
    },
  );

  it.each([FATHA, DAMMA, KASRA, SUKUN])('removes either shadda/vowel ordering (%j)', (vowel) => {
    expect(normalize(`ب${SHADDA}${vowel}زو`)).toBe('بزو');
    expect(normalize(`ب${vowel}${SHADDA}زو`)).toBe('بزو');
  });

  it('returns empty for empty input and for marks/tatweel/invisible formats only', () => {
    expect(normalize('')).toBe('');
    expect(normalize(REMOVED_CHARACTERS.join(''))).toBe('');
    expect(normalize(INVISIBLE_FORMAT_CHARACTERS.join(''))).toBe('');
  });

  it.each(ALEF_VARIANTS)('unifies alef variant %j in an invented word', (alef) => {
    expect(normalize(`${alef}بزو`)).toBe('ابزو');
  });

  it.each([HAMZA_ABOVE, MADDA_ABOVE, HAMZA_BELOW])('normalizes decomposed alef %j', (mark) => {
    expect(normalize(`ا${mark}بزو`)).toBe('ابزو');
    expect(normalize(`ا${mark}بزو`.normalize('NFD'))).toBe('ابزو');
  });

  it('applies NFC before removal and preserves composed characters outside the alef list', () => {
    expect(normalize(`و${HAMZA_ABOVE}زو`)).toBe(`${WAW_HAMZA}زو`);
    expect(normalize(`zupe${ACUTE_ACCENT}`)).toBe('zupé');
    expect(normalize('zupé'.normalize('NFD'))).toBe(normalize('zupé'));
  });

  it('uses locale-independent lowercasing with mixed synthetic Arabic/Latin input', () => {
    expect(normalize(`BEX_I_${ALEF_WASLA}ب${FATHA}زو_ZUPÉ`)).toBe('bex-i-ابزو-zupé');
  });

  it('lowercases Latin letters only, preserving non-Latin case', () => {
    expect(normalize('BEX_Ω_Ж_Ա_ǅ')).toBe('bex-Ω-Ж-Ա-ǆ');
  });

  it.each([
    ['', ''], ['بزو', 'بزو'], [`ب${SHADDA}${FATHA}زو`, 'بزو'],
    [`${ALEF_WASLA}بزو`, 'ابزو'], ['BEX_ZUP', 'bex-zup'], ['ZUPÉ', 'zupé'],
    ['zupé'.normalize('NFD'), 'zupé'], [`a ${FATHA} b`, 'a-b'],
    [' __بزو-BEX__ ', 'بزو-bex'], ['بزو١٢٣', 'بزو١٢٣'],
  ] as const)('keeps the established ordinary four-step output for %j', (input, expected) => {
    expect(normalize(input)).toBe(expected);
  });

  it('normalizes composed and decomposed waw with hamza identically', () => {
    const composed = `${WAW_HAMZA}بزو`;
    const decomposed = `و${HAMZA_ABOVE}بزو`;
    expect(normalize(composed)).toBe(composed);
    expect(normalize(decomposed)).toBe(normalize(composed));
  });

  it('recomposes a Latin letter exposed by mark removal', () => {
    expect(normalize(`e${HAMZA_ABOVE}${ACUTE_ACCENT}`)).toBe('é');
  });

  it.each(SEPARATORS)('collapses separator %j and removes it at either edge', (separator) => {
    expect(normalize(`${separator}BEX${separator.repeat(3)}ZUP${separator}`)).toBe('bex-zup');
    expect(normalize(separator.repeat(3))).toBe('');
  });

  it('removes marks before collapsing mixed separators and trimming separator edges', () => {
    expect(normalize(` __BEX _-- ${FATHA} ${TATWEEL} ZUP-__ `)).toBe('bex-zup');
    expect(normalize(`a ${REMOVED_CHARACTERS[0]} b`)).toBe('a-b');
    expect(normalize(`${SHADDA}__ ${DAGGER_ALEF} -${FATHA}`)).toBe('');
    expect(normalize(`${SEPARATORS.join('')}بزو${SEPARATORS.join('')}`)).toBe('بزو');
  });

  it.each(RETAINED_CHARACTERS.map((character) => ({ codepoint: character.codePointAt(0), character })))(
    'retains out-of-spec character $codepoint without stripping/conversion', ({ character }) => {
      expect(normalize(`ب${character}زو`)).toBe(`ب${character}زو`);
      expect(normalize(character)).toBe(character);
    },
  );

  it('keeps yeh/alef maqsura and teh marbuta/heh distinct', () => {
    expect(normalize('بزي بزى فزة فزه')).toBe('بزي-بزى-فزة-فزه');
  });

  it('does not strip punctuation or interpret filename extensions/paths', () => {
    expect(normalize('!بزو،bex.2/7\\9:؟')).toBe('!بزو،bex.2/7\\9:؟');
    expect(normalize('BEX.2.PNG')).toBe('bex.2.png');
  });

  it('is idempotent for deterministic seeded strings covering every alphabet member', () => {
    for (const input of generatedInputs()) {
      const once = normalize(input);
      expect(normalize(once), JSON.stringify(input)).toBe(once);
      expect(once).toBe(once.normalize('NFC'));
    }
  });

  it('is idempotent when removal brings retained combining marks together', () => {
    const input = `${RETAINED_HIGH_ZAIN}${REMOVED_SMALL_WAW}${RETAINED_SMALL_DAMMA}`;
    const once = normalize(input);
    expect(once).toBe(`${RETAINED_SMALL_DAMMA}${RETAINED_HIGH_ZAIN}`);
    expect(normalize(once)).toBe(once);
  });
});

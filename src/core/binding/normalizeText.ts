// Inclusive ranges specified by PACK_SPEC; no broader Unicode mark stripping.
const ARABIC_DIACRITICS_RANGE = '\u064B-\u065F';
const QURANIC_MARKS_RANGE = '\u06D6-\u06ED';
const DAGGER_ALEF = '\u0670'; // Arabic letter superscript alef.
const TATWEEL = '\u0640'; // Arabic elongation character.
const ARABIC_LETTER_MARK = '\u061C'; // Invisible Arabic direction mark.
const ZERO_WIDTH_AND_DIRECTION_MARKS_RANGE = '\u200B-\u200F'; // Zero-width/joining/direction marks.
const BIDI_EMBEDDINGS_AND_OVERRIDES_RANGE = '\u202A-\u202E'; // Direction embeddings/overrides.
const BIDI_ISOLATES_RANGE = '\u2066-\u2069'; // Direction isolates and their terminator.
const BOM = '\uFEFF'; // Byte order mark / zero-width no-break space; stripped, not a separator.
const ALEF_HAMZA_ABOVE = '\u0623'; // Alef with hamza above.
const ALEF_HAMZA_BELOW = '\u0625'; // Alef with hamza below.
const ALEF_MADDA = '\u0622'; // Alef with madda above.
const ALEF_WASLA = '\u0671'; // Alef wasla.
const PLAIN_ALEF = '\u0627'; // Replacement for the four specified alef forms.
const UNICODE_WHITESPACE = String.raw`\s\p{White_Space}`; // Includes NBSP, NEL and ECMAScript BOM.
const UNDERSCORE = '_'; // U+005F, a separator.
const HYPHEN = '-'; // U+002D, a separator and the canonical replacement.
const REMOVABLE_MARKS = new RegExp(
  `[${ARABIC_DIACRITICS_RANGE}${DAGGER_ALEF}${QURANIC_MARKS_RANGE}${TATWEEL}]`, 'gu',
);
const INVISIBLE_FORMAT_CHARACTERS = new RegExp(
  `[${ARABIC_LETTER_MARK}${ZERO_WIDTH_AND_DIRECTION_MARKS_RANGE}`
  + `${BIDI_EMBEDDINGS_AND_OVERRIDES_RANGE}${BIDI_ISOLATES_RANGE}${BOM}]`, 'gu',
);
const ALEF_VARIANTS = new RegExp(
  `[${ALEF_HAMZA_ABOVE}${ALEF_HAMZA_BELOW}${ALEF_MADDA}${ALEF_WASLA}]`, 'gu',
);
const SEPARATOR_RUN = new RegExp(`[${UNICODE_WHITESPACE}${UNDERSCORE}${HYPHEN}]+`, 'gu');
const EDGE_SEPARATORS = new RegExp(`^${HYPHEN}|${HYPHEN}$`, 'gu');
const LATIN_LETTERS = /(?=\p{Letter})\p{Script=Latin}/gu; // Only Latin-script letters change case.

/** Matching only, never display. Empty output (e.g. marks only) means callers must use "no match". */
export function normalizeText(text: string): string {
  return text
    .normalize('NFC')
    .replace(REMOVABLE_MARKS, '')
    .replace(INVISIBLE_FORMAT_CHARACTERS, '')
    .replace(ALEF_VARIANTS, PLAIN_ALEF)
    .replace(LATIN_LETTERS, (letter) => letter.toLowerCase())
    .replace(SEPARATOR_RUN, HYPHEN)
    .replace(EDGE_SEPARATORS, '')
    // Removing marks can leave adjacent combining marks out of canonical order (D034).
    .normalize('NFC');
}

/** The caller supplies the stem already cut at the first dot; no path/extension handling. */
export function normalizeFilenameStem(stem: string): string {
  return normalizeText(stem);
}

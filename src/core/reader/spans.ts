export interface Span { start: number; end: number }

export function validSpan(span: Span, length: number): boolean {
  return Number.isSafeInteger(span.start) && Number.isSafeInteger(span.end)
    && span.start >= 0 && span.end <= length && span.start < span.end;
}

export function overlaps(a: Span, b: Span): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Single-token spans must be exactly full or core; phrases may mix edges. */
export function alignedRange(
  tokens: readonly (Span & { coreStart: number; coreEnd: number })[], span: Span,
): { first: number; last: number } | undefined {
  const first = tokens.findIndex((t) => span.start === t.start || span.start === t.coreStart);
  const last = tokens.findIndex((t) => span.end === t.end || span.end === t.coreEnd);
  if (first < 0 || last < first) return;
  const token = tokens[first]!;
  if (first === last && !(span.start === token.start && span.end === token.end)
    && !(span.start === token.coreStart && span.end === token.coreEnd)) return;
  return { first, last };
}

// Always trim these pause/verse signs, even after a base; U+06DD is a format character.
const PAUSE_AND_VERSE_SIGNS_RANGE = '\u06D6-\u06DE';
const PAUSE_OR_VERSE_SIGN = new RegExp(`[${PAUSE_AND_VERSE_SIGNS_RANGE}]`, 'u');
const MARK_ONLY = new RegExp(String.raw`^[\p{M}\p{P}\p{S}${PAUSE_AND_VERSE_SIGNS_RANGE}]+$`, 'u');
const BASE_LETTER = /\p{L}/u;
const COMBINING_MARK = /[\p{Mn}\p{Mc}]/u;
const TRIMMABLE_EDGE = /[\s\p{White_Space}\p{M}\p{P}\p{S}]/u;

export function isMark(text: string): boolean {
  return MARK_ONLY.test(text);
}

/** Empty cores are represented by equal offsets at the full span's end. */
export function coreSpan(text: string, { start, end }: Span): { coreStart: number; coreEnd: number } {
  let coreStart = end;
  let coreEnd = end;
  let offset = start;
  let hasBaseLetter = false;
  for (const character of text.slice(start, end)) {
    const sign = PAUSE_OR_VERSE_SIGN.test(character);
    const combining = COMBINING_MARK.test(character);
    const keep = !sign && (combining ? hasBaseLetter : !TRIMMABLE_EDGE.test(character));
    if (keep) {
      if (coreStart === end) coreStart = offset;
      coreEnd = offset + character.length;
    }
    // Whitespace breaks attachment, so standalone marks can extend only the full span.
    hasBaseLetter = !sign && (BASE_LETTER.test(character) || combining && hasBaseLetter);
    offset += character.length;
  }
  return { coreStart, coreEnd };
}

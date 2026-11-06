export type SourceSegment =
  | { type: 'text'; text: string }
  | { type: 'link'; text: string; url: string };

const URL_REGEX = /https?:\/\/[^\s]+/g;
const TRAILING_PUNCT_REGEX = /[.,;:!?]+$/;

/**
 * Splits a pack source string into plain text and http(s) URL segments.
 * Preserves exact text as stored, trims trailing punctuation from URLs,
 * and ignores unsupported schemes (e.g. javascript:, data:).
 */
export function parseSourceSegments(source: string): SourceSegment[] {
  if (!source) {
    return [];
  }

  const segments: SourceSegment[] = [];
  let lastIndex = 0;

  function addText(text: string) {
    if (!text) return;
    const last = segments[segments.length - 1];
    if (last && last.type === 'text') {
      last.text += text;
    } else {
      segments.push({ type: 'text', text });
    }
  }

  for (const match of source.matchAll(URL_REGEX)) {
    const matchIndex = match.index;
    const rawMatch = match[0];

    if (matchIndex > lastIndex) {
      addText(source.slice(lastIndex, matchIndex));
    }

    const punctMatch = rawMatch.match(TRAILING_PUNCT_REGEX);
    let urlText = rawMatch;
    let trailingPunct = '';

    if (punctMatch) {
      trailingPunct = punctMatch[0];
      urlText = rawMatch.slice(0, rawMatch.length - trailingPunct.length);
    }

    let isValid = false;
    try {
      const parsed = new URL(urlText);
      isValid = parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      isValid = false;
    }

    if (isValid) {
      segments.push({
        type: 'link',
        text: urlText,
        url: urlText,
      });
      if (trailingPunct) {
        addText(trailingPunct);
      }
    } else {
      addText(rawMatch);
    }

    lastIndex = matchIndex + rawMatch.length;
  }

  if (lastIndex < source.length) {
    addText(source.slice(lastIndex));
  }

  return segments;
}

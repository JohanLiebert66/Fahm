import { coreSpan, isMark } from './spans';

export interface Token {
  start: number;
  end: number;
  coreStart: number;
  coreEnd: number;
  text: string;
  kind: 'word' | 'phrase' | 'mark';
}

export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  for (const match of text.matchAll(/[^\s\p{White_Space}]+/gu)) {
    const start = match.index;
    const end = start + match[0].length;
    const mark = isMark(match[0]);
    const previous = tokens.at(-1);
    if (mark && previous) {
      previous.end = end;
      previous.text = text.slice(previous.start, end);
      Object.assign(previous, coreSpan(text, previous));
    } else {
      tokens.push({ start, end, ...coreSpan(text, { start, end }),
        text: text.slice(start, end), kind: mark ? 'mark' : 'word' });
    }
  }
  return tokens;
}

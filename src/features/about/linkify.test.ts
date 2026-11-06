import { describe, it, expect } from 'vitest';
import { parseSourceSegments } from './linkify';

describe('parseSourceSegments', () => {
  it('handles empty string', () => {
    expect(parseSourceSegments('')).toEqual([]);
  });

  it('handles plain text without URLs', () => {
    const result = parseSourceSegments('Invented plain source without links');
    expect(result).toEqual([
      { type: 'text', text: 'Invented plain source without links' },
    ]);
  });

  it('handles URL only', () => {
    const result = parseSourceSegments('https://example.org');
    expect(result).toEqual([
      { type: 'link', text: 'https://example.org', url: 'https://example.org' },
    ]);
  });

  it('handles text + URL', () => {
    const result = parseSourceSegments('Example Org - https://example.org');
    expect(result).toEqual([
      { type: 'text', text: 'Example Org - ' },
      { type: 'link', text: 'https://example.org', url: 'https://example.org' },
    ]);
  });

  it('handles two URLs', () => {
    const result = parseSourceSegments('https://alpha.example.com and https://beta.example.com');
    expect(result).toEqual([
      { type: 'link', text: 'https://alpha.example.com', url: 'https://alpha.example.com' },
      { type: 'text', text: ' and ' },
      { type: 'link', text: 'https://beta.example.com', url: 'https://beta.example.com' },
    ]);
  });

  it('excludes trailing period from URL', () => {
    const result = parseSourceSegments('Visit https://example.org.');
    expect(result).toEqual([
      { type: 'text', text: 'Visit ' },
      { type: 'link', text: 'https://example.org', url: 'https://example.org' },
      { type: 'text', text: '.' },
    ]);
  });

  it('excludes trailing comma from URL', () => {
    const result = parseSourceSegments('See https://example.org, for details');
    expect(result).toEqual([
      { type: 'text', text: 'See ' },
      { type: 'link', text: 'https://example.org', url: 'https://example.org' },
      { type: 'text', text: ', for details' },
    ]);
  });

  it('does not link javascript: or data: schemes', () => {
    const jsResult = parseSourceSegments('javascript:alert(1)');
    expect(jsResult).toEqual([
      { type: 'text', text: 'javascript:alert(1)' },
    ]);

    const dataResult = parseSourceSegments('data:text/plain;base64,SGVsbG8=');
    expect(dataResult).toEqual([
      { type: 'text', text: 'data:text/plain;base64,SGVsbG8=' },
    ]);
  });

  it('preserves exact stored text when reconstructing segments', () => {
    const input = 'Source by Example Org (https://example.org), updated.';
    const result = parseSourceSegments(input);
    const reconstructed = result.map((s) => s.text).join('');
    expect(reconstructed).toBe(input);
  });
});

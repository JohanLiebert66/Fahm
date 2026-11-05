import { describe, expect, it } from 'vitest';
import { defaultPackLimits, entryByteLimit, resolveLimits } from './limits';

describe('pack limits', () => {
  it('provides the specified bounded import defaults', () => {
    const expected = {
      entries: 2000, totalBytes: 262144000, imageBytes: 5242880, audioBytes: 10485760,
    };
    expect(defaultPackLimits).toEqual(expected);
    expect(resolveLimits()).toEqual(expected);
  });

  it('merges caller overrides without mutating defaults', () => {
    const overrides = { entries: 3, totalBytes: 123, imageBytes: 12, audioBytes: 24 };
    expect(resolveLimits(overrides)).toEqual(overrides);
    expect(resolveLimits({ entries: 4 })).toEqual({ ...defaultPackLimits, entries: 4 });
    expect(defaultPackLimits.entries).toBe(2000);
  });

  it.each([NaN, Infinity, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, undefined])(
    'uses safe defaults for invalid override %s without throwing', (invalid) => {
      expect(resolveLimits({ entries: invalid, imageBytes: invalid })).toEqual(defaultPackLimits);
      expect(resolveLimits({ entries: invalid, audioBytes: 8 })).toEqual({
        ...defaultPackLimits, audioBytes: 8,
      });
    },
  );

  it.each([
    ['images/card.png', 'imageBytes'], ['puzzles/scene.jpg', 'imageBytes'],
    ['audio/card.mp3', 'audioBytes'], ['texts/story.json', 'totalBytes'],
    ['pack.json', 'totalBytes'], ['images-other/card.png', 'totalBytes'],
  ] as const)('selects the byte bound for %s', (path, key) => {
    const limits = resolveLimits({ totalBytes: 30, imageBytes: 10, audioBytes: 20 });
    expect(entryByteLimit(path, limits)).toBe(limits[key]);
  });

  it('supports zero as an explicit deny-all limit', () => {
    expect(resolveLimits({ entries: 0 }).entries).toBe(0);
  });

  it('allows stricter overrides but never raises the mandated hard ceilings', () => {
    const raised = Object.fromEntries(Object.entries(defaultPackLimits).map(([key, value]) => [key, value + 1]));
    expect(resolveLimits(raised)).toEqual(defaultPackLimits);
    expect(resolveLimits({ imageBytes: defaultPackLimits.imageBytes + 1, audioBytes: 12 }))
      .toEqual({ ...defaultPackLimits, audioBytes: 12 });
  });
});

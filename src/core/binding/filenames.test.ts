import { describe, expect, it } from 'vitest';
import { extensionFromMime, filenameBinding, mimeFromPath, normalizePackPaths } from './filenames';

const mediaPairs = [
  ['png', 'image/png'], ['jpg', 'image/jpeg'], ['gif', 'image/gif'], ['webp', 'image/webp'],
  ['svg', 'image/svg+xml'], ['avif', 'image/avif'], ['mp3', 'audio/mpeg'], ['m4a', 'audio/mp4'],
  ['webm', 'audio/webm'], ['ogg', 'audio/ogg'], ['wav', 'audio/wav'], ['json', 'application/json'],
];

describe('MIME conversions', () => {
  it.each(mediaPairs)('derives export extension %s from its MIME, stripping parameters', (ext, mime) => {
    expect(extensionFromMime(` ${mime?.toUpperCase()}; codecs=opus `)).toBe(ext);
  });
  it.each(['', 'video/webm', 'application/octet-stream', 'audio/mp3', '__proto__'])(
    'does not relabel unsupported MIME %s', (mime) => expect(extensionFromMime(mime)).toBeUndefined(),
  );
  it.each(mediaPairs)('maps extension %s to its MIME without relabelling', (ext, mime) => {
    expect(mimeFromPath(`assets/Card.${ext?.toUpperCase()}`)).toBe(mime);
  });
  it('recognizes the alternate JPEG extension', () => {
    expect(mimeFromPath('images/card.jpeg')).toBe('image/jpeg');
  });
  it.each(['images/card.exe', 'images/card', 'audio/card.mp4', 'images/png/', '__proto__'])(
    'leaves unsupported paths unmatched: %s', (path) => expect(mimeFromPath(path)).toBeUndefined(),
  );
});

describe('filenameBinding', () => {
  const itemIds = new Set(['card', 'card_2', 'Card', 'Café']);
  it.each(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif'])(
    'binds puzzle format %s without any item match', (ext) => {
      const path = `puzzles/unrelated.scene.${ext}`;
      expect(filenameBinding(path, new Set())).toEqual({ path, role: 'puzzle' });
    },
  );
  it.each(['puzzles/scene.mp3', 'puzzles/scene.exe', 'puzzles/', 'texts/card.json'])(
    'leaves non-image puzzle or non-asset %s unbound', (path) => {
      expect(filenameBinding(path, itemIds)).toBeUndefined();
    },
  );
  it.each([
    ['audio/card.mp3', 'pronunciation'], ['audio/card.explain.webm', 'explanation'],
    ['audio/card.explain.m4a', 'explanation'], ['audio/card.other.ogg', 'pronunciation'],
  ] as const)('infers audio role without normalizing ids: %s', (path, role) => {
    expect(filenameBinding(path, itemIds)).toEqual({ path, item: 'card', role });
  });
  it.each(['audio/CARD.mp3', 'audio/missing.mp3', 'audio/card.png', 'audio/card.mp4'])(
    'leaves unmatched or unsupported audio unbound: %s', (path) => {
      expect(filenameBinding(path, itemIds)).toBeUndefined();
    },
  );
  it.each([
    ['images/card.png', 'card', 1], ['images/card.2.png', 'card', 2],
    ['images/card.3.JPG', 'card', 3], ['images/card_2.png', 'card_2', 1],
    ['images/Card.webp', 'Card', 1], ['images/group/Café.svg', 'Café', 1],
  ] as const)('infers image order using the exact first-dot stem: %s', (path, item, order) => {
    expect(filenameBinding(path, itemIds)).toEqual({ path, item, role: 'image', order });
  });
  it.each(['images/CARD.png', 'images/Cafe\u0301.png', 'images/missing.png',
    'images/card_3.png', 'images/card.exe', 'images/card.0.png', 'images/card.2.3.png',
    'images/card.9007199254740992.png', 'images/card/'])(
    'does not guess an unmatched image: %s', (path) => {
      expect(filenameBinding(path, itemIds)).toBeUndefined();
    },
  );
});

describe('normalizePackPaths', () => {
  it('reports missing manifests only after safety and duplicate checks', () => {
    expect(normalizePackPaths(['notes.txt', 'Demo/items.json'], true)).toEqual({ ok: false, errors: [
      { file: 'pack.json', path: '$', message: 'packImport.error.noPack' },
    ] });
    expect(normalizePackPaths(['../bad', 'notes.txt'], true)).toEqual({ ok: false, errors: [
      { file: '../bad', path: '$', message: 'packImport.error.path' },
    ] });
    expect(normalizePackPaths(['notes.txt', 'NOTES.txt'], true)).toEqual({ ok: false, errors: [
      { file: 'NOTES.txt', path: '$', message: 'packImport.error.duplicate' },
    ] });
  });
  it('reports independent path, archive, format and duplicate failures together', () => {
    const result = normalizePackPaths(['../outside', 'images/payload.zip', 'images/card.exe',
      'images/Card.png', 'images/card.png', 'unknown/card.png']);
    expect(result).toEqual({ ok: false, errors: [
      { file: '../outside', path: '$', message: 'packImport.error.path' },
      { file: 'images/payload.zip', path: '$', message: 'packImport.error.archive' },
      { file: 'images/card.exe', path: '$', message: 'packImport.error.format' },
      { file: 'images/card.png', path: '$', message: 'packImport.error.duplicate' },
      { file: 'unknown/card.png', path: '$', message: 'packImport.error.path' },
    ] });
  });

  it('removes one manifest-backed common wrapper while retaining directory alignment', () => {
    expect(normalizePackPaths([
      'Demo\\', 'Demo\\pack.json', 'Demo/items.json', 'Demo/images/', 'Demo/images/Card.png',
    ])).toEqual({ ok: true, value: ['', 'pack.json', 'items.json', 'images/', 'images/Card.png'] });
    expect(normalizePackPaths(['Demo/pack.json', 'Demo/items.json'])).toEqual({
      ok: true, value: ['pack.json', 'items.json'],
    });
  });

  it.each([
    ['other/card.png'], ['Images/card.png'], ['PACK.JSON'], ['images'], ['notes.txt'],
    ['Demo/items.json'], ['Demo/pack.json', 'items.json'],
    ['Demo/pack.json', 'Other/items.json'], ['Outer/Inner/pack.json'],
  ])('rejects unknown locations without inventing a wrapper: %j', (...names) => {
    const result = normalizePackPaths(names);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]?.message).toBe('packImport.error.path');
  });

  it('accepts only the canonical top-level files and folder names', () => {
    const names = ['pack.json', 'items.json', 'bindings.json', 'texts/', 'annotations/',
      'images/', 'audio/', 'puzzles/', 'images/group/Card.png'];
    expect(normalizePackPaths(names)).toEqual({ ok: true, value: names });
  });

  it.each([
    ['images/Card.png', 'images/card.PNG'], ['images/Café.png', 'images/Cafe\u0301.png'],
    ['images/', 'images/'], ['pack.json', 'pack.json'],
    ['Demo/pack.json', 'Demo/images/card.png', 'Demo/images\\card.png'],
  ])('rejects duplicate normalized paths including folders: %j', (...names) => {
    const result = normalizePackPaths(names);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toContainEqual({
      file: names.at(-1), path: '$', message: 'packImport.error.duplicate',
    });
  });

  it.each([['Demo/', 'Demo/'], ['Demo/', 'demo/'], ['Café/', 'Cafe\u0301/']])(
    'rejects duplicate wrapper directories before stripping %s and %s', (first, second) => {
      expect(normalizePackPaths([first!, second!, `${first}pack.json`])).toMatchObject({
        ok: false, errors: expect.arrayContaining([{ file: second, path: '$', message: 'packImport.error.duplicate' }]),
      });
    },
  );

  it.each(['zip', '7z', 'rar', 'tar', 'gz', 'tgz', 'bz2', 'xz', 'zst', 'cab', 'ZIP'])(
    'rejects nested archive extension %s', (ext) => {
      const file = `images/payload.${ext}`;
      expect(normalizePackPaths([file])).toEqual({ ok: false, errors: [
        { file, path: '$', message: 'packImport.error.archive' },
      ] });
    },
  );

  it('detects archive components before removing a root wrapper', () => {
    expect(normalizePackPaths(['Demo.zip/pack.json'])).toEqual({ ok: false, errors: [
      { file: 'Demo.zip/pack.json', path: '$', message: 'packImport.error.archive' },
    ] });
  });

  it.each(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif'])(
    'allows image format %s in image and puzzle folders', (ext) => {
      const names = [`images/card.${ext}`, `puzzles/scene.${ext.toUpperCase()}`];
      expect(normalizePackPaths(names)).toEqual({ ok: true, value: names });
    },
  );
  it('allows supported audio and JSON files', () => {
    const names = ['mp3', 'm4a', 'webm', 'ogg', 'wav'].map((ext) => `audio/card.${ext}`);
    names.push('texts/story.json', 'annotations/story.JSON');
    expect(normalizePackPaths(names)).toEqual({ ok: true, value: names });
  });
  it.each(['images/card.exe', 'puzzles/scene.mp3', 'audio/card.png', 'audio/card.mp4',
    'texts/story.txt', 'annotations/story.js', 'images/card', 'images/card.png.exe'])(
    'rejects unsupported format %s', (file) => {
      expect(normalizePackPaths([file])).toEqual({ ok: false, errors: [
        { file, path: '$', message: 'packImport.error.format' },
      ] });
    },
  );

  it('normalizes separators and NFC while preserving order and filename case', () => {
    const names = ['pack.json', 'items.json', 'images\\Cafe\u0301.PNG', 'images/'];
    expect(normalizePackPaths(names)).toEqual({
      ok: true, value: ['pack.json', 'items.json', 'images/Café.PNG', 'images/'],
    });
    expect(names[2]).toBe('images\\Cafe\u0301.PNG');
    expect(normalizePackPaths([])).toEqual({ ok: true, value: [] });
  });

  it.each([
    '/images/card.png', '\\\\host\\share\\card.png', 'C:\\images\\card.png',
    'C:images/card.png', '../pack.json', 'images/../card.png', 'images/./card.png',
    'images//card.png', '', '.', '..', 'images/card\u0000.png', 'images/card\n.png',
    'images/card\u007f.png', 'images/card\u0085.png',
  ])('rejects unsafe path %j', (name) => {
    expect(normalizePackPaths([name])).toEqual({ ok: false, errors: [
      { file: name, path: '$', message: 'packImport.error.path' },
    ] });
  });
});

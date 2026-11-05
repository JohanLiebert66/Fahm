import 'fake-indexeddb/auto';
import JSZip from 'jszip';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { seedPack, snapshot } from '../../tests/storageFixtures';
import pack from '../../tests/fixtures/en-vocab/pack.json';
import items from '../../tests/fixtures/en-vocab/items.json';
import { createDatabase } from './db';
import { importPack } from './importPack';

let db: ReturnType<typeof createDatabase>;
beforeEach(async () => { db = createDatabase(`hostile-${crypto.randomUUID()}`); await seedPack(db, 'existing'); });
afterEach(async () => { await db.delete(); });
function base() {
  const zip = new JSZip();
  zip.file('pack.json', JSON.stringify(pack), { createFolders: false });
  zip.file('items.json', JSON.stringify(items), { createFolders: false });
  return zip;
}

it.each([
  ['../images/escape.svg', 'packImport.error.path'],
  ['images\\..\\escape.svg', 'packImport.error.path'],
  ['/images/escape.svg', 'packImport.error.path'],
  ['audio/nested.zip', 'packImport.error.archive'],
  ['elsewhere/file.svg', 'packImport.error.path'],
])('rejects hostile path %s before decompression and changes nothing', async (path, message) => {
  const before = await snapshot(db);
  const zip = base().file(path, 'synthetic', { createFolders: false });
  let chunks = 0;
  const report = await importPack(db, await zip.generateAsync({ type: 'uint8array' }), { onChunk: () => chunks++ });
  expect(report).toMatchObject({ status: 'failed', errors: expect.arrayContaining([expect.objectContaining({ message })]) });
  expect(chunks).toBe(0);
  expect(await snapshot(db)).toEqual(before);
});

it('rejects case-insensitive duplicates before JSZip can hide them', async () => {
  const before = await snapshot(db);
  const zip = base().file('images/test.svg', 'a', { createFolders: false })
    .file('images/TEST.svg', 'b', { createFolders: false });
  const report = await importPack(db, await zip.generateAsync({ type: 'uint8array' }));
  expect(report).toMatchObject({ status: 'failed', errors: expect.arrayContaining([
    expect.objectContaining({ message: 'packImport.error.duplicate' }),
  ]) });
  expect(await snapshot(db)).toEqual(before);
});

it('rejects too many directory entries before consuming any expanded chunks', async () => {
  const before = await snapshot(db);
  const zip = base().file('images/test.svg', 'a', { createFolders: false });
  let chunks = 0;
  const report = await importPack(db, await zip.generateAsync({ type: 'uint8array' }),
    { limits: { entries: 2 }, onChunk: () => chunks++ });
  expect(report).toMatchObject({ status: 'failed', errors: expect.arrayContaining([
    expect.objectContaining({ message: 'packImport.error.entries' }),
  ]) });
  expect(chunks).toBe(0);
  expect(await snapshot(db)).toEqual(before);
});

it('rejects exact duplicate central-directory names before JSZip overwrites an entry', async () => {
  const before = await snapshot(db);
  const zip = base().file('images/test-a.svg', 'a', { createFolders: false })
    .file('images/test-b.svg', 'b', { createFolders: false });
  const raw = await zip.generateAsync({ type: 'uint8array' });
  const from = new TextEncoder().encode('images/test-b.svg');
  const to = new TextEncoder().encode('images/test-a.svg');
  let patched = 0;
  for (let i = 0; i <= raw.length - from.length; i++) {
    if (from.every((byte, offset) => raw[i + offset] === byte)) { raw.set(to, i); patched++; }
  }
  expect(patched).toBe(2); // local header plus central-directory record
  let chunks = 0;
  const report = await importPack(db, raw, { onChunk: () => chunks++ });
  expect(report).toMatchObject({ status: 'failed', errors: expect.arrayContaining([
    expect.objectContaining({ message: 'packImport.error.duplicate' }),
  ]) });
  expect(chunks).toBe(0);
  expect(await snapshot(db)).toEqual(before);
});

it('rejects a highly compressible entry on the first chunk over the actual expanded-byte limit', async () => {
  const before = await snapshot(db);
  const expanded = 2 * 1024 * 1024;
  const limit = 96 * 1024;
  const zip = base().file('images/test.svg', new Uint8Array(expanded), { createFolders: false });
  const compressed = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
  expect(compressed.byteLength).toBeLessThan(limit);
  let chunks = 0;
  let received = 0;
  const report = await importPack(db, compressed, {
    limits: { totalBytes: limit, imageBytes: limit },
    onChunk: (_path, bytes) => { chunks++; received += bytes; },
  });
  expect(report.status).toBe('failed');
  expect(report.errors.some(({ message }) => ['packImport.error.total', 'packImport.error.image'].includes(message))).toBe(true);
  expect(received).toBeGreaterThan(limit);
  expect(received).toBeLessThanOrEqual(limit + 16 * 1024);
  expect(chunks).toBeLessThan(12);
  expect(await snapshot(db)).toEqual(before);
});

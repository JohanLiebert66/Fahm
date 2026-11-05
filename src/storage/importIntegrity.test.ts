import 'fake-indexeddb/auto';
import JSZip from 'jszip';
import { Blob as NodeBlob, File as NodeFile } from 'node:buffer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { seedPack, snapshot } from '../../tests/storageFixtures';
import pack from '../../tests/fixtures/en-vocab/pack.json';
import items from '../../tests/fixtures/en-vocab/items.json';
import text from '../../tests/fixtures/en-vocab/texts/classroom.json';
import annotations from '../../tests/fixtures/en-vocab/annotations/classroom.json';
import { createDatabase } from './db';
import { importPack } from './importPack';

let db: ReturnType<typeof createDatabase>;
beforeEach(() => { db = createDatabase(`integrity-${crypto.randomUUID()}`); vi.stubGlobal('Blob', NodeBlob); });
afterEach(async () => { vi.unstubAllGlobals(); await db.delete(); });
const base = () => new JSZip().file('pack.json', JSON.stringify(pack), { createFolders: false })
  .file('items.json', JSON.stringify(items), { createFolders: false });
const file = (path: string, bytes: string | Uint8Array, type: string) => Object.defineProperty(
  new NodeFile([typeof bytes === 'string' ? bytes : new Uint8Array(bytes)], path.split('/').at(-1)!, { type }),
  'webkitRelativePath', { value: path }) as unknown as File;

it('rejects text filename/internal-ID mismatches before replace can change any table', async () => {
  await seedPack(db, pack.id);
  const before = await snapshot(db);
  const source = base().file('texts/alias.json', JSON.stringify(text), { createFolders: false })
    .file('annotations/alias.json', JSON.stringify(annotations), { createFolders: false });
  const report = await importPack(db, await source.generateAsync({ type: 'uint8array' }), { conflict: 'replace' });
  expect(report).toMatchObject({ status: 'failed', errors: expect.arrayContaining([
    { file: 'texts/alias.json', path: '$.id', message: 'packImport.error.textIdentity' },
  ]) });
  expect(await snapshot(db)).toEqual(before);
});

it('rejects a declared folder audio MIME/extension mismatch without relabelling or writing', async () => {
  await seedPack(db, 'existing');
  const before = await snapshot(db);
  const report = await importPack(db, [file('pack.json', JSON.stringify(pack), 'application/json'),
    file('items.json', JSON.stringify(items), 'application/json'),
    file('audio/pencil.mp3', new TextEncoder().encode('RIFF0000WAVE'), 'audio/wav')]);
  expect(report).toMatchObject({ status: 'failed', errors: expect.arrayContaining([
    expect.objectContaining({ file: 'audio/pencil.mp3', message: 'packImport.error.mime' }),
  ]) });
  expect(await snapshot(db)).toEqual(before);
});

it('preserves supported folder audio MIME parameters and actual bytes', async () => {
  const bytes = new Uint8Array([0, 1, 2, 255]);
  const mime = 'audio/webm;codecs=opus';
  const report = await importPack(db, [file('pack.json', JSON.stringify(pack), 'application/json'),
    file('items.json', JSON.stringify(items), 'application/json'), file('audio/pencil.webm', bytes, mime)]);
  expect(report.status).toBe('imported');
  const stored = (await db.assets.toArray())[0]!;
  expect(stored.mime).toBe(mime);
  expect(stored.blob.type).toBe(mime);
  expect(new Uint8Array(await stored.blob.arrayBuffer())).toEqual(bytes);
});

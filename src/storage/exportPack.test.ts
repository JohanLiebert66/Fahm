import 'fake-indexeddb/auto';
import { Blob as NodeBlob } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Dexie from 'dexie';
import JSZip from 'jszip';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { Item, Pack, Text, Annotation } from '../core/pack/types';
import { filenameBinding, normalizePackPaths } from '../core/binding/filenames';
import { createDatabase } from './db';
import { exportPack } from './exportPack';
import { transferBytes } from './packTransfer/bytes';

const fixture = <T,>(name: string): T => JSON.parse(readFileSync(
  join(import.meta.dirname, '../../tests/fixtures/en-vocab', `${name}.json`), 'utf8')) as T;
const pack = fixture<Pack>('pack');
const items = fixture<Item[]>('items');
const text = fixture<Text>('texts/classroom');
const annotations = fixture<Annotation[]>('annotations/classroom');
let db: ReturnType<typeof createDatabase>;
beforeEach(async () => {
  vi.stubGlobal('Blob', NodeBlob);
  db = createDatabase(`export-${crypto.randomUUID()}`);
  await db.packs.add({ id: pack.id, meta: pack, importedAt: 1 });
  await db.items.bulkAdd(items.map((item) => ({ ...item, packId: pack.id })));
  await db.texts.add({ ...text, packId: pack.id });
  await db.annotations.bulkAdd(annotations.map((annotation) => ({ ...annotation, packId: pack.id, textId: text.id })));
});
afterEach(async () => { vi.restoreAllMocks(); vi.unstubAllGlobals(); await db.delete(); });

it('exports source fields and annotations verbatim with no storage owners outside the read transaction', async () => {
  const generate = JSZip.prototype.generateAsync;
  const spy = vi.spyOn(JSZip.prototype, 'generateAsync').mockImplementation(function (this: JSZip, ...args) {
    expect(Dexie.currentTransaction).toBeNull();
    return generate.apply(this, args);
  });
  const result = await exportPack(db, pack.id);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('Expected ZIP');
  expect(result.value.type).toBe('application/zip');
  const zip = await JSZip.loadAsync(await transferBytes(result.value));
  const json = async (path: string) => JSON.parse(await zip.file(path)!.async('string'));
  expect(await json('pack.json')).toEqual(pack);
  expect(await json('items.json')).toEqual([...items].sort((a, b) => a.id.localeCompare(b.id)));
  expect(await json(`texts/${text.id}.json`)).toEqual(text);
  expect(await json(`annotations/${text.id}.json`)).toEqual(annotations);
  expect(await json('bindings.json')).toEqual([]);
  expect(spy).toHaveBeenCalledOnce();
});

it('exports canonical MIME-derived asset paths with exact bytes, binding order and attribution', async () => {
  const itemId = items[0]!.id;
  const payloads = [new Uint8Array([0, 255, 127]), new Uint8Array([8, 9]),
    new Uint8Array([42]), new Uint8Array([99, 0]), new Uint8Array([1, 2, 3])];
  const mimes = ['image/png', 'image/jpeg', 'audio/mp4', 'audio/webm;codecs=opus', 'image/png'];
  const roles = ['image', 'image', 'pronunciation', 'explanation', 'puzzle'] as const;
  await db.assets.bulkAdd(payloads.map((bytes, i) => ({ id: `asset-${i}`, packId: pack.id,
    kind: i === 2 || i === 3 ? 'audio' as const : 'image' as const, mime: mimes[i]!,
    name: '../../hostile\\name.zip', size: bytes.length, blob: transferBytes(bytes, mimes[i]!),
    credit: `credit-${i}`, license: `license-${i}` })));
  await db.bindings.bulkAdd(roles.map((role, i) => ({ id: `binding-${i}`, assetId: `asset-${i}`,
    packId: pack.id, role, ...(role !== 'puzzle' ? { itemId } : {}), order: i === 0 ? 8 : i })));
  const result = await exportPack(db, pack.id);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('Expected ZIP');
  const zip = await JSZip.loadAsync(await transferBytes(result.value));
  const bindings = JSON.parse(await zip.file('bindings.json')!.async('string'));
  expect(bindings).toHaveLength(5);
  expect(bindings.map((binding: { path: string }) => binding.path)).toEqual([
    `images/${itemId}.2.png`, `images/${itemId}.jpg`, `audio/${itemId}.m4a`,
    `audio/${itemId}.explain.webm`, expect.stringMatching(/^puzzles\/[\p{L}\p{N}_-]+\.png$/u),
  ]);
  for (const [i, binding] of bindings.entries()) {
    expect(binding).toMatchObject({ role: roles[i], order: i === 0 ? 8 : i,
      credit: `credit-${i}`, license: `license-${i}` });
    expect(await zip.file(binding.path)!.async('uint8array')).toEqual(payloads[i]);
  }
});

it('keeps all unbound bytes without inferring bindings from unsafe or colliding names', async () => {
  const names = [`images/${items[0]!.id}.png`, 'puzzles/CAFÉ.png', 'images/cafe\u0301.png', 'audio/../../bad.zip'];
  await db.assets.bulkAdd(names.map((name, i) => ({ id: `unbound-${i}`, packId: pack.id,
    kind: i === 3 ? 'audio' as const : 'image' as const, mime: i === 3 ? 'audio/mp4' : 'image/png',
    name, size: 2, blob: transferBytes(new Uint8Array([i, 255]), i === 3 ? 'audio/mp4' : 'image/png') })));
  const result = await exportPack(db, pack.id);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('Expected ZIP');
  const zip = await JSZip.loadAsync(await transferBytes(result.value));
  const paths = Object.keys(zip.files).filter((path) => /^(images|audio|puzzles)\//.test(path));
  expect(paths).toHaveLength(names.length);
  expect(normalizePackPaths(Object.keys(zip.files)).ok).toBe(true);
  const ids = new Set(items.map((item) => item.id));
  const bytes: number[][] = [];
  for (const path of paths) {
    expect(filenameBinding(path, ids)).toBeUndefined();
    bytes.push([...await zip.file(path)!.async('uint8array')]);
  }
  expect(bytes.sort((a, b) => a[0]! - b[0]!)).toEqual(names.map((_, i) => [i, 255]));
  expect(JSON.parse(await zip.file('bindings.json')!.async('string'))).toEqual([]);
});

it.each(['unknown pack', 'dangling asset', 'missing payload', 'unsupported MIME', 'unsafe text path',
  'case-colliding texts', 'orphan annotation', 'wrong asset kind', 'unknown binding item'])(
  'returns typed InvalidData rather than a partial archive for %s', async (problem) => {
    const bytes = new Uint8Array([1]);
    if (['missing payload', 'unsupported MIME', 'wrong asset kind', 'unknown binding item'].includes(problem)) {
      await db.assets.add({ id: 'asset', packId: pack.id, kind: 'image', name: 'file.png', size: 1,
        mime: problem === 'unsupported MIME' ? 'application/octet-stream' : 'image/png',
        blob: problem === 'missing payload' ? undefined as unknown as Blob : transferBytes(bytes, 'image/png') });
    }
    if (['dangling asset', 'wrong asset kind', 'unknown binding item'].includes(problem)) {
      await db.bindings.add({ id: 'binding', assetId: 'asset', packId: pack.id,
        itemId: problem === 'unknown binding item' ? 'not-an-item' : items[0]!.id,
        role: problem === 'wrong asset kind' ? 'pronunciation' : 'image' });
    }
    if (problem === 'unsafe text path') await db.texts.add({ ...text, packId: pack.id, id: '../escape' });
    if (problem === 'case-colliding texts') await db.texts.add({ ...text, packId: pack.id, id: text.id.toUpperCase() });
    if (problem === 'orphan annotation') await db.annotations.add({ ...annotations[0]!, packId: pack.id, textId: 'missing' });
    const result = await exportPack(db, problem === 'unknown pack' ? 'missing' : pack.id);
    expect(result).toMatchObject({ ok: false, error: { code: 'InvalidData' } });
    expect(await db.packs.count()).toBe(1);
  },
);

it('retains separate puzzle payloads when sanitized names collide by case and NFC', async () => {
  const names = ['../../CAFÉ.zip.png', '..\\cafe\u0301.zip.png', 'café-zip.png'];
  await db.assets.bulkAdd(names.map((name, i) => ({ id: `puzzle-${i}`, packId: pack.id,
    kind: 'image' as const, mime: 'image/png', name, size: 1,
    blob: transferBytes(new Uint8Array([i]), 'image/png') })));
  await db.bindings.bulkAdd(names.map((_, i) => ({ id: `puzzle-binding-${i}`, packId: pack.id,
    assetId: `puzzle-${i}`, role: 'puzzle' as const })));
  const result = await exportPack(db, pack.id);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('Expected ZIP');
  const zip = await JSZip.loadAsync(await transferBytes(result.value));
  const bindings = JSON.parse(await zip.file('bindings.json')!.async('string')) as { path: string }[];
  const paths = bindings.map(({ path }) => path);
  expect(new Set(paths.map((path) => path.normalize('NFC').toLowerCase())).size).toBe(names.length);
  expect(normalizePackPaths(Object.keys(zip.files)).ok).toBe(true);
  for (const [i, path] of paths.entries()) {
    expect(path).toMatch(/^puzzles\/[\p{L}\p{N}_-]+(?:\.\d+)?\.png$/u);
    expect(await zip.file(path)!.async('uint8array')).toEqual(new Uint8Array([i]));
  }
});

import 'fake-indexeddb/auto';
import JSZip from 'jszip';
import { File as NodeFile } from 'node:buffer';
import { describe, expect, it } from 'vitest';
import pack from '../../../tests/fixtures/en-vocab/pack.json';
import items from '../../../tests/fixtures/en-vocab/items.json';
import { readEntries } from './readEntries';
import { parsePackEntries } from './parsePackEntries';
import { createDatabase } from '../db';
import { orchestrateImport } from './orchestrateImport';
import { rawEntryLimit } from './types';

function file(path: string, data = ''): File {
  const value = new NodeFile([data], path);
  Object.defineProperty(value, 'webkitRelativePath', { value: path });
  return value as unknown as File;
}

const noPack = { issues: [{ file: 'pack.json', path: '$', message: 'packImport.error.noPack' }] };

describe('directory import contracts', () => {
  it.each([[], ['notes.txt'], ['bundle/items.json']])('reports only noPack for a folder without a manifest: %j', async (...paths) => {
    await expect(readEntries(paths.map(path => file(path, '{bad')))).rejects.toMatchObject(noPack);
  });

  it('reports only noPack before parsing unrelated malformed JSON', () => {
    expect(parsePackEntries([{ path: 'items.json', bytes: new TextEncoder().encode('{bad') }]))
      .toEqual({ ok: false, warnings: [], errors: noPack.issues });
  });

  it('skips empty folder entries before validation and the file limit, but counts raw entries', async () => {
    const files = [file('../ignored/'), file('pack.json', '{}')];
    expect((await readEntries(files, { limits: { entries: 1, rawEntries: 2 } })).map(entry => entry.path))
      .toEqual(['pack.json']);
    await expect(readEntries(files, { limits: { rawEntries: 1 } }))
      .rejects.toMatchObject({ issues: [{ message: 'packImport.error.rawEntries' }] });
    await expect(readEntries([file('images/data/', 'x')])).rejects.toMatchObject({
      issues: [{ message: 'packImport.error.path' }],
    });
  });

  it('excludes ZIP directories from the file limit and applies an injectable raw cap', async () => {
    const zip = new JSZip().file('bundle/pack.json', '{}');
    zip.file('../ignored/', '', { createFolders: false });
    const bytes = await zip.generateAsync({ type: 'uint8array' });
    expect((await readEntries(bytes, { limits: { entries: 1, rawEntries: 3 } })).map(entry => entry.path))
      .toEqual(['pack.json']);
    await expect(readEntries(bytes, { limits: { rawEntries: 2 } }))
      .rejects.toMatchObject({ issues: [{ message: 'packImport.error.rawEntries' }] });
  });

  it('reads and validates a synthetic Windows-style pack with explicit directory entries', async () => {
    const zip = new JSZip().file('bundle/pack.json', JSON.stringify(pack))
      .file('bundle/items.json', JSON.stringify(items));
    const bytes = await zip.generateAsync({ type: 'uint8array' });
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    for (let i = 0; i + 46 <= bytes.length; i++) {
      const signature = view.getUint32(i, true);
      const offset = signature === 0x02014b50 ? 46 : signature === 0x04034b50 ? 30 : 0;
      if (!offset) continue;
      const length = view.getUint16(i + (offset === 46 ? 28 : 26), true);
      for (let j = i + offset; j < i + offset + length; j++) if (bytes[j] === 47) bytes[j] = 92;
    }
    expect(parsePackEntries(await readEntries(bytes))).toMatchObject({ ok: true, value: { pack, items } });
    const db = createDatabase(`directories-${crypto.randomUUID()}`);
    try {
      expect(await orchestrateImport(db, bytes, {})).toMatchObject({ status: 'imported', errors: [], packId: pack.id });
      expect(await db.packs.get(pack.id)).toMatchObject({ id: pack.id, meta: pack });
      expect(await db.items.count()).toBe(items.length);
    } finally { await db.delete(); }
  });

  it.each([NaN, Infinity, -1, 1.5, 10001])('does not weaken the raw cap with %s', (rawEntries) => {
    expect(rawEntryLimit({ limits: { rawEntries } })).toBe(10000);
  });

  it.each(['zip', 'folder'] as const)('enforces the default 10,000 raw-entry boundary for %s', async (kind) => {
    const zip = new JSZip();
    const directory = file('ignored/');
    const files: File[] = [];
    for (let index = 0; index < 10000; index++) {
      if (kind === 'zip') zip.file(`ignored-${index}/`, '', { createFolders: false });
      else files.push(directory);
    }
    const source = () => kind === 'zip' ? zip.generateAsync({ type: 'uint8array' }) : Promise.resolve(files);
    // Exactly 10,000 directories pass the raw cap, then fail only for no pack.
    await expect(readEntries(await source())).rejects.toMatchObject(noPack);
    if (kind === 'zip') zip.file('overflow/', '', { createFolders: false });
    else files.push(directory);
    await expect(readEntries(await source())).rejects.toMatchObject({
      issues: [{ file: '', path: '$', message: 'packImport.error.rawEntries' }],
    });
  }, 15000);

  it.each(['../bad.png', '/bad.png', 'images/nested.zip', 'images/x.png'])('retains hostile-file errors without noPack for %s', async (path) => {
    const duplicate = path === 'images/x.png';
    const message = duplicate ? 'packImport.error.duplicate'
      : path.endsWith('.zip') ? 'packImport.error.archive' : 'packImport.error.path';
    const files = [file('ignored/'), file(path, 'x')];
    const zip = new JSZip().file('ignored/', '', { createFolders: false }).file(path, 'x', { createFolders: false });
    if (duplicate) {
      files.push(file('images/X.png', 'x'));
      zip.file('images/X.png', 'x', { createFolders: false });
    }
    for (const source of [files, await zip.generateAsync({ type: 'uint8array' })]) {
      await expect(readEntries(source)).rejects.toMatchObject({ issues: [{ message }] });
    }
  });

  it('ignores duplicate and unsafe directory names without losing the valid pack', async () => {
    const zip = new JSZip().file('pack.json', '{}').file('../ignored/', '', { createFolders: false })
      .file('other/', '', { createFolders: false }).file('OTHER/', '', { createFolders: false });
    const files = [file('../ignored/'), file('../ignored/'), file('other/'), file('pack.json', '{}')];
    for (const source of [files, await zip.generateAsync({ type: 'uint8array' })]) {
      expect((await readEntries(source, { limits: { entries: 1 } })).map(entry => entry.path)).toEqual(['pack.json']);
    }
  });

  it.each(['images/data/', 'images/data\\'])('rejects data-bearing directory-shaped ZIP name %s', async (path) => {
    const bytes = await new JSZip().file('images/dataX', 'payload', { createFolders: false })
      .generateAsync({ type: 'uint8array' });
    // Preserve the real payload, changing only equal-length raw header names.
    for (let i = 0; i < bytes.length - 11; i++) {
      if (new TextDecoder().decode(bytes.subarray(i, i + 12)) === 'images/dataX') {
        bytes.set(new TextEncoder().encode(path), i);
      }
    }
    await expect(readEntries(bytes)).rejects.toMatchObject({ issues: [{ message: 'packImport.error.path' }] });
  });
});

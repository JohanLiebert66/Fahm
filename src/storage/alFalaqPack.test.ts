import 'fake-indexeddb/auto';
import { Blob as NodeBlob } from 'node:buffer';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import JSZip from 'jszip';
import { expect, it, vi } from 'vitest';
import { validatePack } from '../core/pack/validate';
import type { Pack, Text } from '../core/pack/types';
import { createDatabase } from './db';
import { importPack } from './importPack';
import { exportPack } from './exportPack';
import { transferBytes } from './packTransfer/bytes';

const root = resolve(import.meta.dirname, '../..');
const folder = resolve(root, 'packs/al-falaq');
const files = ['items.json', 'pack.json', 'texts/al-falaq.json'];
const hash = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex').toUpperCase();
const script = resolve(root, 'scripts/build-pack-al-falaq.mjs');
const testFile = resolve(root, 'src/storage/alFalaqPack.test.ts');
function json(path: string): unknown {
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch { throw new Error('Pack JSON could not be read/parsed; payload suppressed.'); }
}
function notice() {
  const document = readFileSync(resolve(root, 'docs/THIRD_PARTY_NOTICES.md'), 'utf8').replace(/\r\n?/gu, '\n');
  const value = /^```\n([\s\S]*?)^```/mu.exec(document)?.[1];
  if (!value) throw new Error('Missing notice block');
  return value;
}

function packData() {
  return {
    pack: json(resolve(folder, 'pack.json')) as Pack,
    items: json(resolve(folder, 'items.json')),
    texts: { 'al-falaq': json(resolve(folder, 'texts/al-falaq.json')) as Text },
    assets: [],
  };
}

it('provides an importable text-only sample that passes validatePack', () => {
  expect(files.every(path => existsSync(resolve(folder, path)))).toBe(true);
  const data = packData();
  const result = validatePack(data);
  expect(result.ok).toBe(true);
  expect(result.warnings.length).toBe(0);
  expect(data.items).toEqual([]);
  expect(data.pack).toMatchObject({ id: 'al-falaq', lang: 'ar', dir: 'rtl' });
  expect(data.texts['al-falaq'].segments.length).toBe(5);
});

it('records the LF-joined verse integrity hash without requiring the external source', () => {
  const record = json(resolve(root, 'packs/al-falaq.integrity.json')) as {
    sha256: string; verseCount: number; sourceSha256: string; algorithm: string;
  };
  const segments = packData().texts['al-falaq'].segments;
  expect(hash(segments.map(segment => segment.text).join('\n'))).toBe(record.sha256);
  expect(record.sha256).toBe('AB6D6E8E968748E1B43665E2F08AF76DCDC72EBCDCA189DB822AE64C638F566F');
  expect(record.verseCount).toBe(5);
  expect(record.sourceSha256).toBe('6933E133DD56DB778C801BF738848454E43648105A151E8D84D86A7CAE39EC5F');
  expect(record.algorithm).toBe('SHA-256 of the five verse texts in verse order joined with one LF (U+000A), no trailing LF, encoded as UTF-8 without BOM.');
  expect(segments.map(segment => segment.ref)).toEqual(['113:1', '113:2', '113:3', '113:4', '113:5']);
  expect(segments.map(segment => segment.id)).toEqual(['1', '2', '3', '4', '5']);
});

it('carries the complete notice line by line in description and the repo sidecar', () => {
  const lines = (value: string) => value.replace(/\r\n?/gu, '\n').split('\n').filter(line => line.trim());
  expect(lines(packData().pack.description ?? '')).toEqual(lines(notice()));
  expect(lines(readFileSync(resolve(root, 'packs/al-falaq.NOTICE.txt'), 'utf8'))).toEqual(lines(notice()));
});

it('keeps only supported JSON files in the folder, with UTF-8, no BOM and a final LF', () => {
  const actual = readdirSync(folder, { recursive: true }).map(String)
    .filter(path => statSync(resolve(folder, path)).isFile()).map(path => path.replaceAll('\\', '/')).sort();
  expect(actual).toEqual(files);
  for (const path of [...files.map(path => resolve(folder, path)), resolve(root, 'packs/al-falaq.integrity.json')]) {
    const bytes = readFileSync(path);
    expect(bytes.subarray(0, 3).toString('hex') === 'efbbbf').toBe(false);
    expect(bytes.at(-1)).toBe(10);
    expect(hash(new TextDecoder('utf-8', { fatal: true }).decode(bytes))).toBe(hash(bytes));
  }
  expect(packData().pack.title).toEqual({ en: 'Al-Falaq' });
  expect(packData().texts['al-falaq'].title).toEqual({ en: 'Al-Falaq (113)' });
  expect(packData().pack.license).toBe('Creative Commons Attribution 3.0');
  expect(packData().pack.source).toBe('Tanzil Project - https://tanzil.net');
});

it('round-trips the actual folder through import, export and re-import with notice and text hashes', async () => {
  const db = createDatabase(`al-falaq-${crypto.randomUUID()}`);
  vi.stubGlobal('Blob', NodeBlob);
  try {
    const source = files.map(path => {
      const file = new File([new Uint8Array(readFileSync(resolve(folder, path)))], path, { type: 'application/json' });
      Object.defineProperty(file, 'webkitRelativePath', { value: `al-falaq/${path}` });
      return file;
    });
    const expected = packData();
    const fingerprints = (text: Text) => text.segments.map(segment => hash(segment.text));
    const checkStored = async (packId: string) => {
      const stored = await db.texts.where('packId').equals(packId).toArray();
      expect(stored.length).toBe(1);
      expect(stored[0]!.segments.length).toBe(5);
      const { packId: owner, ...text } = stored[0]!;
      void owner;
      expect(hash(JSON.stringify(text))).toBe(hash(JSON.stringify(expected.texts['al-falaq'])));
      expect(fingerprints(stored[0]!)).toEqual(fingerprints(expected.texts['al-falaq']));
      expect(hash(stored[0]!.segments.map(segment => segment.text).join('\n')))
        .toBe(hash(expected.texts['al-falaq'].segments.map(segment => segment.text).join('\n')));
      const pack = await db.packs.get(packId);
      expect(hash(pack?.meta.description ?? '')).toBe(hash(notice()));
      expect(hash(JSON.stringify({ ...pack?.meta, id: expected.pack.id }))).toBe(hash(JSON.stringify(expected.pack)));
      expect(await db.items.where('packId').equals(packId).count()).toBe(0);
      expect(await db.annotations.where('packId').equals(packId).count()).toBe(0);
    };
    expect((await importPack(db, source)).status).toBe('imported');
    await db.close(); await db.open();
    await checkStored('al-falaq');
    const exported = await exportPack(db, 'al-falaq');
    expect(exported.ok).toBe(true);
    if (!exported.ok) throw new Error('Pack export failed');
    const bytes = await transferBytes(exported.value);
    const zip = await JSZip.loadAsync(bytes, { checkCRC32: true });
    const manifest = JSON.parse(await zip.file('pack.json')!.async('string')) as Pack;
    expect(hash(manifest.description ?? '')).toBe(hash(notice()));
    expect((await importPack(db, bytes, { conflict: 'copy' })).status).toBe('imported');
    await db.close(); await db.open();
    await checkStored('al-falaq-2');
    await checkStored('al-falaq');
  } finally { vi.unstubAllGlobals(); await db.delete(); }
});

it('keeps script and test sources ASCII-only; real sample text is read and compared only by hashes', () => {
  for (const path of [script, testFile]) {
    expect(/[\u0080-\u{10FFFF}]/u.test(readFileSync(path, 'utf8'))).toBe(false);
  }
});

it('rejects unverified input without changing existing pack files or leaking input', () => {
  const before = files.map(path => hash(readFileSync(resolve(folder, path))));
  const child = spawnSync(process.execPath, [script, testFile], { encoding: 'utf8' });
  expect(child.status).toBe(1);
  expect(child.stdout).toBe('');
  expect(child.stderr).toMatch(/^Source SHA-256 mismatch; actual [A-F0-9]{64}\.\n$/u);
  expect(files.map(path => hash(readFileSync(resolve(folder, path))))).toEqual(before);
});

it('builds deterministic ZIP bytes with fixed timestamps using only supplied entries', async () => {
  const scriptUrl = pathToFileURL(resolve(root, 'scripts/build-pack-al-falaq.mjs')).href;
  const { zipEntries } = await import(/* @vite-ignore */ scriptUrl);
  const entries = [['pack.json', Buffer.from('{"synthetic":true}\n')]];
  const bytes = zipEntries(entries) as Buffer;
  expect(bytes.subarray(0, 4).toString('hex')).toBe('504b0304');
  const zip = await JSZip.loadAsync(bytes, { checkCRC32: true });
  expect(Object.keys(zip.files)).toEqual(['pack.json']);
  expect(await zip.file('pack.json')!.async('string')).toBe('{"synthetic":true}\n');
  expect(zip.file('pack.json')!.date.toISOString()).toBe('1980-01-01T00:00:00.000Z');
  expect(Buffer.from(zipEntries(entries)).equals(bytes)).toBe(true);
});

it('rejects ZIP destinations inside the repository before reading the source', () => {
  const child = spawnSync(process.execPath, [resolve(root, 'scripts/build-pack-al-falaq.mjs'),
    resolve(root, 'src/storage/alFalaqPack.test.ts'), '--zip', resolve(root, 'packs/blocked.zip')], { encoding: 'utf8' });
  expect(child.status).toBe(1);
  expect(child.stderr).toBe('ZIP output must be outside the repository.\n');
  expect(existsSync(resolve(root, 'packs/blocked.zip'))).toBe(false);
});

import 'fake-indexeddb/auto';
import { Blob as NodeBlob } from 'node:buffer';
import JSZip from 'jszip';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import pack from '../../tests/fixtures/en-vocab/pack.json';
import items from '../../tests/fixtures/en-vocab/items.json';
import { createDatabase } from './db';
import { importPack } from './importPack';

let db: ReturnType<typeof createDatabase>;
beforeEach(() => { db = createDatabase(`import-${crypto.randomUUID()}`); vi.stubGlobal('Blob', NodeBlob); });
afterEach(async () => { vi.unstubAllGlobals(); await db.delete(); });
async function archive() {
  const zip = new JSZip();
  zip.file('pack.json', JSON.stringify(pack));
  zip.file('items.json', JSON.stringify(items));
  zip.file('images/pencil.svg', 'synthetic bytes');
  zip.file('images/unmatched.svg', 'unbound bytes');
  return zip.generateAsync({ type: 'uint8array' });
}

it('imports once with unavailable quota warning and real Blob payloads', async () => {
  const result = await importPack(db, await archive());
  expect(result).toMatchObject({ status: 'imported', packId: pack.id,
    counts: { items: items.length, texts: 0, annotations: 0, assets: 2, unbound: 1 },
    warnings: expect.arrayContaining([expect.objectContaining({ message: 'packImport.warning.quotaUnavailable' }),
      expect.objectContaining({ message: 'packImport.warning.unbound' })]) });
  const stored = (await db.assets.toArray()).find((row) => row.name === 'images/pencil.svg');
  expect(stored?.size).toBe(new TextEncoder().encode('synthetic bytes').byteLength);
  expect(await stored?.blob.text()).toBe('synthetic bytes');
});

it('fails the quota preflight without opening a mutation transaction', async () => {
  vi.stubGlobal('navigator', { storage: { estimate: async () => ({ usage: 99, quota: 100 }) } });
  const transactions = vi.spyOn(db, 'transaction');
  const result = await importPack(db, await archive());
  expect(result).toMatchObject({ status: 'failed', storageError: { code: 'QuotaExceeded' } });
  expect(transactions).not.toHaveBeenCalled();
  transactions.mockRestore();
  expect(await db.packs.count()).toBe(0);
});

it('continues with a warning when storage estimate rejects', async () => {
  vi.stubGlobal('navigator', { storage: { estimate: async () => { throw new Error('Synthetic unavailable API'); } } });
  const result = await importPack(db, await archive());
  expect(result).toMatchObject({ status: 'imported', warnings: expect.arrayContaining([
    expect.objectContaining({ message: 'packImport.warning.quotaUnavailable' }),
  ]) });
});

it('warns about low space but imports when the estimated space is sufficient', async () => {
  vi.stubGlobal('navigator', { storage: { estimate: async () => ({ usage: 900_000, quota: 1_000_000 }) } });
  const result = await importPack(db, await archive());
  expect(result).toMatchObject({ status: 'imported', warnings: expect.arrayContaining([
    expect.objectContaining({ message: 'packImport.warning.lowSpace' }),
  ]) });
});

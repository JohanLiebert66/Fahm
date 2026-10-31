import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { storageRecords } from '../../tests/storageFixtures';
import { createDatabase } from './db';
import { assetRepo } from './assetRepo';
import { Blob as NodeBlob } from 'node:buffer';

let db: ReturnType<typeof createDatabase>;
beforeEach(() => { db = createDatabase(`asset-${crypto.randomUUID()}`); });
afterEach(async () => { await db.delete(); });

it('isolates the jsdom Blob cloning limitation from storage code', async () => {
  const jsdomBlob = new Blob(['synthetic asset'], { type: 'image/svg+xml' });
  const cloned = structuredClone(jsdomBlob);
  expect(cloned).toEqual({});
  expect(cloned.type).toBeUndefined();
  expect(cloned.size).toBeUndefined();
  const native = new NodeBlob(['synthetic asset'], { type: 'image/svg+xml' });
  const nativeClone = structuredClone(native);
  expect(nativeClone.type).toBe(native.type);
  expect(nativeClone.size).toBe(native.size);
  expect(await nativeClone.text()).toBe(await native.text());
});

it('round-trips asset metadata and records the jsdom Blob payload limitation', async () => {
  const { asset } = storageRecords();
  const repo = assetRepo(db);
  expect(await repo.create(asset)).toEqual({ ok: true, value: asset.id });
  const result = await repo.get(asset.id);
  if (!result.ok || !result.value) throw new Error('Expected stored asset');
  expect(result.value.mime).toBe(asset.blob.type);
  expect(result.value.size).toBe(asset.blob.size);
  // fake-indexeddb uses Node structuredClone: jsdom Blobs become {} even without Dexie.
  // Do not alter the production schema to compensate for this harness limitation.
  expect(result.value.blob).toEqual(structuredClone(asset.blob));
  expect(result.value.blob).toEqual({});
  expect(result.value.blob.type).toBeUndefined();
  expect(result.value.blob.size).toBeUndefined();
});

it('round-trips a native Node Blob through the unchanged IndexedDB asset table', async () => {
  const { asset } = storageRecords();
  const native = new NodeBlob(['synthetic asset'], { type: asset.mime });
  // Backend control only: Node Blob is not the jsdom Blob accepted by the repository schema.
  await db.assets.add({ ...asset, blob: native as unknown as Blob });
  const stored = await db.assets.get(asset.id);
  expect(stored?.mime).toBe(native.type);
  expect(stored?.size).toBe(native.size);
  expect(stored?.blob).toBeInstanceOf(NodeBlob);
  expect(stored?.blob.type).toBe(native.type);
  expect(stored?.blob.size).toBe(native.size);
  expect(await stored?.blob.text()).toBe(await native.text());
});

it('updates and deletes an asset, and rejects inconsistent MIME/size before writing', async () => {
  const { asset } = storageRecords();
  const repo = assetRepo(db);
  await repo.create(asset);
  const updated = { ...asset, name: 'renamed.svg' };
  expect(await repo.put(updated)).toEqual({ ok: true, value: asset.id });
  const listed = await repo.listByPack(asset.packId);
  expect(listed).toMatchObject({ ok: true, value: [{ name: updated.name, mime: asset.mime, size: asset.size }] });
  for (const invalid of [{ ...asset, size: asset.size + 1 }, { ...asset, mime: 'audio/wav' }]) {
    expect(await repo.put(invalid)).toMatchObject({ ok: false, error: { code: 'InvalidData' } });
  }
  expect(await repo.get(asset.id)).toMatchObject({ ok: true, value: { name: updated.name } });
  expect(await repo.remove(asset.id)).toEqual({ ok: true, value: undefined });
  expect(await repo.list()).toEqual({ ok: true, value: [] });
});

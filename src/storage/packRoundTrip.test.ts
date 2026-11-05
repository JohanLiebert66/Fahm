import 'fake-indexeddb/auto';
import { Blob as NodeBlob } from 'node:buffer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { fixtureArchive } from '../../tests/packTransferFixtures';
import { createDatabase } from './db';
import { importPack } from './importPack';
import { exportPack } from './exportPack';
import { transferBytes } from './packTransfer/bytes';

let db: ReturnType<typeof createDatabase>;
beforeEach(() => { db = createDatabase(`roundtrip-${crypto.randomUUID()}`); vi.stubGlobal('Blob', NodeBlob); });
afterEach(async () => { vi.unstubAllGlobals(); await db.delete(); });

async function contents(packId: string) {
  const stripOwner = <T extends { packId: string }>(rows: T[]) => rows.map(({ packId: omitted, ...row }) => {
    void omitted; return row;
  });
  const assets = new Map((await db.assets.where('packId').equals(packId).toArray()).map((asset) => [asset.id, asset]));
  const bindings = await Promise.all((await db.bindings.where('packId').equals(packId).toArray()).map(async (binding) => {
    const asset = assets.get(binding.assetId)!;
    return { itemId: binding.itemId, role: binding.role, order: binding.order,
      credit: asset.credit, license: asset.license, mime: asset.mime, size: asset.size,
      bytes: [...await transferBytes(asset.blob)] };
  }));
  return { items: stripOwner(await db.items.where('packId').equals(packId).toArray()),
    texts: stripOwner(await db.texts.where('packId').equals(packId).toArray()),
    annotations: stripOwner(await db.annotations.where('packId').equals(packId).toArray()),
    bindings: bindings.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))) };
}

it.each([false, true])('round-trips the full synthetic fixture with exact payloads (backslashes=%s)', async (backslashes) => {
  const imported = await importPack(db, await fixtureArchive('wrapped/', backslashes));
  expect(imported.status).toBe('imported');
  const before = await contents(imported.packId!);
  const exported = await exportPack(db, imported.packId!);
  expect(exported.ok).toBe(true);
  if (!exported.ok) throw new Error('Expected exported pack');
  const again = await importPack(db, await transferBytes(exported.value), { conflict: 'copy' });
  expect(again).toMatchObject({ status: 'imported', packId: `${imported.packId}-2` });
  expect(await contents(again.packId!)).toEqual(before);
  expect(await contents(imported.packId!)).toEqual(before);
});

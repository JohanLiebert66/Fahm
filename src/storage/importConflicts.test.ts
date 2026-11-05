import 'fake-indexeddb/auto';
import { Blob as NodeBlob } from 'node:buffer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { fixtureArchive } from '../../tests/packTransferFixtures';
import { seedPack, snapshot } from '../../tests/storageFixtures';
import pack from '../../tests/fixtures/en-vocab/pack.json';
import { createDatabase } from './db';
import { importPack } from './importPack';

let db: ReturnType<typeof createDatabase>;
beforeEach(() => { db = createDatabase(`conflicts-${crypto.randomUUID()}`); vi.stubGlobal('Blob', NodeBlob); });
afterEach(async () => { vi.unstubAllGlobals(); await db.delete(); });

it('leaves every original and unrelated row untouched when importing as copy', async () => {
  await seedPack(db, pack.id);
  await seedPack(db, 'unrelated');
  const before = await snapshot(db);
  const source = await fixtureArchive();
  expect(await importPack(db, source)).toMatchObject({ status: 'conflict', packId: pack.id });
  expect(await snapshot(db)).toEqual(before);
  const result = await importPack(db, source, { conflict: 'copy' });
  expect(result).toMatchObject({ status: 'imported', packId: `${pack.id}-2` });
  const withoutCopy = Object.fromEntries(Object.entries(await snapshot(db)).map(([table, rows]) =>
    [table, (rows as { packId?: string; id?: string }[]).filter((row) => row.packId !== result.packId
      && !(table === 'packs' && row.id === result.packId))]));
  expect(withoutCopy).toEqual(before);
});

it('replaces edits and recordings, keeps only surviving-item progress, and isolates other packs', async () => {
  const old = await seedPack(db, pack.id);
  await seedPack(db, 'unrelated');
  await db.progress.put({ ...old.progress, itemId: 'removed-item' });
  await db.progress.put({ ...old.progress, profileId: 'second-profile' });
  const unrelatedBefore = Object.fromEntries(await Promise.all(db.tables.map(async (table) =>
    [table.name, (await table.toArray()).filter((row) => row.packId === 'unrelated'
      || table.name === 'packs' && row.id === 'unrelated')])));
  const result = await importPack(db, await fixtureArchive(), { conflict: 'replace' });
  expect(result.status).toBe('imported');
  expect(await db.assets.get(old.asset.id)).toBeUndefined();
  expect(await db.bindings.get(old.binding.id)).toBeUndefined();
  const progress = await db.progress.where('packId').equals(pack.id).toArray();
  expect(progress).toHaveLength(2);
  expect(progress.every((row) => row.itemId === old.item.id)).toBe(true);
  expect(progress).toEqual(expect.arrayContaining([old.progress, { ...old.progress, profileId: 'second-profile' }]));
  const unrelatedAfter = Object.fromEntries(await Promise.all(db.tables.map(async (table) =>
    [table.name, (await table.toArray()).filter((row) => row.packId === 'unrelated'
      || table.name === 'packs' && row.id === 'unrelated')])));
  expect(unrelatedAfter).toEqual(unrelatedBefore);
});

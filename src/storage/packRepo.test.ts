import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { seedPack, storageRecords } from '../../tests/storageFixtures';
import { createDatabase } from './db';
import { packRepo } from './packRepo';

let db: ReturnType<typeof createDatabase>;
beforeEach(() => { db = createDatabase(`pack-${crypto.randomUUID()}`); });
afterEach(async () => { await db.delete(); });

it('creates, reads, replaces, lists and removes pack metadata', async () => {
  const repo = packRepo(db);
  const { pack } = storageRecords();
  expect(await repo.create(pack)).toEqual({ ok: true, value: pack.id });
  expect(await repo.get(pack.id)).toEqual({ ok: true, value: pack });
  const updated = { ...pack, importedAt: 2 };
  expect(await repo.put(updated)).toEqual({ ok: true, value: pack.id });
  expect(await repo.list()).toEqual({ ok: true, value: [updated] });
  expect(await repo.remove(pack.id)).toEqual({ ok: true, value: undefined });
  expect(await repo.get(pack.id)).toEqual({ ok: true, value: undefined });
});

it('rejects invalid metadata before mutating storage', async () => {
  const repo = packRepo(db);
  const { pack } = storageRecords();
  expect(await repo.create({ ...pack, id: 'different-id' })).toMatchObject({
    ok: false, error: { code: 'InvalidData' },
  });
  expect(await db.packs.count()).toBe(0);
});

it('uses the atomic cascade when removing a pack through the repository', async () => {
  const row = await seedPack(db, 'remove-me');
  expect(await packRepo(db).remove(row.pack.id)).toEqual({ ok: true, value: undefined });
  for (const table of [db.items, db.texts, db.annotations, db.assets, db.bindings, db.progress]) {
    expect(await table.where('packId').equals(row.pack.id).count()).toBe(0);
  }
});

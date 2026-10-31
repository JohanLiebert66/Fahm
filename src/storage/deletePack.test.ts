import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { seedPack, snapshot } from '../../tests/storageFixtures';
import { createDatabase } from './db';
import { deletePack } from './deletePack';

let db: ReturnType<typeof createDatabase>;
beforeEach(() => { db = createDatabase(`delete-${crypto.randomUUID()}`); });
afterEach(async () => { await db.delete(); });

it('removes every pack-owned row while leaving other packs, profiles and settings untouched', async () => {
  const row = await seedPack(db, 'remove-me');
  await seedPack(db, 'keep-me');
  await db.profiles.add({ ...row.profile, id: 'second-profile' });
  await db.progress.add({ ...row.progress, profileId: 'second-profile' });
  await db.bindings.add({ ...row.binding, id: crypto.randomUUID(), role: 'puzzle', itemId: undefined });
  const before = await snapshot(db);
  expect(await deletePack(db, 'remove-me')).toEqual({ ok: true, value: undefined });
  expect(await db.packs.get('remove-me')).toBeUndefined();
  for (const table of [db.items, db.texts, db.annotations, db.assets, db.bindings, db.progress]) {
    expect(await table.where('packId').equals('remove-me').count()).toBe(0);
    expect(await table.toArray()).toEqual(before[table.name].filter((record: { packId: string }) => record.packId !== 'remove-me'));
  }
  expect(await db.packs.toArray()).toEqual(before.packs.filter((record: { id: string }) => record.id !== 'remove-me'));
  expect(await db.profiles.toArray()).toEqual(before.profiles);
  expect(await db.settings.toArray()).toEqual(before.settings);
  expect(await deletePack(db, 'remove-me')).toEqual({ ok: true, value: undefined });
});

it('rolls back pack deletion if an actual Dexie delete hook fails midway', async () => {
  await seedPack(db, 'remove-me');
  await seedPack(db, 'keep-me');
  const before = await snapshot(db);
  let reached = false;
  const fail = () => { reached = true; throw new Error('forced asset deletion failure'); };
  db.assets.hook('deleting', fail);
  expect(await deletePack(db, 'remove-me')).toMatchObject({ ok: false, error: { code: 'WriteFailed' } });
  db.assets.hook('deleting').unsubscribe(fail);
  expect(reached).toBe(true);
  expect(await snapshot(db)).toEqual(before);
});

it('rejects invalid pack ids without changing data', async () => {
  await seedPack(db, 'keep-me');
  const before = await snapshot(db);
  expect(await deletePack(db, '')).toMatchObject({ ok: false, error: { code: 'InvalidData' } });
  expect(await snapshot(db)).toEqual(before);
});

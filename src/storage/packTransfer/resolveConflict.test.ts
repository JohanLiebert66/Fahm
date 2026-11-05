import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { createDatabase } from '../db';
import { storageRecords } from '../../../tests/storageFixtures';
import { resolveConflict } from './resolveConflict';

let db: ReturnType<typeof createDatabase>;
beforeEach(() => { db = createDatabase(`conflict-${crypto.randomUUID()}`); });
afterEach(async () => { await db.delete(); });

it('uses the original id for a first import regardless of conflict preference', async () => {
  expect(await resolveConflict(db, 'new-pack', 'copy')).toEqual(
    { status: 'imported', packId: 'new-pack', replace: false });
});

it('finds the first free copy suffix without creating or deleting records', async () => {
  await db.packs.bulkAdd(['existing', 'existing-2', 'existing-4'].map((id) => storageRecords(id).pack));
  expect(await resolveConflict(db, 'existing')).toEqual({ status: 'conflict', packId: 'existing', replace: false });
  expect(await resolveConflict(db, 'existing', 'copy')).toEqual({ status: 'imported', packId: 'existing-3', replace: false });
  expect(await resolveConflict(db, 'existing', 'replace')).toEqual({ status: 'imported', packId: 'existing', replace: true });
  expect(await db.packs.count()).toBe(3);
});

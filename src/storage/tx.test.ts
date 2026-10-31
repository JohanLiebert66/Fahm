import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { seedPack, snapshot, storageRecords } from '../../tests/storageFixtures';
import { createDatabase } from './db';
import { runTransaction, storageErrorKeys } from './tx';

let db: ReturnType<typeof createDatabase>;
beforeEach(() => { db = createDatabase(`tx-${crypto.randomUUID()}`); });
afterEach(async () => { await db.delete(); });

describe('transactions', () => {
  it('rolls back every table after real writes and a forced failure midway', async () => {
    await seedPack(db, 'existing');
    const before = await snapshot(db);
    const row = storageRecords('new-pack');
    const result = await runTransaction(db, db.tables, async () => {
      await db.packs.add(row.pack);
      await db.items.add(row.item);
      await db.texts.add(row.text);
      await db.annotations.add(row.annotation);
      await db.assets.add(row.asset);
      await db.bindings.clear();
      await db.progress.clear();
      await db.profiles.clear();
      await db.settings.clear();
      // Read our own writes before aborting, not a failure before any mutations.
      expect(await db.packs.count()).toBe(2);
      expect(await db.bindings.count()).toBe(0);
      throw new Error('forced midway failure');
    });
    expect(result).toMatchObject({ ok: false, error: { code: 'WriteFailed' } });
    expect(await snapshot(db)).toEqual(before);
  });

  it.each([
    ['QuotaExceededError', 'QuotaExceeded'], ['MissingAPIError', 'StorageUnavailable'],
    ['SecurityError', 'StorageUnavailable'], ['InvalidStateError', 'StorageUnavailable'],
    ['DataError', 'InvalidData'], ['DataCloneError', 'InvalidData'], ['Error', 'WriteFailed'],
  ] as const)('maps %s to %s without throwing', async (name, code) => {
    const result = await runTransaction(db, [db.packs], async () => {
      throw Object.assign(new Error('test failure'), { name });
    });
    expect(result).toMatchObject({ ok: false, error: { code, messageKey: storageErrorKeys[code] } });
    if (!result.ok) expect(result.error.nextStepKey).toMatch(/^storage\.action\./);
  });

  it('reports success only after commit and returns the operation value', async () => {
    const row = storageRecords();
    const result = await runTransaction(db, [db.packs], async () => {
      await db.packs.add(row.pack);
      return row.pack.id;
    });
    expect(result).toEqual({ ok: true, value: row.pack.id });
    expect(await db.packs.get(row.pack.id)).toEqual(row.pack);
  });
});

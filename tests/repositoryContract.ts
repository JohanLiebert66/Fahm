import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { createDatabase, type FahmDatabase } from '../src/storage/db';
import type { StorageResult } from '../src/storage/tx';

interface Repository<T, Key> {
  create(row: T): Promise<StorageResult<Key>>;
  put(row: T): Promise<StorageResult<Key>>;
  get(key: Key): Promise<StorageResult<T | undefined>>;
  list(): Promise<StorageResult<T[]>>;
  remove(key: Key): Promise<StorageResult<void>>;
  listByPack?(packId: string): Promise<StorageResult<T[]>>;
}

export function repositoryContract<T, Key>(
  factory: (db: FahmDatabase) => Repository<T, Key>,
  rows: () => { original: T; updated: T; invalid: T; key: Key; packId?: string },
) {
  let db: FahmDatabase;
  beforeEach(() => { db = createDatabase(`repo-${crypto.randomUUID()}`); });
  afterEach(async () => { await db.delete(); });
  it('creates, reads, replaces, lists and removes its records', async () => {
    const repo = factory(db);
    const { original, updated, key, packId } = rows();
    expect(await repo.create(original)).toEqual({ ok: true, value: key });
    expect(await repo.get(key)).toEqual({ ok: true, value: original });
    expect(await repo.put(updated)).toEqual({ ok: true, value: key });
    expect(await repo.get(key)).toEqual({ ok: true, value: updated });
    expect(await repo.list()).toEqual({ ok: true, value: [updated] });
    if (repo.listByPack && packId) {
      expect(await repo.listByPack(packId)).toEqual({ ok: true, value: [updated] });
      expect(await repo.listByPack('absent-pack')).toEqual({ ok: true, value: [] });
    }
    expect(await repo.remove(key)).toEqual({ ok: true, value: undefined });
    expect(await repo.get(key)).toEqual({ ok: true, value: undefined });
  });
  it('rejects invalid writes and preserves the existing record', async () => {
    const repo = factory(db);
    const { original, invalid, key } = rows();
    expect((await repo.create(original)).ok).toBe(true);
    expect(await repo.put(invalid)).toMatchObject({ ok: false, error: { code: 'InvalidData' } });
    expect(await repo.get(key)).toEqual({ ok: true, value: original });
  });
  it('rejects duplicate creation without replacing data', async () => {
    const repo = factory(db);
    const { original, updated, key } = rows();
    await repo.create(original);
    expect(await repo.create(updated)).toMatchObject({ ok: false, error: { code: 'InvalidData' } });
    expect(await repo.get(key)).toEqual({ ok: true, value: original });
  });
}

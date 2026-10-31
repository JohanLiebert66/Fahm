import type { Table } from 'dexie';
import type { ZodType } from 'zod';
import type { FahmDatabase } from './db';
import { runTransaction, storageFailure, type StorageResult } from './tx';

/** Shared mechanics only; each repository owns its table and schema. */
export function recordRepo<T, Key>(db: FahmDatabase, table: Table<T, Key>, schema: ZodType<T>) {
  async function write(input: T, replace: boolean): Promise<StorageResult<Key>> {
    const parsed = schema.safeParse(input);
    if (!parsed.success) return storageFailure('InvalidData');
    return runTransaction(db, [table], () => replace ? table.put(parsed.data) : table.add(parsed.data));
  }
  return {
    create: (input: T) => write(input, false),
    put: (input: T) => write(input, true),
    get: (key: Key) => runTransaction(db, [table], () => table.get(key), 'r'),
    list: () => runTransaction(db, [table], () => table.toArray(), 'r'),
    listByPack: (packId: string) => runTransaction(db, [table],
      () => table.where('packId').equals(packId).toArray(), 'r'),
    remove: (key: Key) => runTransaction(db, [table], () => table.delete(key)),
  };
}

import type { FahmDatabase } from './db';
import { packSchema } from '../core/pack/schema';
import { runTransaction, storageFailure, type StorageResult } from './tx';

export async function deletePack(db: FahmDatabase, packId: string): Promise<StorageResult<void>> {
  if (!packSchema.shape.id.safeParse(packId).success) return storageFailure('InvalidData');
  const owned = [db.items, db.texts, db.annotations, db.bindings, db.assets, db.progress];
  return runTransaction(db, [db.packs, ...owned], async () => {
    for (const table of owned) await table.where('packId').equals(packId).delete();
    await db.packs.delete(packId);
  });
}

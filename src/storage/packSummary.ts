import type { FahmDatabase } from './db';
import type { Pack } from '../core/pack/types';
import { runTransaction, type StorageResult } from './tx';

export interface PackSummary {
  id: string;
  meta: Pack;
  importedAt: number;
  textCount: number;
  itemCount: number;
}

export async function getPackSummaries(db: FahmDatabase): Promise<StorageResult<PackSummary[]>> {
  return runTransaction(db, [db.packs, db.texts, db.items], async () => {
    const packs = await db.packs.toArray();
    return Promise.all(
      packs.map(async pack => {
        const [textCount, itemCount] = await Promise.all([
          db.texts.where('packId').equals(pack.id).count(),
          db.items.where('packId').equals(pack.id).count(),
        ]);
        return {
          id: pack.id,
          meta: pack.meta,
          importedAt: pack.importedAt,
          textCount,
          itemCount,
        };
      }),
    );
  }, 'r');
}

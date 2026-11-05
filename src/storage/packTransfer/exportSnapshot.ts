import type { FahmDatabase } from '../db';
import type { StoredAnnotation, StoredAsset, StoredBinding, StoredItem, StoredPack, StoredText } from '../records';
import { runTransaction } from '../tx';

export interface ExportSnapshot {
  pack: StoredPack; items: StoredItem[]; texts: StoredText[];
  annotations: StoredAnnotation[]; assets: StoredAsset[]; bindings: StoredBinding[];
}

export function exportSnapshot(db: FahmDatabase, packId: string) {
  return runTransaction(db, [db.packs, db.items, db.texts, db.annotations, db.assets, db.bindings], async () => {
    const pack = await db.packs.get(packId);
    if (!pack) throw new TypeError('Unknown pack');
    const [items, texts, annotations, assets, bindings] = await Promise.all(
      [db.items, db.texts, db.annotations, db.assets, db.bindings].map((table) =>
        table.where('packId').equals(packId).toArray()),
    );
    return { pack, items, texts, annotations, assets, bindings } as ExportSnapshot;
  }, 'r');
}

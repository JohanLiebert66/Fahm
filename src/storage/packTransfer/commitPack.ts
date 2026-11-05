import type { PackContents } from '../../core/pack/types';
import type { FahmDatabase } from '../db';
import { runTransaction, type StorageResult } from '../tx';
import type { AppliedAssets } from './applyBindings';
import { resolveConflict } from './resolveConflict';

export async function commitPack(
  db: FahmDatabase, contents: PackContents, applied: AppliedAssets, conflict?: 'copy' | 'replace',
): Promise<StorageResult<{ status: 'imported' | 'conflict'; packId: string }>> {
  return runTransaction(db, [db.packs, db.items, db.texts, db.annotations, db.assets, db.bindings, db.progress], async () => {
    const decision = await resolveConflict(db, contents.pack.id, conflict);
    const { packId } = decision;
    if (decision.status === 'conflict') return { status: 'conflict' as const, packId };
    if (decision.replace) {
      for (const table of [db.items, db.texts, db.annotations, db.assets, db.bindings]) {
        await table.where('packId').equals(packId).delete();
      }
      const survivors = new Set(contents.items.map((item) => item.id));
      await db.progress.where('packId').equals(packId).filter((row) => !survivors.has(row.itemId)).delete();
      await db.packs.delete(packId);
    }
    await db.packs.add({ id: packId, meta: { ...contents.pack, id: packId }, importedAt: Date.now() });
    await db.items.bulkAdd(contents.items.map((item) => ({ ...item, packId })));
    await db.texts.bulkAdd(Object.values(contents.texts).map((text) => ({ ...text, packId })));
    await db.annotations.bulkAdd(Object.entries(contents.annotations).flatMap(([textId, annotations]) =>
      annotations.map((annotation) => ({ ...annotation, textId, packId }))));
    await db.assets.bulkAdd(applied.assets.map((asset) => ({ ...asset, packId })));
    await db.bindings.bulkAdd(applied.bindings.map((binding) => ({ ...binding, packId })));
    return { status: 'imported' as const, packId };
  });
}

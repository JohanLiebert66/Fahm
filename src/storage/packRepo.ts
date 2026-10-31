import type { FahmDatabase } from './db';
import { recordRepo } from './recordRepo';
import { storedPackSchema } from './recordSchemas';
import { deletePack } from './deletePack';

export function packRepo(db: FahmDatabase) {
  const { listByPack, ...repo } = recordRepo(db, db.packs, storedPackSchema);
  void listByPack;
  return { ...repo, remove: (packId: string) => deletePack(db, packId) };
}

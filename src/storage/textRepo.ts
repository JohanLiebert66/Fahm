import type { FahmDatabase } from './db';
import { recordRepo } from './recordRepo';
import { storedTextSchema } from './recordSchemas';

export function textRepo(db: FahmDatabase) {
  // Texts are immutable after import: no replacement/update operation.
  const { put, ...repo } = recordRepo(db, db.texts, storedTextSchema);
  void put;
  return repo;
}

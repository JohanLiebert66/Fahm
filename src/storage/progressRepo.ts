import type { FahmDatabase } from './db';
import { recordRepo } from './recordRepo';
import { storedProgressSchema } from './recordSchemas';

export function progressRepo(db: FahmDatabase) {
  return recordRepo(db, db.progress, storedProgressSchema);
}

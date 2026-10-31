import type { FahmDatabase } from './db';
import { recordRepo } from './recordRepo';
import { storedItemSchema } from './recordSchemas';

export function itemRepo(db: FahmDatabase) {
  return recordRepo(db, db.items, storedItemSchema);
}

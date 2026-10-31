import type { FahmDatabase } from './db';
import { recordRepo } from './recordRepo';
import { storedBindingSchema } from './recordSchemas';

export function bindingRepo(db: FahmDatabase) {
  return recordRepo(db, db.bindings, storedBindingSchema);
}

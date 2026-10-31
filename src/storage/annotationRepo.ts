import type { FahmDatabase } from './db';
import { recordRepo } from './recordRepo';
import { storedAnnotationSchema } from './recordSchemas';

export function annotationRepo(db: FahmDatabase) {
  return recordRepo(db, db.annotations, storedAnnotationSchema);
}

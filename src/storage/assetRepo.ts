import type { FahmDatabase } from './db';
import { recordRepo } from './recordRepo';
import { storedAssetSchema } from './recordSchemas';

export function assetRepo(db: FahmDatabase) {
  return recordRepo(db, db.assets, storedAssetSchema);
}

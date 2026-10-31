import type { FahmDatabase } from './db';
import { recordRepo } from './recordRepo';
import { storedProfileSchema } from './recordSchemas';
import type { StoredProfile } from './records';
import { runTransaction, storageFailure, type StorageResult } from './tx';

export function profileRepo(db: FahmDatabase) {
  const { listByPack, ...repo } = recordRepo(db, db.profiles, storedProfileSchema);
  void listByPack;
  async function ensureDefault(details: Pick<StoredProfile, 'name' | 'avatar'>): Promise<StorageResult<StoredProfile>> {
    // The caller supplies a localized name; storage contains no UI text.
    const parsed = storedProfileSchema.safeParse({ ...details, id: 'default', createdAt: Date.now() });
    if (!parsed.success) return storageFailure('InvalidData');
    return runTransaction(db, [db.profiles], async () => {
      const existing = await db.profiles.get('default');
      if (existing) return existing;
      await db.profiles.add(parsed.data);
      return parsed.data;
    });
  }
  return { ...repo, ensureDefault };
}

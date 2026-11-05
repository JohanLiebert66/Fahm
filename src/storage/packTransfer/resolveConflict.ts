import type { FahmDatabase } from '../db';

/** Run inside the import transaction so simultaneous imports cannot claim one id. */
export async function resolveConflict(db: FahmDatabase, sourceId: string, choice?: 'copy' | 'replace') {
  const exists = !!await db.packs.get(sourceId);
  if (exists && !choice) return { status: 'conflict' as const, packId: sourceId, replace: false };
  if (!exists || choice === 'replace') {
    return { status: 'imported' as const, packId: sourceId, replace: exists };
  }
  let suffix = 2;
  while (await db.packs.get(`${sourceId}-${suffix}`)) suffix++;
  return { status: 'imported' as const, packId: `${sourceId}-${suffix}`, replace: false };
}

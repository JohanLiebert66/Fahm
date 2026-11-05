import type { FahmDatabase } from './db';
import { mapStorageError, type StorageResult } from './tx';
import { buildArchive } from './packTransfer/buildArchive';
import { exportSnapshot } from './packTransfer/exportSnapshot';

export async function exportPack(db: FahmDatabase, packId: string): Promise<StorageResult<Blob>> {
  const snapshot = await exportSnapshot(db, packId);
  if (!snapshot.ok) return snapshot;
  try {
    return { ok: true, value: await buildArchive(snapshot.value) };
  } catch (error) {
    return mapStorageError(error);
  }
}

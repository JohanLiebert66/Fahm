import { mapStorageError, storageFailure, type StorageResult } from './tx';

export async function requestPersistence(): Promise<StorageResult<boolean>> {
  try {
    const storage = typeof navigator === 'undefined' ? undefined : navigator?.storage;
    if (typeof storage?.persist !== 'function') return storageFailure('StorageUnavailable');
    const value: unknown = await storage.persist();
    return typeof value === 'boolean' ? { ok: true, value } : storageFailure('InvalidData');
  } catch (error) {
    return mapStorageError(error);
  }
}

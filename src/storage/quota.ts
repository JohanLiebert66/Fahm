import { z } from 'zod';
import { mapStorageError, storageFailure, type StorageResult } from './tx';

const estimateSchema = z.object({
  usage: z.number().finite().nonnegative().optional(),
  quota: z.number().finite().nonnegative().optional(),
}).passthrough();

export async function estimateQuota(): Promise<StorageResult<StorageEstimate>> {
  try {
    const storage = typeof navigator === 'undefined' ? undefined : navigator?.storage;
    if (typeof storage?.estimate !== 'function') return storageFailure('StorageUnavailable');
    const parsed = estimateSchema.safeParse(await storage.estimate());
    return parsed.success ? { ok: true, value: parsed.data } : storageFailure('InvalidData');
  } catch (error) {
    return mapStorageError(error);
  }
}

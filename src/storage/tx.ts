import type { Table } from 'dexie';
import type { FahmDatabase } from './db';

export const storageErrorKeys = {
  QuotaExceeded: 'storage.error.quota', StorageUnavailable: 'storage.error.unavailable',
  WriteFailed: 'storage.error.write', InvalidData: 'storage.error.invalidData',
} as const;
export type StorageErrorCode = keyof typeof storageErrorKeys;
export type StorageError = {
  [Code in StorageErrorCode]: {
    code: Code; messageKey: typeof storageErrorKeys[Code];
    nextStepKey: string;
  }
}[StorageErrorCode];
export type StorageResult<T> = { ok: true; value: T } | { ok: false; error: StorageError };

export function storageFailure(code: StorageErrorCode): { ok: false; error: StorageError } {
  return { ok: false, error: { code, messageKey: storageErrorKeys[code],
    nextStepKey: code === 'QuotaExceeded' ? 'storage.action.freeSpaceOrBackup'
      : code === 'StorageUnavailable' ? 'storage.action.useSupportedBrowser'
      : code === 'InvalidData' ? 'storage.action.checkData' : 'storage.action.retryOrBackup',
  } as StorageError };
}

export function mapStorageError(error: unknown): { ok: false; error: StorageError } {
  const name = typeof error === 'object' && error !== null && 'name' in error ? error.name : '';
  if (name === 'QuotaExceededError') return storageFailure('QuotaExceeded');
  if (['MissingAPIError', 'SecurityError', 'InvalidStateError', 'DatabaseClosedError',
    'OpenFailedError', 'VersionError'].includes(String(name))) return storageFailure('StorageUnavailable');
  if (['DataError', 'DataCloneError', 'ConstraintError', 'TypeError', 'SyntaxError']
    .includes(String(name))) return storageFailure('InvalidData');
  return storageFailure('WriteFailed');
}

export async function runTransaction<T>(
  db: FahmDatabase, tables: Table[], operation: () => Promise<T>, mode: 'r' | 'rw' = 'rw',
): Promise<StorageResult<T>> {
  try {
    const value = await db.transaction(mode, tables, operation);
    return { ok: true, value };
  } catch (error) {
    return mapStorageError(error);
  }
}

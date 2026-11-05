import type { PackLimits } from '../../core/pack/limits';
import type { PackIssue } from '../../core/pack/types';

export interface TransferEntry { path: string; bytes: Uint8Array; mime?: string }
export type TransferSource = Blob | Uint8Array | readonly File[];
export interface ReadOptions {
  limits?: Partial<PackLimits> & { rawEntries?: number };
  onChunk?: (path: string, bytes: number) => void;
}

export function rawEntryLimit(options: ReadOptions): number {
  const value = options.limits?.rawEntries;
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 10000 ? value : 10000;
}

export function transferFailure(message: string, file = ''): Error & { issues: PackIssue[] } {
  return Object.assign(new Error(message), { issues: [{ file, path: '$', message }] });
}

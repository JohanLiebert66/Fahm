import type { PackLimits } from '../../core/pack/limits';
import type { PackIssue } from '../../core/pack/types';

export interface TransferEntry { path: string; bytes: Uint8Array; mime?: string }
export type TransferSource = Blob | Uint8Array | readonly File[];
export interface ReadOptions {
  limits?: Partial<PackLimits>;
  onChunk?: (path: string, bytes: number) => void;
}

export function transferFailure(message: string, file = ''): Error & { issues: PackIssue[] } {
  return Object.assign(new Error(message), { issues: [{ file, path: '$', message }] });
}

import type { PackIssue } from '../../core/pack/types';
import type { StorageError } from '../tx';
import type { ReadOptions } from './types';

export interface ImportOptions extends ReadOptions { conflict?: 'copy' | 'replace' }
export interface ImportCounts {
  items: number; texts: number; annotations: number; assets: number; unbound: number;
}
export interface ImportReport {
  status: 'imported' | 'conflict' | 'failed';
  packId?: string;
  counts: ImportCounts;
  errors: PackIssue[];
  warnings: PackIssue[];
  storageError?: StorageError;
}

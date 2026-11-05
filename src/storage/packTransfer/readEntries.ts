import { z } from 'zod';
import { resolveLimits } from '../../core/pack/limits';
import { readFolder } from './readFolder';
import { readZip } from './readZip';
import { type ReadOptions, type TransferEntry, type TransferSource, transferFailure } from './types';

const folderSchema = z.array(z.custom<File>((value) => {
  if (!value || typeof value !== 'object') return false;
  const file = value as File;
  return typeof file.name === 'string' && typeof file.slice === 'function'
    && Number.isSafeInteger(file.size) && file.size >= 0;
}));

export async function readEntries(source: TransferSource, options: ReadOptions = {}): Promise<TransferEntry[]> {
  if (source instanceof Uint8Array || source instanceof Blob) return readZip(source, options);
  if (Array.isArray(source) && source.length > Math.min(resolveLimits(options.limits).entries, 2000)) {
    throw transferFailure('packImport.error.entries');
  }
  const folder = folderSchema.safeParse(source);
  if (!folder.success) throw transferFailure('packImport.error.format');
  return readFolder(folder.data, options);
}

import { mimeFromPath, normalizePackPaths } from '../../core/binding/filenames';
import { entryByteLimit, resolveLimits } from '../../core/pack/limits';
import { transferBytes } from './bytes';
import { type ReadOptions, type TransferEntry, transferFailure } from './types';

async function readFile(file: File, path: string, accept: (chunk: Uint8Array) => void): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  let length = 0;
  const consume = (chunk: Uint8Array) => {
    accept(chunk);
    chunks.push(chunk);
    length += chunk.byteLength;
  };
  try {
    if (typeof file.stream === 'function') {
      const reader = file.stream().getReader();
      let done = false;
      try {
        while (true) {
          const result = await reader.read();
          if (result.done) { done = true; break; }
          consume(result.value);
        }
      } finally {
        if (!done) await reader.cancel().catch(() => undefined);
        reader.releaseLock();
      }
    } else {
      for (let offset = 0; offset < file.size; offset += 16384) {
        consume(await transferBytes(file.slice(offset, offset + 16384)));
      }
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return bytes;
  } catch (error) {
    if (error instanceof Error && 'issues' in error) throw error;
    throw transferFailure('packImport.error.read', path);
  } finally { chunks.length = 0; }
}

export async function readFolder(files: readonly File[], options: ReadOptions = {}): Promise<TransferEntry[]> {
  const limits = resolveLimits(options.limits);
  if (files.length > Math.min(limits.entries, 2000)) throw transferFailure('packImport.error.entries');
  const names = files.map((file) => file.webkitRelativePath || (file as File & { relativePath?: string }).relativePath || file.name);
  const normalized = normalizePackPaths(names);
  if (!normalized.ok) throw Object.assign(new Error('packImport.error.path'), { issues: normalized.errors });
  const entries: TransferEntry[] = [];
  let total = 0;
  for (let i = 0; i < files.length; i++) {
    const path = normalized.value[i]!;
    if (!path || path.endsWith('/')) continue;
    let size = 0;
    const bytes = await readFile(files[i]!, path, (chunk) => {
      size += chunk.byteLength;
      total += chunk.byteLength;
      options.onChunk?.(path, chunk.byteLength);
      if (total > limits.totalBytes) throw transferFailure('packImport.error.total', path);
      if (size > entryByteLimit(path, limits)) {
        throw transferFailure(path.startsWith('audio/') ? 'packImport.error.audio' : 'packImport.error.image', path);
      }
    });
    entries.push({ path, bytes, mime: files[i]!.type || mimeFromPath(path) });
  }
  return entries;
}

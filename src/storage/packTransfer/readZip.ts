import JSZip from 'jszip';
import { mimeFromPath, normalizePackPaths } from '../../core/binding/filenames';
import { entryByteLimit, resolveLimits } from '../../core/pack/limits';
import { transferBytes } from './bytes';
import { type ReadOptions, type TransferEntry, rawEntryLimit, transferFailure } from './types';
import { zipDirectory } from './zipDirectory';

type StreamedFile = JSZip.JSZipObject & {
  internalStream(type: 'uint8array'): JSZip.JSZipStreamHelper<Uint8Array>;
};

function zipName(name: string, directory = false): string {
  const path = name.replaceAll('\\', '/').normalize('NFC');
  // JSZip appends '/' to Windows directory names that already end in '\\'.
  return directory ? path.replace(/\/+$/, '/') : path;
}

function inflate(file: JSZip.JSZipObject, accept: (chunk: Uint8Array) => void): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    let length = 0;
    let stopped = false;
    const stream = (file as StreamedFile).internalStream('uint8array');
    const fail = (error: unknown) => {
      if (stopped) return;
      stopped = true;
      // JSZip exposes pause, not cancellation: stop future compressed input.
      // Its current synchronous inflate call may still emit; discard it below.
      stream.pause(); // Never resume after failure or retain the overflow chunk.
      chunks.length = 0;
      reject(error);
    };
    stream.on('data', (chunk) => {
      if (stopped) return;
      try { accept(chunk); }
      catch (error) { fail(error); return; }
      chunks.push(chunk);
      length += chunk.byteLength;
    });
    stream.on('error', () => fail(transferFailure('packImport.error.archive', file.name)));
    stream.on('end', () => {
      if (stopped) return;
      const bytes = new Uint8Array(length);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      chunks.length = 0;
      stopped = true;
      resolve(bytes);
    });
    stream.resume();
  });
}

export async function readZip(source: Blob | Uint8Array, options: ReadOptions = {}): Promise<TransferEntry[]> {
  const limits = resolveLimits(options.limits);
  const size = source instanceof Uint8Array ? source.byteLength : source.size;
  if (size > limits.totalBytes) throw transferFailure('packImport.error.total');
  let bytes: Uint8Array;
  try { bytes = source instanceof Uint8Array ? source : await transferBytes(source); }
  catch { throw transferFailure('packImport.error.read'); }
  const names = zipDirectory(bytes, limits.entries, rawEntryLimit(options));
  const normalized = normalizePackPaths(names, true);
  if (!normalized.ok && normalized.errors.some(issue => issue.message !== 'packImport.error.noPack')) {
    throw Object.assign(new Error('packImport.error.path'), { issues: normalized.errors });
  }
  let zip: JSZip;
  try { zip = await JSZip.loadAsync(bytes, { createFolders: false, checkCRC32: false }); }
  catch { throw transferFailure('packImport.error.archive'); }

  const loadedFiles = Object.values(zip.files).filter(file => !file.dir);
  const decoded = normalizePackPaths(loadedFiles.map(file => file.unsafeOriginalName ?? file.name), true);
  if (!decoded.ok) throw Object.assign(new Error('packImport.error.path'), { issues: decoded.errors });
  if (!normalized.ok) throw Object.assign(new Error('packImport.error.noPack'), { issues: normalized.errors });
  if (loadedFiles.length !== names.length) throw transferFailure('packImport.error.duplicate');
  const loaded = new Map(loadedFiles.map(file =>
    [zipName(file.unsafeOriginalName ?? file.name, file.dir), file]));

  for (const name of names) {
    if (!loaded.has(zipName(name))) {
      throw transferFailure('packImport.error.path', name);
    }
  }
  let total = 0;
  const entries: TransferEntry[] = [];
  for (let i = 0; i < names.length; i++) {
    const file = loaded.get(zipName(names[i]!))!;
    if (file.dir) throw transferFailure('packImport.error.path', names[i]);
    const path = normalized.value[i]!;
    let size = 0;
    const content = await inflate(file, (chunk) => {
      size += chunk.byteLength;
      total += chunk.byteLength;
      options.onChunk?.(path, chunk.byteLength);
      if (total > limits.totalBytes) throw transferFailure('packImport.error.total', path);
      if (size > entryByteLimit(path, limits)) {
        throw transferFailure(path.startsWith('audio/') ? 'packImport.error.audio' : 'packImport.error.image', path);
      }
    });
    entries.push({ path, bytes: content, mime: mimeFromPath(path) });
  }
  return entries;
}

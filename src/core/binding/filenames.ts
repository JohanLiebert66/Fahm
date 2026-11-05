import { z } from 'zod';
import type { Binding, PackIssue } from '../pack/types';

type PathResult = { ok: true; value: string[] } | { ok: false; errors: PackIssue[] };
const safePathSchema = z.string().min(1).refine((path) => {
  const parts = path.replace(/\/$/, '').split('/');
  return !/^[a-z]:/i.test(path) && parts.every((part) => part && part !== '.' && part !== '..')
    && !/\p{Cc}/u.test(path);
});

const imageExtensions = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif']);
const audioExtensions = new Set(['mp3', 'm4a', 'webm', 'ogg', 'wav']);

function pathExtension(path: string): string {
  return /\.([^./]+)$/.exec(path)?.[1]?.toLowerCase() ?? '';
}

const extensionMimes = new Map([
  ['png', 'image/png'], ['jpg', 'image/jpeg'], ['jpeg', 'image/jpeg'], ['gif', 'image/gif'],
  ['webp', 'image/webp'], ['svg', 'image/svg+xml'], ['avif', 'image/avif'],
  ['mp3', 'audio/mpeg'], ['m4a', 'audio/mp4'], ['webm', 'audio/webm'],
  ['ogg', 'audio/ogg'], ['wav', 'audio/wav'], ['json', 'application/json'],
]);

export function mimeFromPath(path: string): string | undefined {
  return extensionMimes.get(pathExtension(path));
}

/** Canonical extension without a leading dot (JPEG exports use jpg). */
export function extensionFromMime(mime: string): string | undefined {
  const canonical = mime.split(';')[0]?.trim().toLowerCase();
  for (const [ext, type] of extensionMimes) {
    if (type === canonical) return ext;
  }
  return undefined;
}

export function filenameBinding(path: string, itemIds: ReadonlySet<string>): Binding | undefined {
  if (path.startsWith('puzzles/') && imageExtensions.has(pathExtension(path))) {
    return { path, role: 'puzzle' };
  }
  const name = path.split('/').at(-1) ?? '';
  const parts = name.split('.');
  const item = parts[0] ?? '';
  if (!itemIds.has(item)) return undefined;
  const suffix = parts.slice(1, -1).join('.');
  if (path.startsWith('audio/') && audioExtensions.has(pathExtension(path))) {
    return { path, item, role: suffix === 'explain' ? 'explanation' : 'pronunciation' };
  }
  if (!path.startsWith('images/') || !imageExtensions.has(pathExtension(path))) return undefined;
  if (suffix && !/^[1-9]\d*$/.test(suffix)) return undefined;
  const order = suffix ? Number(suffix) : 1;
  return Number.isSafeInteger(order) ? { path, item, role: 'image', order } : undefined;
}

export function normalizePackPaths(names: string[], requirePack = false): PathResult {
  const value = names.map((name) => name.replace(/\\/g, '/').normalize('NFC'));
  const errors: PackIssue[] = [];
  const rejected = new Set<number>();
  value.forEach((path, index) => {
    if (!safePathSchema.safeParse(path).success) {
      rejected.add(index);
      errors.push({ file: names[index] ?? path, path: '$', message: 'packImport.error.path' });
    } else if (path.split('/').some((part) => /\.(zip|7z|rar|tar|gz|gzip|tgz|bz2|tbz2?|xz|txz|zst|cab)$/i.test(part))) {
      rejected.add(index);
      errors.push({ file: names[index] ?? path, path: '$', message: 'packImport.error.archive' });
    }
  });
  const prefix = `${value[0]?.split('/')[0]}/`;
  const wrapped = value.includes(`${prefix}pack.json`)
    && value.every((path) => path.startsWith(prefix));
  const paths = wrapped ? value.map((path) => path.slice(prefix.length)) : value;
  if (requirePack) {
    const seen = new Set<string>();
    value.forEach((path, index) => {
      if (rejected.has(index)) return;
      if (seen.has(path.toLowerCase())) {
        errors.push({ file: names[index]!, path: '$', message: 'packImport.error.duplicate' });
      }
      seen.add(path.toLowerCase());
    });
    if (errors.length) return { ok: false, errors };
    if (!paths.includes('pack.json')) {
      return { ok: false, errors: [{ file: 'pack.json', path: '$', message: 'packImport.error.noPack' }] };
    }
  }
  const roots = new Set(['pack.json', 'items.json', 'bindings.json']);
  const folders = new Set(['texts', 'annotations', 'images', 'audio', 'puzzles']);
  const seen = new Set<string>();
  paths.forEach((path, index) => {
    if (rejected.has(index)) return;
    const key = value[index]!.toLowerCase();
    if (seen.has(key)) {
      errors.push({ file: names[index] ?? path, path: '$', message: 'packImport.error.duplicate' });
    }
    seen.add(key);
    if (!path) return;
    const folder = path.split('/')[0] ?? '';
    if (!roots.has(path) && !(path.includes('/') && folders.has(folder))) {
      errors.push({ file: names[index] ?? path, path: '$', message: 'packImport.error.path' });
    } else if (!roots.has(path) && !path.endsWith('/')) {
      const ext = pathExtension(path);
      const supported = folder === 'audio' ? audioExtensions.has(ext)
        : folder === 'images' || folder === 'puzzles' ? imageExtensions.has(ext) : ext === 'json';
      if (!supported) {
        errors.push({ file: names[index] ?? path, path: '$', message: 'packImport.error.format' });
      }
    }
  });
  return errors.length ? { ok: false, errors } : { ok: true, value: paths };
}

import type { PackInput, PackIssue, PackValidationResult } from '../../core/pack/types';
import { validatePack } from '../../core/pack/validate';
import { normalizePackPaths } from '../../core/binding/filenames';

export function parsePackEntries(entries: readonly { path: string; bytes: Uint8Array }[]): PackValidationResult {
  entries = entries.filter(entry => !(entry.path.replaceAll('\\', '/').endsWith('/') && entry.bytes.length === 0));
  const dataDirectory = entries.find(entry => entry.path.replaceAll('\\', '/').endsWith('/'));
  if (dataDirectory) return { ok: false, warnings: [], errors: [
    { file: dataDirectory.path, path: '$', message: 'packImport.error.path' },
  ] };
  const normalized = normalizePackPaths(entries.map(entry => entry.path), true);
  if (!normalized.ok) return { ok: false, warnings: [], errors: normalized.errors };
  entries = entries.map((entry, index) => ({ ...entry, path: normalized.value[index]! }));
  const json = new Map<string, unknown>();
  const errors: PackIssue[] = [];
  for (const entry of entries.filter(({ path }) => path.toLowerCase().endsWith('.json'))) {
    try {
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(entry.bytes);
      json.set(entry.path, JSON.parse(decoded.replace(/^\uFEFF/, '')) as unknown);
    } catch {
      errors.push({ file: entry.path, path: '$', message: 'packImport.error.json' });
    }
  }
  const files = (folder: string) => Object.fromEntries([...json].flatMap(([path, value]) =>
    path.startsWith(`${folder}/`) ? [[path.slice(folder.length + 1, -5), value]] : []));
  const rawBindings = json.get('bindings.json');
  const bindings: unknown = Array.isArray(rawBindings) ? rawBindings.map((raw: unknown, index) => {
    if (!raw || typeof raw !== 'object' || !('path' in raw) || typeof raw.path !== 'string') return raw;
    const normalized = normalizePackPaths([raw.path]);
    if (normalized.ok) return { ...raw, path: normalized.value[0] };
    errors.push(...normalized.errors.map((issue) => ({ ...issue,
      file: 'bindings.json', path: `$[${index}].path` })));
    return raw;
  }) : rawBindings;
  const input: PackInput = {
    pack: json.get('pack.json'), items: json.get('items.json'),
    texts: files('texts'), annotations: files('annotations'), bindings,
    assets: entries.filter(({ path }) => /^(images|audio|puzzles)\//.test(path)).map(({ path }) => path),
  };
  const result = validatePack(input);
  for (const [id, raw] of Object.entries(input.texts ?? {})) {
    if (raw && typeof raw === 'object' && 'id' in raw && typeof raw.id === 'string' && raw.id !== id) {
      errors.push({ file: `texts/${id}.json`, path: '$.id', message: 'packImport.error.textIdentity' });
    }
  }
  if (!result.ok) return { ...result, errors: [...errors, ...result.errors] };
  return errors.length ? { ok: false, errors, warnings: result.warnings } : result;
}

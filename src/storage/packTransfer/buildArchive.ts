import JSZip from 'jszip';
import { extensionFromMime, normalizePackPaths } from '../../core/binding/filenames';
import type { Binding } from '../../core/pack/types';
import type { StoredAsset, StoredBinding } from '../records';
import type { ExportSnapshot } from './exportSnapshot';
import { transferBytes } from './bytes';

function safeStem(name: string): string {
  const basename = name.replaceAll('\\', '/').split('/').at(-1) ?? '';
  return basename.replace(/\.[^.]*$/, '').normalize('NFC')
    .replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '') || 'asset';
}

function bindingPath(binding: StoredBinding, asset: StoredAsset, bindings: StoredBinding[]): string {
  const ext = extensionFromMime(asset.mime);
  if (!ext) throw new TypeError('Unsupported asset MIME');
  if (binding.role === 'puzzle') return `puzzles/${safeStem(asset.name)}.${ext}`;
  if (!binding.itemId) throw new TypeError('Missing binding item');
  if (binding.role !== 'image') {
    return `audio/${binding.itemId}${binding.role === 'explanation' ? '.explain' : ''}.${ext}`;
  }
  const images = bindings.filter((row) => row.role === 'image' && row.itemId === binding.itemId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const position = images.indexOf(binding) + 1;
  return `images/${binding.itemId}${position > 1 ? `.${position}` : ''}.${ext}`;
}

export async function buildArchive(snapshot: ExportSnapshot): Promise<Blob> {
  const zip = new JSZip();
  const used = new Set<string>();
  const unique = (path: string) => {
    const dot = path.lastIndexOf('.');
    let candidate = path.normalize('NFC');
    let suffix = 2;
    while (used.has(candidate.toLowerCase())) {
      candidate = `${path.slice(0, dot)}.${suffix++}${path.slice(dot)}`.normalize('NFC');
    }
    return candidate;
  };
  const add = (path: string, value: string | Uint8Array) => {
    const normalized = normalizePackPaths([path]);
    if (!normalized.ok) throw new TypeError('Unsafe archive path');
    const safe = normalized.value[0]!;
    const key = safe.toLowerCase();
    if (used.has(key)) throw new TypeError('Duplicate archive path');
    used.add(key);
    zip.file(safe, value, { createFolders: false });
  };
  const json = (path: string, value: unknown) => add(path, JSON.stringify(value));
  const textIds = new Set(snapshot.texts.map((text) => text.id));
  if (snapshot.annotations.some((row) => !textIds.has(row.textId))) throw new TypeError('Orphan annotation');
  json('pack.json', snapshot.pack.meta);
  json('items.json', snapshot.items.map(({ packId, ...item }) => { void packId; return item; }));
  for (const { packId, ...text } of snapshot.texts) {
    void packId;
    json(`texts/${text.id}.json`, text);
    const annotations = snapshot.annotations.filter((row) => row.textId === text.id)
      .map(({ packId: owner, textId, ...annotation }) => { void owner; void textId; return annotation; });
    if (annotations.length) json(`annotations/${text.id}.json`, annotations);
  }
  const assets = new Map(snapshot.assets.map((asset) => [asset.id, asset]));
  const bindings: Binding[] = [];
  for (const binding of snapshot.bindings) {
    const asset = assets.get(binding.assetId);
    if (!asset) throw new TypeError('Missing bound asset');
    if (binding.role !== 'puzzle' && !snapshot.items.some((item) => item.id === binding.itemId)) {
      throw new TypeError('Unknown binding item');
    }
    const audio = ['pronunciation', 'explanation'].includes(binding.role);
    if (audio !== (asset.kind === 'audio')) throw new TypeError('Wrong asset kind');
    const path = unique(bindingPath(binding, asset, snapshot.bindings));
    add(path, await transferBytes(asset.blob));
    bindings.push({ path, role: binding.role,
      ...(binding.itemId !== undefined ? { item: binding.itemId } : {}),
      ...(binding.order !== undefined ? { order: binding.order } : {}),
      ...(asset.credit !== undefined ? { credit: asset.credit } : {}),
      ...(asset.license !== undefined ? { license: asset.license } : {}),
    });
  }
  const boundIds = new Set(snapshot.bindings.map((binding) => binding.assetId));
  const itemIds = new Set(snapshot.items.map((item) => item.id.normalize('NFC').toLowerCase()));
  for (const asset of snapshot.assets.filter((row) => !boundIds.has(row.id))) {
    const ext = extensionFromMime(asset.mime);
    if (!ext) throw new TypeError('Unsupported asset MIME');
    let stem = safeStem(asset.name);
    while (itemIds.has(stem.toLowerCase())) stem = `unbound-${crypto.randomUUID()}`;
    const path = unique(`${asset.kind === 'audio' ? 'audio' : 'images'}/${stem}.${ext}`);
    add(path, await transferBytes(asset.blob));
  }
  json('bindings.json', bindings);
  return transferBytes(await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' }), 'application/zip');
}

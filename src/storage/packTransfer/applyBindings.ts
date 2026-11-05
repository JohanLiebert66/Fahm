import type { PackContents } from '../../core/pack/types';
import type { StoredAsset, StoredBinding } from '../records';
import { filenameBinding, mimeFromPath } from '../../core/binding/filenames';
import { transferBytes } from './bytes';

export interface AppliedAssets { assets: StoredAsset[]; bindings: StoredBinding[]; unbound: number }
export function applyBindings(
  contents: PackContents, entries: readonly { path: string; bytes: Uint8Array; mime?: string }[],
): AppliedAssets {
  const assets: StoredAsset[] = [];
  const bindings: StoredBinding[] = [];
  const explicit = new Map(contents.bindings.map((binding) => [binding.path, binding]));
  const itemIds = new Set(contents.items.map((item) => item.id));
  for (const entry of entries.filter(({ path }) => contents.assets.includes(path))) {
    const expectedMime = mimeFromPath(entry.path);
    const mime = entry.mime || expectedMime;
    const binding = explicit.get(entry.path) ?? filenameBinding(entry.path, itemIds);
    const audio = entry.path.startsWith('audio/');
    if (!mime || mime.split(';')[0]?.trim().toLowerCase() !== expectedMime) {
      throw Object.assign(new Error('packImport.error.mime'), { issues: [
        { file: entry.path, path: '$', message: 'packImport.error.mime' },
      ] });
    }
    if (binding && (audio !== ['pronunciation', 'explanation'].includes(binding.role))) {
      throw Object.assign(new Error('packImport.error.binding'), { issues: [
        { file: entry.path, path: '$', message: 'packImport.error.binding' },
      ] });
    }
    const asset: StoredAsset = {
      id: crypto.randomUUID(), packId: contents.pack.id, kind: audio ? 'audio' : 'image',
      mime, name: entry.path, size: entry.bytes.byteLength, blob: transferBytes(entry.bytes, mime),
      ...(binding?.credit !== undefined ? { credit: binding.credit } : {}),
      ...(binding?.license !== undefined ? { license: binding.license } : {}),
    };
    assets.push(asset);
    if (binding) bindings.push({
      id: crypto.randomUUID(), packId: contents.pack.id, assetId: asset.id, role: binding.role,
      ...(binding.item !== undefined ? { itemId: binding.item } : {}),
      ...(binding.order !== undefined ? { order: binding.order } : {}),
    });
  }
  return { assets, bindings, unbound: assets.length - bindings.length };
}

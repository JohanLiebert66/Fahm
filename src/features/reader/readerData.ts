import { createDatabase, type FahmDatabase } from '../../storage/db';
import { packRepo } from '../../storage/packRepo';
import { textRepo } from '../../storage/textRepo';
import { itemRepo } from '../../storage/itemRepo';
import { annotationRepo } from '../../storage/annotationRepo';
import { bindingRepo } from '../../storage/bindingRepo';
import { assetRepo } from '../../storage/assetRepo';
import type { StorageResult } from '../../storage/tx';

function unwrap<T>(result: StorageResult<T>): T {
  if (!result.ok) throw new Error('reader.error');
  return result.value;
}

export async function loadReaderData(db: FahmDatabase, packId?: string, textId?: string) {
  if (packId && textId) {
    const [pack, text, items, annotations, bindings] = await Promise.all([
      packRepo(db).get(packId), textRepo(db).get([packId, textId]),
      itemRepo(db).listByPack(packId), annotationRepo(db).listByPack(packId),
      bindingRepo(db).listByPack(packId),
    ]);
    return { packs: [unwrap(pack)].filter(p => p !== undefined),
      texts: [unwrap(text)].filter(t => t !== undefined), items: unwrap(items),
      annotations: unwrap(annotations).filter(a => a.textId === textId), bindings: unwrap(bindings) };
  }
  const packs = unwrap(await packRepo(db).list());
  const texts = (await Promise.all(packs.map(p => textRepo(db).listByPack(p.id)))).flatMap(unwrap);
  return { packs, texts, items: [], annotations: [], bindings: [] };
}

export type ReaderData = Awaited<ReturnType<typeof loadReaderData>>;
export interface AssetUrlProvider {
  getUrl: (packId: string, assetId: string) => Promise<string | undefined>;
  revokeUrl: (url: string) => void;
}

/** Fetch only one asset; ownership of a returned URL transfers to the caller. */
export function createAssetUrlProvider(db: FahmDatabase): AssetUrlProvider {
  return {
    async getUrl(packId, assetId) {
      const asset = unwrap(await assetRepo(db).get(assetId));
      if (!asset || asset.packId !== packId || asset.kind !== 'image') return undefined;
      return URL.createObjectURL(asset.blob);
    },
    revokeUrl: url => URL.revokeObjectURL(url),
  };
}

export { createDatabase };

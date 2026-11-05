import { expect, it, afterEach, vi } from 'vitest';
import { Blob as NodeBlob } from 'node:buffer';
import pack from '../../../tests/fixtures/en-vocab/pack.json';
import items from '../../../tests/fixtures/en-vocab/items.json';
import { packContentsSchema } from '../../core/pack/schema';
import { applyBindings } from './applyBindings';

afterEach(() => vi.unstubAllGlobals());
const entries = ['images/pencil.svg', 'images/bag.2.svg', 'audio/pencil.explain.webm',
  'images/pencils.svg', 'puzzles/test.svg'].map((path) => ({ path, bytes: new Uint8Array([1, 2, 3]) }));

it('honors explicit bindings before exact-ID inference and records actual byte sizes', async () => {
  vi.stubGlobal('Blob', NodeBlob);
  const contents = packContentsSchema.parse({ pack, items, assets: entries.map((entry) => entry.path),
    bindings: [{ path: entries[0]!.path, item: 'bag', role: 'image', order: 7,
      credit: 'Synthetic author', license: 'CC0-1.0' }] });
  const result = applyBindings(contents, entries);
  expect(result.assets).toHaveLength(5);
  expect(result.unbound).toBe(1);
  const asset = result.assets.find((asset) => asset.name === entries[0]!.path)!;
  expect(asset).toMatchObject({ size: 3, mime: 'image/svg+xml', credit: 'Synthetic author', license: 'CC0-1.0' });
  expect([...new Uint8Array(await asset.blob.arrayBuffer())]).toEqual([1, 2, 3]);
  expect(result.bindings).toEqual(expect.arrayContaining([
    expect.objectContaining({ assetId: asset.id, itemId: 'bag', role: 'image', order: 7 }),
    expect.objectContaining({ itemId: 'bag', role: 'image', order: 2 }),
    expect.objectContaining({ itemId: 'pencil', role: 'explanation' }),
    expect.objectContaining({ role: 'puzzle' }),
  ]));
});

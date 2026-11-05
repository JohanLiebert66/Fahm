import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import * as assets from '../../storage/assetRepo';
import * as readerData from './readerData';
import { useReaderData } from './useReaderData';
import { readerDatabase, enPack, enText, arPack, arText } from './readerTestFixtures';
import type { FahmDatabase } from '../../storage/db';

let db: FahmDatabase;
beforeEach(async () => { db = await readerDatabase(); });
afterEach(async () => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); await db.delete(); });

it('creates an object URL for only the requested asset and checks ownership/kind', async () => {
  // Blob is injected at the repo boundary, never round-tripped through fake-indexeddb.
  const blob = new Blob(['synthetic image'], { type: 'image/svg+xml' });
  const get = vi.fn().mockResolvedValue({ ok: true, value: { packId: enPack.id, kind: 'image', blob } });
  vi.spyOn(assets, 'assetRepo').mockReturnValue({ get } as unknown as ReturnType<typeof assets.assetRepo>);
  const createObjectURL = vi.fn(() => 'blob:owned'), revokeObjectURL = vi.fn();
  vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
  const provider = readerData.createAssetUrlProvider(db);
  expect(await provider.getUrl(enPack.id, 'requested')).toBe('blob:owned');
  expect(get).toHaveBeenCalledExactlyOnceWith('requested');
  expect(createObjectURL).toHaveBeenCalledExactlyOnceWith(blob);
  provider.revokeUrl('blob:owned');
  expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:owned');
  expect(await provider.getUrl('other-pack', 'requested')).toBeUndefined();
  get.mockResolvedValue({ ok: true, value: { packId: enPack.id, kind: 'audio', blob } });
  expect(await provider.getUrl(enPack.id, 'requested')).toBeUndefined();
  get.mockResolvedValue({ ok: true, value: undefined });
  expect(await provider.getUrl(enPack.id, 'requested')).toBeUndefined();
  expect(createObjectURL).toHaveBeenCalledTimes(1);
});

it('loads metadata through repositories without touching the asset table', async () => {
  const assetReads = vi.spyOn(assets, 'assetRepo');
  const data = await readerData.loadReaderData(db, enPack.id, enText.id);
  expect(data.texts[0]?.segments).toEqual(enText.segments);
  expect(data.items.length).toBeGreaterThan(1);
  expect(data.annotations.length).toBeGreaterThan(0);
  expect(assetReads).not.toHaveBeenCalled();
});

it('ignores an older data load when the route changes before it finishes', async () => {
  const load = readerData.loadReaderData;
  const firstData = await load(db, enPack.id, enText.id);
  let resolve!: (value: readerData.ReaderData) => void;
  const pending = new Promise<readerData.ReaderData>(done => { resolve = done; });
  vi.spyOn(readerData, 'loadReaderData').mockReturnValueOnce(pending)
    .mockImplementation((...args) => load(...args));
  const hook = renderHook(({ pack, text }) => useReaderData(db, pack, text),
    { initialProps: { pack: enPack.id, text: enText.id } });
  hook.rerender({ pack: arPack.id, text: arText.id });
  await waitFor(() => expect(hook.result.current).toHaveProperty('data.packs.0.id', arPack.id));
  await act(async () => { resolve(firstData); });
  expect(hook.result.current).toHaveProperty('data.packs.0.id', arPack.id);
});

it('does not reuse a stale snapshot when a route changes away and back during loading', async () => {
  const load = readerData.loadReaderData;
  vi.spyOn(readerData, 'loadReaderData').mockImplementationOnce((...args) => load(...args))
    .mockImplementation(() => new Promise(() => {}));
  const hook = renderHook(({ pack, text }) => useReaderData(db, pack, text),
    { initialProps: { pack: enPack.id, text: enText.id } });
  await waitFor(() => expect(hook.result.current).toHaveProperty('data.packs.0.id', enPack.id));
  hook.rerender({ pack: arPack.id, text: arText.id });
  hook.rerender({ pack: enPack.id, text: enText.id });
  expect(hook.result.current).toBeUndefined();
});

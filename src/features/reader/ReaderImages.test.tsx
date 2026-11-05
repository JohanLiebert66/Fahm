import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import type { FahmDatabase } from '../../storage/db';
import { changeLanguage } from '../../i18n';
import { readerDatabase, enItems, enPack, enText } from './readerTestFixtures';
import { renderReader } from './readerTestRender';
import type { AssetUrlProvider } from './readerData';

let db: FahmDatabase;
beforeEach(async () => {
  db = await readerDatabase(); await changeLanguage('en');
  await db.bindings.bulkAdd([
    { id: 'later', packId: enPack.id, assetId: 'later', itemId: enItems[0]!.id, role: 'image', order: 3 },
    { id: 'first', packId: enPack.id, assetId: 'first', itemId: enItems[0]!.id, role: 'image', order: 1 },
    { id: 'audio', packId: enPack.id, assetId: 'audio', itemId: enItems[0]!.id, role: 'pronunciation', order: 0 },
    { id: 'bag', packId: enPack.id, assetId: 'bag', itemId: enItems[1]!.id, role: 'image', order: 0 },
  ]);
});
afterEach(async () => { cleanup(); await db.delete(); });

it('loads only the selected first image by order, uses term alt text and releases each URL', async () => {
  const provider: AssetUrlProvider = { getUrl: vi.fn(async (_, id) => `blob:${id}`), revokeUrl: vi.fn() };
  const { unmount } = renderReader(db, { assetProvider: provider });
  const pencil = await screen.findByRole('button', { name: enItems[0]!.term });
  expect(provider.getUrl).not.toHaveBeenCalled();
  fireEvent.click(pencil);
  expect(await screen.findByRole('img', { name: enItems[0]!.term })).toHaveAttribute('src', 'blob:first');
  expect(provider.getUrl).toHaveBeenCalledExactlyOnceWith(enPack.id, 'first');
  fireEvent.click(screen.getByRole('button', { name: enItems[1]!.term }));
  expect(await screen.findByRole('img', { name: enItems[1]!.term })).toHaveAttribute('src', 'blob:bag');
  expect(provider.revokeUrl).toHaveBeenCalledWith('blob:first');
  unmount();
  expect(provider.revokeUrl).toHaveBeenCalledWith('blob:bag');
});

it('does not display late images after rapid taps or navigation to another segment', async () => {
  await db.texts.update([enPack.id, enText.id], { segments: [enText.segments[0]!,
    { ...enText.segments[0]!, id: '2' }] });
  const pending: ((url: string) => void)[] = [];
  const provider: AssetUrlProvider = { getUrl: vi.fn(() => new Promise<string>(resolve => pending.push(resolve))),
    revokeUrl: vi.fn() };
  const { unmount } = renderReader(db, { assetProvider: provider });
  fireEvent.click(await screen.findByRole('button', { name: enItems[0]!.term }));
  fireEvent.click(screen.getByRole('button', { name: enItems[1]!.term }));
  await act(async () => { pending[1]!('blob:current'); });
  expect(screen.getByRole('img')).toHaveAttribute('src', 'blob:current');
  await act(async () => { pending[0]!('blob:old'); });
  expect(screen.getByRole('img')).toHaveAttribute('src', 'blob:current');
  expect(provider.revokeUrl).toHaveBeenCalledWith('blob:old');
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(provider.revokeUrl).toHaveBeenCalledWith('blob:current');
  fireEvent.click(screen.getByRole('button', { name: enItems[0]!.term }));
  await waitFor(() => expect(provider.getUrl).toHaveBeenCalledTimes(3));
  fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
  await act(async () => { pending[2]!('blob:old-segment'); });
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(provider.revokeUrl).toHaveBeenCalledWith('blob:old-segment');
  unmount();
  expect(provider.revokeUrl).toHaveBeenCalledTimes(3);
});

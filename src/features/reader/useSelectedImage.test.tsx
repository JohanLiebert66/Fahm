import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { useSelectedImage } from './useSelectedImage';
import type { AssetUrlProvider } from './readerData';

afterEach(cleanup);
function deferred() {
  let resolve!: (url: string) => void;
  const promise = new Promise<string>(done => { resolve = done; });
  return { promise, resolve };
}

it('displays a URL and revokes it when selection changes and on unmount', async () => {
  const provider: AssetUrlProvider = { getUrl: vi.fn(async (_, asset) => `blob:${asset}`), revokeUrl: vi.fn() };
  const hook = renderHook(({ key }) => useSelectedImage(provider, 'pack', 'image', key),
    { initialProps: { key: 'first' } });
  await waitFor(() => expect(hook.result.current).toBe('blob:image'));
  hook.rerender({ key: 'second' });
  await waitFor(() => expect(provider.getUrl).toHaveBeenCalledTimes(2));
  expect(provider.revokeUrl).toHaveBeenCalledTimes(1);
  hook.unmount();
  expect(provider.revokeUrl).toHaveBeenCalledTimes(2);
});

it('ignores and revokes late results after rapid selection/segment changes and unmount', async () => {
  const first = deferred(), second = deferred(), third = deferred();
  const provider: AssetUrlProvider = { getUrl: vi.fn().mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise).mockReturnValueOnce(third.promise), revokeUrl: vi.fn() };
  const hook = renderHook(({ key }) => useSelectedImage(provider, 'pack', 'image', key),
    { initialProps: { key: 'segment-1/token-1' } });
  hook.rerender({ key: 'segment-1/token-2' });
  await act(async () => { second.resolve('blob:current'); });
  expect(hook.result.current).toBe('blob:current');
  await act(async () => { first.resolve('blob:stale'); });
  expect(hook.result.current).toBe('blob:current');
  expect(provider.revokeUrl).toHaveBeenCalledWith('blob:stale');
  hook.rerender({ key: 'segment-2/token-1' });
  expect(hook.result.current).toBeUndefined();
  expect(provider.revokeUrl).toHaveBeenCalledWith('blob:current');
  hook.unmount();
  await act(async () => { third.resolve('blob:unmounted'); });
  expect(provider.revokeUrl).toHaveBeenCalledWith('blob:unmounted');
  expect(provider.revokeUrl).toHaveBeenCalledTimes(3);
});

it('keeps a calm placeholder for rejected or missing assets and does not load without selection', async () => {
  const provider: AssetUrlProvider = { getUrl: vi.fn().mockRejectedValue(new Error('missing')), revokeUrl: vi.fn() };
  const hook = renderHook(({ asset }: { asset?: string }) => useSelectedImage(provider, 'pack', asset, 'token'),
    { initialProps: { asset: undefined as string | undefined } });
  expect(provider.getUrl).not.toHaveBeenCalled();
  hook.rerender({ asset: 'missing' });
  await act(async () => { await Promise.resolve(); });
  expect(hook.result.current).toBeUndefined();
  expect(provider.revokeUrl).not.toHaveBeenCalled();
});

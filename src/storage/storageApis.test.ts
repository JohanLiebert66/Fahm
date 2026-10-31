import { afterEach, expect, it, vi } from 'vitest';
import { requestPersistence } from './persist';
import { estimateQuota } from './quota';

afterEach(() => { vi.unstubAllGlobals(); });

it('handles absent navigator, storage manager, and individual methods without throwing', async () => {
  for (const navigator of [undefined, {}, { storage: {} }]) {
    vi.stubGlobal('navigator', navigator);
    for (const result of [await requestPersistence(), await estimateQuota()]) {
      expect(result).toMatchObject({ ok: false, error: { code: 'StorageUnavailable' } });
    }
  }
  vi.stubGlobal('navigator', { storage: { persist: async () => true } });
  expect(await estimateQuota()).toMatchObject({ ok: false, error: { code: 'StorageUnavailable' } });
  vi.stubGlobal('navigator', { storage: { estimate: async () => ({}) } });
  expect(await requestPersistence()).toMatchObject({ ok: false, error: { code: 'StorageUnavailable' } });
});

it.each([true, false])('preserves the persistence decision %s and method receiver', async (decision) => {
  const storage = { persist: vi.fn(async function (this: unknown) {
    expect(this).toBe(storage);
    return decision;
  }) };
  vi.stubGlobal('navigator', { storage });
  expect(await requestPersistence()).toEqual({ ok: true, value: decision });
  expect(storage.persist).toHaveBeenCalledOnce();
});

it('preserves estimates, including browsers that omit usage or quota', async () => {
  for (const estimate of [{ usage: 10, quota: 100 }, {}, { quota: 100 }]) {
    const storage = { estimate: vi.fn(async function (this: unknown) {
      expect(this).toBe(storage);
      return estimate;
    }) };
    vi.stubGlobal('navigator', { storage });
    expect(await estimateQuota()).toEqual({ ok: true, value: estimate });
  }
});

it('maps rejected calls and synchronous API access errors to typed failures', async () => {
  const storage = {
    persist: async () => { throw new DOMException('Denied', 'SecurityError'); },
    estimate: async () => { throw new DOMException('Full', 'QuotaExceededError'); },
  };
  vi.stubGlobal('navigator', { storage });
  expect(await requestPersistence()).toMatchObject({ ok: false, error: { code: 'StorageUnavailable' } });
  expect(await estimateQuota()).toMatchObject({ ok: false, error: { code: 'QuotaExceeded' } });
  vi.stubGlobal('navigator', { get storage() { throw new DOMException('Denied', 'SecurityError'); } });
  expect(await requestPersistence()).toMatchObject({ ok: false, error: { code: 'StorageUnavailable' } });
  expect(await estimateQuota()).toMatchObject({ ok: false, error: { code: 'StorageUnavailable' } });
});

it('rejects malformed API return values without throwing', async () => {
  vi.stubGlobal('navigator', { storage: { persist: async () => 'yes', estimate: async () => ({ usage: -1 }) } });
  expect(await requestPersistence()).toMatchObject({ ok: false, error: { code: 'InvalidData' } });
  expect(await estimateQuota()).toMatchObject({ ok: false, error: { code: 'InvalidData' } });
});

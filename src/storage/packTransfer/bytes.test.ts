import { Blob as NodeBlob } from 'node:buffer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { transferBytes } from './bytes';

afterEach(() => vi.unstubAllGlobals());

describe('transferBytes', () => {
  it('reads older browser Blobs with FileReader', async () => {
    const blob = new window.Blob([new Uint8Array([4, 5, 6])]);
    Object.defineProperty(blob, 'arrayBuffer', { value: undefined });
    expect([...await transferBytes(blob)]).toEqual([4, 5, 6]);
  });
  it('preserves the exact typed-array view through a native Blob and clone', async () => {
    vi.stubGlobal('Blob', NodeBlob);
    const value = new Uint8Array([90, 1, 2, 3, 91]).subarray(1, 4);
    const blob = transferBytes(value, 'image/png');
    expect(blob.type).toBe('image/png');
    expect([...await transferBytes(structuredClone(blob))]).toEqual([1, 2, 3]);
  });
});

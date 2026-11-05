import { Blob as NodeBlob, File as NodeFile } from 'node:buffer';
import JSZip from 'jszip';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readEntries } from './readEntries';
import type { TransferSource } from './types';

afterEach(() => vi.unstubAllGlobals());

describe('readEntries', () => {
  it('bounds raw folder count before consulting individual file metadata', async () => {
    const name = vi.fn(() => { throw new Error('metadata must not be read'); });
    const file = Object.defineProperty({}, 'name', { get: name });
    await expect(readEntries([file] as File[], { limits: { rawEntries: 0 } }))
      .rejects.toMatchObject({ issues: [{ message: 'packImport.error.rawEntries' }] });
    expect(name).not.toHaveBeenCalled();
  });
  it.each([null, 'not a source', 7, [null], [{ name: 'pack.json' }]])(
    'rejects invalid external source %j with a format issue', async (source) => {
      await expect(readEntries(source as unknown as TransferSource))
        .rejects.toMatchObject({ issues: [{ message: 'packImport.error.format' }] });
    },
  );
  it('accepts ZIP Uint8Arrays, native Blobs and readonly File arrays', async () => {
    vi.stubGlobal('Blob', NodeBlob);
    const bytes = await new JSZip().file('pack.json', '{}').generateAsync({ type: 'uint8array' });
    const files = Object.freeze([new NodeFile(['{}'], 'pack.json') as unknown as File]);
    const sources: TransferSource[] = [bytes, new Blob([new Uint8Array(bytes)]), files];
    for (const source of sources) {
      const entries = await readEntries(source);
      expect(entries.map(({ path }) => path)).toEqual(['pack.json']);
      expect([...entries[0]!.bytes]).toEqual([123, 125]);
    }
  });
});

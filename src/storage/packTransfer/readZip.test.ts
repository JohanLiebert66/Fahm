import JSZip from 'jszip';
import { Blob as NodeBlob } from 'node:buffer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readZip } from './readZip';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('readZip', () => {
  it.each(['both', 'central'] as const)('normalizes %s header separators including explicit Windows directories', async headers => {
    const bytes = await new JSZip().file('bundle/pack.json', '{}').file('bundle/items.json', '[]')
      .generateAsync({ type: 'uint8array' });
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    for (let i = 0; i + 46 <= bytes.length; i++) {
      const signature = view.getUint32(i, true);
      const offset = signature === 0x02014b50 ? 46 : signature === 0x04034b50 && headers === 'both' ? 30 : 0;
      if (!offset) continue;
      const length = view.getUint16(i + (offset === 46 ? 28 : 26), true);
      for (let j = i + offset; j < i + offset + length; j++) if (bytes[j] === 47) bytes[j] = 92;
    }
    expect((await readZip(bytes)).map(entry => entry.path)).toEqual(['pack.json', 'items.json']);
  });

  it.each([
    ['../images/x.png', 'packImport.error.path'],
    ['images\\..\\x.png', 'packImport.error.path'],
    ['/images/x.png', 'packImport.error.path'],
    ['audio/nested.zip', 'packImport.error.archive'],
  ])('rejects raw hostile path %s before loading or delivering chunks', async (path, message) => {
    const bytes = await new JSZip().file(path, 'x', { createFolders: false })
      .generateAsync({ type: 'uint8array' });
    const load = vi.spyOn(JSZip, 'loadAsync');
    const onChunk = vi.fn();
    await expect(readZip(bytes, { onChunk })).rejects.toMatchObject({ issues: [{ message }] });
    expect(load).not.toHaveBeenCalled();
    expect(onChunk).not.toHaveBeenCalled();
  });

  it.each([
    ['images/x.png', 'images/X.png'],
    ['images/é.png', 'images/é.png'],
    ['images/x.png', 'images\\x.png'],
  ])('rejects canonical collisions between %s and %s before loading', async (first, second) => {
    const bytes = await new JSZip().file(first, 'x', { createFolders: false })
      .file(second, 'y', { createFolders: false }).generateAsync({ type: 'uint8array' });
    const load = vi.spyOn(JSZip, 'loadAsync');
    await expect(readZip(bytes)).rejects.toMatchObject({ issues: [{ message: 'packImport.error.duplicate' }] });
    expect(load).not.toHaveBeenCalled();
  });

  it('compares raw central names with unsafeOriginalName after Unicode extra-field decoding', async () => {
    const bytes = await new JSZip().file('../é/../images/x.png', 'x', { createFolders: false })
      .generateAsync({ type: 'uint8array', encodeFileName: (name) => name ? 'images/x.png' : '' });
    const onChunk = vi.fn();
    await expect(readZip(bytes, { onChunk })).rejects.toMatchObject({ issues: [{ message: 'packImport.error.path' }] });
    expect(onChunk).not.toHaveBeenCalled();
  });

  it('counts the actual raw directory records rather than the forged declared count', async () => {
    const zip = new JSZip().file('pack.json', '{}', { createFolders: false });
    for (let i = 0; i < 2000; i++) zip.folder(`images/${i}`);
    const bytes = await zip.generateAsync({ type: 'uint8array' });
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    view.setUint16(bytes.length - 14, 1, true);
    view.setUint16(bytes.length - 12, 1, true);
    const load = vi.spyOn(JSZip, 'loadAsync');
    await expect(readZip(bytes)).rejects.toMatchObject({ issues: [{ message: 'packImport.error.entries' }] });
    expect(load).not.toHaveBeenCalled();
  });

  it('checks native Blob size without reading an oversized source', async () => {
    vi.stubGlobal('Blob', NodeBlob);
    const source = new Blob([new Uint8Array(11)]);
    const read = vi.spyOn(source, 'arrayBuffer');
    await expect(readZip(source, { limits: { totalBytes: 10 } })).rejects.toThrow('packImport.error.total');
    expect(read).not.toHaveBeenCalled();
  });

  it('rejects oversized archive bytes before JSZip loads anything', async () => {
    const load = vi.spyOn(JSZip, 'loadAsync');
    await expect(readZip(new Uint8Array(11), { limits: { totalBytes: 10 } }))
      .rejects.toMatchObject({ issues: [{ message: 'packImport.error.total' }] });
    expect(load).not.toHaveBeenCalled();
  });

  it('rejects a real ZIP at the first overflow chunk and ignores subsequent emissions', async () => {
    const bytes = await new JSZip().file('images/large.png', new Uint8Array(300_000))
      .generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
    const chunks: number[] = [];
    await expect(readZip(bytes, { limits: { imageBytes: 1000 },
      onChunk: (path, size) => { expect(path).toBe('images/large.png'); chunks.push(size); },
    })).rejects.toMatchObject({ issues: [{ message: 'packImport.error.image' }] });
    expect(chunks).toEqual([16384]);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(chunks).toEqual([16384]);
  });

  it('shares the actual decompressed byte budget across entries', async () => {
    const bytes = await new JSZip().file('pack.json', new Uint8Array(40_000))
      .file('items.json', new Uint8Array(40_000))
      .generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
    const chunks: [string, number][] = [];
    await expect(readZip(bytes, { limits: { totalBytes: 50_000 },
      onChunk: (path, size) => chunks.push([path, size]),
    })).rejects.toMatchObject({ issues: [{ message: 'packImport.error.total' }] });
    expect(chunks).toEqual([
      ['pack.json', 16384], ['pack.json', 16384], ['pack.json', 7232], ['items.json', 16384],
    ]);
  });

  it('bounds actual inflated bytes even when uncompressed-size declarations lie', async () => {
    const bytes = await new JSZip().file('images/x.png', new Uint8Array(300_000), { createFolders: false })
      .generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const central = view.getUint32(bytes.length - 6, true);
    view.setUint32(22, 1, true);
    view.setUint32(central + 24, 1, true);
    const onChunk = vi.fn();
    await expect(readZip(bytes, { limits: { imageBytes: 1000 }, onChunk }))
      .rejects.toMatchObject({ issues: [{ message: 'packImport.error.image' }] });
    expect(onChunk.mock.calls).toEqual([['images/x.png', 16384]]);
  });

  it('preserves actual bytes and strips a common wrapper', async () => {
    vi.stubGlobal('Blob', NodeBlob);
    const zip = new JSZip().file('bundle/pack.json', '{}').file('bundle/images/x.png', [1, 2, 255]);
    const source = new Blob([new Uint8Array(await zip.generateAsync({ type: 'uint8array' }))]);
    const entries = await readZip(source);
    expect(entries.map(({ path }) => path)).toEqual(['pack.json', 'images/x.png']);
    expect([...entries[1]!.bytes]).toEqual([1, 2, 255]);
    expect(entries[1]!.mime).toBe('image/png');
  });
});

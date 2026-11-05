import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { zipDirectory } from './zipDirectory';

describe('zipDirectory', () => {
  it.each([
    ['missing end record', (v: DataView, _c: number, e: number) => v.setUint32(e, 0, true)],
    ['multi-disk end', (v: DataView, _c: number, e: number) => v.setUint16(e + 4, 1, true)],
    ['mismatched disk count', (v: DataView, _c: number, e: number) => v.setUint16(e + 8, 0, true)],
    ['zip64 count', (v: DataView, _c: number, e: number) => v.setUint16(e + 10, 65535, true)],
    ['incorrect directory size', (v: DataView, _c: number, e: number) => v.setUint32(e + 12, 1, true)],
    ['incorrect directory signature', (v: DataView, c: number) => v.setUint32(c, 0, true)],
    ['encrypted entry', (v: DataView, c: number) => v.setUint16(c + 8, 1, true)],
    ['unsupported compression', (v: DataView, c: number) => v.setUint16(c + 10, 99, true)],
    ['zip64 size', (v: DataView, c: number) => v.setUint32(c + 24, 0xffffffff, true)],
    ['multi-disk entry', (v: DataView, c: number) => v.setUint16(c + 34, 1, true)],
    ['truncated name', (v: DataView, c: number) => v.setUint16(c + 28, 65535, true)],
    ['bad local offset', (v: DataView, c: number) => v.setUint32(c + 42, c, true)],
    ['different local name', (v: DataView) => v.setUint8(30, 120)],
  ])('rejects %s with a typed archive issue', async (_label, mutate) => {
    const bytes = await new JSZip().file('pack.json', '{}').generateAsync({ type: 'uint8array' });
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const end = bytes.length - 22;
    mutate(view, view.getUint32(end + 16, true), end);
    expect(() => zipDirectory(bytes)).toThrow('packImport.error.archive');
  });

  it('rejects tiny non-ZIP input with an issue instead of a DataView exception', () => {
    expect(() => zipDirectory(new Uint8Array([1]))).toThrow('packImport.error.archive');
  });

  it('rejects exact duplicate raw names before JSZip can overwrite them', async () => {
    const bytes = await new JSZip().file('a.json', '{}').file('b.json', '{}')
      .generateAsync({ type: 'uint8array' });
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] === 98 && bytes[i + 1] === 46) bytes[i] = 97;
    }
    expect(() => zipDirectory(bytes)).toThrow('packImport.error.duplicate');
  });

  it('counts every actual central record including directories before inflating', async () => {
    const zip = new JSZip().file('folder/pack.json', '{}');
    const bytes = await zip.generateAsync({ type: 'uint8array' });
    expect(() => zipDirectory(bytes, 1)).toThrow('packImport.error.entries');
  });
  it('lists central-directory paths including explicit directories', async () => {
    const zip = new JSZip().file('wrapped/pack.json', '{}');
    const bytes = await zip.generateAsync({ type: 'uint8array' });
    expect(zipDirectory(bytes)).toEqual(['wrapped/', 'wrapped/pack.json']);
  });
});

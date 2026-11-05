import { File as NodeFile } from 'node:buffer';
import { describe, expect, it, vi } from 'vitest';
import { readFolder } from './readFolder';

function file(path: string, data: Uint8Array, relativeKey = 'webkitRelativePath'): File {
  const value = new NodeFile([new Uint8Array(data)], path.split('/').at(-1)!);
  Object.defineProperty(value, relativeKey, { value: path });
  return value as unknown as File;
}

describe('readFolder', () => {
  it.each(['images/large.png', 'puzzles/large.svg', 'audio/large.mp3'])(
    'cancels the real stream for %s after an actual over-limit chunk', async (path) => {
      const value = file(path, new Uint8Array(50_000));
      const cancel = vi.fn();
      const pull = vi.fn((controller: ReadableStreamDefaultController<Uint8Array>) => {
        controller.enqueue(new Uint8Array(16384));
      });
      const stream = new ReadableStream({ pull, cancel }, { highWaterMark: 0 });
      Object.defineProperties(value, {
        size: { value: 1 }, stream: { value: () => stream },
      });
      const chunks = vi.fn();
      await expect(readFolder([value, file('pack.json', new Uint8Array())], { limits: { imageBytes: 1000, audioBytes: 1000 }, onChunk: chunks }))
        .rejects.toMatchObject({ issues: [{ message: path.startsWith('audio/')
          ? 'packImport.error.audio' : 'packImport.error.image' }] });
      expect(chunks.mock.calls).toEqual([[path, 16384]]);
      expect(pull).toHaveBeenCalledTimes(1);
      expect(cancel).toHaveBeenCalledTimes(1);
    },
  );

  it('bounds fallback slice reads without materializing the whole File', async () => {
    const value = new window.File([new Uint8Array(50_000)], 'large.png');
    Object.defineProperty(value, 'webkitRelativePath', { value: 'images/large.png' });
    Object.defineProperty(value, 'stream', { value: undefined });
    const slice = vi.spyOn(value, 'slice');
    const chunks = vi.fn();
    await expect(readFolder([value, file('pack.json', new Uint8Array())], { limits: { imageBytes: 1000 }, onChunk: chunks }))
      .rejects.toMatchObject({ issues: [{ message: 'packImport.error.image' }] });
    expect(slice).toHaveBeenCalledTimes(1);
    expect(slice).toHaveBeenCalledWith(0, 16384);
    expect(chunks.mock.calls).toEqual([['images/large.png', 16384]]);
  });

  it('rejects excessive entry counts before reading', async () => {
    const value = file('pack.json', new Uint8Array([1]));
    const read = vi.spyOn(value, 'arrayBuffer');
    await expect(readFolder([value], { limits: { entries: 0 } }))
      .rejects.toMatchObject({ issues: [{ message: 'packImport.error.entries' }] });
    expect(read).not.toHaveBeenCalled();
  });

  it('aggregates actual bytes across files and never starts later entries after failure', async () => {
    const first = file('pack.json', new Uint8Array([1, 2]));
    const second = file('items.json', new Uint8Array([3, 4]));
    const last = file('bindings.json', new Uint8Array([5]));
    const startLast = vi.spyOn(last, 'stream');
    const chunks = vi.fn();
    await expect(readFolder([first, second, last], { limits: { totalBytes: 3 }, onChunk: chunks }))
      .rejects.toMatchObject({ issues: [{ message: 'packImport.error.total' }] });
    expect(chunks.mock.calls).toEqual([['pack.json', 2], ['items.json', 2]]);
    expect(startLast).not.toHaveBeenCalled();
  });

  it('reports native stream failures as read issues', async () => {
    const value = file('pack.json', new Uint8Array([1]));
    Object.defineProperty(value, 'stream', { value: () => new ReadableStream({
      start(controller) { controller.error(new Error('synthetic read failure')); },
    }) });
    await expect(readFolder([value])).rejects.toMatchObject({ issues: [{ message: 'packImport.error.read' }] });
  });

  it('normalizes all folder paths before opening any stream', async () => {
    const first = file('pack.json', new Uint8Array([1]));
    const invalid = file('../images/x.png', new Uint8Array([2]));
    const start = vi.spyOn(first, 'stream');
    await expect(readFolder([first, invalid])).rejects.toMatchObject({
      issues: [{ message: 'packImport.error.path' }],
    });
    expect(start).not.toHaveBeenCalled();
  });

  it('retains exact bytes across multiple bounded fallback slices', async () => {
    const data = Uint8Array.from({ length: 20_000 }, (_, index) => index % 251);
    const value = new window.File([data], 'pack.json');
    Object.defineProperty(value, 'stream', { value: undefined });
    const onChunk = vi.fn();
    const entries = await readFolder([value], { limits: { totalBytes: 20_000 }, onChunk });
    expect(entries[0]!.bytes).toEqual(data);
    expect(onChunk.mock.calls).toEqual([['pack.json', 16384], ['pack.json', 3616]]);
  });

  it('preserves native File bytes and normalizes either relative-path property', async () => {
    const files = [file('bundle/pack.json', new Uint8Array([123, 125])),
      file('bundle/images/x.png', new Uint8Array([0, 1, 255]), 'relativePath')];
    const chunks = vi.fn();
    const entries = await readFolder(files, { onChunk: chunks });
    expect(entries.map(({ path }) => path)).toEqual(['pack.json', 'images/x.png']);
    expect([...entries[1]!.bytes]).toEqual([0, 1, 255]);
    expect(entries[1]!.mime).toBe('image/png');
    expect(chunks.mock.calls).toEqual([['pack.json', 2], ['images/x.png', 3]]);
  });
});

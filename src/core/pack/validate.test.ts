
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validatePack } from './validate';
import type { PackContents } from './types';

function fixture(name: string) {
  const base = resolve('tests/fixtures', name);
  const read = (path: string): unknown => JSON.parse(readFileSync(resolve(base, path), 'utf8'));
  const files = readdirSync(base, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => resolve(entry.parentPath, entry.name).slice(base.length + 1).replaceAll('\\', '/'));
  const documents = (folder: string) => Object.fromEntries(files
    .filter((file) => file.startsWith(`${folder}/`) && file.endsWith('.json'))
    .map((file) => [file.slice(folder.length + 1, -5), read(file)]));
  return {
    pack: read('pack.json'), items: read('items.json'),
    texts: documents('texts'), annotations: documents('annotations'),
    ...(files.includes('bindings.json') ? { bindings: read('bindings.json') } : {}),
    assets: files.filter((file) => !file.endsWith('.json')),
  };
}

describe('validatePack', () => {
  it.each(['en-vocab', 'ar-letters', 'ar-sample-text', 'puzzle-only'])(
    'accepts the %s fixture and preserves all supported fields', (name) => {
      const input = fixture(name);
      const result = validatePack(input);
      expect(result).toEqual({ ok: true, value: { ...input, bindings: input.bindings ?? [] }, warnings: [] });
      expect(JSON.parse(JSON.stringify(result))).toEqual(result);
    });

  it('reports and removes unknown fields in every file and nested objects', () => {
    const clean = fixture('en-vocab') as PackContents;
    const input = structuredClone(clean);
    const add = (object: object) => Object.assign(object, { future: 'ignored' });
    add(input.pack); add(input.items[0]!); add(input.items[0]!.explain.en!);
    add(input.texts.classroom!); add(input.texts.classroom!.segments[0]!);
    add(input.annotations.classroom![1]!); add(input.annotations.classroom![1]!.override!);
    add(input.annotations.classroom![1]!.override!.explain.en!); add(input.bindings[0]!);
    const before = structuredClone(input);
    const result = validatePack(input);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected valid input');
    expect(result.value).toEqual(clean);
    expect(result.warnings.map(({ file, path }) => `${file}:${path}`)).toEqual([
      'pack.json:$.future', 'items.json:$[0].explain.en.future', 'items.json:$[0].future',
      'texts/classroom.json:$.segments[0].future', 'texts/classroom.json:$.future',
      'annotations/classroom.json:$[1].override.explain.en.future',
      'annotations/classroom.json:$[1].override.future', 'annotations/classroom.json:$[1].future',
      'bindings.json:$[0].future',
    ]);
    expect(result.warnings.every((issue) => issue.message.includes('ignored'))).toBe(true);
    expect(input).toEqual(before);
  });

  it('aggregates readable schema errors across files, keeping warnings on failure', () => {
    const input = fixture('en-vocab') as PackContents;
    Object.assign(input.pack, { schemaVersion: 2, source: '', future: true });
    input.items[0]!.id = 'bad.id';
    Object.assign(input.texts.classroom!.segments[0]!, { text: 42 });
    input.annotations.classroom![0]!.start = -1;
    Object.assign(input.bindings[0]!, { role: 'video' });
    const result = validatePack(input);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected errors');
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ file: 'pack.json', path: '$.schemaVersion', message: expect.stringContaining('supported version is 1') }),
      expect.objectContaining({ file: 'pack.json', path: '$.source' }),
      expect.objectContaining({ file: 'items.json', path: '$[0].id' }),
      expect.objectContaining({ file: 'texts/classroom.json', path: '$.segments[0].text' }),
      expect.objectContaining({ file: 'annotations/classroom.json', path: '$[0].start' }),
      expect.objectContaining({ file: 'bindings.json', path: '$[0].role' }),
    ]));
    expect(result.errors.every((issue) => issue.message.length > 0)).toBe(true);
    expect(result.warnings).toEqual([{ file: 'pack.json', path: '$.future', message: expect.stringContaining('ignored') }]);
  });

  it.each(['pack', 'items'] as const)('reports missing required %s file', (file) => {
    const input = fixture('en-vocab');
    input[file] = undefined;
    const result = validatePack(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toContainEqual(expect.objectContaining({ file: `${file}.json`, path: '$' }));
  });
});

import { describe, expect, it } from 'vitest';
import pack from '../../../tests/fixtures/en-vocab/pack.json';
import items from '../../../tests/fixtures/en-vocab/items.json';
import text from '../../../tests/fixtures/en-vocab/texts/classroom.json';
import annotations from '../../../tests/fixtures/en-vocab/annotations/classroom.json';
import bindings from '../../../tests/fixtures/en-vocab/bindings.json';
import { packContentsSchema } from './schema';
import { validatePack } from './validate';
import type { PackContents } from './types';

function input(): PackContents {
  return packContentsSchema.parse({ pack, items, texts: { classroom: text },
    annotations: { classroom: annotations }, bindings, assets: bindings.map((binding) => binding.path) });
}

type Failure = [string, (value: PackContents) => void, string, string, string];
const failures: Failure[] = [
  ['duplicate item', (v) => v.items.push(v.items[0]!), 'items.json', '$[6].id', 'Duplicate item'],
  ['unknown annotation item', (v) => { v.annotations.classroom![0]!.item = 'missing'; },
    'annotations/classroom.json', '$[0].item', 'Unknown item'],
  ['unknown segment', (v) => { v.annotations.classroom![0]!.segment = 'missing'; },
    'annotations/classroom.json', '$[0].segment', 'Unknown segment'],
  ['unknown text', (v) => { v.annotations.missing = []; }, 'annotations/missing.json', '$', 'Unknown text'],
  ['span beyond text', (v) => { v.annotations.classroom![0]!.end = 1000; },
    'annotations/classroom.json', '$[0].end', 'inside segment text'],
  ['empty span', (v) => { v.annotations.classroom![0]!.end = 2; },
    'annotations/classroom.json', '$[0].end', 'greater than start'],
  ['reversed span', (v) => { v.annotations.classroom![0]!.end = 1; },
    'annotations/classroom.json', '$[0].end', 'greater than start'],
  ['unordered spans', (v) => v.annotations.classroom!.reverse(),
    'annotations/classroom.json', '$[1].start', 'ordered'],
  ['overlapping spans', (v) => { v.annotations.classroom![1]!.start = 7; },
    'annotations/classroom.json', '$[1].start', 'overlap'],
  ['slice mismatch', (v) => { v.annotations.classroom![0]!.text = ''; },
    'annotations/classroom.json', '$[0].text', 'slice'],
  ['binding unknown item', (v) => { v.bindings[0]!.item = 'missing'; },
    'bindings.json', '$[0].item', 'Unknown item'],
  ...(['image', 'pronunciation', 'explanation'] as const).map((role): Failure =>
    [`${role} missing item`, (v) => { v.bindings[0]!.role = role; delete v.bindings[0]!.item; },
      'bindings.json', '$[0].item', 'requires an item']),
  ['puzzle with item', (v) => { v.bindings[0]!.role = 'puzzle'; },
    'bindings.json', '$[0].item', 'must not have an item'],
  ['missing asset', (v) => { v.assets = []; }, 'bindings.json', '$[0].path', 'not found'],
  ['duplicate binding path', (v) => v.bindings.push(v.bindings[0]!),
    'bindings.json', '$[7].path', 'already bound'],
  ['duplicate segment', (v) => v.texts.classroom!.segments.push(v.texts.classroom!.segments[0]!),
    'texts/classroom.json', '$.segments[1].id', 'Duplicate segment'],
];

describe('pack cross-checks', () => {
  it.each(failures)('rejects %s', (_name, mutate, file, path, message) => {
    const value = input();
    mutate(value);
    const result = validatePack(value);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toContainEqual({ file, path, message: expect.stringContaining(message) });
  });

  it('reports schema and cross-file errors together without hiding valid siblings', () => {
    const value = input();
    value.pack.source = '';
    value.items[0]!.term = '';
    value.items.push(value.items[1]!);
    value.annotations.classroom![0]!.item = 'missing';
    value.bindings[0]!.path = 'absent.svg';
    const result = validatePack(value);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ file: 'pack.json', path: '$.source' }),
      expect.objectContaining({ file: 'items.json', path: '$[0].term' }),
      expect.objectContaining({ file: 'items.json', path: '$[6].id', message: expect.stringContaining('Duplicate') }),
      expect.objectContaining({ file: 'annotations/classroom.json', path: '$[0].item', message: expect.stringContaining('Unknown') }),
      expect.objectContaining({ file: 'bindings.json', path: '$[0].path', message: expect.stringContaining('not found') }),
    ]));
  });

  it('does not let invalid metadata hide independent reference, span or asset errors', () => {
    const value = input();
    value.texts.classroom!.title = {};
    value.annotations.classroom![0]!.item = 'missing';
    value.annotations.classroom![0]!.start = -1;
    value.annotations.classroom![1]!.end = 1000;
    Object.assign(value.bindings[0]!, { credit: 42, path: 'absent.svg' });
    const result = validatePack(value);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ file: 'texts/classroom.json', path: '$.title' }),
      expect.objectContaining({ file: 'annotations/classroom.json', path: '$[0].start' }),
      expect.objectContaining({ file: 'annotations/classroom.json', path: '$[0].item', message: expect.stringContaining('Unknown item') }),
      expect.objectContaining({ file: 'annotations/classroom.json', path: '$[1].end', message: expect.stringContaining('inside segment text') }),
      expect.objectContaining({ file: 'bindings.json', path: '$[0].credit' }),
      expect.objectContaining({ file: 'bindings.json', path: '$[0].path', message: expect.stringContaining('not found') }),
    ]));
  });

  it('treats prototype-like annotation file names as ordinary unknown text ids', () => {
    const value = input();
    Object.assign(value.annotations, { toString: [] });
    expect(() => validatePack(value)).not.toThrow();
    const result = validatePack(value);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toContainEqual({
      file: 'annotations/toString.json', path: '$', message: 'Unknown text: toString',
    });
  });

  it('checks item identity even when another field of that item is invalid', () => {
    const value = input();
    value.items[0]!.term = '';
    value.items.push(structuredClone(value.items[0]!));
    const result = validatePack(value);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContainEqual(expect.objectContaining({ file: 'items.json', path: '$[6].id', message: expect.stringContaining('Duplicate item') }));
      expect(result.errors.some((issue) => issue.message.includes('Unknown item'))).toBe(false);
    }
  });

  it('uses UTF-16 indices, preserves diacritics, and permits adjacent spans and absent text checks', () => {
    const value = input();
    const segment = value.texts.classroom!.segments[0]!;
    segment.text = String.fromCodePoint(0x1f4d8) + segment.text;
    for (const annotation of value.annotations.classroom!) {
      annotation.start += 2; annotation.end += 2;
    }
    expect(validatePack(value).ok).toBe(true);
    value.annotations.classroom![0]!.start -= 1;
    expect(validatePack(value).ok).toBe(false);
    value.annotations.classroom = [
      { segment: segment.id, start: 0, end: 2, item: value.items[0]!.id },
      { segment: segment.id, start: 2, end: segment.text.length, item: value.items[1]!.id },
    ];
    expect(validatePack(value).ok).toBe(true);
  });

  it('orders spans per segment, not across unrelated segments', () => {
    const value = input();
    const segment = structuredClone(value.texts.classroom!.segments[0]!);
    segment.id = '2';
    value.texts.classroom!.segments.push(segment);
    value.annotations.classroom!.push({ ...value.annotations.classroom![0]!, segment: '2' });
    expect(validatePack(value).ok).toBe(true);
  });

  it('preserves audio binding roles and all their optional metadata', () => {
    const value = input();
    for (const role of ['pronunciation', 'explanation'] as const) {
      const path = `audio/${role}.webm`;
      value.assets.push(path);
      value.bindings.push({ path, role, item: value.items[0]!.id, order: 2, credit: 'Test', license: 'CC0-1.0' });
    }
    const before = structuredClone(value);
    expect(validatePack(value)).toEqual({ ok: true, value: before, warnings: [] });
    expect(value).toEqual(before);
  });
});

import { describe, expect, it } from 'vitest';
import pack from '../../../tests/fixtures/en-vocab/pack.json';
import items from '../../../tests/fixtures/en-vocab/items.json';
import text from '../../../tests/fixtures/en-vocab/texts/classroom.json';
import annotations from '../../../tests/fixtures/en-vocab/annotations/classroom.json';
import bindings from '../../../tests/fixtures/en-vocab/bindings.json';
import { annotationSchema, bindingSchema, itemIdSchema, itemSchema, packSchema, textSchema } from './schema';
import { validatePack } from './validate';

function input() {
  return { pack: structuredClone(pack), items: structuredClone(items),
    texts: { classroom: structuredClone(text) }, annotations: { classroom: structuredClone(annotations) },
    bindings: structuredClone(bindings), assets: bindings.map((binding) => binding.path) };
}

describe('pack schemas: required fields and malformed JSON values', () => {
  it.each(['schemaVersion', 'id', 'title', 'lang', 'dir', 'author', 'license', 'source'])(
    'rejects missing pack.%s', (key) => {
      const value: Record<string, unknown> = { ...pack };
      delete value[key];
      const result = validatePack({ ...input(), pack: value });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors).toContainEqual(expect.objectContaining({ file: 'pack.json', path: `$.${key}` }));
    });

  it.each([0, 2, '1', null])('rejects unsupported schemaVersion %j', (schemaVersion) => {
    const result = packSchema.safeParse({ ...pack, schemaVersion });
    expect(result.success).toBe(false);
  });

  it.each(['bad.id', 'bad id', '', 'bad/id', 'bad!', 'بَ'])('rejects item id %j', (id) => {
    expect(itemIdSchema.safeParse(id).success).toBe(false);
  });
  it.each(['classroom_2', 'ب-٢', 'Book-12', '書本', '𐐀_1'])('accepts Unicode item id %j', (id) => {
    expect(itemIdSchema.parse(id)).toBe(id);
  });
  it.each(['Upper', 'with_underscore', 'with.dot', 'two words', 'عربي', ''])('rejects pack id %j', (id) => {
    expect(packSchema.safeParse({ ...pack, id }).success).toBe(false);
  });
  it('rejects empty titles and invalid direction', () => {
    expect(packSchema.safeParse({ ...pack, title: {} }).success).toBe(false);
    expect(textSchema.safeParse({ ...text, title: {} }).success).toBe(false);
    expect(packSchema.safeParse({ ...pack, dir: 'sideways' }).success).toBe(false);
  });
  it.each(['id', 'term', 'explain'])('rejects missing item.%s', (key) => {
    const value: Record<string, unknown> = { ...items[0] };
    delete value[key];
    expect(itemSchema.safeParse(value).success).toBe(false);
  });
  it.each(['id', 'title', 'segments'])('rejects missing text.%s', (key) => {
    const value: Record<string, unknown> = { ...text };
    delete value[key];
    expect(textSchema.safeParse(value).success).toBe(false);
  });
  it.each(['id', 'text'])('rejects missing segment.%s', (key) => {
    const value: Record<string, unknown> = { ...text.segments[0] };
    delete value[key];
    expect(textSchema.safeParse({ ...text, segments: [value] }).success).toBe(false);
  });
  it.each(['segment', 'start', 'end', 'item'])('rejects missing annotation.%s', (key) => {
    const value: Record<string, unknown> = { ...annotations[0] };
    delete value[key];
    expect(annotationSchema.safeParse(value).success).toBe(false);
  });
  it.each(['start', 'end'])('rejects fractional, negative and string %s offsets', (key) => {
    for (const offset of [-1, 1.5, '2', null]) {
      expect(annotationSchema.safeParse({ ...annotations[0], [key]: offset }).success).toBe(false);
    }
  });
  it.each(['path', 'role'])('rejects missing binding.%s', (key) => {
    const value: Record<string, unknown> = { ...bindings[0] };
    delete value[key];
    expect(bindingSchema.safeParse(value).success).toBe(false);
  });
  it('rejects malformed optional fields and nested explanations', () => {
    for (const extra of [{ forms: 'invalid' }, { level: 'one' }, { group: 1 }, { explain: { en: {} } }]) {
      expect(itemSchema.safeParse({ ...items[0], ...extra }).success).toBe(false);
    }
    expect(annotationSchema.safeParse({ ...annotations[0], override: { explain: { en: {} } } }).success).toBe(false);
    for (const extra of [{ order: -1 }, { credit: 1 }, { license: false }]) {
      expect(bindingSchema.safeParse({ ...bindings[0], ...extra }).success).toBe(false);
    }
  });
  it('reports malformed file roots without throwing or hiding other errors', () => {
    const result = validatePack({ pack: null, items: {}, texts: { invalid: [] },
      annotations: { invalid: null }, bindings: false, assets: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(new Set(result.errors.map((issue) => issue.file))).toEqual(new Set([
      'pack.json', 'items.json', 'texts/invalid.json', 'annotations/invalid.json', 'bindings.json',
    ]));
  });
});

import { expect, it } from 'vitest';
import pack from '../../../tests/fixtures/en-vocab/pack.json';
import items from '../../../tests/fixtures/en-vocab/items.json';
import text from '../../../tests/fixtures/en-vocab/texts/classroom.json';
import annotations from '../../../tests/fixtures/en-vocab/annotations/classroom.json';
import { parsePackEntries } from './parsePackEntries';

const entry = (path: string, value: unknown, bom = false) => ({
  path, bytes: new TextEncoder().encode((bom ? '\uFEFF' : '') + JSON.stringify(value)),
});

it('parses UTF-8 BOM files through validatePack preserving references and annotations', () => {
  const result = parsePackEntries([
    entry('pack.json', pack, true), entry('items.json', items, true),
    entry('texts/classroom.json', text), entry('annotations/classroom.json', annotations),
  ]);
  expect(result).toMatchObject({ ok: true, value: { pack, items,
    texts: { classroom: text }, annotations: { classroom: annotations } } });
});

it('collects malformed JSON and independent validation errors before any writes', () => {
  const result = parsePackEntries([
    entry('pack.json', { ...pack, schemaVersion: 99 }), entry('items.json', [{ id: 'invalid.id' }]),
    { path: 'texts/broken.json', bytes: new TextEncoder().encode('{broken') },
  ]);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error('Expected invalid input');
  expect(new Set(result.errors.map((issue) => issue.file))).toEqual(
    new Set(['pack.json', 'items.json', 'texts/broken.json']));
});

it('normalizes explicit binding backslashes before validation', () => {
  const result = parsePackEntries([entry('pack.json', pack), entry('items.json', items),
    entry('bindings.json', [{ path: 'images\\pencil.svg', item: 'pencil', role: 'image' }]),
    { path: 'images/pencil.svg', bytes: new Uint8Array([1]) }]);
  expect(result).toMatchObject({ ok: true, value: { bindings: [
    { path: 'images/pencil.svg', item: 'pencil', role: 'image' },
  ] } });
});

it('parses supported uppercase JSON extensions instead of silently dropping texts', () => {
  const result = parsePackEntries([entry('pack.json', pack), entry('items.json', items),
    entry('texts/classroom.JSON', text), entry('annotations/classroom.JSON', annotations)]);
  expect(result).toMatchObject({ ok: true, value: {
    texts: { classroom: text }, annotations: { classroom: annotations },
  } });
});

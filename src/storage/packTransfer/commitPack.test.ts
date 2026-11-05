import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import pack from '../../../tests/fixtures/en-vocab/pack.json';
import items from '../../../tests/fixtures/en-vocab/items.json';
import text from '../../../tests/fixtures/en-vocab/texts/classroom.json';
import annotations from '../../../tests/fixtures/en-vocab/annotations/classroom.json';
import { packContentsSchema } from '../../core/pack/schema';
import { createDatabase } from '../db';
import { commitPack } from './commitPack';
import { seedPack, snapshot, storageRecords } from '../../../tests/storageFixtures';

let db: ReturnType<typeof createDatabase>;
beforeEach(() => { db = createDatabase(`commit-${crypto.randomUUID()}`); });
afterEach(async () => { await db.delete(); });
const contents = packContentsSchema.parse({ pack, items, assets: [],
  texts: { classroom: text }, annotations: { classroom: annotations } });
const applied = { assets: [], bindings: [], unbound: 0 };

it('commits all validated rows and preserves annotation text without changing the schema', async () => {
  expect(await commitPack(db, contents, applied)).toEqual({ ok: true,
    value: { status: 'imported', packId: pack.id } });
  expect(await db.items.count()).toBe(items.length);
  expect(await db.texts.get([pack.id, text.id])).toEqual({ ...text, packId: pack.id });
  expect(await db.annotations.toArray()).toEqual(annotations.map((annotation) =>
    ({ ...annotation, textId: text.id, packId: pack.id })));
});

it('requires a conflict decision and allocates successive copies without touching the original', async () => {
  await commitPack(db, contents, applied);
  const original = await snapshot(db);
  expect(await commitPack(db, contents, applied)).toEqual({ ok: true,
    value: { status: 'conflict', packId: pack.id } });
  expect(await snapshot(db)).toEqual(original);
  for (const suffix of [2, 3]) {
    expect(await commitPack(db, contents, applied, 'copy')).toEqual({ ok: true,
      value: { status: 'imported', packId: `${pack.id}-${suffix}` } });
  }
  expect(await db.items.where('packId').equals(pack.id).toArray()).toEqual(original.items);
  expect(await db.packs.get(pack.id)).toEqual(original.packs![0]);
});

it('replaces pack data but retains progress for surviving items across profiles', async () => {
  await commitPack(db, contents, applied);
  const progress = storageRecords(pack.id).progress;
  await db.progress.bulkAdd([progress, { ...progress, profileId: 'other' },
    { ...progress, itemId: items[1]!.id }]);
  const replacement = { ...contents, items: [contents.items[0]!], texts: {}, annotations: {} };
  expect(await commitPack(db, replacement, applied, 'replace')).toMatchObject({ ok: true,
    value: { status: 'imported', packId: pack.id } });
  expect(await db.items.count()).toBe(1);
  expect(await db.texts.count()).toBe(0);
  expect(await db.annotations.count()).toBe(0);
  // IndexedDB returns primary-key order, not insertion order.
  expect(await db.progress.toArray()).toEqual([{ ...progress, profileId: 'other' }, progress]);
});

it('rolls back every table when the last write fails after observed mutations', async () => {
  await seedPack(db, pack.id);
  const before = await snapshot(db);
  let reachedAfterMutations = false;
  const failAfterWrites = async () => {
    expect(await db.items.count()).toBe(items.length);
    expect(await db.texts.count()).toBe(1);
    expect(await db.assets.count()).toBe(0);
    expect(await db.bindings.count()).toBe(0);
    reachedAfterMutations = true;
    throw new Error('Synthetic failure after actual writes');
  };
  const bindingWrite = vi.spyOn(db.bindings, 'bulkAdd').mockImplementationOnce(
    failAfterWrites as unknown as typeof db.bindings.bulkAdd);
  expect(await commitPack(db, contents, applied, 'replace')).toMatchObject({ ok: false,
    error: { code: 'WriteFailed' } });
  bindingWrite.mockRestore();
  expect(reachedAfterMutations).toBe(true);
  expect(await snapshot(db)).toEqual(before);
});

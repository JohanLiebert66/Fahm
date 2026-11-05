import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createDatabase } from './db';
import { addExplanation, type AddExplanationRequest } from './addExplanation';
import { tokenize } from '../core/reader/tokenize';
import { validatePack } from '../core/pack/validate';
import { storageRecords, seedPack, snapshot } from '../../tests/storageFixtures';

let db: ReturnType<typeof createDatabase>;
const pack = storageRecords('synthetic-pack').pack;
const text = { id: 'invented', title: { en: 'Invented fixture' },
  segments: [{ id: 's', text: '(zorpli), zorpli blimzo' }] };
function request(): AddExplanationRequest {
  return { packId: pack.id, textId: text.id, segmentId: 's',
    token: tokenize(text.segments[0]!.text)[0]!, language: 'en', meaning: 'An invented meaning.' };
}
beforeEach(async () => {
  db = createDatabase(`explanation-${crypto.randomUUID()}`);
  await db.packs.add(pack);
  await db.texts.add({ ...text, packId: pack.id });
});
afterEach(async () => { vi.restoreAllMocks(); await db.delete(); });

it('commits one item and one core annotation in one transaction and survives reopening as a valid pack', async () => {
  const transaction = vi.spyOn(db, 'transaction');
  const result = await addExplanation(db, request(), () => 'fixed-id');
  expect(result).toMatchObject({ ok: true, value: { ok: true, value: {
    item: { id: 'fixed-id', term: 'zorpli' }, annotation: { item: 'fixed-id' },
  } } });
  expect(transaction).toHaveBeenCalledTimes(1);
  expect(transaction.mock.calls[0]![0]).toBe('rw');
  transaction.mockRestore();
  db.close(); await db.open();
  const items = await db.items.toArray();
  const annotations = await db.annotations.toArray();
  const token = request().token;
  expect(items).toEqual([{ packId: pack.id, id: 'fixed-id', term: 'zorpli',
    explain: { en: { meaning: request().meaning } } }]);
  expect(annotations).toEqual([{ packId: pack.id, textId: text.id, segment: 's',
    start: token.coreStart, end: token.coreEnd, item: 'fixed-id' }]);
  expect(await db.texts.toArray()).toEqual([{ ...text, packId: pack.id }]);
  expect(await db.packs.toArray()).toEqual([pack]);
  expect(validatePack({ pack: pack.meta, items, texts: { [text.id]: text },
    annotations: { [text.id]: annotations.map(({ packId: _pack, textId: _text, ...row }) => {
      void _pack; void _text; return row;
    }) }, assets: [] }).ok).toBe(true);
});

it('rolls back after both actual writes, preserving all pre-existing tables', async () => {
  await seedPack(db, 'unrelated-pack');
  const before = await snapshot(db);
  const add = db.annotations.add.bind(db.annotations);
  let observedMutations = false;
  const failAfterWrites = async (...args: Parameters<typeof add>) => {
    await add(...args);
    expect(await db.items.get([pack.id, 'fixed-id'])).toBeDefined();
    expect(await db.annotations.where('packId').equals(pack.id).count()).toBe(1);
    observedMutations = true;
    throw new Error('Synthetic failure after item and annotation writes');
  };
  vi.spyOn(db.annotations, 'add').mockImplementationOnce(failAfterWrites as unknown as typeof db.annotations.add);
  expect(await addExplanation(db, request(), () => 'fixed-id')).toMatchObject({ ok: false,
    error: { code: 'WriteFailed' } });
  expect(observedMutations).toBe(true);
  expect(await snapshot(db)).toEqual(before);
});

it.each(['emptyTerm', 'duplicateTerm', 'overlap', 'invalid'])('rejects %s without any writes', async error => {
  const value = request();
  if (error === 'emptyTerm') {
    const segments = [{ id: 's', text: '\u200B' }];
    await db.texts.put({ ...text, segments, packId: pack.id });
    value.token = tokenize(segments[0]!.text)[0]!;
  }
  if (error === 'duplicateTerm') {
    await db.items.add({ packId: pack.id, id: 'existing', term: 'blimzo', forms: ['ZORPLI'], explain: {} });
  }
  if (error === 'overlap') {
    await db.items.add({ packId: pack.id, id: 'existing', term: 'blimzo', explain: {} });
    await db.annotations.add({ packId: pack.id, textId: text.id, segment: 's',
      start: value.token.coreStart, end: value.token.coreEnd, item: 'existing' });
  }
  if (error === 'invalid') value.token = { ...value.token, coreEnd: -1 };
  const before = await snapshot(db);
  const itemWrite = vi.spyOn(db.items, 'add');
  const annotationWrite = vi.spyOn(db.annotations, 'add');
  expect(await addExplanation(db, value)).toEqual({ ok: true, value: { ok: false, errors: [error] } });
  expect(itemWrite).not.toHaveBeenCalled(); expect(annotationWrite).not.toHaveBeenCalled();
  expect(await snapshot(db)).toEqual(before);
});

it('serializes concurrent saves across connections so only one can create the same normalized term', async () => {
  const other = createDatabase(db.name);
  try {
    const results = await Promise.all([addExplanation(db, request(), () => 'fixed-id'),
      addExplanation(other, request(), () => 'fixed-id')]);
    expect(results.filter(result => result.ok && result.value.ok)).toHaveLength(1);
    expect(results.filter(result => result.ok && !result.value.ok)).toEqual([
      { ok: true, value: { ok: false, errors: ['duplicateTerm'] } },
    ]);
    expect(await db.items.count()).toBe(1); expect(await db.annotations.count()).toBe(1);
  } finally { other.close(); }
});

it('suffixes colliding IDs for distinct words without changing the first permanent ID', async () => {
  await addExplanation(db, request(), () => 'fixed-id');
  const token = tokenize(text.segments[0]!.text).at(-1)!;
  expect(await addExplanation(db, { ...request(), token }, () => 'fixed-id')).toMatchObject({ ok: true,
    value: { ok: true, value: { item: { id: 'fixed-id-2' } } } });
  expect((await db.items.toArray()).map(item => item.id)).toEqual(['fixed-id', 'fixed-id-2']);
});

it('validates the resulting pack before writing if existing annotations are invalid', async () => {
  await db.annotations.add({ packId: pack.id, textId: text.id, segment: 'missing',
    start: 0, end: 1, item: 'missing' });
  const before = await snapshot(db);
  expect(await addExplanation(db, request())).toEqual({ ok: true, value: { ok: false, errors: ['invalid'] } });
  expect(await snapshot(db)).toEqual(before);
});

it.each(['pack', 'text', 'segment'])('rejects a missing %s without writes', async missing => {
  const value = { ...request(), [`${missing}Id`]: 'missing' };
  const before = await snapshot(db);
  expect(await addExplanation(db, value)).toEqual({ ok: true, value: { ok: false, errors: ['invalid'] } });
  expect(await snapshot(db)).toEqual(before);
});

it('returns a typed unavailable error instead of crashing on a closed database', async () => {
  db.close();
  expect(await addExplanation(db, request())).toMatchObject({ ok: false,
    error: { code: 'StorageUnavailable' } });
});

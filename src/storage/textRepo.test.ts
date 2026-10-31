import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { storageRecords } from '../../tests/storageFixtures';
import { createDatabase } from './db';
import { textRepo } from './textRepo';

let db: ReturnType<typeof createDatabase>;
beforeEach(() => { db = createDatabase(`text-${crypto.randomUUID()}`); });
afterEach(async () => { await db.delete(); });

it('creates, reads, lists and removes immutable source texts', async () => {
  const repo = textRepo(db);
  const { text } = storageRecords();
  const key: [string, string] = [text.packId, text.id];
  expect(await repo.create(text)).toEqual({ ok: true, value: key });
  expect(await repo.get(key)).toEqual({ ok: true, value: text });
  expect(await repo.listByPack(text.packId)).toEqual({ ok: true, value: [text] });
  expect(await repo.list()).toEqual({ ok: true, value: [text] });
  expect('put' in repo).toBe(false);
  expect(await repo.create({ ...text, segments: [] })).toMatchObject({
    ok: false, error: { code: 'InvalidData' },
  });
  expect(await repo.get(key)).toEqual({ ok: true, value: text });
  expect(await repo.remove(key)).toEqual({ ok: true, value: undefined });
  expect(await repo.get(key)).toEqual({ ok: true, value: undefined });
});

it('rejects an invalid source text before writing', async () => {
  const { text } = storageRecords();
  expect(await textRepo(db).create({ ...text, packId: '' })).toMatchObject({
    ok: false, error: { code: 'InvalidData' },
  });
  expect(await db.texts.count()).toBe(0);
});

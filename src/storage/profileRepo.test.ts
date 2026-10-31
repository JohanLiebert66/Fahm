import 'fake-indexeddb/auto';
import { repositoryContract } from '../../tests/repositoryContract';
import { storageRecords } from '../../tests/storageFixtures';
import { profileRepo } from './profileRepo';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { createDatabase } from './db';

repositoryContract(profileRepo, () => {
  const { profile: original } = storageRecords();
  return { original, updated: { ...original, name: 'Updated test profile' }, invalid: { ...original, name: '' }, key: original.id };
});

let db: ReturnType<typeof createDatabase>;
let second: ReturnType<typeof createDatabase>;
beforeEach(() => {
  const name = `first-run-${crypto.randomUUID()}`;
  db = createDatabase(name); second = createDatabase(name);
});
afterEach(async () => { second.close(); await db.delete(); });

it('creates one default profile across concurrent connections and preserves later edits', async () => {
  const details = { name: 'Synthetic profile', avatar: 'test-avatar' };
  const results = await Promise.all([
    profileRepo(db).ensureDefault(details), profileRepo(second).ensureDefault(details),
  ]);
  expect(results[0]).toEqual(results[1]);
  expect(results[0]).toMatchObject({ ok: true, value: details });
  expect(await db.profiles.count()).toBe(1);
  const first = results[0];
  if (!first?.ok) throw new Error('Expected a default profile');
  const edited = { ...first.value, name: 'Renamed profile' };
  await profileRepo(db).put(edited);
  expect(await profileRepo(db).ensureDefault(details)).toEqual({ ok: true, value: edited });
  expect(await db.profiles.count()).toBe(1);
});

it('does not create a default profile from invalid details', async () => {
  expect(await profileRepo(db).ensureDefault({ name: '', avatar: '' })).toMatchObject({
    ok: false, error: { code: 'InvalidData' },
  });
  expect(await db.profiles.count()).toBe(0);
});

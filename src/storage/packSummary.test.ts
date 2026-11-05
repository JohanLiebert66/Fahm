import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createDatabase, type FahmDatabase } from './db';
import { seedPack } from '../../tests/storageFixtures';
import { getPackSummaries } from './packSummary';

let db: FahmDatabase;

beforeEach(() => {
  db = createDatabase(`test-pack-summary-${crypto.randomUUID()}`);
});

afterEach(async () => {
  await db.delete();
});

describe('getPackSummaries', () => {
  it('returns empty array when no packs are stored', async () => {
    const result = await getPackSummaries(db);
    expect(result).toEqual({ ok: true, value: [] });
  });

  it('returns pack summaries with accurate text and item counts and importedAt', async () => {
    await seedPack(db, 'pack-a');
    await seedPack(db, 'pack-b');

    // Add an extra text and item to pack-a
    await db.texts.add({
      packId: 'pack-a',
      id: 'text-2',
      title: { en: 'Second text' },
      ref: 'ref-2',
      segments: [{ id: 's1', text: 'hello' }],
    });
    await db.items.add({
      packId: 'pack-a',
      id: 'item-2',
      term: 'pen',
      forms: [],
      group: 'stationery',
      level: 1,
      explain: { en: { meaning: 'Writing instrument', example: 'Use a pen' } },
    });

    const result = await getPackSummaries(db);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).toHaveLength(2);
    const packA = result.value.find(p => p.id === 'pack-a');
    const packB = result.value.find(p => p.id === 'pack-b');

    expect(packA).toBeDefined();
    expect(packA?.textCount).toBe(2);
    expect(packA?.itemCount).toBe(2);
    expect(packA?.importedAt).toBe(1);
    expect(packA?.meta.id).toBe('pack-a');

    expect(packB).toBeDefined();
    expect(packB?.textCount).toBe(1);
    expect(packB?.itemCount).toBe(1);
  });

  it('returns typed StorageUnavailable error when database is closed', async () => {
    db.close();
    const result = await getPackSummaries(db);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('StorageUnavailable');
    }
  });
});

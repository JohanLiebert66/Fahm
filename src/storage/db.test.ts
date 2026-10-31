import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from './db';

let db: ReturnType<typeof createDatabase>;
beforeEach(() => { db = createDatabase(`storage-${crypto.randomUUID()}`); });
afterEach(async () => { await db.delete(); });

describe('database v1', () => {
  it('defines the exact primary keys and pack ownership indexes', async () => {
    await db.open();
    const keys = Object.fromEntries(db.tables.map((table) => [table.name, table.schema.primKey.src]));
    expect(keys).toEqual({
      packs: 'id', items: '[packId+id]', texts: '[packId+id]',
      annotations: '[packId+textId+segment+start+end]', assets: 'id',
      bindings: 'id', profiles: 'id', progress: '[profileId+packId+itemId]', settings: 'key',
    });
    for (const name of ['items', 'texts', 'annotations', 'assets', 'bindings', 'progress']) {
      expect(db.table(name).schema.idxByName.packId).toBeDefined();
    }
    expect(db.verno).toBe(1);
  });
});

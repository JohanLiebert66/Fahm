import packJson from './fixtures/en-vocab/pack.json';
import itemsJson from './fixtures/en-vocab/items.json';
import textJson from './fixtures/en-vocab/texts/classroom.json';
import annotationsJson from './fixtures/en-vocab/annotations/classroom.json';
import { annotationSchema, itemSchema, packSchema, textSchema } from '../src/core/pack/schema';
import type { FahmDatabase } from '../src/storage/db';
import type { StoredAsset, StoredBinding, StoredProfile, StoredProgress } from '../src/storage/records';

/** All teaching content comes from the existing synthetic fixture. */
export function storageRecords(packId = packJson.id) {
  const meta = { ...packSchema.parse(packJson), id: packId };
  const item = { ...itemSchema.parse(itemsJson[0]), packId };
  const text = { ...textSchema.parse(textJson), packId };
  const { text: omitted, ...annotation } = annotationSchema.parse(annotationsJson[0]);
  void omitted;
  const blob = new Blob(['synthetic asset'], { type: 'image/svg+xml' });
  const asset: StoredAsset = {
    id: crypto.randomUUID(), packId, kind: 'image', name: 'synthetic.svg',
    mime: blob.type, size: blob.size, blob,
  };
  const binding: StoredBinding = {
    id: crypto.randomUUID(), packId, assetId: asset.id, itemId: item.id, role: 'image', order: 0,
  };
  const profile: StoredProfile = { id: 'test-profile', name: 'Test', avatar: '', createdAt: 1 };
  const progress: StoredProgress = {
    profileId: profile.id, packId, itemId: item.id, srsVersion: 1,
    srsState: null, lastSeen: 1, correct: 0, wrong: 0,
  };
  return {
    pack: { id: packId, meta, importedAt: 1 }, item, text,
    annotation: { ...annotation, packId, textId: text.id }, asset, binding, profile, progress,
  };
}

export async function seedPack(db: FahmDatabase, packId: string) {
  const row = storageRecords(packId);
  await db.transaction('rw', db.tables, async () => {
    await db.packs.add(row.pack); await db.items.add(row.item); await db.texts.add(row.text);
    await db.annotations.add(row.annotation); await db.assets.add(row.asset);
    await db.bindings.add(row.binding); await db.progress.add(row.progress);
    await db.profiles.put(row.profile);
    await db.settings.put({ key: 'test-setting', value: 1 });
  });
  return row;
}

export async function snapshot(db: FahmDatabase) {
  return Object.fromEntries(await Promise.all(db.tables.map(async (table) => [table.name, await table.toArray()])));
}

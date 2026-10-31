import Dexie, { type Table } from 'dexie';
import type {
  StoredAnnotation, StoredAsset, StoredBinding, StoredItem, StoredPack,
  StoredProfile, StoredProgress, StoredSetting, StoredText, ItemKey, AnnotationKey, ProgressKey,
} from './records';

export type FahmDatabase = Dexie & {
  packs: Table<StoredPack, string>;
  items: Table<StoredItem, ItemKey>;
  texts: Table<StoredText, ItemKey>;
  annotations: Table<StoredAnnotation, AnnotationKey>;
  assets: Table<StoredAsset, string>;
  bindings: Table<StoredBinding, string>;
  profiles: Table<StoredProfile, string>;
  progress: Table<StoredProgress, ProgressKey>;
  settings: Table<StoredSetting, string>;
};

/** Append a new version and upgrade callback for future migrations; never edit v1. */
export function registerMigrations(db: FahmDatabase) {
  db.version(1).stores({
    packs: 'id', items: '[packId+id], packId', texts: '[packId+id], packId',
    annotations: '[packId+textId+segment+start+end], packId',
    assets: 'id, packId', bindings: 'id, packId, assetId, itemId',
    profiles: 'id', progress: '[profileId+packId+itemId], packId, profileId', settings: 'key',
  });
}

export function createDatabase(name = 'fahm'): FahmDatabase {
  const db = new Dexie(name) as FahmDatabase;
  registerMigrations(db);
  return db;
}

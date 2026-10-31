import type { Annotation, Binding, Item, Pack, Text } from '../core/pack/types';

export interface StoredPack { id: Pack['id']; meta: Pack; importedAt: number }
export type StoredItem = Item & { packId: Pack['id'] };
export type StoredText = Text & { packId: Pack['id'] };
export type StoredAnnotation = Omit<Annotation, 'text' | 'item'> & {
  packId: Pack['id']; textId: Text['id']; item?: Annotation['item'];
};
export type StoredAsset = Pick<Binding, 'credit' | 'license'> & {
  id: string; packId: Pack['id']; kind: 'image' | 'audio';
  mime: string; name: string; size: number; blob: Blob;
};
export type StoredBinding = Omit<Binding, 'path' | 'item' | 'credit' | 'license'> & {
  id: string; packId: Pack['id']; assetId: StoredAsset['id']; itemId?: Item['id'];
};
export interface StoredProfile { id: string; name: string; avatar: string; createdAt: number }
export interface StoredProgress {
  profileId: StoredProfile['id']; packId: Pack['id']; itemId: Item['id'];
  srsVersion: number; srsState: unknown; lastSeen: number; correct: number; wrong: number;
}
export interface StoredSetting { key: string; value: unknown }
export type ItemKey = [string, string];
export type AnnotationKey = [string, string, string, number, number];
export type ProgressKey = [string, string, string];

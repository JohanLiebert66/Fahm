import { z } from 'zod';
import { annotationSchema, bindingSchema, itemIdSchema, itemSchema, packSchema, textSchema } from '../core/pack/schema';

const id = z.string().min(1);
const packId = packSchema.shape.id;
const timestamp = z.number().finite().nonnegative();
const count = z.number().int().nonnegative();
export const storedPackSchema = z.object({
  id: packId, meta: packSchema, importedAt: timestamp,
}).refine((record) => record.id === record.meta.id);
export const storedItemSchema = itemSchema.extend({ packId });
export const storedTextSchema = textSchema.extend({ packId });
export const storedAnnotationSchema = annotationSchema.omit({ text: true }).partial({ item: true })
  .extend({ packId, textId: id }).refine((record) => record.end > record.start);
export const storedBindingSchema = bindingSchema.omit({ path: true, item: true, credit: true, license: true })
  .extend({ id, packId, assetId: z.string().uuid(), itemId: itemIdSchema.optional() });
export const storedAssetSchema = bindingSchema.pick({ credit: true, license: true }).extend({
  id: z.string().uuid(), packId, kind: z.enum(['image', 'audio']), mime: id,
  name: id, size: count, blob: z.instanceof(Blob),
}).refine((record) => record.size === record.blob.size && record.mime === record.blob.type);
export const storedProfileSchema = z.object({ id, name: id, avatar: z.string(), createdAt: timestamp });
export const storedProgressSchema = z.object({
  profileId: id, packId, itemId: itemIdSchema, srsVersion: z.number().int().positive(),
  srsState: z.unknown(), lastSeen: timestamp, correct: count, wrong: count,
});

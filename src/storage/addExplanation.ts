import type { Token } from '../core/reader/tokenize';
import { buildExplanation, type ExplanationResult } from '../core/reader/buildExplanation';
import { validatePack } from '../core/pack/validate';
import type { FahmDatabase } from './db';
import { runTransaction, type StorageResult } from './tx';

export interface AddExplanationRequest {
  packId: string;
  textId: string;
  segmentId: string;
  token: Token;
  language: string;
  meaning: string;
}

export async function addExplanation(
  db: FahmDatabase, request: AddExplanationRequest, generateId?: (normalizedTerm: string) => string,
): Promise<StorageResult<ExplanationResult>> {
  // Lock the read snapshot and writes together so concurrent saves cannot bypass validation.
  return runTransaction(db, [db.packs, db.items, db.texts, db.annotations], async (): Promise<ExplanationResult> => {
    const { packId, textId, segmentId, token, language, meaning } = request;
    const [pack, items, texts, annotations] = await Promise.all([
      db.packs.get(packId), db.items.where('packId').equals(packId).toArray(),
      db.texts.where('packId').equals(packId).toArray(), db.annotations.where('packId').equals(packId).toArray(),
    ]);
    const segment = texts.find(text => text.id === textId)?.segments.find(entry => entry.id === segmentId);
    if (!pack || !segment) return { ok: false, errors: ['invalid'] };
    const result = buildExplanation({ segment, token, language, meaning, items, generateId,
      annotations: annotations.filter(entry => entry.textId === textId) });
    if (!result.ok) return result;
    const { item, annotation } = result.value;
    const updated = [...annotations, { ...annotation, packId, textId }];
    const validation = validatePack({ pack: pack.meta, items: [...items, item],
      texts: Object.fromEntries(texts.map(text => [text.id, text])),
      annotations: Object.fromEntries(texts.map(text => [text.id,
        updated.filter(entry => entry.textId === text.id).sort((a, b) => a.start - b.start)])), assets: [] });
    if (!validation.ok) return { ok: false, errors: ['invalid'] };
    // Validate everything before the first mutation; texts and pack metadata are never written.
    await db.items.add({ ...item, packId });
    await db.annotations.add({ ...annotation, packId, textId });
    return result;
  });
}

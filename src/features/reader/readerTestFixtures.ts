import 'fake-indexeddb/auto';
import { createDatabase } from '../../storage/db';
import { annotationSchema, itemSchema, packSchema, textSchema } from '../../core/pack/schema';
import enPack from '../../../tests/fixtures/en-vocab/pack.json';
import enItems from '../../../tests/fixtures/en-vocab/items.json';
import enText from '../../../tests/fixtures/en-vocab/texts/classroom.json';
import enAnnotations from '../../../tests/fixtures/en-vocab/annotations/classroom.json';
import arPack from '../../../tests/fixtures/ar-sample-text/pack.json';
import arItems from '../../../tests/fixtures/ar-sample-text/items.json';
import arText from '../../../tests/fixtures/ar-sample-text/texts/everyday.json';
import arAnnotations from '../../../tests/fixtures/ar-sample-text/annotations/everyday.json';

export { enPack, enItems, enText, arPack, arItems, arText };

export async function readerDatabase() {
  const db = createDatabase(`reader-test-${crypto.randomUUID()}`);
  for (const [pack, items, text, annotations] of [
    [enPack, enItems, enText, enAnnotations], [arPack, arItems, arText, arAnnotations],
  ] as const) {
    const meta = packSchema.parse(pack);
    await db.packs.add({ id: meta.id, meta, importedAt: 1 });
    await db.items.bulkAdd(items.map(item => ({ ...itemSchema.parse(item), packId: meta.id })));
    const parsedText = textSchema.parse(text);
    await db.texts.add({ ...parsedText, packId: meta.id });
    await db.annotations.bulkAdd(annotations.map(input => {
      const { text: omitted, ...annotation } = annotationSchema.parse(input);
      void omitted;
      return { ...annotation, packId: meta.id, textId: parsedText.id };
    }));
  }
  return db;
}

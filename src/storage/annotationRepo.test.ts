import 'fake-indexeddb/auto';
import { repositoryContract } from '../../tests/repositoryContract';
import { storageRecords } from '../../tests/storageFixtures';
import { annotationRepo } from './annotationRepo';

repositoryContract(annotationRepo, () => {
  const { annotation: original } = storageRecords();
  return { original, updated: { ...original, override: { explain: {} } }, invalid: { ...original, end: -1 }, key: [original.packId, original.textId, original.segment, original.start, original.end] as [string, string, string, number, number], packId: original.packId };
});

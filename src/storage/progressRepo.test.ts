import 'fake-indexeddb/auto';
import { repositoryContract } from '../../tests/repositoryContract';
import { storageRecords } from '../../tests/storageFixtures';
import { progressRepo } from './progressRepo';

repositoryContract(progressRepo, () => {
  const { progress: original } = storageRecords();
  return { original, updated: { ...original, correct: 1 }, invalid: { ...original, profileId: '' }, key: [original.profileId, original.packId, original.itemId] as [string, string, string], packId: original.packId };
});

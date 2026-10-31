import 'fake-indexeddb/auto';
import { repositoryContract } from '../../tests/repositoryContract';
import { storageRecords } from '../../tests/storageFixtures';
import { itemRepo } from './itemRepo';

repositoryContract(itemRepo, () => {
  const { item: original } = storageRecords();
  return { original, updated: { ...original, level: 2 }, invalid: { ...original, packId: '' }, key: [original.packId, original.id] as [string, string], packId: original.packId };
});

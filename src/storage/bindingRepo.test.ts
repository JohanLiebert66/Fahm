import 'fake-indexeddb/auto';
import { repositoryContract } from '../../tests/repositoryContract';
import { storageRecords } from '../../tests/storageFixtures';
import { bindingRepo } from './bindingRepo';

repositoryContract(bindingRepo, () => {
  const { binding: original } = storageRecords();
  return { original, updated: { ...original, role: 'puzzle' as const, itemId: undefined }, invalid: { ...original, assetId: '' }, key: original.id, packId: original.packId };
});

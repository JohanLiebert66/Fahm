import type { FahmDatabase } from './db';
import type { TransferSource } from './packTransfer/types';
import type { ImportOptions, ImportReport } from './packTransfer/report';
import { orchestrateImport } from './packTransfer/orchestrateImport';
export type { ImportOptions, ImportReport } from './packTransfer/report';

export async function importPack(
  db: FahmDatabase, source: TransferSource, options: ImportOptions = {},
): Promise<ImportReport> {
  return orchestrateImport(db, source, options);
}

import type { PackIssue } from '../../core/pack/types';
import type { FahmDatabase } from '../db';
import { estimateQuota } from '../quota';
import { mapStorageError, storageFailure } from '../tx';
import { applyBindings } from './applyBindings';
import { commitPack } from './commitPack';
import { parsePackEntries } from './parsePackEntries';
import { readEntries } from './readEntries';
import type { ImportOptions, ImportReport } from './report';
import type { TransferSource } from './types';

const issue = (message: string): PackIssue => ({ file: 'pack.json', path: '$', message });

export async function orchestrateImport(
  db: FahmDatabase, source: TransferSource, options: ImportOptions,
): Promise<ImportReport> {
  const report: ImportReport = { status: 'failed', errors: [], warnings: [],
    counts: { items: 0, texts: 0, annotations: 0, assets: 0, unbound: 0 } };
  try {
    const entries = await readEntries(source, options);
    const parsed = parsePackEntries(entries);
    report.warnings.push(...parsed.warnings);
    if (!parsed.ok) return { ...report, errors: parsed.errors };
    const contents = parsed.value;
    const applied = applyBindings(contents, entries);
    report.packId = contents.pack.id;
    report.counts = { items: contents.items.length, texts: Object.keys(contents.texts).length,
      annotations: Object.values(contents.annotations).reduce((sum, rows) => sum + rows.length, 0),
      assets: applied.assets.length, unbound: applied.unbound };
    if (applied.unbound) report.warnings.push(issue('packImport.warning.unbound'));
    const estimate = await estimateQuota();
    if (!estimate.ok || estimate.value.quota === undefined || estimate.value.usage === undefined) {
      report.warnings.push(issue('packImport.warning.quotaUnavailable'));
    } else {
      const bytes = entries.reduce((sum, entry) => sum + entry.bytes.byteLength, 0);
      const { quota, usage } = estimate.value;
      if (usage + bytes > quota) return { ...report, storageError: storageFailure('QuotaExceeded').error };
      if (usage + bytes >= quota * 0.9) report.warnings.push(issue('packImport.warning.lowSpace'));
    }
    const saved = await commitPack(db, contents, applied, options.conflict);
    return saved.ok ? { ...report, ...saved.value } : { ...report, storageError: saved.error };
  } catch (error) {
    if (error && typeof error === 'object' && 'issues' in error && Array.isArray(error.issues)) {
      return { ...report, errors: error.issues as PackIssue[] };
    }
    return { ...report, storageError: mapStorageError(error).error,
      errors: [issue('packImport.error.read')] };
  }
}

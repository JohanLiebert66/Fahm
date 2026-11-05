import { useEffect, useId, useRef, useState, type ChangeEvent, type InputHTMLAttributes, type KeyboardEvent } from 'react';
import { createDatabase, type FahmDatabase } from '../../storage/db';
import { useTranslation } from 'react-i18next';
import { Card } from '../../ui/Card';
import { IconButton } from '../../ui/IconButton';
import { importPack, type ImportOptions, type ImportReport } from '../../storage/importPack';
import type { TransferSource } from '../../storage/packTransfer/types';
import type { PackIssue } from '../../core/pack/types';
import { exportPack } from '../../storage/exportPack';
import { mapStorageError, type StorageError } from '../../storage/tx';

// The pure validator keeps technical diagnostics; localize them only for display.
const validationReasons: [RegExp, string][] = [
  [/^Unknown field ignored$/, 'unknownField'], [/^Unsupported schemaVersion/, 'schemaVersion'],
  [/^Duplicate (item|segment) id:/, 'duplicateId'],
  [/^(Unknown (item|text|segment):|Asset path not found:)/, 'reference'],
  [/^Asset path is already bound:/, 'assetAlreadyBound'],
  [/^Item id must contain/, 'itemId'], [/^Pack id must match/, 'packId'],
  [/^(Must not be empty|Required)$/, 'required'], [/^At least one language/, 'language'],
  [/^Offset must/, 'offset'], [/^Span (end must|must be inside)/, 'span'],
  [/^Spans must be ordered/, 'spanOrder'], [/^Spans must not overlap/, 'overlap'],
  [/^Annotation text must equal/, 'annotationText'], [/^Puzzle binding must not/, 'puzzleItem'],
  [/ binding requires an item$/, 'bindingItem'],
];

export function ImportPack({ db: suppliedDb }: { db?: FahmDatabase }) {
  const connection = useRef<FahmDatabase | null>(null);
  useEffect(() => {
    const db = suppliedDb ?? createDatabase();
    connection.current = db;
    return () => {
      connection.current = null;
      if (!suppliedDb) db.close();
    };
  }, [suppliedDb]);
  const { t } = useTranslation();
  const source = useRef<TransferSource | null>(null);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [choice, setChoice] = useState<'copy' | 'replace'>('copy');
  const [notice, setNotice] = useState('');
  const [backupError, setBackupError] = useState<StorageError | null>(null);
  const dialogTitle = useId();
  const conflicting = report?.status === 'conflict';
  const picker = useRef<HTMLInputElement | null>(null);
  useEffect(() => { if (!conflicting) picker.current?.focus(); }, [conflicting]);
  async function run(options?: ImportOptions) {
    const db = connection.current;
    if (!source.current || busy || !db) return;
    setBusy(true);
    if (!options) setReport(null);
    setNotice('');
    setBackupError(null);
    try {
      const result = await importPack(db, source.current, options);
      setReport(result);
      if (result.status === 'conflict') setChoice('copy');
      if (result.status !== 'conflict') source.current = null;
    } catch {
      source.current = null;
      setReport({ status: 'failed', counts: { items: 0, texts: 0, annotations: 0, assets: 0, unbound: 0 },
        errors: [{ file: '', path: '$', message: 'packImport.error.read' }], warnings: [] });
    } finally { setBusy(false); }
  }
  function pick(event: ChangeEvent<HTMLInputElement>, folder = false) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = '';
    if (!files.length || busy || conflicting) return;
    picker.current = event.currentTarget;
    source.current = folder ? files : files[0]!;
    void run();
  }
  function cancel() {
    source.current = null;
    setReport(null);
    setNotice('packImport.cancelled');
    setBackupError(null);
  }
  async function backup() {
    const db = connection.current;
    if (busy || !report?.packId || !db) return;
    setBusy(true);
    setNotice('');
    setBackupError(null);
    try {
      const result = await exportPack(db, report.packId);
      if (!result.ok) { setBackupError(result.error); setNotice('packImport.exportFailed'); return; }
      const link = document.createElement('a');
      const url = URL.createObjectURL(result.value);
      try {
        link.href = url;
        link.download = `${report.packId}.zip`;
        document.body.append(link);
        link.click();
        setNotice('packImport.backupReady');
      } finally { link.remove(); URL.revokeObjectURL(url); }
    } catch (error) {
      setBackupError(mapStorageError(error).error);
      setNotice('packImport.exportFailed');
    } finally { setBusy(false); }
  }
  function dialogKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && !busy) { event.preventDefault(); cancel(); }
    if (event.key !== 'Tab') return;
    if (busy) { event.preventDefault(); return; }
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('input:not(:disabled):checked, button:not(:disabled)'));
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  const issueText = (issue: PackIssue) => issue.message.startsWith('packImport.')
    ? t(issue.message, { count: report?.counts.unbound ?? 0 })
    : t(`packImport.validationReason.${validationReasons.find(([pattern]) => pattern.test(issue.message))?.[1] ?? 'invalidField'}`);
  const issues = (entries: PackIssue[]) => <ul>{entries.map((issue, index) =>
    <li key={index}><bdi>{issue.file} {issue.path}</bdi>: {issueText(issue)}</li>)}</ul>;
  const feedback = <>
    <div role="status" aria-live="polite">
      {busy && <p>{t('packImport.busy')}</p>}
      {notice && notice !== 'packImport.exportFailed' && <p>{t(notice)}</p>}
      {report && <>
        <p>{t(`packImport.${report.status}`)}</p>
        <p>{t('packImport.warnings', { count: report.warnings.length })}</p>
        {issues(report.warnings)}
        {Object.entries(report.counts).map(([key, count]) => <p key={key}>{t(`packImport.counts.${key}`, { count })}</p>)}
      </>}
    </div>
    {report && <div role="alert">
      <p>{t('packImport.errors', { count: report.errors.length })}</p>
      {issues(report.errors)}
      {notice === 'packImport.exportFailed' && <p>{t(notice)}</p>}
      {backupError && <p>{t(backupError.messageKey)} {t(backupError.nextStepKey)}</p>}
      {report.storageError && <p>{t(report.storageError.messageKey)} {t(report.storageError.nextStepKey)}</p>}
    </div>}
  </>;
  return <Card className="w-full max-w-2xl flex flex-col gap-4 text-start">
    <h2 className="text-2xl font-bold">{t('packImport.title')}</h2>
    <label>{t('packImport.zip')}
      <input className="block min-h-[48px] min-w-[48px] w-full" type="file" accept=".zip,application/zip" disabled={busy || conflicting} onChange={event => pick(event)} />
    </label>
    <label>{t('packImport.folder')}
      <input className="block min-h-[48px] min-w-[48px] w-full" type="file" multiple disabled={busy || conflicting} onChange={event => pick(event, true)}
        {...{ webkitdirectory: '' } as InputHTMLAttributes<HTMLInputElement>} />
    </label>
    {!conflicting && feedback}
    {conflicting && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4">
      <div role="dialog" onKeyDown={dialogKey} aria-modal="true" aria-labelledby={dialogTitle} className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl bg-white p-6 flex flex-col gap-4">
        <h3 id={dialogTitle} className="text-xl font-bold">{t('packImport.conflict')}</h3>
        {feedback}
        {(['copy', 'replace'] as const).map(value => <label key={value} className="flex items-center gap-2 min-h-[48px]">
          <input type="radio" name={dialogTitle} value={value} checked={choice === value} autoFocus={value === 'copy'}
            className="min-h-[48px] min-w-[48px]" disabled={busy} onChange={() => setChoice(value)} />
          {t(`packImport.${value}`)}
        </label>)}
        <p>{t('packImport.replaceWarning')}</p>
        <IconButton aria-label={t('packImport.backup')} disabled={busy} onClick={() => { void backup(); }}>{t('packImport.backup')}</IconButton>
        <IconButton aria-label={t('packImport.confirm')} disabled={busy} onClick={() => { void run({ conflict: choice }); }}>{t('packImport.confirm')}</IconButton>
        <IconButton aria-label={t('packImport.cancel')} disabled={busy} onClick={cancel}>{t('packImport.cancel')}</IconButton>
      </div>
    </div>}
  </Card>;
}

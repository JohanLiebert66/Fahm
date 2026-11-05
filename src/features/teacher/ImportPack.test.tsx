import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exportPack } from '../../storage/exportPack';
import { storageFailure } from '../../storage/tx';
import * as database from '../../storage/db';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { importPack } from '../../storage/importPack';
import type { ImportReport } from '../../storage/packTransfer/report';

vi.mock('../../storage/importPack', () => ({ importPack: vi.fn() }));
vi.mock('../../storage/exportPack', () => ({ exportPack: vi.fn() }));
const imported: ImportReport = { status: 'imported', packId: 'fixture',
  counts: { items: 2, texts: 1, annotations: 3, assets: 4, unbound: 0 }, errors: [], warnings: [] };
import { changeLanguage } from '../../i18n';
import { ImportPack } from './ImportPack';

beforeEach(async () => { vi.mocked(importPack).mockReset(); vi.mocked(exportPack).mockReset(); await changeLanguage('en'); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('ImportPack', () => {
  it.each(['zip', 'folder'] as const)('passes actual %s picker files to the shared importer and reports only after completion', async kind => {
    let finish!: (report: ImportReport) => void;
    vi.mocked(importPack).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const db = database.createDatabase('import-picker-test');
    render(<ImportPack db={db} />);
    const input = screen.getByLabelText(kind === 'zip' ? 'Choose ZIP file' : 'Choose folder');
    const file = new File(['{}'], kind === 'zip' ? 'fixture.zip' : 'pack.json');
    const files = kind === 'zip' ? [file] : [file, new File(['[]'], 'items.json')];
    if (kind === 'folder') for (const entry of files) Object.defineProperty(entry, 'webkitRelativePath', { value: `fixture/${entry.name}` });
    fireEvent.change(input, { target: { files } });
    expect(importPack).toHaveBeenCalledWith(db, kind === 'zip' ? file : files, undefined);
    expect(screen.queryByText('Pack imported.')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Choose ZIP file')).toBeDisabled();
    expect(screen.getByLabelText('Choose folder')).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Working…');
    await act(async () => { finish(imported); });
    expect(screen.getByRole('status')).toHaveTextContent('Pack imported.');
    for (const count of ['Items: 2', 'Texts: 1', 'Annotations: 3', 'Assets: 4']) expect(screen.getByRole('status')).toHaveTextContent(count);
    expect(input).toHaveValue('');
    expect(input).not.toBeDisabled();
    db.close();
  });

  it('announces translated issues, storage next steps and unbound counts without translating pack data', async () => {
    vi.mocked(importPack).mockResolvedValueOnce({ ...imported, status: 'failed',
      counts: { ...imported.counts, unbound: 7 },
      errors: [{ file: 'items.json', path: '$[0].term', message: 'Missing content field' },
        { file: 'images/test.png', path: '$', message: 'packImport.error.image' }],
      warnings: [{ file: '', path: '$', message: 'packImport.warning.unbound' }],
      storageError: { code: 'QuotaExceeded', messageKey: 'storage.error.quota', nextStepKey: 'storage.action.freeSpaceOrBackup' } });
    await changeLanguage('ar');
    render(<ImportPack />);
    fireEvent.change(screen.getByLabelText('اختر ملف ZIP'), { target: { files: [new File([''], 'test.zip')] } });
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('الأخطاء: 2');
    expect(alert).toHaveTextContent('items.json');
    expect(alert).toHaveTextContent('$[0].term');
    expect(alert).toHaveTextContent('هذا الحقل مفقود أو غير صالح.');
    expect(alert).not.toHaveTextContent('Missing content field');
    expect(alert).toHaveTextContent('تتجاوز إحدى الصور الحد الأقصى البالغ ٥ ميغابايت.');
    expect(alert).toHaveTextContent('لا توجد مساحة تخزين كافية.');
    expect(alert).toHaveTextContent('حرّر مساحة تخزين أو صدّر نسخة احتياطية، ثم حاول مجدداً.');
    expect(screen.getByRole('status')).toHaveTextContent('التحذيرات: 1');
    expect(screen.getByRole('status')).toHaveTextContent('تحتاج 7 من الملفات إلى ربط يدوي.');
    expect(screen.queryByText('Pack imported.')).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/packImport\.|storage\./);
  });

  it('catches unexpected import failures and accepts the same file again', async () => {
    vi.mocked(importPack).mockRejectedValueOnce(new Error('unexpected internal detail')).mockResolvedValueOnce(imported);
    render(<ImportPack />);
    const input = screen.getByLabelText('Choose ZIP file');
    const file = new File([''], 'retry.zip');
    fireEvent.change(input, { target: { files: [file] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not read the selected pack. Please select it again.');
    expect(document.body).not.toHaveTextContent('unexpected internal detail');
    expect(input).not.toBeDisabled();
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Pack imported.'));
    expect(importPack).toHaveBeenCalledTimes(2);
    expect(input).toHaveValue('');
  });

  it.each(['copy', 'replace', 'cancel'] as const)('resolves an existing pack with %s while retaining the original source', async action => {
    vi.mocked(importPack).mockResolvedValueOnce({ ...imported, status: 'conflict' });
    let finish!: (report: ImportReport) => void;
    vi.mocked(importPack).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const db = database.createDatabase('conflict-ui-test');
    render(<ImportPack db={db} />);
    const file = new File([''], 'conflict.zip');
    fireEvent.change(screen.getByLabelText('Choose ZIP file'), { target: { files: [file] } });
    const dialog = await screen.findByRole('dialog', { name: 'A pack with this ID already exists.' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('radio', { name: 'Import as copy' })).toBeChecked();
    expect(screen.getByLabelText('Choose folder')).toBeDisabled();
    if (action === 'cancel') {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(importPack).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('status')).toHaveTextContent('Import cancelled.');
      expect(screen.getByLabelText('Choose ZIP file')).not.toBeDisabled();
    } else {
      if (action === 'replace') fireEvent.click(screen.getByRole('radio', { name: 'Replace existing pack' }));
      expect(dialog).toHaveTextContent('Replacing deletes teacher edits and recordings');
      fireEvent.click(screen.getByRole('button', { name: 'Continue import' }));
      expect(importPack).toHaveBeenNthCalledWith(2, db, file, { conflict: action });
      expect(screen.getByRole('button', { name: 'Continue import' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
      expect(screen.getByRole('radio', { name: 'Import as copy' })).toBeDisabled();
      expect(fireEvent.keyDown(dialog, { key: 'Tab' })).toBe(false);
      fireEvent.keyDown(dialog, { key: 'Escape' });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      await act(async () => { finish(imported); });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('Pack imported.');
    }
    db.close();
  });

  it('keeps keyboard focus inside the modal and restores the picker when Escape cancels', async () => {
    vi.mocked(importPack).mockResolvedValueOnce({ ...imported, status: 'conflict' });
    render(<ImportPack />);
    const picker = screen.getByLabelText('Choose ZIP file');
    fireEvent.change(picker, { target: { files: [new File([''], 'conflict.zip')] } });
    const dialog = await screen.findByRole('dialog');
    const copy = screen.getByRole('radio', { name: 'Import as copy' });
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    expect(copy).toHaveFocus();
    fireEvent.keyDown(copy, { key: 'Tab', shiftKey: true });
    expect(cancel).toHaveFocus();
    fireEvent.keyDown(cancel, { key: 'Tab' });
    expect(copy).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(picker).toHaveFocus();
  });

  it('traps focus at the checked radio when Replace is selected', async () => {
    vi.mocked(importPack).mockResolvedValueOnce({ ...imported, status: 'conflict' });
    render(<ImportPack />);
    fireEvent.change(screen.getByLabelText('Choose ZIP file'), { target: { files: [new File([''], 'conflict.zip')] } });
    const replace = await screen.findByRole('radio', { name: 'Replace existing pack' });
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(replace);
    replace.focus();
    fireEvent.keyDown(replace, { key: 'Tab', shiftKey: true });
    expect(cancel).toHaveFocus();
    fireEvent.keyDown(cancel, { key: 'Tab' });
    expect(replace).toHaveFocus();
  });

  it('exports the existing pack before replacement and revokes the download URL', async () => {
    vi.mocked(importPack).mockResolvedValueOnce({ ...imported, status: 'conflict' });
    let finish!: (value: { ok: true; value: Blob }) => void;
    vi.mocked(exportPack).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const create = vi.fn(() => 'blob:backup'), revoke = vi.fn();
    vi.stubGlobal('URL', Object.assign(class extends URL {}, { createObjectURL: create, revokeObjectURL: revoke }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this).toHaveAttribute('download', 'fixture.zip');
      expect(this).toHaveAttribute('href', 'blob:backup');
    });
    const db = database.createDatabase('backup-ui-test');
    render(<ImportPack db={db} />);
    fireEvent.change(screen.getByLabelText('Choose ZIP file'), { target: { files: [new File([''], 'test.zip')] } });
    const backup = await screen.findByRole('button', { name: 'Export backup first' });
    fireEvent.click(backup);
    expect(exportPack).toHaveBeenCalledWith(db, 'fixture');
    expect(backup).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Continue import' })).toBeDisabled();
    const blob = new Blob(['backup'], { type: 'application/zip' });
    await act(async () => { finish({ ok: true, value: blob }); });
    expect(create).toHaveBeenCalledWith(blob);
    expect(click).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledWith('blob:backup');
    expect(screen.getByRole('status')).toHaveTextContent('Backup downloaded.');
    expect(screen.getByRole('dialog')).toContainElement(screen.getByRole('status'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(importPack).toHaveBeenCalledTimes(1);
    expect(backup).not.toBeDisabled();
    db.close();
  });

  it.each(['storage', 'throw', 'download'] as const)('reports %s backup failure without losing the conflict choice or source', async failure => {
    vi.mocked(importPack).mockResolvedValueOnce({ ...imported, status: 'conflict' }).mockResolvedValueOnce(imported);
    const revoke = vi.fn();
    if (failure === 'storage') vi.mocked(exportPack).mockResolvedValueOnce(storageFailure('StorageUnavailable'));
    else if (failure === 'throw') vi.mocked(exportPack).mockRejectedValueOnce(new Error('private detail'));
    else {
      vi.mocked(exportPack).mockResolvedValueOnce({ ok: true, value: new Blob(['backup']) });
      vi.stubGlobal('URL', Object.assign(class extends URL {}, { createObjectURL: () => 'blob:failed', revokeObjectURL: revoke }));
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { throw new Error('download failed'); });
    }
    render(<ImportPack />);
    fireEvent.change(screen.getByLabelText('Choose ZIP file'), { target: { files: [new File([''], 'test.zip')] } });
    const backup = await screen.findByRole('button', { name: 'Export backup first' });
    fireEvent.click(screen.getByRole('radio', { name: 'Replace existing pack' }));
    fireEvent.click(backup);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Could not export a backup.'));
    if (failure === 'storage') {
      expect(screen.getByRole('alert')).toHaveTextContent('Local storage is unavailable.');
      expect(screen.getByRole('alert')).toHaveTextContent('Use a supported browser with local storage enabled.');
    }
    if (failure === 'download') {
      expect(revoke).toHaveBeenCalledWith('blob:failed');
      expect(document.querySelector('a[download]')).not.toBeInTheDocument();
    }
    expect(backup).not.toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Replace existing pack' })).toBeChecked();
    expect(document.body).not.toHaveTextContent('private detail');
    fireEvent.click(screen.getByRole('button', { name: 'Continue import' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Pack imported.'));
    expect(importPack).toHaveBeenLastCalledWith(expect.anything(), expect.any(File), { conflict: 'replace' });
  });

  it('creates one database and closes its owned connection on unmount', () => {
    const create = vi.spyOn(database, 'createDatabase');
    const view = render(<ImportPack />);
    expect(create).toHaveBeenCalledTimes(1);
    const close = vi.spyOn(create.mock.results[0]!.value as database.FahmDatabase, 'close');
    view.rerender(<ImportPack />);
    expect(create).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(close).toHaveBeenCalledTimes(1);
    create.mockRestore();
  });

  it('does not close a database supplied by its caller', () => {
    const db = database.createDatabase('import-ui-test');
    const close = vi.spyOn(db, 'close');
    const view = render(<ImportPack db={db} />);
    view.unmount();
    expect(close).not.toHaveBeenCalled();
    close.mockRestore();
    db.close();
  });

  it('provides zip and genuine multiple folder pickers with translated labels', () => {
    render(<ImportPack />);
    expect(screen.getByRole('heading', { name: 'Import pack' })).toBeInTheDocument();
    const zip = screen.getByLabelText('Choose ZIP file');
    expect(zip).toHaveAttribute('type', 'file');
    expect(zip).toHaveAttribute('accept', '.zip,application/zip');
    const folder = screen.getByLabelText('Choose folder');
    expect(folder).toHaveAttribute('type', 'file');
    expect(folder).toHaveAttribute('webkitdirectory');
    expect(folder).toHaveAttribute('multiple');
    for (const input of [zip, folder]) expect(input.className).toContain('min-h-[48px]');
  });
});

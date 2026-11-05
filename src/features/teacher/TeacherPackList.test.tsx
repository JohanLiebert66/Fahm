import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createDatabase, type FahmDatabase } from '../../storage/db';
import { seedPack } from '../../../tests/storageFixtures';
import { TeacherPackList } from './TeacherPackList';
import '../../i18n';
import * as deletePackModule from '../../storage/deletePack';
import type { StorageResult } from '../../storage/tx';

let db: FahmDatabase;

beforeEach(() => {
  db = createDatabase(`test-teacher-pack-list-${crypto.randomUUID()}`);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await db.delete();
});

describe('TeacherPackList', () => {
  it('renders empty state when there are no packs', async () => {
    render(<TeacherPackList db={db} />);
    expect(await screen.findByText('No packs imported yet.')).toBeInTheDocument();
  });

  it('lists packs with localized title, id, localized date, and counts of texts and items', async () => {
    await seedPack(db, 'pack-alpha');
    render(<TeacherPackList db={db} />);

    expect(await screen.findByText('Classroom vocabulary')).toBeInTheDocument();
    expect(screen.getByText('pack-alpha')).toBeInTheDocument();
    expect(screen.getByText('Texts: 1')).toBeInTheDocument();
    expect(screen.getByText('Items: 1')).toBeInTheDocument();

    const deleteBtn = screen.getByRole('button', {
      name: 'Delete pack Classroom vocabulary',
    });
    expect(deleteBtn).toBeInTheDocument();
    expect(deleteBtn.className).toContain('min-h-[48px]');
    expect(deleteBtn.className).toContain('min-w-[48px]');
  });

  it('opens confirmation dialog on delete click with focus on Cancel, and Cancel deletes nothing', async () => {
    await seedPack(db, 'pack-alpha');
    render(<TeacherPackList db={db} />);

    const deleteBtn = await screen.findByRole('button', {
      name: 'Delete pack Classroom vocabulary',
    });
    fireEvent.click(deleteBtn);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toHaveTextContent('pack-alpha');
    expect(screen.getByText(/Are you sure you want to delete/)).toHaveTextContent('Classroom vocabulary');

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    expect(cancelBtn).toHaveFocus();

    fireEvent.click(cancelBtn);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('pack-alpha')).toBeInTheDocument();
  });

  it('confirming delete calls deletePack, updates list in place', async () => {
    await seedPack(db, 'pack-alpha');
    render(<TeacherPackList db={db} />);

    const deleteBtn = await screen.findByRole('button', {
      name: 'Delete pack Classroom vocabulary',
    });
    fireEvent.click(deleteBtn);

    const confirmBtn = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByText('pack-alpha')).not.toBeInTheDocument();
      expect(screen.getByText('No packs imported yet.')).toBeInTheDocument();
    });
  });

  it('disables buttons and ignores Escape while delete is running (one tap deletes once)', async () => {
    await seedPack(db, 'pack-alpha');

    let resolveDelete!: (val: StorageResult<void>) => void;
    const deletePromise = new Promise<StorageResult<void>>(resolve => {
      resolveDelete = resolve;
    });
    const deleteSpy = vi.spyOn(deletePackModule, 'deletePack').mockReturnValue(deletePromise);

    render(<TeacherPackList db={db} />);

    const deleteBtn = await screen.findByRole('button', {
      name: 'Delete pack Classroom vocabulary',
    });
    fireEvent.click(deleteBtn);

    const confirmBtn = screen.getByRole('button', { name: 'Delete' });
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });

    fireEvent.click(confirmBtn);

    expect(deleteSpy).toHaveBeenCalledTimes(1);
    expect(confirmBtn).toBeDisabled();
    expect(cancelBtn).toBeDisabled();

    // Pressing Escape while deleting must NOT close the dialog
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Tapping confirm again while deleting does not trigger another delete
    fireEvent.click(confirmBtn);
    expect(deleteSpy).toHaveBeenCalledTimes(1);

    // Resolve delete
    resolveDelete({ ok: true, value: undefined });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('shows typed storage error when delete fails and keeps pack in list', async () => {
    await seedPack(db, 'pack-alpha');

    vi.spyOn(deletePackModule, 'deletePack').mockResolvedValue({
      ok: false,
      error: {
        code: 'WriteFailed',
        messageKey: 'storage.error.write',
        nextStepKey: 'storage.action.retryOrBackup',
      },
    });

    render(<TeacherPackList db={db} />);

    const deleteBtn = await screen.findByRole('button', {
      name: 'Delete pack Classroom vocabulary',
    });
    fireEvent.click(deleteBtn);

    const confirmBtn = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(confirmBtn);

    expect(await screen.findByRole('alert')).toHaveTextContent('Changes could not be saved.');
    expect(screen.getByText('pack-alpha')).toBeInTheDocument();
  });

  it('shows clear storage error if storage is unavailable on load', async () => {
    db.close();
    render(<TeacherPackList db={db} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Local storage is unavailable.');
  });
});

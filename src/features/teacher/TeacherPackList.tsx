import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createDatabase, type FahmDatabase } from '../../storage/db';
import { deletePack } from '../../storage/deletePack';
import { getPackSummaries, type PackSummary } from '../../storage/packSummary';
import type { StorageError } from '../../storage/tx';
import { localizedContent } from '../reader/localizedContent';
import { Dialog } from '../../ui/Dialog';

export interface TeacherPackListProps {
  db?: FahmDatabase;
}

export function TeacherPackList({ db: suppliedDb }: TeacherPackListProps) {
  const { t, i18n } = useTranslation();
  const connection = useRef<FahmDatabase | null>(null);

  const [summaries, setSummaries] = useState<PackSummary[] | null>(null);
  const [loadError, setLoadError] = useState<StorageError | null>(null);
  const [packToDelete, setPackToDelete] = useState<PackSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<StorageError | null>(null);

  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const db = suppliedDb ?? createDatabase();
    connection.current = db;
    let active = true;

    async function load() {
      const result = await getPackSummaries(db);
      if (!active) return;
      if (result.ok) {
        setSummaries(result.value);
        setLoadError(null);
      } else {
        setLoadError(result.error);
      }
    }

    void load();

    return () => {
      active = false;
      if (!suppliedDb) {
        void db.close();
      }
    };
  }, [suppliedDb]);

  const handleDeleteClick = (pack: PackSummary) => {
    setDeleteError(null);
    setPackToDelete(pack);
  };

  const handleCloseDialog = () => {
    if (!isDeleting) {
      setPackToDelete(null);
      setDeleteError(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!packToDelete || isDeleting || !connection.current) return;
    setIsDeleting(true);
    setDeleteError(null);

    const result = await deletePack(connection.current, packToDelete.id);
    if (result.ok) {
      setSummaries(prev => (prev ? prev.filter(p => p.id !== packToDelete.id) : []));
      setPackToDelete(null);
      setIsDeleting(false);
    } else {
      setDeleteError(result.error);
      setIsDeleting(false);
    }
  };

  const formatImportDate = (timestamp: number) => {
    try {
      return new Intl.DateTimeFormat(i18n.language, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(timestamp));
    } catch {
      return new Date(timestamp).toLocaleDateString();
    }
  };

  const targetTitle = packToDelete
    ? localizedContent(packToDelete.meta.title, i18n.language, packToDelete.meta.lang)?.value || packToDelete.id
    : '';

  return (
    <div className="flex flex-col gap-4 text-start">
      <h3 id="teacher-packs-heading" className="text-xl font-bold text-slate-800">
        {t('teacherPacks.title')}
      </h3>

      {loadError && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
          <p className="font-semibold">{t(loadError.messageKey)}</p>
          <p>{t(loadError.nextStepKey)}</p>
        </div>
      )}

      {summaries !== null && summaries.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
          <p>{t('teacherPacks.empty')}</p>
        </div>
      )}

      {summaries && summaries.length > 0 && (
        <ul className="flex flex-col gap-4" aria-label={t('teacherPacks.title')}>
          {summaries.map(pack => {
            const title =
              localizedContent(pack.meta.title, i18n.language, pack.meta.lang)?.value || pack.id;
            return (
              <li
                key={pack.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-1 text-start">
                  <span className="text-lg font-bold text-slate-800">
                    <bdi>{title}</bdi>
                  </span>
                  <span className="text-sm font-mono text-slate-500">
                    <bdi>{pack.id}</bdi>
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatImportDate(pack.importedAt)}
                  </span>
                  <div className="flex items-center gap-3 text-xs font-medium text-slate-600 mt-1">
                    <span>{t('teacherPacks.texts', { count: pack.textCount })}</span>
                    <span aria-hidden="true">•</span>
                    <span>{t('teacherPacks.items', { count: pack.itemCount })}</span>
                  </div>
                </div>

                <div className="flex items-center sm:self-center">
                  <button
                    type="button"
                    aria-label={`${t('teacherPacks.delete')} ${title}`}
                    onClick={() => handleDeleteClick(pack)}
                    className="min-h-[48px] min-w-[48px] px-4 py-2 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200 border border-red-200 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    {t('teacherPacks.delete')}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        isOpen={packToDelete !== null}
        onClose={handleCloseDialog}
        titleId="delete-pack-dialog-title"
        title={t('teacherPacks.deleteTitle')}
        disableClose={isDeleting}
        initialFocusRef={cancelButtonRef}
      >
        <div className="flex flex-col gap-4">
          <p className="text-slate-600">
            {t('teacherPacks.deleteWarning', {
              title: targetTitle,
              id: packToDelete?.id ?? '',
            })}
          </p>

          {deleteError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
              <p className="font-semibold">{t(deleteError.messageKey)}</p>
              <p>{t(deleteError.nextStepKey)}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              ref={cancelButtonRef}
              type="button"
              autoFocus
              disabled={isDeleting}
              onClick={handleCloseDialog}
              className="min-h-[48px] min-w-[48px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-medium transition-colors disabled:opacity-50"
            >
              {t('teacherPacks.cancelDelete')}
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="min-h-[48px] min-w-[48px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-medium transition-colors disabled:opacity-50"
            >
              {isDeleting ? t('teacherPacks.deleting') : t('teacherPacks.confirmDelete')}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

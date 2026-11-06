import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createDatabase, type FahmDatabase } from '../../storage/db';
import { getPackSummaries, type PackSummary } from '../../storage/packSummary';
import type { StorageError } from '../../storage/tx';
import { parseSourceSegments } from './linkify';

export function AboutScreen({ db: suppliedDb }: { db?: FahmDatabase }) {
  const { t, i18n } = useTranslation();
  const connection = useRef<FahmDatabase | null>(null);
  const [summaries, setSummaries] = useState<PackSummary[] | null>(null);
  const [loadError, setLoadError] = useState<StorageError | null>(null);

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

  return (
    <div className="w-full max-w-3xl flex flex-col items-start gap-8 p-4 sm:p-6 text-start">
      <div className="w-full flex items-center justify-between gap-4">
        <Link
          to="/"
          className="min-w-[48px] min-h-[48px] inline-flex items-center justify-center rounded-xl px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {t('about.back')}
        </Link>
      </div>

      <section className="w-full bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-2 text-start">
        <h2 className="text-2xl font-bold text-slate-800">{t('appName')}</h2>
        <p className="text-slate-600 text-sm">{t('about.description')}</p>
        <p className="text-slate-500 text-xs">{t('about.codeLicense')}</p>
      </section>

      <section className="w-full flex flex-col gap-4 text-start" aria-labelledby="about-credits-heading">
        <h3 id="about-credits-heading" className="text-xl font-bold text-slate-800">
          {t('about.contentCredits')}
        </h3>

        {loadError && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
            <p className="font-semibold">{t(loadError.messageKey)}</p>
            <p>{t(loadError.nextStepKey)}</p>
          </div>
        )}

        {summaries !== null && summaries.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500 w-full">
            <p>{t('about.noPacks')}</p>
          </div>
        )}

        {summaries && summaries.length > 0 && (
          <ul className="flex flex-col gap-4 w-full" aria-label="content-credits-list">
            {summaries.map(pack => {
              const title =
                pack.meta.title[i18n.language] ??
                pack.meta.title[i18n.language.split('-')[0]!] ??
                pack.meta.title[pack.meta.lang] ??
                Object.values(pack.meta.title)[0] ??
                pack.id;
              const hasNotice = Boolean(pack.meta.description && pack.meta.description.trim().length > 0);
              const sourceSegments = parseSourceSegments(pack.meta.source);

              return (
                <li
                  key={pack.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-3 text-start"
                >
                  <div className="flex flex-col gap-1 text-start">
                    <span className="text-lg font-bold text-slate-800">
                      <bdi>{title}</bdi>
                    </span>
                    <span className="text-sm font-mono text-slate-500">
                      <bdi>{t('about.packId', { id: pack.id })}</bdi>
                    </span>
                    <div className="text-sm text-slate-700 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                      <span className="font-semibold">{t('about.sourceLabel')}:</span>
                      <span className="break-words">
                        {sourceSegments.map((seg, idx) =>
                          seg.type === 'link' ? (
                            <a
                              key={idx}
                              href={seg.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline text-indigo-600 hover:text-indigo-800 break-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
                            >
                              {seg.text}
                            </a>
                          ) : (
                            <span key={idx}>{seg.text}</span>
                          )
                        )}
                      </span>
                    </div>
                    <div className="text-sm text-slate-700 flex items-center gap-2">
                      <span className="font-semibold">{t('about.licenseLabel')}:</span>
                      <span>{pack.meta.license}</span>
                    </div>
                  </div>

                  {hasNotice && (
                    <details className="mt-2 rounded-xl border border-slate-200 p-3 bg-slate-50 text-start">
                      <summary className="cursor-pointer font-medium text-slate-700 min-h-[48px] flex items-center select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded">
                        {t('about.copyrightNotice')}
                      </summary>
                      <pre
                        dir="ltr"
                        className="mt-2 overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200"
                      >
                        {pack.meta.description}
                      </pre>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

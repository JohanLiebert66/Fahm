import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { FahmDatabase } from '../../storage/db';
import { TeacherPackList } from './TeacherPackList';

export function TeacherHome({ db }: { db?: FahmDatabase }) {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-3xl flex flex-col items-center gap-8 p-4 sm:p-6 text-start">
      <div className="w-full bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{t('teacherMode')}</h2>
            <p className="text-slate-600 text-sm">{t('teacherHomeDescription')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/about"
            className="min-w-[48px] min-h-[48px] inline-flex items-center justify-center rounded-xl px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold shadow-sm transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {t('about.title')}
          </Link>
          <Link
            to="/teacher/import"
            className="min-w-[48px] min-h-[48px] inline-flex items-center justify-center rounded-xl px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold shadow-sm transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {t('packImport.title')}
          </Link>
        </div>
      </div>

      <section className="w-full" aria-labelledby="teacher-packs-heading">
        <TeacherPackList db={db} />
      </section>
    </div>
  );
}

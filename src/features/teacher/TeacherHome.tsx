import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export function TeacherHome() {
  const { t } = useTranslation();

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-slate-800">{t('teacherMode')}</h2>
          <p className="text-slate-600 text-sm">{t('teacherHomeDescription')}</p>
        </div>

        <Link to="/teacher/import" className="min-w-[48px] min-h-[48px] flex items-center rounded-xl p-3 bg-indigo-50">
          {t('packImport.title')}
        </Link>
      </div>
    </div>
  );
}

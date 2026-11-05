import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useMode } from './ModeProvider';

export function TeacherBar() {
  const { t } = useTranslation();
  const { mode, exitTeacherMode } = useMode();
  const navigate = useNavigate();

  if (mode !== 'teacher') {
    return null;
  }

  const handleExit = () => {
    exitTeacherMode();
    navigate('/');
  };

  return (
    <nav
      aria-label={t('teacherBarNav')}
      className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-amber-950"
    >
      <div className="flex items-center gap-2 font-bold text-amber-900">
        <svg
          className="w-5 h-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
        <span>{t('teacherMode')}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          to="/teacher"
          className="min-w-[48px] min-h-[48px] px-3 py-2 inline-flex items-center justify-center rounded-xl border border-amber-300 bg-white hover:bg-amber-100 active:bg-amber-200 font-medium text-amber-900 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          {t('teacherHome')}
        </Link>
        <button
          type="button"
          onClick={handleExit}
          className="min-w-[48px] min-h-[48px] px-4 py-2 inline-flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-900 font-medium text-white transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
        >
          {t('exitTeacherMode')}
        </button>
      </div>
    </nav>
  );
}

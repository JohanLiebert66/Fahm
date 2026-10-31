import { useTranslation } from 'react-i18next';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { changeLanguage } from '../i18n';
import { HoldButton } from '../ui/HoldButton';
import { useMode } from './ModeProvider';
import { TeacherGate } from './TeacherGate';
import { ChildHome } from './ChildHome';
import { TeacherHome } from '../features/teacher/TeacherHome';

export function App() {
  const { t, i18n } = useTranslation();
  const { mode, enterTeacherMode } = useMode();
  const navigate = useNavigate();
  const currentLang = i18n.language?.startsWith('ar') ? 'ar' : 'en';

  const handleToggleLanguage = () => {
    const nextLang = currentLang === 'ar' ? 'en' : 'ar';
    void changeLanguage(nextLang);
  };

  const handleEnterTeacherMode = () => {
    enterTeacherMode();
    navigate('/teacher');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="flex items-center justify-between p-4 border-b border-slate-200 bg-white/90 backdrop-blur">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">{t('appName')}</h1>
        <div className="flex items-center gap-2">
          {mode === 'child' && (
            <HoldButton
              onComplete={handleEnterTeacherMode}
              aria-label={t('teacherGateAction')}
              className="min-w-[48px] min-h-[48px] p-2 rounded-xl text-slate-400 hover:text-slate-600 active:text-slate-700 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </HoldButton>
          )}
          <button
            type="button"
            onClick={handleToggleLanguage}
            aria-label={t('language')}
            className="min-w-[48px] min-h-[48px] px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 flex items-center justify-center font-semibold text-slate-700 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <span>{t('switchToLanguage')}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <Routes>
          <Route path="/" element={<ChildHome />} />
          <Route
            path="/teacher"
            element={
              <TeacherGate>
                <TeacherHome />
              </TeacherGate>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

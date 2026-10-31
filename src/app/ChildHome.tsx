import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';

interface ShellButton {
  id: string;
  titleKey: string;
  colorClasses: string;
  icon: React.ReactNode;
}

const MAIN_BUTTONS: ShellButton[] = [
  {
    id: 'learn',
    titleKey: 'learn',
    colorClasses: 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100 active:bg-emerald-200',
    icon: (
      <svg className="w-12 h-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: 'play',
    titleKey: 'play',
    colorClasses: 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100 active:bg-amber-200',
    icon: (
      <svg className="w-12 h-12 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'practice',
    titleKey: 'practice',
    colorClasses: 'bg-sky-50 border-sky-200 text-sky-900 hover:bg-sky-100 active:bg-sky-200',
    icon: (
      <svg className="w-12 h-12 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'readWithMe',
    titleKey: 'readWithMe',
    colorClasses: 'bg-indigo-50 border-indigo-200 text-indigo-900 hover:bg-indigo-100 active:bg-indigo-200',
    icon: (
      <svg className="w-12 h-12 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
];

export function ChildHome() {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-xl">
      {MAIN_BUTTONS.map((btn) => (
        <Card
          key={btn.id}
          as="button"
          onClick={() => {
            // Placeholder for future feature navigation
          }}
          aria-label={t(btn.titleKey)}
          className={`flex flex-col items-center justify-center p-6 gap-3 min-h-[140px] text-center transition-all ${btn.colorClasses}`}
        >
          {btn.icon}
          <span className="text-xl font-bold">{t(btn.titleKey)}</span>
        </Card>
      ))}
    </div>
  );
}

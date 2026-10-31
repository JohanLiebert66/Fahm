import { createContext, useContext, useState, useMemo, ReactNode } from 'react';

export type AppMode = 'child' | 'teacher';

export interface ModeContextValue {
  mode: AppMode;
  isTeacher: boolean;
  enterTeacherMode: () => void;
  exitTeacherMode: () => void;
  setMode: (mode: AppMode) => void;
}

const ModeContext = createContext<ModeContextValue | null>(null);

export interface ModeProviderProps {
  children: ReactNode;
  initialMode?: AppMode;
}

export function ModeProvider({ children, initialMode = 'child' }: ModeProviderProps) {
  const [mode, setMode] = useState<AppMode>(initialMode);

  const value = useMemo<ModeContextValue>(() => ({
    mode,
    isTeacher: mode === 'teacher',
    enterTeacherMode: () => setMode('teacher'),
    exitTeacherMode: () => setMode('child'),
    setMode,
  }), [mode]);

  return (
    <ModeContext.Provider value={value}>
      {children}
    </ModeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMode(): ModeContextValue {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
}

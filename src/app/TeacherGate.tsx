import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useMode } from './ModeProvider';

export interface TeacherGateProps {
  children: ReactNode;
}

export function TeacherGate({ children }: TeacherGateProps) {
  const { mode } = useMode();
  const location = useLocation();

  if (mode !== 'teacher') {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

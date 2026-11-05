import { useEffect, type ReactNode, type RefObject } from 'react';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  titleId: string;
  title: ReactNode;
  children: ReactNode;
  className?: string;
  disableClose?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
}

export function Dialog({
  isOpen,
  onClose,
  titleId,
  title,
  children,
  className = '',
  disableClose = false,
  initialFocusRef,
}: DialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !disableClose) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    if (initialFocusRef?.current) {
      initialFocusRef.current.focus();
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, disableClose, initialFocusRef]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4"
      role="presentation"
      onClick={e => {
        if (e.target === e.currentTarget && !disableClose) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl flex flex-col gap-4 text-start ${className}`}
      >
        <h3 id={titleId} className="text-xl font-bold text-slate-800">
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}

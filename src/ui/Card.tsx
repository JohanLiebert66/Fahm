import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  as?: 'div' | 'article' | 'section' | 'button';
  role?: string;
  tabIndex?: number;
  'aria-label'?: string;
}

export function Card({
  children,
  className = '',
  onClick,
  as: Component = onClick ? 'button' : 'div',
  role,
  tabIndex,
  'aria-label': ariaLabel,
}: CardProps) {
  const isInteractive = Boolean(onClick);
  const isButton = Component === 'button';

  return (
    <Component
      type={isButton ? 'button' : undefined}
      role={role}
      tabIndex={tabIndex ?? (isInteractive && !isButton ? 0 : undefined)}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={
        isInteractive && !isButton
          ? (e: React.KeyboardEvent<HTMLElement>) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.(e as unknown as React.MouseEvent<HTMLElement>);
              }
            }
          : undefined
      }
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm p-4 ${
        isInteractive
          ? 'cursor-pointer hover:shadow-md active:scale-[0.98] transition-all min-h-[48px] min-w-[48px] text-start'
          : ''
      } ${className}`}
    >
      {children}
    </Component>
  );
}

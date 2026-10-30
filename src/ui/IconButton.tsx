import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function IconButton({
  'aria-label': ariaLabel,
  icon,
  children,
  className = '',
  type = 'button',
  disabled = false,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`min-w-[48px] min-h-[48px] inline-flex items-center justify-center p-2 rounded-xl text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

'use client';

import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'font-semibold rounded-lg transition-all flex items-center justify-center gap-2',
        {
          'bg-primary hover:bg-primary-hover text-white': variant === 'primary',
          'bg-secondary hover:bg-secondary-hover text-white': variant === 'secondary',
          'border border-border bg-bg-card hover:bg-bg-card-hover text-white': variant === 'outline',
        },
        {
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-5 py-2.5': size === 'md',
          'px-8 py-3 text-lg': size === 'lg',
        },
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}


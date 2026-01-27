'use client';

import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
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
        'font-semibold rounded-xl transition-all flex items-center justify-center gap-2',
        'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-bg',
        {
          // Primary: 그라데이션 + 글로우 효과
          'bg-gradient-to-r from-primary to-blue-500 hover:from-primary-hover hover:to-blue-600 text-white shadow-lg hover:shadow-primary/25 btn-glow':
            variant === 'primary',
          // Secondary: 회색 톤
          'bg-slate-600 hover:bg-slate-500 text-white': variant === 'secondary',
          // Outline: 테두리만
          'border-2 border-border bg-transparent hover:border-primary hover:bg-primary/10 text-white':
            variant === 'outline',
          // Ghost: 투명 배경
          'bg-transparent hover:bg-white/10 text-slate-300 hover:text-white':
            variant === 'ghost',
        },
        {
          'px-4 py-2 text-sm': size === 'sm',
          'px-6 py-3': size === 'md',
          'px-8 py-4 text-lg': size === 'lg',
        },
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
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

'use client';

import { clsx } from 'clsx';

interface CardProps {
  title?: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ title, badge, children, className, hover = false }: CardProps) {
  return (
    <section
      className={clsx(
        'bg-bg-card rounded-2xl p-6 border border-border/50',
        'backdrop-blur-sm',
        hover && 'card-hover cursor-pointer',
        className
      )}
    >
      {title && (
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
          {title}
          {badge && (
            <span className="text-xs bg-gradient-to-r from-primary to-violet-500 text-white px-3 py-1 rounded-full font-bold uppercase tracking-wide">
              {badge}
            </span>
          )}
        </h2>
      )}
      {children}
    </section>
  );
}

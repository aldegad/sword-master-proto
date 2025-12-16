'use client';

import { clsx } from 'clsx';

interface CardProps {
  title?: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, badge, children, className }: CardProps) {
  return (
    <section className={clsx('bg-bg-card rounded-2xl p-6 border border-border', className)}>
      {title && (
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          {title}
          {badge && (
            <span className="text-xs bg-gradient-to-r from-primary to-purple-500 text-white px-2 py-0.5 rounded font-bold">
              {badge}
            </span>
          )}
        </h2>
      )}
      {children}
    </section>
  );
}


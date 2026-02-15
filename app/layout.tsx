import type { Metadata } from 'next';
import './globals.css';
import { SiteNav } from '@/components/common/SiteNav';

export const metadata: Metadata = {
  title: {
    default: 'Sword Master',
    template: '%s | Sword Master',
  },
  description: 'Sword Master web hub built with Next.js and Pixi.js',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="site-shell">
          <SiteNav />
          {children}
        </div>
      </body>
    </html>
  );
}

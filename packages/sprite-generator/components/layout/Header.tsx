'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { Globe, BookOpen } from 'lucide-react';

export function Header() {
  const { t, locale, toggleLocale } = useTranslation();

  return (
    <header className="text-center mb-10 relative">
      {/* 우측 상단 버튼들 */}
      <div className="absolute right-0 top-0 flex items-center gap-2">
        {/* 튜토리얼 링크 */}
        <Link
          href="/tutorial"
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl
                     bg-white/5 border border-white/10 text-slate-300
                     hover:bg-white/10 hover:text-white hover:border-primary/50
                     transition-all duration-200"
        >
          <BookOpen className="w-4 h-4" />
          <span>{locale === 'ko' ? '가이드' : 'Guide'}</span>
        </Link>

        {/* 언어 전환 버튼 */}
        <button
          onClick={toggleLocale}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl
                     bg-white/5 border border-white/10 text-slate-300
                     hover:bg-white/10 hover:text-white hover:border-primary/50
                     transition-all duration-200"
          suppressHydrationWarning
        >
          <Globe className="w-4 h-4" />
          <span suppressHydrationWarning>{locale === 'ko' ? 'EN' : '한국어'}</span>
        </button>
      </div>

      {/* 타이틀 */}
      <div className="pt-2">
        <h1
          className="text-4xl md:text-5xl font-bold mb-3 gradient-text"
          suppressHydrationWarning
        >
          {t('header.title')}
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto" suppressHydrationWarning>
          {t('header.subtitle')}
        </p>
      </div>
    </header>
  );
}

'use client';

import { useTranslation } from '@/lib/i18n';

export function Header() {
  const { t, toggleLocale } = useTranslation();

  return (
    <header className="text-center mb-12 relative">
      {/* 언어 전환 버튼 */}
      <button
        onClick={toggleLocale}
        className="absolute right-0 top-0 px-3 py-1.5 text-sm rounded-lg border border-border text-slate-400 hover:text-white hover:border-primary transition-colors"
      >
        {t('common.langToggle')}
      </button>

      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
        {t('header.title')}
      </h1>
      <p className="text-slate-400 text-lg">
        {t('header.subtitle')}
      </p>
    </header>
  );
}


'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { LOCALE_EVENT, type Locale, applyLocale, detectLocale } from '@/lib/locale';

const copy = {
  ko: {
    title: '검을 두른 채 걷다',
    desc: 'Next.js 구조로 정리된 웹 허브 + Phaser 기반 게임 런타임',
    play: '게임 시작',
    rulebook: '룰북 보기',
    featureTitle: '프로젝트 구성',
    cards: [
      {
        title: 'Landing (/)',
        desc: '마케팅/소개/업데이트 공지를 Next.js 페이지로 관리합니다.',
      },
      {
        title: 'Game (/game)',
        desc: '게임 캔버스는 Phaser.js로 구동되며 기존 전투 시스템을 사용합니다.',
      },
      {
        title: 'Rulebook (/rulebook)',
        desc: '룰/데이터 문서를 일반 웹 페이지처럼 유지보수합니다.',
      },
      {
        title: 'Firebase Hosting',
        desc: 'Next 정적 export 결과물(dist)을 그대로 배포합니다.',
      },
    ],
    footer: '© 2026 Soo Hong Kim',
  },
  en: {
    title: 'Walk with the Blade',
    desc: 'Next.js web hub + Phaser-based game runtime',
    play: 'Play Game',
    rulebook: 'Open Rulebook',
    featureTitle: 'Project Layout',
    cards: [
      {
        title: 'Landing (/)',
        desc: 'Marketing and update pages are managed with Next.js.',
      },
      {
        title: 'Game (/game)',
        desc: 'The runtime canvas runs on Phaser.js with the original combat systems.',
      },
      {
        title: 'Rulebook (/rulebook)',
        desc: 'Rules and data docs are maintained as regular web pages.',
      },
      {
        title: 'Firebase Hosting',
        desc: 'Deploys the Next static export output (dist) directly.',
      },
    ],
    footer: '© 2026 Soo Hong Kim',
  },
} as const;

export function LandingContent() {
  const [locale, setLocale] = useState<Locale>('ko');

  useEffect(() => {
    const next = detectLocale();
    setLocale(next);
    applyLocale(next);

    const onLocaleChanged = () => {
      const changed = detectLocale();
      setLocale(changed);
      applyLocale(changed);
    };

    window.addEventListener(LOCALE_EVENT, onLocaleChanged as EventListener);
    window.addEventListener('storage', onLocaleChanged);

    return () => {
      window.removeEventListener(LOCALE_EVENT, onLocaleChanged as EventListener);
      window.removeEventListener('storage', onLocaleChanged);
    };
  }, []);

  const t = useMemo(() => copy[locale], [locale]);

  return (
    <main className="container">
      <section className="hero">
        <h1>{t.title}</h1>
        <p>{t.desc}</p>
        <div className="cta-row">
          <Link href="/game" className="cta-primary">
            {t.play}
          </Link>
          <Link href="/rulebook" className="cta-secondary">
            {t.rulebook}
          </Link>
        </div>
      </section>

      <section>
        <h2 className="page-title">{t.featureTitle}</h2>
        <div className="section-grid">
          {t.cards.map((card) => (
            <article key={card.title} className="card">
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="footer">{t.footer}</footer>
    </main>
  );
}

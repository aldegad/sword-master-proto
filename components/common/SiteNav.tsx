'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LOCALE_EVENT, type Locale, detectLocale, saveLocale } from '@/lib/locale';
import { RulebookModal } from '@/components/common/RulebookModal';

export function SiteNav() {
  const pathname = usePathname();
  const [locale, setLocale] = useState<Locale>('ko');
  const [menuOpen, setMenuOpen] = useState(false);
  const [rulebookOpen, setRulebookOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLocale(detectLocale());
  }, []);

  useEffect(() => {
    const handleLocaleSync = () => {
      setLocale(detectLocale());
    };

    window.addEventListener(LOCALE_EVENT, handleLocaleSync as EventListener);
    window.addEventListener('storage', handleLocaleSync);

    return () => {
      window.removeEventListener(LOCALE_EVENT, handleLocaleSync as EventListener);
      window.removeEventListener('storage', handleLocaleSync);
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const labels = useMemo(() => {
    if (locale === 'en') {
      return {
        home: 'Home',
        game: 'Game',
        rulebook: 'Rulebook',
        settings: 'Settings',
        locale: '한국어',
        openRulebook: 'Open Rulebook Popup',
      };
    }

    return {
      home: '홈',
      game: '게임',
      rulebook: '룰북',
      settings: '설정',
      locale: 'English',
      openRulebook: '룰북 팝업 열기',
    };
  }, [locale]);

  const onToggleLocale = () => {
    const next: Locale = locale === 'ko' ? 'en' : 'ko';
    setLocale(next);
    saveLocale(next);
    setMenuOpen(false);
  };

  const onOpenRulebook = () => {
    setRulebookOpen(true);
    setMenuOpen(false);
  };

  return (
    <>
      <header className="site-nav">
        <div className="site-nav-inner">
          <Link href="/" className="site-brand">
            Sword Master
          </Link>
          <nav className="site-links" aria-label="Primary">
            <Link className="site-link" href="/">
              {labels.home}
            </Link>
            <Link className="site-link" href="/game">
              {labels.game}
            </Link>
            <Link className="site-link" href="/rulebook">
              {labels.rulebook}
            </Link>
            <a
              className="site-link"
              href="https://github.com/aldegad/sword-master"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <div className="settings-wrap" ref={menuRef}>
              <button
                id="settings-button"
                type="button"
                className="site-button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                {labels.settings}
              </button>

              {menuOpen ? (
                <div className="settings-menu" role="menu" aria-label={labels.settings}>
                  <button id="locale-toggle" type="button" className="settings-item" onClick={onToggleLocale}>
                    {labels.locale}
                  </button>
                  <button
                    id="open-rulebook-modal"
                    type="button"
                    className="settings-item"
                    onClick={onOpenRulebook}
                  >
                    {labels.openRulebook}
                  </button>
                </div>
              ) : null}
            </div>
          </nav>
        </div>
      </header>

      <RulebookModal open={rulebookOpen} onClose={() => setRulebookOpen(false)} />
    </>
  );
}

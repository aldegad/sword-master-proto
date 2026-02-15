'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { RulebookModal } from '@/components/common/RulebookModal';
import { LOCALE_EVENT, type Locale, detectLocale, saveLocale } from '@/lib/locale';

export function PhaserGame() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [locale, setLocale] = useState<Locale>('ko');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rulebookOpen, setRulebookOpen] = useState(false);

  useEffect(() => {
    if (!hostRef.current) return;

    let disposed = false;
    let game: any = null;

    const init = async () => {
      const [{ default: Phaser }, { BootScene }, { GameScene }, { UIScene }] = await Promise.all([
        import('phaser'),
        import('@/src/scenes/BootScene'),
        import('@/src/scenes/GameScene'),
        import('@/src/scenes/UIScene'),
      ]);

      if (disposed || !hostRef.current) return;

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.WEBGL,
        parent: hostRef.current,
        backgroundColor: '#16213e',
        render: {
          antialias: true,
          pixelArt: false,
        },
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: 1920,
          height: 1080,
        },
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
          },
        },
        scene: [BootScene, GameScene, UIScene],
      };

      game = new Phaser.Game(config);
    };

    init();

    return () => {
      disposed = true;
      if (game) {
        game.destroy(true);
      }
      if (hostRef.current) {
        hostRef.current.replaceChildren();
      }
    };
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    const syncLocale = () => {
      setLocale(detectLocale());
    };

    syncLocale();
    window.addEventListener(LOCALE_EVENT, syncLocale as EventListener);
    window.addEventListener('storage', syncLocale);

    return () => {
      window.removeEventListener(LOCALE_EVENT, syncLocale as EventListener);
      window.removeEventListener('storage', syncLocale);
    };
  }, []);

  useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      if (!settingsRef.current) return;
      if (!settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, []);

  const labels = useMemo(() => {
    if (locale === 'en') {
      return {
        fullscreen: isFullscreen ? 'Exit Fullscreen' : 'Fullscreen',
        locale: '한국어',
        openRulebook: 'Open Rulebook Popup',
      };
    }

    return {
      fullscreen: isFullscreen ? '전체화면 나가기' : '전체화면',
      locale: 'English',
      openRulebook: '룰북 팝업 열기',
    };
  }, [isFullscreen, locale]);

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await document.documentElement.requestFullscreen().catch(() => undefined);
  };

  const toggleLocale = () => {
    const next: Locale = locale === 'ko' ? 'en' : 'ko';
    setLocale(next);
    saveLocale(next);
    setSettingsOpen(false);
  };

  return (
    <>
      <div className="phaser-controls">
        <div className="game-settings-wrap" ref={settingsRef}>
          <button
            id="game-settings-button"
            type="button"
            className="icon-button icon-only"
            onClick={() => setSettingsOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={settingsOpen}
            aria-label="settings"
          >
            <img src="/icons/gear.svg" width={20} height={20} alt="" aria-hidden />
          </button>

          {settingsOpen ? (
            <div className="game-settings-menu" role="menu" aria-label="game settings">
              <button
                id="game-fullscreen-toggle"
                type="button"
                className="game-settings-item"
                onClick={() => {
                  toggleFullscreen();
                  setSettingsOpen(false);
                }}
              >
                <img src="/icons/fullscreen.svg" width={16} height={16} alt="" aria-hidden />
                <span>{labels.fullscreen}</span>
              </button>
              <button id="game-locale-toggle" type="button" className="game-settings-item" onClick={toggleLocale}>
                <img src="/icons/language.svg" width={16} height={16} alt="" aria-hidden />
                <span>{labels.locale}</span>
              </button>
              <button
                id="game-open-rulebook-modal"
                type="button"
                className="game-settings-item"
                onClick={() => {
                  setRulebookOpen(true);
                  setSettingsOpen(false);
                }}
              >
                <img src="/icons/book.svg" width={16} height={16} alt="" aria-hidden />
                <span>{labels.openRulebook}</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <div ref={hostRef} className="phaser-host" />
      <RulebookModal open={rulebookOpen} onClose={() => setRulebookOpen(false)} />
    </>
  );
}

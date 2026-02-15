'use client';

import { useEffect, useRef, useState } from 'react';
import { RulebookModal } from '@/components/common/RulebookModal';

export function PhaserGame() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [rulebookOpen, setRulebookOpen] = useState(false);
  const OPEN_RULEBOOK_EVENT = 'sword-master-open-rulebook';

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
    const openRulebook = () => setRulebookOpen(true);
    window.addEventListener(OPEN_RULEBOOK_EVENT, openRulebook as EventListener);
    return () => window.removeEventListener(OPEN_RULEBOOK_EVENT, openRulebook as EventListener);
  }, []);

  return (
    <>
      <div ref={hostRef} className="phaser-host" />
      <RulebookModal open={rulebookOpen} onClose={() => setRulebookOpen(false)} />
    </>
  );
}

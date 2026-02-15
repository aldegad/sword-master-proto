'use client';

import { useEffect, useRef } from 'react';
import { Application, Container, Graphics, Text, TextStyle, Ticker } from 'pixi.js';

export function PixiGame() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;

    const host = hostRef.current;
    let disposed = false;
    let initialized = false;

    const app = new Application();

    const init = async () => {
      await app.init({
        width: host.clientWidth,
        height: host.clientHeight,
        background: '#0b0d12',
        antialias: true,
        resolution: window.devicePixelRatio || 1,
      });

      if (disposed) {
        if (initialized) {
          app.destroy(true);
        }
        return;
      }

      initialized = true;
      host.appendChild(app.canvas);

      const world = new Container();
      app.stage.addChild(world);

      const hero = new Graphics();
      hero.roundRect(0, 0, 110, 110, 16);
      hero.fill({ color: 0xd4b463 });
      hero.position.set(120, app.screen.height * 0.5 - 55);

      const enemy = new Graphics();
      enemy.roundRect(0, 0, 110, 110, 16);
      enemy.fill({ color: 0x9e3d3d });
      enemy.position.set(app.screen.width - 230, app.screen.height * 0.5 - 55);

      const label = new Text({
        text: 'PIXI RUNTIME READY',
        style: new TextStyle({
          fill: '#f4f7fb',
          fontSize: 20,
          fontWeight: '700',
        }),
      });
      label.anchor.set(0.5, 0);
      label.position.set(app.screen.width / 2, 24);

      const subtitle = new Text({
        text: '게임 로직 포팅은 여기서 진행하면 됩니다.',
        style: new TextStyle({
          fill: '#a7b0bf',
          fontSize: 14,
        }),
      });
      subtitle.anchor.set(0.5, 0);
      subtitle.position.set(app.screen.width / 2, 52);

      world.addChild(hero, enemy, label, subtitle);

      let t = 0;
      const ticker = new Ticker();
      ticker.add(() => {
        t += 0.03;
        hero.x = 120 + Math.sin(t) * 22;
        enemy.x = app.screen.width - 230 + Math.cos(t * 1.2) * 22;
      });
      ticker.start();

      const onResize = () => {
        if (!hostRef.current) return;
        const width = hostRef.current.clientWidth;
        const height = hostRef.current.clientHeight;

        app.renderer.resize(width, height);
        hero.y = app.screen.height * 0.5 - 55;
        enemy.y = app.screen.height * 0.5 - 55;
        enemy.x = app.screen.width - 230 + Math.cos(t * 1.2) * 22;
        label.x = app.screen.width / 2;
        subtitle.x = app.screen.width / 2;
      };

      window.addEventListener('resize', onResize);

      return () => {
        window.removeEventListener('resize', onResize);
        ticker.stop();
        ticker.destroy();
      };
    };

    let cleanup: (() => void) | undefined;

    init().then((maybeCleanup) => {
      cleanup = maybeCleanup;
    });

    return () => {
      disposed = true;
      cleanup?.();
      if (initialized) {
        app.destroy(true);
      }
      host.replaceChildren();
    };
  }, []);

  return <div ref={hostRef} className="game-stage-inner" />;
}

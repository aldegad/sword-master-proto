import { PixiGame } from './PixiGame';

export const metadata = {
  title: 'Game',
};

export default function GamePage() {
  return (
    <main className="container">
      <h1 className="page-title">Game Runtime (Pixi.js)</h1>
      <section className="game-shell">
        <div className="game-stage">
          <PixiGame />
        </div>
        <aside className="game-note">
          현재 페이지는 Pixi 런타임 엔트리입니다. 기존 Phaser 기반 로직은 Next 구조로 전환하면서 제거되었고,
          이후 게임 시스템은 Pixi 기준으로 모듈화해 이 페이지에 연결하면 됩니다.
        </aside>
      </section>
    </main>
  );
}

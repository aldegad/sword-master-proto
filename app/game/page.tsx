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
          Pixi 전용 런타임으로 동작하며 그래픽은 단색/미니멀 UI로 단순화했습니다.
          카드 사용 시 적 대기턴이 감소하고, 턴 종료 버튼으로 전투를 진행합니다.
        </aside>
      </section>
    </main>
  );
}

import { PhaserGame } from './PhaserGame';

export const metadata = {
  title: 'Game',
};

export default function GamePage() {
  return (
    <main className="container">
      <section className="game-shell">
        <div className="game-stage">
          <PhaserGame />
        </div>
        <aside className="game-note">
          기존 Phaser 기반 시스템으로 복구되었습니다.
          캐릭터 애니메이션, 카드 상세/툴팁, 전투 UI 레이어를 포함한 전체 게임 흐름을 사용합니다.
        </aside>
      </section>
    </main>
  );
}

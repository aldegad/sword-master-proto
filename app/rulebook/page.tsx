import { buildEnemy, CARD_POOL, getWaveEnemyCount, PLAYER_BASE, STARTER_DECK } from '@/lib/game-data';

export const metadata = {
  title: 'Rulebook',
};

const waveExamples = [1, 3, 5, 8] as const;

const waveRows = waveExamples.map((wave) => {
  const count = getWaveEnemyCount(wave);
  const preview = Array.from({ length: count }).map((_, i) => buildEnemy(wave, i, i + 1));

  return {
    wave,
    count,
    preview,
  };
});

export default function RulebookPage() {
  return (
    <main className="container">
      <h1 className="page-title">룰북</h1>

      <article className="rulebook">
        <h2>1. 게임 목표</h2>
        <p>
          적 웨이브를 최대한 오래 돌파하며 생존하는 턴제 카드 전투 게임입니다.
          현재 버전은 <strong>무한 웨이브 생존</strong> 구조이며, 점수의 핵심은 도달 웨이브와 획득 골드입니다.
        </p>

        <h2>2. 기본 자원</h2>
        <table>
          <thead>
            <tr>
              <th>항목</th>
              <th>초기값</th>
              <th>설명</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>HP</td>
              <td>{PLAYER_BASE.hp}</td>
              <td>0이 되면 즉시 패배합니다.</td>
            </tr>
            <tr>
              <td>마나</td>
              <td>{PLAYER_BASE.mana}</td>
              <td>카드 사용 비용. 내 턴 시작 시 최대치로 회복됩니다.</td>
            </tr>
            <tr>
              <td>방어</td>
              <td>0</td>
              <td>적 공격 피해를 먼저 흡수합니다. 턴 시작 시 초기화됩니다.</td>
            </tr>
            <tr>
              <td>골드</td>
              <td>0</td>
              <td>웨이브 클리어 시 획득합니다. (현재는 기록용)</td>
            </tr>
          </tbody>
        </table>

        <h2>3. 턴 진행</h2>
        <ol>
          <li>내 턴 시작: 마나/방어 갱신, 손패가 5장이 될 때까지 드로우.</li>
          <li>카드 사용: 공격 또는 방어 카드를 사용합니다.</li>
          <li>대기턴 감소: 카드를 1장 사용할 때마다 모든 적의 대기턴이 1 감소합니다.</li>
          <li>적 행동: 대기턴이 0 이하가 된 적은 즉시 공격 후 대기턴이 리셋됩니다.</li>
          <li>턴 종료 버튼: 카드 사용 없이 대기턴을 1 감소시키고 다음 턴으로 넘어갑니다.</li>
        </ol>

        <h2>4. 카드 시스템</h2>
        <p>
          덱이 비면 버림 더미를 셔플해 다시 덱으로 사용합니다.
          타겟 지정이 없는 현재 버전에서는 공격 카드가 항상 <strong>가장 앞의 생존 적</strong>을 공격합니다.
        </p>

        <table>
          <thead>
            <tr>
              <th>카드</th>
              <th>종류</th>
              <th>코스트</th>
              <th>효과</th>
            </tr>
          </thead>
          <tbody>
            {CARD_POOL.map((card) => (
              <tr key={card.key}>
                <td>{card.name}</td>
                <td>{card.type === 'attack' ? '공격' : '방어'}</td>
                <td>{card.cost}</td>
                <td>{card.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>5. 시작 덱 구성</h2>
        <ul>
          {STARTER_DECK.map((item) => {
            const card = CARD_POOL.find((c) => c.key === item.key);
            if (!card) return null;
            return (
              <li key={item.key}>
                {card.name} x{item.count} ({card.type === 'attack' ? '공격' : '방어'}, 코스트 {card.cost})
              </li>
            );
          })}
        </ul>

        <h2>6. 웨이브와 적 스케일링</h2>
        <p>
          웨이브가 올라갈수록 적 수와 능력치가 증가합니다.
          적 수 공식은 <code>min(1 + floor((wave-1)/2), 3)</code> 입니다.
        </p>

        <table>
          <thead>
            <tr>
              <th>웨이브</th>
              <th>적 수</th>
              <th>적 정보 예시</th>
            </tr>
          </thead>
          <tbody>
            {waveRows.map((row) => (
              <tr key={row.wave}>
                <td>{row.wave}</td>
                <td>{row.count}</td>
                <td>
                  {row.preview
                    .map((enemy) => `${enemy.name}(HP ${enemy.hp}, ATK ${enemy.attack}, Delay ${enemy.delayMax})`)
                    .join(' / ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>7. 전투 계산</h2>
        <ul>
          <li>공격 카드: 대상 적 HP에서 카드 피해값만큼 감소합니다.</li>
          <li>방어 카드: 플레이어 방어 수치가 증가합니다.</li>
          <li>적 공격: 먼저 방어 수치로 피해를 흡수하고 남은 피해가 HP에 적용됩니다.</li>
          <li>웨이브 클리어: 현재 덱/버림/손패를 합쳐 셔플하고 다음 웨이브를 시작합니다.</li>
        </ul>

        <h2>8. 패배와 재시작</h2>
        <p>
          HP가 0이 되면 게임 오버 화면이 표시됩니다.
          <strong>다시 시작</strong> 버튼으로 초기 상태(웨이브 1, HP/마나 초기값)로 재시작할 수 있습니다.
        </p>

        <h2>9. 운영 팁</h2>
        <ul>
          <li>대기턴이 낮은 적부터 빠르게 정리하면 피해를 줄일 수 있습니다.</li>
          <li>마나를 모두 공격에만 쓰면 생존이 흔들리므로 방어 카드를 섞어 사용하세요.</li>
          <li>강타(코스트 2)는 마나 효율이 높은 마무리 카드로 운영하는 것이 안정적입니다.</li>
        </ul>
      </article>
    </main>
  );
}

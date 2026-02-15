export const metadata = {
  title: 'Rulebook',
};

export default function RulebookPage() {
  return (
    <main className="container">
      <h1 className="page-title">룰북</h1>
      <article className="rulebook">
        <h2>1. 기본 규칙</h2>
        <p>
          Sword Master는 턴 기반 전투와 덱 관리가 결합된 액션 카드 게임입니다.
          플레이어는 검 카드와 스킬 카드를 조합해 적 웨이브를 돌파합니다.
        </p>

        <h2>2. 턴 구조</h2>
        <ul>
          <li>드로우 단계: 카드를 뽑습니다.</li>
          <li>행동 단계: 마나를 사용해 카드를 플레이합니다.</li>
          <li>종료 단계: 턴 종료 후 적이 행동합니다.</li>
        </ul>

        <h2>3. 핵심 자원</h2>
        <table>
          <thead>
            <tr>
              <th>자원</th>
              <th>설명</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>HP</td>
              <td>0이 되면 패배합니다.</td>
            </tr>
            <tr>
              <td>마나</td>
              <td>카드 사용 비용입니다.</td>
            </tr>
            <tr>
              <td>방어력</td>
              <td>적 공격 피해를 상쇄합니다.</td>
            </tr>
            <tr>
              <td>골드</td>
              <td>상점 구매에 사용합니다.</td>
            </tr>
          </tbody>
        </table>

        <h2>4. 카드 타입</h2>
        <ul>
          <li>검 카드: 기본 공격/발도 공격의 기준이 됩니다.</li>
          <li>스킬 카드: 공격/방어/유틸 효과를 제공합니다.</li>
          <li>유틸 카드: 드로우, 버프, 상태이상 처리에 활용합니다.</li>
        </ul>

        <h2>5. 개발 메모</h2>
        <p>
          리포지토리는 Next.js 구조로 리팩터링되었고, 게임 런타임은 Pixi.js로 분리되었습니다.
          룰북 상세 데이터는 이후 JSON/MD 기반으로 확장해 관리하면 됩니다.
        </p>
      </article>
    </main>
  );
}

# 소드마스터 - 개발 가이드

## 📝 문서 업데이트 규칙

### ⚠️ 중요: 코드 수정 시 문서도 함께 업데이트!

코드를 수정하면 **반드시** 관련 문서도 업데이트해야 합니다.

| 수정 내용 | 업데이트할 문서 |
|-----------|-----------------|
| 새 검 추가 | `04-DATA-REFERENCE.md` 검 목록 |
| 새 스킬 추가 | `04-DATA-REFERENCE.md` 스킬 목록 |
| 새 적 추가 | `04-DATA-REFERENCE.md` 적 목록 |
| 시스템 변경 | `02-GAME-SYSTEMS.md` |
| 타입 변경 | `03-CODE-ARCHITECTURE.md` |
| 새 기능 추가 | `01-OVERVIEW.md` 또는 해당 문서 |

### 문서 위치

```
docs/
├── 01-OVERVIEW.md        # 프로젝트 개요
├── 02-GAME-SYSTEMS.md    # 게임 시스템 상세
├── 03-CODE-ARCHITECTURE.md # 코드 구조
├── 04-DATA-REFERENCE.md  # 데이터 레퍼런스
└── 05-CONTRIBUTION.md    # 이 문서 (개발 가이드)
```

---

## 🛠️ 개발 시 체크리스트

### 새 검 추가 시

1. `src/data/swords.ts`에 검 데이터 추가
2. `docs/04-DATA-REFERENCE.md` 검 목록 테이블에 추가
3. (선택) 초기 덱에 포함시키려면 `src/data/skills.ts`의 `getStarterDeck()` 수정

### 새 스킬 추가 시

1. `src/data/skills.ts`에 스킬 데이터 추가
2. `docs/04-DATA-REFERENCE.md` 스킬 목록에 추가
3. 새로운 효과 타입이면 `src/types/index.ts`의 `SkillEffect` 수정
4. `03-CODE-ARCHITECTURE.md` 타입 문서 업데이트

### 새 적 추가 시

1. `src/data/enemies.ts`에 적 템플릿 추가
2. `createRandomEnemy()` 함수의 난이도 풀에 추가
3. `docs/04-DATA-REFERENCE.md` 적 목록에 추가

### 시스템 변경 시

1. 해당 코드 수정
2. `02-GAME-SYSTEMS.md` 관련 섹션 업데이트
3. 타입이 변경되면 `03-CODE-ARCHITECTURE.md`도 업데이트

---

## 📋 코드 스타일

### 타입 정의

- 모든 인터페이스는 `src/types/index.ts`에 정의
- 데이터 템플릿 타입은 각 데이터 파일 상단에 정의 가능

### 데이터 구조

```typescript
// 검 데이터 예시
swordId: {
  id: 'swordId',           // 고유 ID (키와 동일)
  name: '검 이름',          // 표시 이름
  emoji: '⚔️',             // 이모지
  origin: 'korean',        // 출신
  attack: 10,              // 공격력
  attackCount: 1,          // 타수
  reach: 'single',         // 범위
  defense: 3,              // 방어
  durability: 3,           // 내구도 (1~5)
  manaCost: 1,             // 마나
  description: '설명',      // 툴팁에 표시
  specialEffect?: '특수',   // 선택적
}
```

### 이벤트 기반 통신

GameScene과 UIScene은 이벤트로 통신:

```typescript
// GameScene에서 발생
this.events.emit('handUpdated');
this.events.emit('statsUpdated');
this.events.emit('turnEnded');
this.events.emit('combatStarted');

// UIScene에서 수신
this.gameScene.events.on('handUpdated', this.updateCardDisplay, this);
```

---

## 🔧 자주 하는 수정

### 밸런스 조정

- 검 스탯: `src/data/swords.ts`
- 스킬 스탯: `src/data/skills.ts`
- 적 스탯: `src/data/enemies.ts`
- 게임 상수: `src/types/index.ts`의 `GAME_CONSTANTS`

### UI 수정

- 카드 UI: `src/scenes/UIScene.ts`의 `renderSwordCard()`, `renderSkillCard()`
- 툴팁: `showTooltip()`
- 버튼: `createActionButtons()`

### 전투 로직 수정

- 데미지 계산: `src/scenes/GameScene.ts`의 `executeAttack()`
- 적 행동: `executeEnemyAction()`
- 턴 흐름: `endTurn()`, `reduceAllEnemyDelays()`


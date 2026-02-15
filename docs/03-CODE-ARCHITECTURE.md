# 소드마스터 - 코드 아키텍처

## 🏗️ 전체 구조

```
src/
├── main.ts                 # Phaser 게임 초기화
├── types/
│   └── index.ts            # 타입 정의
├── data/
│   ├── swords.ts           # 검 데이터
│   ├── skills.ts           # 스킬 데이터
│   └── enemies.ts          # 적 데이터
├── scenes/
│   ├── BootScene.ts        # 로딩 → 타이틀
│   ├── GameScene.ts        # 메인 게임 씬
│   └── UIScene.ts          # UI 레이어
└── systems/                # 게임 시스템 (분리됨)
    ├── CombatSystem.ts     # 전투 로직
    ├── CardSystem.ts       # 카드 시스템
    ├── EnemyManager.ts     # 적 관리
    └── AnimationHelper.ts  # 애니메이션
```

---

## 📦 시스템 분리 구조

GameScene이 너무 커져서 기능별로 분리:

| 시스템 | 역할 | 줄 수 |
|--------|------|-------|
| **GameScene** | 메인 로직, 초기화, 상태 관리 | ~400 |
| **CombatSystem** | 공격, 방어, 데미지 계산 | ~380 |
| **CardSystem** | 카드 사용, 드로우, 교환 | ~340 |
| **EnemyManager** | 적 생성, 스프라이트, 행동 | ~200 |
| **AnimationHelper** | 모든 애니메이션 효과 | ~130 |

### 시스템 접근 방법

```typescript
// GameScene에서 시스템 초기화
this.combatSystem = new CombatSystem(this);
this.cardSystem = new CardSystem(this);
this.enemyManager = new EnemyManager(this);
this.animationHelper = new AnimationHelper(this);

// 시스템에서 GameScene 접근
this.scene.playerState.hp
this.scene.animationHelper.showMessage(...)
```

---

## 📦 타입 정의 (`src/types/index.ts`)

### 주요 인터페이스

```typescript
// 검 카드
interface SwordCard {
  id: string;
  name: string;
  displayName: string;  // 인첸트 포함
  emoji: string;
  origin: 'korean' | 'japanese' | 'chinese' | 'western' | 'unique';
  rarity: 'common' | 'uncommon' | 'rare' | 'unique';
  attack: number;
  attackCount: number;
  reach: ReachType;
  defense: number;      // = 방어율%
  durability: number;
  currentDurability: number;
  manaCost: number;
  description: string;
  prefix?: SwordPrefix;
  suffix?: SwordSuffix;
}

// 스킬 카드
interface SkillCard {
  id: string;
  name: string;
  emoji: string;
  type: 'attack' | 'defense' | 'buff' | 'special';
  attackMultiplier: number;
  attackCount: number;
  reach: ReachType;
  defenseBonus: number;
  durabilityCost: number;
  manaCost: number;
  description: string;
  effect?: SkillEffect;
}

// 플레이어 상태
interface PlayerState {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  defense: number;
  currentSword: SwordCard | null;
  hand: Card[];
  deck: Card[];
  discard: Card[];
  buffs: Buff[];
  passives: PlayerPassive[];
  exp: number;
  level: number;
}

// 적
interface Enemy {
  id: string;
  name: string;
  emoji: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  actions: EnemyAction[];
  actionQueue: EnemyAction[];  // 현재 행동 큐
  currentActionIndex: number;
  isStunned: number;
  bleed?: { damage: number; duration: number };
}
```

---

## 🎮 GameScene (`src/scenes/GameScene.ts`)

메인 게임 씬. 시스템들을 조율하는 중앙 컨트롤러.

### 주요 속성

```typescript
// 상태
playerState: PlayerState;
gameState: GameState;

// 시스템
combatSystem: CombatSystem;
cardSystem: CardSystem;
enemyManager: EnemyManager;
animationHelper: AnimationHelper;

// 모드
isExchangeMode: boolean;
isTargetingMode: boolean;
pendingCard: { card: Card; index: number } | null;
```

### 주요 메서드

| 메서드 | 설명 |
|--------|------|
| `initializeGame()` | 게임 초기화 |
| `startMoving()` | 이동 페이즈 시작 |
| `encounterEnemies()` | 적 조우 → 전투 |
| `startCombat()` | 전투 초기화 |
| `endTurn()` | 턴 종료 |
| `checkCombatEnd()` | 전투 종료 체크 |
| `resetDeck()` | 덱 리셋 (전투 종료 시) |
| `gameOver()` | 게임 오버 |

### 이벤트

```typescript
this.events.emit('handUpdated');      // 손패 변경
this.events.emit('statsUpdated');     // 스탯 변경
this.events.emit('turnEnded');        // 턴 종료
this.events.emit('combatStarted');    // 전투 시작
this.events.emit('modeChanged');      // 모드 변경 (교환/타겟)
this.events.emit('targetingStarted'); // 타겟 선택 시작
```

---

## ⚔️ CombatSystem (`src/systems/CombatSystem.ts`)

전투 관련 모든 로직.

### 주요 메서드

| 메서드 | 설명 |
|--------|------|
| `executeAttack(skill, target?)` | 공격 실행 |
| `executeDefense(skill)` | 방어 스킬 |
| `executeBuff(skill)` | 버프 스킬 |
| `executeEnemyAction(enemy, action)` | 적 행동 |
| `damageEnemy(enemy, damage)` | 적 데미지 |
| `killEnemy(enemy)` | 적 처치 |
| `reduceAllEnemyDelays(amount)` | 대기턴 감소 |

---

## 🃏 CardSystem (`src/systems/CardSystem.ts`)

카드 관련 모든 로직.

### 주요 메서드

| 메서드 | 설명 |
|--------|------|
| `useCard(index)` | 카드 사용 (진입점) |
| `executeCard(index, target?)` | 실제 카드 실행 |
| `equipSword(sword)` | 검 장착 |
| `useSkill(skill, target?)` | 스킬 사용 |
| `drawCards(count)` | 카드 드로우 |
| `toggleExchangeMode()` | 교환 모드 토글 |
| `exchangeCard(index)` | 카드 교환 |
| `startTargeting(card, index)` | 타겟 선택 시작 |
| `selectTarget(enemyId)` | 타겟 선택 |
| `dropCard()` | 카드 드롭 |

---

## 👹 EnemyManager (`src/systems/EnemyManager.ts`)

적 관련 모든 로직.

### 주요 메서드

| 메서드 | 설명 |
|--------|------|
| `spawnWaveEnemies()` | 웨이브 적 생성 |
| `createEnemySprite(enemy)` | 적 스프라이트 |
| `updateEnemySprite(enemy)` | HP바 업데이트 |
| `removeEnemySprite(id)` | 스프라이트 제거 |
| `initializeEnemyActions()` | 행동 큐 초기화 |
| `checkEnemyActions()` | 행동 실행 체크 |
| `executeRemainingEnemyActions()` | 남은 행동 실행 |

---

## ✨ AnimationHelper (`src/systems/AnimationHelper.ts`)

모든 애니메이션 효과.

### 주요 메서드

| 메서드 | 설명 |
|--------|------|
| `playerAttack()` | 플레이어 공격 모션 |
| `playerHit()` | 플레이어 피격 |
| `showDamageNumber(x, y, dmg, color)` | 데미지 숫자 |
| `showMessage(msg, color)` | 화면 메시지 |
| `showParryEffect()` | 방어 성공 이펙트 |

---

## 🖼️ UIScene (`src/scenes/UIScene.ts`)

GameScene 위에 레이어로 렌더링되는 UI.

### 주요 컴포넌트

| 컴포넌트 | 설명 |
|----------|------|
| HP 바 | 체력 표시 |
| 마나 오브 | 마나 표시 |
| 무기 정보 | 현재 장착 검 |
| 카드 UI | 손패 카드 (호버 → 툴팁) |
| 버튼 | 턴 종료, 대기, 교환 |
| 타겟 인디케이터 | 적 선택 UI |
| 툴팁 | 카드 상세 정보 |

### 조작키

| 키 | 기능 |
|----|------|
| 1~0 | 카드 사용 |
| SPACE | 턴 종료 |
| W | 대기 |
| X | 교환 모드 |
| ESC | 취소 |

---

## 🔄 게임 루프

```
update() {
  if (isMoving) {
    // 배경 스크롤
    // 거리 증가
    // 일정 거리 → encounterEnemies()
  }
  
  if (isTargetingMode) {
    // 타겟 인디케이터 위치 업데이트
  }
}
```

전투는 턴 기반이므로 `update()`에서 처리하지 않고, 
카드 사용 / 턴 종료 이벤트로 처리.

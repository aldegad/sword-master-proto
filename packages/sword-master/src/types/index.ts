// 리치 타입 - 공격 범위
// swordDouble: 무기 범위의 2배 (single→2, double→4, triple→6)
export type ReachType = 'single' | 'double' | 'triple' | 'all' | 'swordDouble';

// 무기 등급
export type SwordRarity = 'common' | 'uncommon' | 'rare' | 'unique';

// 인첸트 접두사
export interface SwordPrefix {
  id: string;
  name: string;
  effect: {
    type: 'durability' | 'attack' | 'defense' | 'attackCount';
    value: number;
  };
}

// 인첸트 접미사
export interface SwordSuffix {
  id: string;
  name: string;
  effect: {
    type: 'reach' | 'lifesteal' | 'bleed' | 'pierce';
    value: number | ReachType;
  };
}

// 검 카드 (무기)
export interface SwordCard {
  id: string;
  name: string;
  displayName: string;     // 인첸트 포함된 표시 이름
  emoji: string;           // 이모지 아이콘
  origin: 'korean' | 'japanese' | 'chinese' | 'western' | 'unique';
  rarity: SwordRarity;     // 등급
  attack: number;          // 기본 공격력
  attackCount: number;     // 공격 횟수
  reach: ReachType;        // 공격 범위
  defense: number;         // 방어력
  pierce: number;          // 방어관통력 (적 방어력에서 빼는 고정 수치)
  durability: number;      // 내구도 (최대 1~5)
  currentDurability: number; // 현재 내구도
  manaCost: number;        // 장착 마나 비용
  description: string;
  specialEffect?: string;  // 특수 효과 설명
  // 발도 (장착 시 자동 공격)
  drawAttack: {
    name: string;          // 발도 공격 이름
    multiplier: number;    // 공격력 배수
    reach: ReachType;      // 공격 범위
    durabilityCost: number; // 내구도 소모
    effect?: string;       // 발도 특수 효과 설명
    isSwift?: boolean;     // 신속 발도 (단검류)
    criticalCondition?: 'enemyDelay1';  // 크리티컬 조건
    pierce?: boolean;      // 방어 무시
  };
  // 인첸트
  prefix?: SwordPrefix;
  suffix?: SwordSuffix;
}

// 스킬 카드 (검술)
export interface SkillCard {
  id: string;
  name: string;
  emoji: string;             // 이모지 아이콘
  type: 'attack' | 'defense' | 'buff' | 'special';
  attackMultiplier: number;  // 공격력 배수
  attackCount: number;       // 공격 횟수
  reach: ReachType;          // 공격 범위
  defenseBonus: number;      // 방어 보너스
  durabilityCost: number;    // 내구도 소모
  manaCost: number;          // 마나 비용
  description: string;
  effect?: SkillEffect;
  isSwift?: boolean;         // 신속 스킬 - 적 대기턴을 감소시키지 않음
  isConsumable?: boolean;    // 1회용 스킬 - 사용 후 덱에서 완전히 제거
}

// 스킬 특수 효과
export interface SkillEffect {
  type: 'bleed' | 'stun' | 'pierce' | 'lifesteal' | 'charge' | 'delayReduce' | 'focus' | 'draw' | 'sharpen' | 'searchSword' | 'graveRecall' | 'graveEquip' | 'parry' | 'ironWall' | 'chargeAttack' | 'taunt' | 'bladeDance' | 'sheathe' | 'followUp' | 'drawSwords' | 'graveDrawTop';
  value: number;
  duration?: number;
}

// 카운트 효과 타입 (패리, 철벽, 강타 등 대기 시간 기반 효과)
export interface CountEffect {
  id: string;
  type: 'ironWall' | 'parry' | 'chargeAttack';
  name: string;
  emoji: string;
  remainingDelays: number;  // 남은 대기 시간
  isNew: boolean;           // 이번 턴에 추가됨 (첫 감소 시 false로 변경)
  data: {
    defenseMultiplier?: number;  // 방어율 배수 (x5, x10)
    attackMultiplier?: number;   // 공격 배수
    attackCount?: number;        // 추가 타수 (deprecated, skillAttackCount 사용)
    skillAttackCount?: number;   // 스킬 타수배율 (발동 시 현재 무기 타수와 곱함)
    reach?: string;              // 공격 범위 (발동 시 무기 범위와 비교)
    targetId?: string;           // 타겟 적 ID (강타용)
  };
}

// 통합 카드 타입
export type Card = 
  | { type: 'sword'; data: SwordCard }
  | { type: 'skill'; data: SkillCard };

// 플레이어 패시브 스킬
export interface PlayerPassive {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  effect: {
    type: 'uniqueWeaponChance' | 'startDraw' | 'maxMana' | 'attackBonus';
    value: number;
  };
}

// 플레이어 상태
export interface PlayerState {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  defense: number;
  currentSword: SwordCard | null;
  hand: Card[];        // 현재 손패 (최대 10장)
  deck: Card[];        // 덱
  discard: Card[];     // 무덤 (버린 카드)
  buffs: Buff[];
  countEffects: CountEffect[];  // 카운트 효과 (패리, 철벽, 반격 등)
  position: number;    // 러너 위치
  usedAttackThisTurn: boolean;   // 이번 턴에 공격/무기 스킬 사용 여부 (이어베기 조건용)
  // 패시브 스킬
  passives: PlayerPassive[];
  // 경험치 & 레벨
  exp: number;
  level: number;
}

// 버프/디버프
export interface Buff {
  id: string;
  name: string;
  type: 'attack' | 'defense' | 'speed';
  value: number;
  duration: number;
}

// 적 스킬/행동
export interface EnemyAction {
  id: string;
  name: string;
  type: 'attack' | 'charge' | 'defend' | 'special' | 'buff';
  damage: number;
  delay: number;          // 기본 대기턴
  currentDelay: number;   // 현재 남은 대기턴
  description: string;
  effect?: {
    type: 'bleed' | 'stun' | 'debuff' | 'heal';
    value: number;
    duration?: number;
  };
}

// 적 타입
export interface Enemy {
  id: string;
  name: string;
  emoji: string;             // 이모지 아이콘
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  x: number;
  actions: EnemyAction[];    // 적의 스킬/행동 목록
  actionQueue: EnemyAction[]; // 현재 행동 큐
  currentActionIndex: number; // 현재 준비 중인 행동
  isStunned: number;         // 스턴 남은 턴
  bleed?: { damage: number; duration: number };
}

// 게임 상태
export interface GameState {
  phase: 'running' | 'combat' | 'victory' | 'paused' | 'gameOver';
  turn: number;
  score: number;
  distance: number;
  enemies: Enemy[];
  currentWave: number;       // 현재 웨이브
  enemiesDefeated: number;   // 처치한 적 수
}

// 상수
export const GAME_CONSTANTS = {
  MAX_HAND_SIZE: 10,
  INITIAL_DRAW: 5,
  DRAW_PER_TURN: 2,
  INITIAL_MANA: 5,
  MAX_MANA: 10,
  DECK_SIZE: 20,
};

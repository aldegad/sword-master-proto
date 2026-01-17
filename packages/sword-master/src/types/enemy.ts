/**
 * 적 관련 타입 정의
 */

// 적 행동 타입
export type EnemyActionType = 'attack' | 'charge' | 'defend' | 'special' | 'buff' | 'taunt';

// 적 행동 효과 타입
export type EnemyEffectType = 'bleed' | 'stun' | 'debuff' | 'heal' | 'taunt' | 'summon' | 'poison';

// 적 행동/스킬
export interface EnemyAction {
  id: string;
  name: string;
  type: EnemyActionType;
  damage: number;
  delay: number;          // 기본 대기턴
  currentDelay: number;   // 현재 남은 대기턴
  description: string;
  defenseIncrease?: number;  // 방어력 증가 (defend/taunt 타입에서 사용)
  hitCount?: number;      // 다중 타격 (각 타격마다 개별 방어 판정)
  effect?: {
    type: EnemyEffectType;
    value: number;
    duration?: number;
  };
}

// 적
export interface Enemy {
  id: string;
  name: string;
  emoji: string;
  hp: number;
  maxHp: number;
  defense: number;
  x: number;
  actions: EnemyAction[];
  actionTemplates?: EnemyAction[];  // 보스 전용: 행동 템플릿
  actionQueue: EnemyAction[];
  currentActionIndex: number;
  isStunned: number;
  bleeds: { damage: number; duration: number }[];
  poisons: { damage: number; duration: number }[];  // 독 상태
  actionsPerTurn?: { min: number; max: number };
  isBoss?: boolean;
  isTaunting?: boolean;
  tauntDuration?: number;
  summonCooldown?: number;  // 호출 쿨다운 (0이면 호출 가능)
  isSummoned?: boolean;  // 소환된 적 (경험치 없음)
}

// 적 템플릿 (데이터 정의용)
export interface EnemyTemplate {
  id: string;
  name: string;
  emoji: string;
  hp: number;
  defense: number;
  actions: Omit<EnemyAction, 'currentDelay'>[];
  actionsPerTurn?: { min: number; max: number };
  silverDrop?: { min: number; max: number };
  isTaunting?: boolean;
}


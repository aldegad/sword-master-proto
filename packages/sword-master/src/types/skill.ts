/**
 * 스킬 관련 타입 정의
 */
import type { ReachType } from './common';

// 스킬 타입
export type SkillType = 'attack' | 'defense' | 'buff' | 'special' | 'draw';

// 스킬 효과 타입
export type SkillEffectType = 
  | 'bleed' | 'stun' | 'pierce' | 'lifesteal' 
  | 'charge' | 'delayReduce' | 'focus' | 'draw' 
  | 'sharpen' | 'searchSword' | 'graveRecall' | 'graveEquip' 
  | 'chargeAttack' | 'taunt' | 'bladeDance' | 'sheathe' 
  | 'followUp' | 'drawSwords' | 'graveDrawTop' | 'armorBreaker' 
  | 'countDefense' | 'bladeGrab' | 'sweep' | 'flowRead';

// 스킬 특수 효과
export interface SkillEffect {
  type: SkillEffectType;
  value: number;
  duration?: number;
  // countDefense 전용
  counterAttack?: boolean;
  counterMultiplier?: number;
  consumeOnSuccess?: boolean;
  // flowRead 전용
  defenseScaling?: number[];
  counterScaling?: number[];
}

// 스킬 카드
export interface SkillCard {
  id: string;
  name: string;
  emoji: string;
  type: SkillType;
  attackMultiplier: number;
  attackCount: number;
  reach: ReachType;
  defenseBonus: number;
  durabilityCost: number;
  manaCost: number;
  description: string;
  effect?: SkillEffect;
  isSwift?: boolean;      // 신속 스킬 - 적 대기턴을 감소시키지 않음
  isConsumable?: boolean; // 1회용 스킬 - 사용 후 덱에서 완전히 제거
}

// 카운트 효과 타입 (패리, 철벽, 강타 등 대기 시간 기반 효과)
export type CountEffectType = 'chargeAttack' | 'countDefense' | 'flowRead';

export interface CountEffect {
  id: string;
  type: CountEffectType;
  name: string;
  emoji: string;
  remainingDelays: number;
  maxDelays?: number;
  isNew: boolean;
  data: {
    defenseMultiplier?: number;
    attackMultiplier?: number;
    attackCount?: number;
    skillAttackCount?: number;
    reach?: string;
    targetId?: string;
    counterAttack?: boolean;
    consumeOnSuccess?: boolean;
    defenseScaling?: number[];
    counterScaling?: number[];
  };
}


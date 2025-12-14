/**
 * 플레이어 관련 타입 정의
 */
import type { SwordCard } from './sword';
import type { SkillCard, CountEffect } from './skill';

// 통합 카드 타입
export type Card = 
  | { type: 'sword'; data: SwordCard }
  | { type: 'skill'; data: SkillCard };

// 버프 타입
export type BuffType = 'attack' | 'defense' | 'speed';

// 버프/디버프
export interface Buff {
  id: string;
  name: string;
  type: BuffType;
  value: number;
  duration: number;
}

// 패시브 효과 타입
export type PassiveEffectType = 
  | 'uniqueWeaponChance'  // 유니크 무기 확률
  | 'startDraw'           // 시작 드로우 증가
  | 'maxMana'             // 최대 마나 증가
  | 'attackBonus'         // 공격력 보너스
  | 'waitIncrease'        // 대기 횟수 증가
  | 'perfectCast'         // 완벽 시전 (내구도 상관없이)
  | 'defenseBonus';       // 방어율 증가

// 플레이어 패시브 스킬
export interface PlayerPassive {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  effect: {
    type: PassiveEffectType;
    value: number;
  };
}

// 패시브 스킬 템플릿 (레벨업 시 선택용)
export interface PassiveTemplate {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  effect: {
    type: PassiveEffectType;
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
  hand: Card[];
  deck: Card[];
  discard: Card[];
  buffs: Buff[];
  countEffects: CountEffect[];
  position: number;
  usedAttackThisTurn: boolean;
  passives: PlayerPassive[];
  exp: number;
  level: number;
  silver: number;
}


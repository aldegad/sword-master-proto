/**
 * 플레이어 관련 타입 정의
 */
import type { SwordCard, WeaponCategory } from './sword';
import type { SkillCard, CountEffect } from './skill';

// 통합 카드 타입 (스킬만 드로우, 검은 별도 슬롯)
export type Card =
  | { type: 'sword'; data: SwordCard }
  | { type: 'skill'; data: SkillCard };

// 검 장착 마나 비용
export const SWORD_EQUIP_COST: Record<WeaponCategory, number> = {
  dagger: 0,
  sword: 1,
  greatsword: 2,
  unique: 1,
};

// 검 슬롯 상수
export const MAX_SWORD_SLOTS = 7;
export const STARTER_SWORD_COUNT = 3;

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
  | 'defenseBonus'        // 방어율 증가
  | 'drawIncrease';       // 턴 드로우 증가

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

  // 검 슬롯 시스템 (덱/손패에서 분리)
  swordInventory: SwordCard[];     // 보유 검 목록 (최대 7자루)
  equippedSwordIndex: number;      // 현재 장착 중인 검의 인덱스 (-1 = 맨손)

  // 스킬 카드만 (검은 별도 관리)
  hand: SkillCard[];
  deck: SkillCard[];
  discard: SkillCard[];

  buffs: Buff[];
  countEffects: CountEffect[];
  position: number;
  usedAttackThisTurn: boolean;
  passives: PlayerPassive[];
  exp: number;
  level: number;
  silver: number;
}

// 현재 장착된 검 가져오기
export function getEquippedSword(state: PlayerState): SwordCard | null {
  if (state.equippedSwordIndex < 0 || state.equippedSwordIndex >= state.swordInventory.length) {
    return null;
  }
  return state.swordInventory[state.equippedSwordIndex];
}

// 장착 비용 계산
export function getEquipCost(sword: SwordCard): number {
  return SWORD_EQUIP_COST[sword.category] ?? 1;
}


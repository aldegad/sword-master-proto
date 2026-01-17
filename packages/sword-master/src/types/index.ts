/**
 * 타입 정의 - 모든 타입을 re-export
 */

// 공용 타입
export type { ReachType } from './common';
export { GAME_CONSTANTS } from './common';

// 검(무기) 타입
export type { 
  SwordRarity, 
  WeaponCategory,
  SwordPrefix, 
  SwordSuffix, 
  DrawAttack,
  SwordTemplate,
  SwordCard 
} from './sword';

// 스킬 타입
export type { 
  SkillType,
  SkillEffectType,
  SkillEffect, 
  SkillCard,
  CountEffectType,
  CountEffect 
} from './skill';

// 적 타입
export type { 
  EnemyActionType,
  EnemyEffectType,
  EnemyAction, 
  Enemy,
  EnemyTemplate
} from './enemy';

// 플레이어 타입
export type {
  Card,
  BuffType,
  Buff,
  PassiveEffectType,
  PlayerPassive,
  PassiveTemplate,
  PlayerState
} from './player';

export {
  SWORD_EQUIP_COST,
  MAX_SWORD_SLOTS,
  STARTER_SWORD_COUNT,
  getEquippedSword,
  getEquipCost
} from './player';

// 게임 상태 타입
export type { 
  GamePhase,
  GameState 
} from './game';

/**
 * 검(무기) 관련 타입 정의
 */
import type { ReachType } from './common';
import type {
  SwordOrigin,
  SwordRarity,
  WeaponCategory,
} from '../constants/swordMeta';

export type { SwordOrigin, SwordRarity, WeaponCategory };

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

// 발도 공격 정의
export interface DrawAttack {
  name: string;           // 발도 공격 이름
  multiplier: number;     // 공격력 배수
  reach: ReachType;       // 공격 범위
  durabilityCost: number; // 내구도 소모
  effect?: string;        // 발도 특수 효과 설명
  isSwift?: boolean;      // 신속 발도 (단검류)
  criticalCondition?: 'enemyDelay1';  // 크리티컬 조건
  criticalMultiplier?: number;  // 크리티컬 배율 (기본 1.5 = 150%)
  criticalPierce?: boolean;     // 크리티컬 시 방어 무시
  criticalBleed?: { damage: number; duration: number };  // 크리티컬 시 출혈
  criticalPoison?: { damage: number; duration: number }; // 크리티컬 시 독
  cancelEnemySkill?: boolean;   // 항상 적 스킬 취소 (본국검)
  criticalCancelEnemySkill?: boolean;   // 크리티컬 시에만 적 스킬 취소 (요이도로시)
  pierce?: boolean;       // 방어 무시
  armorReduce?: number;   // 적 방어력 영구 감소
  delayIncrease?: number; // 적 대기턴 증가
}

// 검 템플릿 (데이터 정의용)
export interface SwordTemplate {
  id: string;
  name: string;
  emoji: string;
  origin: SwordOrigin;
  rarity: SwordRarity;
  category: WeaponCategory;
  attack: number;
  attackCount: number;
  reach: ReachType;
  defense: number;
  pierce: number;
  durability: number;
  manaCost: number;
  description: string;
  specialEffect?: string;
  bleedOnHit?: { damage: number; duration: number };
  poisonOnHit?: { damage: number; duration: number };  // 독 피해
  armorBreakOnHit?: number;
  delayIncreaseOnHit?: number;  // 장착 중 공격 시 적 대기턴 증가
  isMirage?: boolean;  // 신기루: 사용하지 않으면 턴 종료 시 사라짐
  drawAttack: DrawAttack;
}

// 검 카드 (게임 내 인스턴스)
export interface SwordCard extends SwordTemplate {
  displayName: string;      // 인첸트 포함된 표시 이름
  currentDurability: number; // 현재 내구도
  prefix?: SwordPrefix;
  suffix?: SwordSuffix;
  delayIncreaseOnHit?: number;  // 장착 중 공격 시 적 대기턴 증가
  poisonOnHit?: { damage: number; duration: number };  // 독 피해
  isMirage?: boolean;  // 신기루: 사용하지 않으면 턴 종료 시 사라짐
}

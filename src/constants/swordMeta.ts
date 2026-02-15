/**
 * 검 메타 상수/타입
 * - origin / rarity / category 문자열을 한 곳에서 관리한다.
 */

export const SWORD_ORIGIN = {
  KOREAN: 'korean',
  JAPANESE: 'japanese',
  CHINESE: 'chinese',
  WESTERN: 'western',
  UNIQUE: 'unique',
} as const;

export type SwordOrigin = (typeof SWORD_ORIGIN)[keyof typeof SWORD_ORIGIN];
export const SWORD_ORIGIN_LIST = Object.values(SWORD_ORIGIN) as SwordOrigin[];

export const SWORD_RARITY = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  UNIQUE: 'unique',
} as const;

export type SwordRarity = (typeof SWORD_RARITY)[keyof typeof SWORD_RARITY];
export const SWORD_RARITY_LIST = Object.values(SWORD_RARITY) as SwordRarity[];

export const WEAPON_CATEGORY = {
  SWORD: 'sword',
  DAGGER: 'dagger',
  GREATSWORD: 'greatsword',
  UNIQUE: 'unique',
} as const;

export type WeaponCategory = (typeof WEAPON_CATEGORY)[keyof typeof WEAPON_CATEGORY];
export const WEAPON_CATEGORY_LIST = Object.values(WEAPON_CATEGORY) as WeaponCategory[];

import type { SwordCard, SwordPrefix, SwordSuffix, SwordRarity, ReachType } from '../types';

// ===== 인첸트 접두사 =====
export const PREFIXES: Record<string, SwordPrefix> = {
  rusty: {
    id: 'rusty',
    name: '녹슨',
    effect: { type: 'durability', value: -99 }, // 내구도 1로 고정
  },
  broken: {
    id: 'broken',
    name: '부서진',
    effect: { type: 'attack', value: -5 },
  },
  sharp: {
    id: 'sharp',
    name: '날카로운',
    effect: { type: 'attack', value: 3 },
  },
  heavy: {
    id: 'heavy',
    name: '무거운',
    effect: { type: 'attack', value: 5 },
  },
  swift: {
    id: 'swift',
    name: '신속한',
    effect: { type: 'attackCount', value: 1 },
  },
  sturdy: {
    id: 'sturdy',
    name: '견고한',
    effect: { type: 'durability', value: 2 },
  },
};

// ===== 인첸트 접미사 =====
export const SUFFIXES: Record<string, SwordSuffix> = {
  ofBlood: {
    id: 'ofBlood',
    name: '피의',
    effect: { type: 'lifesteal', value: 0.1 },
  },
  ofWounds: {
    id: 'ofWounds',
    name: '상처의',
    effect: { type: 'bleed', value: 2 },
  },
  ofPiercing: {
    id: 'ofPiercing',
    name: '관통의',
    effect: { type: 'pierce', value: 0.2 },
  },
  ofReach: {
    id: 'ofReach',
    name: '광역의',
    effect: { type: 'reach', value: 'double' },
  },
};

// ===== 검 기본 데이터 =====
interface SwordTemplate {
  id: string;
  name: string;
  emoji: string;
  origin: 'korean' | 'japanese' | 'chinese' | 'western' | 'unique';
  rarity: SwordRarity;
  attack: number;
  attackCount: number;
  reach: ReachType;
  defense: number;
  pierce: number;     // 방어관통력 (0~5, 적 방어력에서 빼는 고정 수치)
  durability: number;
  manaCost: number;
  description: string;
  specialEffect?: string;
  // 특수 장착 효과
  bleedOnHit?: { damage: number; duration: number };  // 장착 중 모든 공격에 출혈
  armorBreakOnHit?: number;  // 장착 중 모든 공격에 적 방어력 감소
  drawAttack: {
    name: string;
    multiplier: number;
    reach: ReachType;
    durabilityCost: number;
    effect?: string;  // 발도 특수 효과
    isSwift?: boolean;  // 신속 발도 (단검류)
    criticalCondition?: 'enemyDelay1';  // 크리티컬 조건
    pierce?: boolean;  // 방어 무시
    armorReduce?: number;  // 적 방어력 영구 감소 (0 이하로 내려가지 않음)
  };
}

export const SWORDS: Record<string, SwordTemplate> = {
  // ===== 한국도 =====
  samjeongdo: {
    id: 'samjeongdo',
    name: '삼정도',
    emoji: '🗡️',
    origin: 'korean',
    rarity: 'common',
    attack: 16,
    attackCount: 1,
    reach: 'single',
    defense: 20,
    pierce: 1,        // 일반 군도
    durability: 6,
    manaCost: 1,
    description: '조선 군관의 표준 도검.',
    drawAttack: { 
      name: '군관발도', 
      multiplier: 1.0, 
      reach: 'single', 
      durabilityCost: 1,
      effect: '기본기에 충실' 
    },
  },
  pagapdo: {
    id: 'pagapdo',
    name: '파갑도',
    emoji: '⚔️',
    origin: 'korean',
    rarity: 'uncommon',
    attack: 13,
    attackCount: 1,
    reach: 'single',
    defense: 16,
    pierce: 5,        // 갑옷 관통 특화!
    durability: 5,
    manaCost: 2,
    description: '갑옷을 부수는 도검. 장착 중 모든 공격에 방어력 감소.',
    specialEffect: '방어구 파괴',
    armorBreakOnHit: 2,   // 모든 공격에 방어력 -2
    drawAttack: { 
      name: '파갑일섬', 
      multiplier: 1.3, 
      reach: 'single', 
      durabilityCost: 1,
      effect: '적 방어력 무시. 방어력 -5.',
      pierce: true,       // 방어 무시
      armorReduce: 5,     // 방어력 영구 감소
    },
  },
  yoroidoshi: {
    id: 'yoroidoshi',
    name: '요이도로시',
    emoji: '🗡️',
    origin: 'japanese',
    rarity: 'uncommon',
    attack: 8,
    attackCount: 2,
    reach: 'single',
    defense: 10,
    pierce: 2,        // 갑옷 꿰뚫기
    durability: 7,
    manaCost: 1,
    description: '갑옷을 꿰뚫기 위한 단검. 장착 중 모든 공격에 출혈.',
    specialEffect: '출혈 부여',
    bleedOnHit: { damage: 6, duration: 3 },
    drawAttack: { 
      name: '관통자', 
      multiplier: 1, 
      reach: 'single', 
      durabilityCost: 1,
      effect: '출혈: 5데미지/3턴',
    },
  },
  bongukgeom: {
    id: 'bongukgeom',
    name: '본국검',
    emoji: '🗡️',
    origin: 'korean',
    rarity: 'uncommon',
    attack: 14,
    attackCount: 1,
    reach: 'double',
    defense: 25,
    pierce: 2,        // 중간 수준
    durability: 6,
    manaCost: 2,
    description: '본국검법의 정수. 2적 범위.',
    drawAttack: { 
      name: '본국세', 
      multiplier: 1.0, 
      reach: 'double', 
      durabilityCost: 1,
      effect: '2명 동시 타격' 
    },
  },
  woldo: {
    id: 'woldo',
    name: '월도',
    emoji: '🌙',
    origin: 'korean',
    rarity: 'rare',
    attack: 22,
    attackCount: 1,
    reach: 'triple',
    defense: 30,
    pierce: 3,        // 대형 도검
    durability: 4,
    manaCost: 3,
    description: '초승달 모양 장수도. 3적 범위.',
    specialEffect: '휩쓸기',
    drawAttack: { 
      name: '크게 베기', 
      multiplier: 1.2, 
      reach: 'all',
      durabilityCost: 1,
      effect: '월도를 크게 휘둘러 전체 베기!' 
    },
  },

  // ===== 일본도 =====
  katana: {
    id: 'katana',
    name: '카타나',
    emoji: '⚔️',
    origin: 'japanese',
    rarity: 'common',
    attack: 15,
    attackCount: 1,
    reach: 'single',
    defense: 18,
    pierce: 2,        // 날카로운 베기 특화
    durability: 6,
    manaCost: 1,
    description: '일본도의 대표. 날카로운 베기.',
    drawAttack: { 
      name: '거합', 
      multiplier: 1.8, 
      reach: 'single', 
      durabilityCost: 1,
      effect: '칼집에서 뽑으며 일섬!' 
    },
  },
  wakizashi: {
    id: 'wakizashi',
    name: '와키자시',
    emoji: '🔪',
    origin: 'japanese',
    rarity: 'common',
    attack: 10,
    attackCount: 2,
    reach: 'single',
    defense: 8,
    pierce: 0,        // 단검류 - 낮은 관통
    durability: 8,
    manaCost: 1,
    description: '보조검. 빠른 2타 공격.',
    drawAttack: { 
      name: '먼저 찌르기', 
      multiplier: 1.0, 
      reach: 'single', 
      durabilityCost: 1,
      effect: '적 대기 1일 때 크리티컬! (300% 데미지)',
      criticalCondition: 'enemyDelay1',
    },
  },
  nodachi: {
    id: 'nodachi',
    name: '노다치',
    emoji: '🔱',
    origin: 'japanese',
    rarity: 'rare',
    attack: 25,
    attackCount: 1,
    reach: 'double',
    defense: 28,
    pierce: 4,        // 무거운 대검 - 높은 관통
    durability: 4,
    manaCost: 3,
    description: '거대한 장검. 압도적 파괴력.',
    drawAttack: { 
      name: '대거합', 
      multiplier: 2.5, 
      reach: 'double', 
      durabilityCost: 1,
      effect: '거대한 칼날로 휩쓴다' 
    },
  },

  // ===== 중국검 =====
  guandao: {
    id: 'guandao',
    name: '언월도',
    emoji: '🐉',
    origin: 'chinese',
    rarity: 'rare',
    attack: 28,
    attackCount: 1,
    reach: 'all',
    defense: 32,
    pierce: 4,        // 무거운 언월도 - 높은 관통
    durability: 5,
    manaCost: 4,
    description: '청룡언월도. 전체 공격!',
    specialEffect: '위압: 적 공격력 -10%',
    drawAttack: { 
      name: '용참', 
      multiplier: 2.0, 
      reach: 'all', 
      durabilityCost: 1,
      effect: '용의 기세로 전체 적 베기' 
    },
  },

  // ===== 유니크 무기 =====
  jangwang: {
    id: 'jangwang',
    name: '잔광',
    emoji: '✨',
    origin: 'unique',
    rarity: 'unique',
    attack: 30,
    attackCount: 2,
    reach: 'double',
    defense: 0,
    pierce: 5,
    durability: 1,
    manaCost: 0,
    description: '사라지는 빛의 검. 단 한 번의 섬광.',
    specialEffect: '일회용! 모든 공격 관통.',
    drawAttack: { 
      name: '섬광', 
      multiplier: 3.0, 
      reach: 'all', 
      durabilityCost: 1,
      effect: '눈부신 빛으로 전체 적 관통',
      pierce: true,
    },
  },
  
  // 한국 유니크 - 칠성검
  chilseong: {
    id: 'chilseong',
    name: '칠성검',
    emoji: '⭐',
    origin: 'korean',
    rarity: 'unique',
    attack: 28,
    attackCount: 3,
    reach: 'single',
    defense: 15,
    pierce: 3,
    durability: 7,
    manaCost: 2,
    description: '북두칠성의 기운을 담은 신검. 백제의 영검.',
    specialEffect: '일곱 별의 가호',
    drawAttack: { 
      name: '칠성일섬', 
      multiplier: 2.5, 
      reach: 'single', 
      durabilityCost: 1,
      effect: '별빛이 검에 깃들어 베기',
      criticalCondition: 'enemyDelay1',
    },
  },
  
  // 한국 유니크 - 사인검
  saingum: {
    id: 'saingum',
    name: '사인검',
    emoji: '☯',
    origin: 'korean',
    rarity: 'unique',
    attack: 32,
    attackCount: 2,
    reach: 'double',
    defense: 20,
    pierce: 2,
    durability: 5,
    manaCost: 3,
    description: '조선의 의검. 악을 베고 정의를 세운다.',
    specialEffect: '정기가 깃든 검',
    bleedOnHit: { damage: 6, duration: 3 },
    drawAttack: { 
      name: '파사검', 
      multiplier: 2.0, 
      reach: 'double', 
      durabilityCost: 1,
      effect: '사악한 기운을 베어낸다',
    },
  },
  
  // 일본 유니크 - 무라마사
  muramasa: {
    id: 'muramasa',
    name: '무라마사',
    emoji: '👹',
    origin: 'japanese',
    rarity: 'unique',
    attack: 35,
    attackCount: 2,
    reach: 'single',
    defense: 5,
    pierce: 4,
    durability: 4,
    manaCost: 2,
    description: '요도 무라마사. 피에 굶주린 마검.',
    specialEffect: '피를 부르는 검',
    bleedOnHit: { damage: 8, duration: 4 },
    drawAttack: { 
      name: '혈참', 
      multiplier: 2.8, 
      reach: 'single', 
      durabilityCost: 1,
      effect: '마검이 피를 원한다!',
    },
  },
  
  // 일본 유니크 - 마사무네
  masamune: {
    id: 'masamune',
    name: '마사무네',
    emoji: '🌸',
    origin: 'japanese',
    rarity: 'unique',
    attack: 25,
    attackCount: 3,
    reach: 'double',
    defense: 25,
    pierce: 5,
    durability: 6,
    manaCost: 3,
    description: '명검 마사무네. 검성의 영혼이 깃든 검.',
    specialEffect: '검성의 가호',
    drawAttack: { 
      name: '무월', 
      multiplier: 2.0, 
      reach: 'all', 
      durabilityCost: 1,
      effect: '달빛처럼 고요하게, 그러나 날카롭게',
    },
  },
  
  // 일본 유니크 - 쿠사나기노츠루기
  kusanagi: {
    id: 'kusanagi',
    name: '쿠사나기',
    emoji: '🌊',
    origin: 'japanese',
    rarity: 'unique',
    attack: 30,
    attackCount: 2,
    reach: 'all',
    defense: 18,
    pierce: 6,
    durability: 5,
    manaCost: 4,
    description: '삼종신기 중 하나. 풀을 베는 검.',
    specialEffect: '신검의 기운',
    drawAttack: { 
      name: '천총운검', 
      multiplier: 3.0, 
      reach: 'all', 
      durabilityCost: 1,
      effect: '신의 바람이 적을 베어낸다',
      pierce: true,
    },
  },
};

// 유니크 무기 목록
export const UNIQUE_SWORDS = ['jangwang', 'chilseong', 'saingum', 'muramasa', 'masamune', 'kusanagi'];

// 랜덤 유니크 무기 생성
export function getRandomUniqueSword(): SwordCard {
  const uniqueId = UNIQUE_SWORDS[Math.floor(Math.random() * UNIQUE_SWORDS.length)];
  return createSwordCard(uniqueId)!;
}

// ===== 검 생성 함수 =====

export function createSwordCard(swordId: string, prefix?: string, suffix?: string): SwordCard | null {
  const template = SWORDS[swordId];
  if (!template) return null;
  
  let sword: SwordCard = {
    ...template,
    displayName: template.name,
    currentDurability: template.durability,
    prefix: prefix ? PREFIXES[prefix] : undefined,
    suffix: suffix ? SUFFIXES[suffix] : undefined,
    // 특수 장착 효과 복사
    bleedOnHit: template.bleedOnHit,
    armorBreakOnHit: template.armorBreakOnHit,
  };
  
  // 접두사 적용
  if (prefix && PREFIXES[prefix]) {
    const p = PREFIXES[prefix];
    sword.displayName = `${p.name} ${sword.name}`;
    
    if (p.effect.type === 'durability') {
      if (p.id === 'rusty') {
        sword.durability = 1;
        sword.currentDurability = 1;
      } else {
        sword.durability = Math.max(1, sword.durability + p.effect.value);
        sword.currentDurability = sword.durability;
      }
    } else if (p.effect.type === 'attack') {
      sword.attack = Math.max(1, sword.attack + p.effect.value);
    } else if (p.effect.type === 'attackCount') {
      sword.attackCount += p.effect.value;
    }
  }
  
  // 접미사 적용
  if (suffix && SUFFIXES[suffix]) {
    const s = SUFFIXES[suffix];
    sword.displayName = `${sword.displayName} (${s.name})`;
  }
  
  return sword;
}

// 랜덤 검 생성 (인첸트 확률 포함)
export function getRandomSword(wave: number = 1): SwordCard {
  const swordIds = Object.keys(SWORDS).filter(id => SWORDS[id].rarity !== 'unique');
  
  // 레어도 필터 (웨이브에 따라)
  let pool = swordIds.filter(id => {
    const rarity = SWORDS[id].rarity;
    if (wave < 3) return rarity === 'common';
    if (wave < 6) return rarity === 'common' || rarity === 'uncommon';
    return true;
  });
  
  if (pool.length === 0) pool = swordIds;
  
  const randomId = pool[Math.floor(Math.random() * pool.length)];
  
  // 인첸트 확률
  let prefix: string | undefined;
  let suffix: string | undefined;
  
  const prefixRoll = Math.random();
  if (prefixRoll < 0.1) {
    prefix = 'rusty';
  } else if (prefixRoll < 0.2) {
    prefix = 'broken';
  } else if (prefixRoll < 0.25 && wave >= 3) {
    prefix = 'sharp';
  } else if (prefixRoll < 0.3 && wave >= 5) {
    prefix = 'swift';
  } else if (prefixRoll < 0.35 && wave >= 5) {
    prefix = 'sturdy';
  }
  
  const suffixRoll = Math.random();
  if (suffixRoll < 0.05 && wave >= 5) {
    suffix = 'ofBlood';
  } else if (suffixRoll < 0.1 && wave >= 5) {
    suffix = 'ofWounds';
  }
  
  return createSwordCard(randomId, prefix, suffix)!;
}

// 유니크 무기 "잔광" 생성
export function createJangwang(): SwordCard {
  return createSwordCard('jangwang')!;
}

// 녹슨 검 생성 (일회용)
export function createRustySword(swordId: string): SwordCard | null {
  return createSwordCard(swordId, 'rusty');
}

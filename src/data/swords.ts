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
  durability: number;
  manaCost: number;
  description: string;
  specialEffect?: string;
  drawAttack: {
    name: string;
    multiplier: number;
    reach: ReachType;
    durabilityCost: number;
    effect?: string;  // 발도 특수 효과
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
    attack: 12,
    attackCount: 1,
    reach: 'single',
    defense: 8,
    durability: 6,  // 4→6
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
  haegapdo: {
    id: 'haegapdo',
    name: '해갑도',
    emoji: '⚔️',
    origin: 'korean',
    rarity: 'uncommon',
    attack: 18,
    attackCount: 1,
    reach: 'single',
    defense: 3,
    durability: 5,  // 3→5
    manaCost: 2,
    description: '갑옷을 뚫는 관통력.',
    specialEffect: '관통 20%',
    drawAttack: { 
      name: '파갑일섬', 
      multiplier: 1.3, 
      reach: 'single', 
      durabilityCost: 1,
      effect: '적 방어력 무시' 
    },
  },
  yedogeom: {
    id: 'yedogeom',
    name: '예도검',
    emoji: '🔪',
    origin: 'korean',
    rarity: 'common',
    attack: 10,
    attackCount: 2,
    reach: 'single',
    defense: 12,
    durability: 8,  // 5→8 (2타 무기라 더 높게)
    manaCost: 1,
    description: '예법과 실전을 겸비한 검. 2타.',
    drawAttack: { 
      name: '쌍발도', 
      multiplier: 0.6, 
      reach: 'single', 
      durabilityCost: 2,  // 2타라 2 소모
      effect: '2회 연속 타격' 
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
    defense: 15,
    durability: 6,  // 4→6
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
    defense: 5,
    durability: 4,  // 2→4
    manaCost: 3,
    description: '초승달 모양 장수도. 3적 범위.',
    specialEffect: '휩쓸기',
    drawAttack: { 
      name: '월광참', 
      multiplier: 1.5, 
      reach: 'triple', 
      durabilityCost: 1,
      effect: '초승달 궤적으로 3명 베기' 
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
    defense: 10,
    durability: 6,  // 4→6
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
    attack: 8,
    attackCount: 2,
    reach: 'single',
    defense: 12,
    durability: 8,  // 5→8 (2타 무기)
    manaCost: 1,
    description: '보조검. 빠른 2타 공격.',
    drawAttack: { 
      name: '소태도술', 
      multiplier: 0.5, 
      reach: 'single', 
      durabilityCost: 2,  // 2타라 2 소모
      effect: '빠른 연속 자상' 
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
    defense: 3,
    durability: 4,  // 2→4
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
    defense: 0,
    durability: 5,  // 3→5
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

  // ===== 서양검 =====
  longsword: {
    id: 'longsword',
    name: '롱소드',
    emoji: '🗡️',
    origin: 'western',
    rarity: 'common',
    attack: 14,
    attackCount: 1,
    reach: 'single',
    defense: 15,
    durability: 8,  // 5→8
    manaCost: 1,
    description: '양손검. 공방 균형.',
    drawAttack: { 
      name: '발검', 
      multiplier: 1.0, 
      reach: 'single', 
      durabilityCost: 1,
      effect: '균형 잡힌 일격' 
    },
  },
  armingsword: {
    id: 'armingsword',
    name: '아밍 소드',
    emoji: '⚔️',
    origin: 'western',
    rarity: 'common',
    attack: 12,
    attackCount: 1,
    reach: 'single',
    defense: 18,
    durability: 10,  // 5→10 (가장 튼튼)
    manaCost: 1,
    description: '기사의 검. 최고 내구도와 방어.',
    drawAttack: { 
      name: '기사도', 
      multiplier: 0.8, 
      reach: 'single', 
      durabilityCost: 1,
      effect: '방어적 자세로 검을 뽑음' 
    },
  },
  claymore: {
    id: 'claymore',
    name: '클레이모어',
    emoji: '⚔️',
    origin: 'western',
    rarity: 'rare',
    attack: 24,
    attackCount: 1,
    reach: 'double',
    defense: 5,
    durability: 4,  // 2→4
    manaCost: 3,
    description: '스코틀랜드 대검. 2적 범위.',
    drawAttack: { 
      name: '하이랜드 돌격', 
      multiplier: 2.0, 
      reach: 'double', 
      durabilityCost: 1,
      effect: '용맹한 돌격 일섬' 
    },
  },
  rapier: {
    id: 'rapier',
    name: '레이피어',
    emoji: '🤺',
    origin: 'western',
    rarity: 'uncommon',
    attack: 10,
    attackCount: 3,
    reach: 'single',
    defense: 12,
    durability: 9,  // 3→9 (3타 무기라 높게)
    manaCost: 1,
    description: '찌르기 특화. 3타 연속 공격.',
    specialEffect: '크리티컬 2배',
    drawAttack: { 
      name: '펜싱 돌진', 
      multiplier: 0.5, 
      reach: 'single', 
      durabilityCost: 3,  // 3타라 3 소모
      effect: '세 번 연속 찌르기' 
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
    durability: 1,  // 유니크는 1 유지 (일회용)
    manaCost: 0,
    description: '사라지는 빛의 검. 단 한 번의 섬광.',
    specialEffect: '일회용! 모든 공격 관통.',
    drawAttack: { 
      name: '섬광', 
      multiplier: 3.0, 
      reach: 'all', 
      durabilityCost: 1,
      effect: '눈부신 빛으로 전체 적 관통' 
    },
  },
};

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

import type { SwordCard, SwordPrefix, SwordSuffix, SwordTemplate } from '../types';

// ===== 인첸트 접두사 =====
export const PREFIXES: Record<string, SwordPrefix> = {
  chipped: {
    id: 'chipped',
    name: '이가 빠진',
    effect: { type: 'durability', value: -99 }, // 내구도 고정 (createSwordCard에서 처리)
  },
};

// ===== 인첸트 접미사 =====
export const SUFFIXES: Record<string, SwordSuffix> = {
  // 현재 사용 안 함
};

export const SWORDS: Record<string, SwordTemplate> = {
  // ===== 장검 (sword) =====
  
  // --- 한국 장검 ---
  samjeongdo: {
    id: 'samjeongdo',
    name: '삼정도',
    emoji: '🗡️',
    origin: 'korean',
    rarity: 'common',
    category: 'sword',
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
    category: 'sword',
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
  bongukgeom: {
    id: 'bongukgeom',
    name: '본국검',
    emoji: '🗡️',
    origin: 'korean',
    rarity: 'uncommon',
    category: 'sword',
    attack: 14,
    attackCount: 1,
    reach: 'single',
    defense: 26,
    pierce: 1,
    durability: 6,
    manaCost: 2,
    description: '본국검법의 정수. 상대의 공격의 흐름을 끊어내는 것에 특화되어 있다.',
    specialEffect: '공격 시 적 대기+1',
    delayIncreaseOnHit: 1,  // 공격 시 적 대기턴 +1
    drawAttack: { 
      name: '끊어내기', 
      multiplier: 1.0, 
      reach: 'single', 
      durabilityCost: 1,
      effect: '적의 공격의 흐름을 끊으며 틈을 만든다.',
      delayIncrease: 1,  // 발도 시 대기 +1
    },
  },
  
  // --- 일본 장검 ---
  katana: {
    id: 'katana',
    name: '카타나',
    emoji: '⚔️',
    origin: 'japanese',
    rarity: 'common',
    category: 'sword',
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

  // ===== 단검 (dagger) =====
  
  // --- 일본 단검 ---
  yoroidoshi: {
    id: 'yoroidoshi',
    name: '요이도로시',
    emoji: '🗡️',
    origin: 'japanese',
    rarity: 'uncommon',
    category: 'dagger',
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
  wakizashi: {
    id: 'wakizashi',
    name: '와키자시',
    emoji: '🔪',
    origin: 'japanese',
    rarity: 'common',
    category: 'dagger',  // 단검류
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
      effect: '1회만 공격. 적 대기 1일 때 크리티컬! (50뎀)',
      criticalCondition: 'enemyDelay1',
      criticalMultiplier: 5.0,  // 크리티컬 500% = 10 * 5 = 50
    },
  },

  // ===== 대검 (greatsword) =====
  
  // --- 한국 대검 ---
  woldo: {
    id: 'woldo',
    name: '월도',
    emoji: '🌙',
    origin: 'korean',
    rarity: 'rare',
    category: 'greatsword',
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
  
  // --- 일본 대검 ---
  nodachi: {
    id: 'nodachi',
    name: '노다치',
    emoji: '🔱',
    origin: 'japanese',
    rarity: 'rare',
    category: 'greatsword',
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
  
  // --- 중국 대검 ---
  guandao: {
    id: 'guandao',
    name: '언월도',
    emoji: '🐉',
    origin: 'chinese',
    rarity: 'rare',
    category: 'greatsword',
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

  // ===== 유니크 무기 (unique) =====
  
  // --- 유니크 (국적 없음) ---
  jangwang: {
    id: 'jangwang',
    name: '잔광',
    emoji: '✨',
    origin: 'unique',
    rarity: 'unique',
    category: 'unique',
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
  
  // --- 한국 유니크 ---
  chilseong: {
    id: 'chilseong',
    name: '칠성검',
    emoji: '⭐',
    origin: 'korean',
    rarity: 'unique',
    category: 'unique',
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
  saingum: {
    id: 'saingum',
    name: '사인검',
    emoji: '☯',
    origin: 'korean',
    rarity: 'unique',
    category: 'unique',
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
  
  // --- 일본 유니크 ---
  muramasa: {
    id: 'muramasa',
    name: '무라마사',
    emoji: '👹',
    origin: 'japanese',
    rarity: 'unique',
    category: 'unique',
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
  masamune: {
    id: 'masamune',
    name: '마사무네',
    emoji: '🌸',
    origin: 'japanese',
    rarity: 'unique',
    category: 'unique',
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
  kusanagi: {
    id: 'kusanagi',
    name: '쿠사나기',
    emoji: '🌊',
    origin: 'japanese',
    rarity: 'unique',
    category: 'unique',
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
// 보스 보상용 유니크 무기 (잔광 제외)
export const UNIQUE_SWORDS_BOSS = ['chilseong', 'saingum', 'muramasa', 'masamune', 'kusanagi'];

// 랜덤 유니크 무기 생성 (보스 보상용 - 잔광 제외)
export function getRandomUniqueSword(): SwordCard {
  const uniqueId = UNIQUE_SWORDS_BOSS[Math.floor(Math.random() * UNIQUE_SWORDS_BOSS.length)];
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
    delayIncreaseOnHit: template.delayIncreaseOnHit,
  };
  
  // 접두사 적용
  if (prefix && PREFIXES[prefix]) {
    const p = PREFIXES[prefix];
    sword.displayName = `${p.name} ${sword.name}`;
    
    if (p.effect.type === 'durability') {
      if (p.id === 'chipped') {
        // 이가 빠진: 단검류는 내구도 1, 나머지는 내구도 2
        const isDagger = template.category === 'dagger';
        const chippedDurability = isDagger ? 1 : 2;
        sword.durability = chippedDurability;
        sword.currentDurability = chippedDurability;
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
  
  // 20% 확률로 '이가 빠진' 인첸트
  const prefix = Math.random() < 0.20 ? 'chipped' : undefined;
  
  return createSwordCard(randomId, prefix)!;
}

// 상점용 깨끗한 검 생성 (인첸트 없음)
export function getCleanSword(wave: number = 1): SwordCard {
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
  
  // 인첸트 없이 깨끗한 상태로 생성
  return createSwordCard(randomId)!;
}

// 유니크 무기 "잔광" 생성
export function createJangwang(): SwordCard {
  return createSwordCard('jangwang')!;
}

// 녹슨 검 생성 (일회용)
export function createRustySword(swordId: string): SwordCard | null {
  return createSwordCard(swordId, 'rusty');
}

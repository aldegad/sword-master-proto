import type { SwordCard, SwordPrefix, SwordSuffix, SwordTemplate } from '../types';
import { SWORD_ID, SWORD_ID_LIST, type SwordId } from '../constants/gameIds';
import {
  SWORD_ORIGIN,
  SWORD_RARITY,
  WEAPON_CATEGORY,
} from '../constants/swordMeta';

const ORIGIN = SWORD_ORIGIN;
const RARITY = SWORD_RARITY;
const CATEGORY = WEAPON_CATEGORY;

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
  // =============================================
  // 1. 군도형 (Military Saber)
  // 보병용 표준 군도. 공격·방어·내구가 균형 잡힌 기본 무기.
  // =============================================
  
  // --- 한국 군도 ---
  samjeongdo: {
    id: 'samjeongdo',
    name: '삼정도',
    emoji: '🗡️',
    origin: ORIGIN.KOREAN,
    rarity: RARITY.COMMON,
    category: CATEGORY.SWORD,
    attack: 16,
    attackCount: 1,
    reach: 'single',
    defense: 20,
    pierce: 1,
    durability: 6,
    manaCost: 2,
    description: '조선 군관의 제식 도검. 공격과 방어의 균형이 좋은 안정적인 기본 무기.',
    drawAttack: { 
      name: '군관발도', 
      multiplier: 1.0, 
      reach: 'single', 
      durabilityCost: 1,
      effect: '기본기에 충실한 정석 발도' 
    },
  },

  // --- 일본 군도 ---
  katana: {
    id: 'katana',
    name: '카타나',
    emoji: '⚔️',
    origin: ORIGIN.JAPANESE,
    rarity: RARITY.COMMON,
    category: CATEGORY.SWORD,
    attack: 14,
    attackCount: 1,
    reach: 'single',
    defense: 16,
    pierce: 2,
    durability: 5,
    manaCost: 2,
    description: '일본 보병의 대표 도검. 베기 성능이 뛰어나 단일 대상 압박에 특화.',
    drawAttack: { 
      name: '거합', 
      multiplier: 1.8,
      reach: 'single', 
      durabilityCost: 1,
      effect: '칼집에서 뽑으며 일섬!' 
    },
  },

  // --- 중국 군도 ---
  byeongdo: {
    id: 'byeongdo',
    name: '병도',
    emoji: '🔪',
    origin: ORIGIN.CHINESE,
    rarity: RARITY.COMMON,
    category: CATEGORY.SWORD,
    attack: 14,
    attackCount: 1,
    reach: 'double',
    defense: 18,
    pierce: 1,
    durability: 7,
    manaCost: 2,
    description: '중국 보병용 제식 도검. 단순하고 실전적인 구조로 집단 전투에서 효율적.',
    specialEffect: '2적 범위 공격',
    drawAttack: { 
      name: '횡참', 
      multiplier: 1.0, 
      reach: 'double', 
      durabilityCost: 1,
      effect: '옆으로 크게 휘둘러 2명의 적을 벤다' 
    },
  },

  // =============================================
  // 2. 갑파괴형 (Armor Breaker)
  // 갑옷·방패·중장보병 대응용. 날이 두껍고 무거우며 관통 성능이 높음.
  // =============================================
  
  // --- 일본 장병기 ---
  nagamaki: {
    id: 'nagamaki',
    name: '나가마키',
    emoji: '🔱',
    origin: ORIGIN.JAPANESE,
    rarity: RARITY.COMMON,
    category: CATEGORY.SWORD,
    attack: 16,
    attackCount: 1,
    reach: 'double',
    defense: 12,
    pierce: 5,
    durability: 5,
    manaCost: 3,
    description: '긴 자루와 긴 도날을 결합한 일본 장병기. 강한 베기와 충격 전달로 중장갑 보병 압박에 유리.',
    specialEffect: '충격 전달: 타격 시 적 대기 +1',
    delayIncreaseOnHit: 1,
    drawAttack: { 
      name: '장병참', 
      multiplier: 1.6, 
      reach: 'double', 
      durabilityCost: 1,
      effect: '긴 자루로 충격을 실어 크게 베어 중장갑에도 타격을 준다',
      armorReduce: 2,
    },
  },

  // --- 중국 갑파괴검 ---
  jungdo: {
    id: 'jungdo',
    name: '중도',
    emoji: '🔨',
    origin: ORIGIN.CHINESE,
    rarity: RARITY.COMMON,
    category: CATEGORY.SWORD,
    attack: 17,
    attackCount: 1,
    reach: 'single',
    defense: 20,
    pierce: 4,
    durability: 6,
    manaCost: 2,
    description: '두껍고 넓은 칼날의 중국도. 방패·중장 보병 대응에 적합한 높은 관통력.',
    delayIncreaseOnHit: 1,
    drawAttack: { 
      name: '중압참', 
      multiplier: 1.4, 
      reach: 'single', 
      durabilityCost: 1,
      effect: '무거운 칼날로 내리쳐 적을 제압',
      armorReduce: 3,
    },
  },

  // =============================================
  // 3. 기술검형 (Technique Sword)
  // 검술, 흐름 제어, 타이밍 중심. 숙련자에게 보상이 큰 무기군.
  // =============================================
  
  // --- 한국 기술검 ---
  bongukgeom: {
    id: 'bongukgeom',
    name: '본국검',
    emoji: '🗡️',
    origin: ORIGIN.KOREAN,
    rarity: RARITY.COMMON,
    category: CATEGORY.SWORD,
    attack: 14,
    attackCount: 1,
    reach: 'single',
    defense: 24,
    pierce: 1,
    durability: 6,
    manaCost: 2,
    description: '본국검법의 정수. 상대의 공격 흐름을 끊어내는 방어적·통제형 무기.',
    delayIncreaseOnHit: 1,
    drawAttack: { 
      name: '끊어내기', 
      multiplier: 1.2, 
      reach: 'single', 
      durabilityCost: 1,
      effect: '**스킬 취소**! 적의 발동 직전 스킬을 무효화',
      cancelEnemySkill: true,  // 조건 없이 항상 스킬 취소
    },
  },

  // --- 일본 기술검 ---
  gekkenkatana: {
    id: 'gekkenkatana',
    name: '격검용 카타나',
    emoji: '⚡',
    origin: ORIGIN.JAPANESE,
    rarity: RARITY.COMMON,
    category: CATEGORY.SWORD,
    attack: 12,
    attackCount: 1,
    reach: 'single',
    defense: 22,
    pierce: 2,
    durability: 5,
    manaCost: 2,
    description: '거합·카운터 중심 운용의 기술 특화 검. 타이밍 의존도가 높은 숙련자 보상형.',
    drawAttack: { 
      name: '전광일섬', 
      multiplier: 2.5, 
      reach: 'single', 
      durabilityCost: 1,
      effect: '적 대기 1일 때 크리티컬!',
      criticalCondition: 'enemyDelay1',
      criticalMultiplier: 2.0,
    },
  },

  // --- 중국 기술검 ---
  jian: {
    id: 'jian',
    name: '젠',
    emoji: '✨',
    origin: ORIGIN.CHINESE,
    rarity: RARITY.COMMON,
    category: CATEGORY.SWORD,
    attack: 10,
    attackCount: 2,
    reach: 'single',
    defense: 18,
    pierce: 3,
    durability: 5,
    manaCost: 2,
    description: '찌르기와 정밀 공격 중심의 검. 공격력은 낮지만 기술 계수가 우수한 컨트롤형.',
    bleedOnHit: { damage: 10, duration: 3 },  // 기본 출혈 10
    drawAttack: { 
      name: '점혈', 
      multiplier: 1.2, 
      reach: 'single', 
      durabilityCost: 1,
      effect: '급소를 정확히 찌른다. 출혈 부여.',
    },
  },

  // =============================================
  // 4. 단검형 (Sidearm / Dagger)
  // 보조 무기 또는 암습용. 연속 공격, 상태 이상 부여에 적합.
  // =============================================
  
  // --- 한국 단검 ---
  bisu: {
    id: 'bisu',
    name: '비수',
    emoji: '🗡️',
    origin: ORIGIN.KOREAN,
    rarity: RARITY.COMMON,
    category: CATEGORY.DAGGER,
    attack: 7,
    attackCount: 2,
    reach: 'single',
    defense: 4,
    pierce: 1,
    durability: 4,
    manaCost: 1,
    description: '간결하고 실용적인 단검. 은신·호위·암습에 특화된 빠른 선제 공격용.',
    drawAttack: { 
      name: '선제타격', 
      multiplier: 1.0, 
      reach: 'single',
      durabilityCost: 1,
      effect: '**신속공격** 적 대기 1일 때 방어 무시 크리티컬!',
      isSwift: true,
      criticalCondition: 'enemyDelay1',
      criticalMultiplier: 5.0,  // 500%
      criticalPierce: true,     // 크리티컬 시 방어 무시
    },
  },

  // --- 일본 단검 ---
  wakizashi: {
    id: 'wakizashi',
    name: '와키자시',
    emoji: '🔪',
    origin: ORIGIN.JAPANESE,
    rarity: RARITY.COMMON,
    category: CATEGORY.DAGGER,
    attack: 8,
    attackCount: 2,
    reach: 'single',
    defense: 8,
    pierce: 0,
    durability: 5,
    manaCost: 1,
    description: '보조검. 빠른 연속 공격과 조건부 크리티컬에 특화.',
    drawAttack: { 
      name: '먼저 찌르기', 
      multiplier: 1.0, 
      reach: 'single', 
      durabilityCost: 1,
      criticalCondition: 'enemyDelay1',
      criticalPierce: true,     // 크리티컬 시 방어 무시
      criticalMultiplier: 4.5,
    },
  },

  yoroidoshi: {
    id: 'yoroidoshi',
    name: '요이도로시',
    emoji: '🗡️',
    origin: ORIGIN.JAPANESE,
    rarity: RARITY.COMMON,
    category: CATEGORY.DAGGER,
    attack: 8,
    attackCount: 2,
    reach: 'single',
    defense: 10,
    pierce: 2,
    durability: 5,
    manaCost: 1,
    description: '갑옷 관통 단검. 출혈·지속 피해에 특화된 중장 상대 대응용.',
    bleedOnHit: { damage: 6, duration: 3 },  // 일반 공격: 출혈 6
    drawAttack: { 
      name: '찔러 끊기', 
      multiplier: 1.5, 
      reach: 'single', 
      durabilityCost: 1,
      effect: '적 대기 1일 때, 상대의 **스킬을 취소** 시킨다.',
      criticalCondition: 'enemyDelay1',
      criticalMultiplier: 1.5,
      criticalPierce: true,              // 크리티컬 시 방어 무시
      criticalCancelEnemySkill: true,    // 크리티컬 시에만 적 스킬 취소
    },
  },

  // --- 중국 단검 ---
  jagaekdangeom: {
    id: 'jagaekdangeom',
    name: '자객 단검',
    emoji: '🌙',
    origin: ORIGIN.CHINESE,
    rarity: RARITY.COMMON,
    category: CATEGORY.DAGGER,
    attack: 9,
    attackCount: 3,
    reach: 'single',
    defense: 4,
    pierce: 1,
    durability: 5,
    manaCost: 1,
    description: '암살 및 근접 제압용 단검. 독 계열 상태 이상에 특화.',
    poisonOnHit: { damage: 4, duration: 4 },  // 일반 공격: 독 4
    drawAttack: { 
      name: '암살', 
      multiplier: 1.0, 
      reach: 'single', 
      durabilityCost: 1,
      effect: '적 대기 1일 때 방어 무시 + 맹독!',
      criticalCondition: 'enemyDelay1',
      criticalMultiplier: 3.0,  // 300% (기본)
      criticalPierce: true,     // 크리티컬 시 방어 무시
      criticalPoison: { damage: 17, duration: 3 },  // 크리티컬 시 독 18
    },
  },

  // =============================================
  // 5. 중장검형 (Heavy / Battlefield Sword)
  // 보병 전장에서의 범위 제압용. 느리지만 위압과 파괴력이 큼.
  // =============================================
  
  // --- 한국 중장검 ---
  woldo: {
    id: 'woldo',
    name: '월도',
    emoji: '🌙',
    origin: ORIGIN.KOREAN,
    rarity: RARITY.COMMON,
    category: CATEGORY.GREATSWORD,
    attack: 22,
    attackCount: 1,
    reach: 'triple',
    defense: 30,
    pierce: 3,
    durability: 4,
    manaCost: 3,
    description: '장수용 대형 도검. 다수 대상 공격과 범위 피해에 특화.',
    drawAttack: { 
      name: '크게 베기', 
      multiplier: 1.2, 
      reach: 'all',
      durabilityCost: 1,
      effect: '월도를 크게 휘둘러 전체 베기!' 
    },
  },

  // --- 일본 중장검 ---
  nodachi: {
    id: 'nodachi',
    name: '노다치',
    emoji: '🔱',
    origin: ORIGIN.JAPANESE,
    rarity: RARITY.COMMON,
    category: CATEGORY.GREATSWORD,
    attack: 25,
    attackCount: 1,
    reach: 'double',
    defense: 28,
    pierce: 4,
    durability: 4,
    manaCost: 3,
    description: '초대형 장검. 압도적인 공격력과 긴 리치의 선공 압박형 무기.',
    drawAttack: { 
      name: '대거합', 
      multiplier: 2.5, 
      reach: 'double', 
      durabilityCost: 1,
      effect: '거대한 칼날로 휩쓴다' 
    },
  },

  // --- 중국 중장검 ---
  guandao: {
    id: 'guandao',
    name: '언월도',
    emoji: '🐉',
    origin: ORIGIN.CHINESE,
    rarity: RARITY.COMMON,
    category: CATEGORY.GREATSWORD,
    attack: 28,
    attackCount: 1,
    reach: 'all',
    defense: 32,
    pierce: 4,
    durability: 5,
    manaCost: 4,
    description: '청룡언월도. 위압감이 강해 사기 저하·공격력 감소 효과와 궁합이 좋음.',
    specialEffect: '위압: 적 공격력 -10%',
    drawAttack: { 
      name: '용참', 
      multiplier: 2.0, 
      reach: 'all', 
      durabilityCost: 1,
      effect: '용의 기세로 전체 적 베기' 
    },
  },

  // =============================================
  // 유니크 무기 (Unique Weapons)
  // =============================================
  
  // --- 유니크 (국적 없음) ---
  jangwang: {
    id: 'jangwang',
    name: '잔광',
    emoji: '✨',
    origin: ORIGIN.UNIQUE,
    rarity: RARITY.UNIQUE,
    category: CATEGORY.UNIQUE,
    attack: 30,
    attackCount: 1,
    reach: 'double',
    defense: 0,
    pierce: 5,
    durability: 1,
    manaCost: 0,
    description: '모든 것을 내려놓은 순간. 번뜩이는 검의 깨달음.',
    specialEffect: '단 한 번의 섬광.',
    isMirage: true,  // 신기루: 사용하지 않으면 턴 종료 시 사라짐
    drawAttack: { 
      name: '섬광', 
      multiplier: 1.0,
      reach: 'all', 
      durabilityCost: 1,
      effect: '눈부신 빛으로 전체 적 관통',
      pierce: true,
    },
  },
  
  // --- 한국 유니크 ---
  chilseong: {
    id: 'chilseong',
    name: '성흔절도',
    emoji: '⭐',
    origin: ORIGIN.UNIQUE,
    rarity: RARITY.UNIQUE,
    category: CATEGORY.UNIQUE,
    attack: 28,
    attackCount: 3,
    reach: 'single',
    defense: 15,
    pierce: 3,
    durability: 7,
    manaCost: 2,
    description: '붕괴한 성좌의 파편을 봉인한 연격형 마검.',
    specialEffect: '연속 타격 종료 시 추가 출혈',
    drawAttack: { 
      name: '성흔난격',
      multiplier: 2.5, 
      reach: 'single', 
      durabilityCost: 1,
      effect: '성흔 파편을 연속으로 폭주시켜 절단',
      criticalCondition: 'enemyDelay1',
    },
  },
  saingum: {
    id: 'saingum',
    name: '공허침식도',
    emoji: '☯',
    origin: ORIGIN.UNIQUE,
    rarity: RARITY.UNIQUE,
    category: CATEGORY.UNIQUE,
    attack: 32,
    attackCount: 2,
    reach: 'double',
    defense: 20,
    pierce: 2,
    durability: 5,
    manaCost: 3,
    description: '공간 균열을 먹어치우며 칼날을 증식시키는 침식도.',
    specialEffect: '방어 관통 강화',
    bleedOnHit: { damage: 6, duration: 3 },
    drawAttack: { 
      name: '공허관통',
      multiplier: 2.0, 
      reach: 'double', 
      durabilityCost: 1,
      effect: '균열선을 따라 방어를 무시하고 관통',
    },
  },
  
  // --- 일본 유니크 ---
  muramasa: {
    id: 'muramasa',
    name: '폭풍유리검',
    emoji: '👹',
    origin: ORIGIN.UNIQUE,
    rarity: RARITY.UNIQUE,
    category: CATEGORY.UNIQUE,
    attack: 35,
    attackCount: 2,
    reach: 'single',
    defense: 5,
    pierce: 4,
    durability: 4,
    manaCost: 2,
    description: '폭풍핵으로 제련된 유리 칼날이 연타마다 흔들린다.',
    specialEffect: '연속 타격 시 적 대기턴 압박',
    bleedOnHit: { damage: 8, duration: 4 },
    drawAttack: { 
      name: '난류참',
      multiplier: 2.8, 
      reach: 'single', 
      durabilityCost: 1,
      effect: '난류 궤적으로 베어 대기턴을 흔든다',
    },
  },
  masamune: {
    id: 'masamune',
    name: '야식맹세검',
    emoji: '🌸',
    origin: ORIGIN.UNIQUE,
    rarity: RARITY.UNIQUE,
    category: CATEGORY.UNIQUE,
    attack: 25,
    attackCount: 3,
    reach: 'double',
    defense: 25,
    pierce: 5,
    durability: 6,
    manaCost: 3,
    description: '심야 의식을 통해 계약된 일격 특화형 맹세검.',
    specialEffect: '고위력 단절 일격',
    drawAttack: { 
      name: '흑야단절',
      multiplier: 2.0, 
      reach: 'all', 
      durabilityCost: 1,
      effect: '암야의 잔상을 남기며 광역 절단',
    },
  },
  kusanagi: {
    id: 'kusanagi',
    name: '여명파열도',
    emoji: '🌊',
    origin: ORIGIN.UNIQUE,
    rarity: RARITY.UNIQUE,
    category: CATEGORY.UNIQUE,
    attack: 30,
    attackCount: 2,
    reach: 'all',
    defense: 18,
    pierce: 6,
    durability: 5,
    manaCost: 4,
    description: '여명 직전의 균열광을 칼날로 압축한 파열형 도검.',
    specialEffect: '사용 후 다음 턴 마나 유리',
    drawAttack: { 
      name: '여명붕괴',
      multiplier: 3.0, 
      reach: 'all', 
      durabilityCost: 1,
      effect: '폭발적인 균열파로 전장을 쓸어낸다',
      pierce: true,
    },
  },
};

// 유니크 무기 목록
// 보스 보상용 유니크 무기 (잔광 제외)
export const UNIQUE_SWORDS_BOSS: SwordId[] = [
  SWORD_ID.CHILSEONG,
  SWORD_ID.SAINGUM,
  SWORD_ID.MURAMASA,
  SWORD_ID.MASAMUNE,
  SWORD_ID.KUSANAGI,
];

// 랜덤 유니크 무기 생성 (보스 보상용 - 잔광 제외)
export function getRandomUniqueSword(): SwordCard {
  const uniqueId = UNIQUE_SWORDS_BOSS[Math.floor(Math.random() * UNIQUE_SWORDS_BOSS.length)];
  return createSwordCard(uniqueId)!;
}

// ===== 검 생성 함수 =====

export function createSwordCard(swordId: SwordId, prefix?: string, suffix?: string): SwordCard | null {
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
    poisonOnHit: template.poisonOnHit,
    armorBreakOnHit: template.armorBreakOnHit,
    delayIncreaseOnHit: template.delayIncreaseOnHit,
    isMirage: template.isMirage,  // 신기루 태그 복사
  };
  
  // 접두사 적용
  if (prefix && PREFIXES[prefix]) {
    const p = PREFIXES[prefix];
    sword.displayName = `${p.name} ${sword.name}`;
    
    if (p.effect.type === 'durability') {
      if (p.id === 'chipped') {
        // 이가 빠진: 단검류는 내구도 1, 나머지는 내구도 2
        const isDagger = template.category === CATEGORY.DAGGER;
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
export function getRandomSword(_wave: number = 1): SwordCard {
  // 유니크 제외한 모든 무기 풀
  const pool = SWORD_ID_LIST.filter((id) => SWORDS[id]?.rarity !== RARITY.UNIQUE);
  const randomId = pool[Math.floor(Math.random() * pool.length)];
  
  // 20% 확률로 '이가 빠진' 인첸트
  const prefix = Math.random() < 0.25 ? 'chipped' : undefined;
  
  return createSwordCard(randomId, prefix)!;
}

// 상점용 깨끗한 검 생성 (인첸트 없음)
export function getCleanSword(_wave: number = 1): SwordCard {
  // 유니크 제외한 모든 무기 풀
  const pool = SWORD_ID_LIST.filter((id) => SWORDS[id]?.rarity !== RARITY.UNIQUE);
  const randomId = pool[Math.floor(Math.random() * pool.length)];
  
  // 인첸트 없이 깨끗한 상태로 생성
  return createSwordCard(randomId)!;
}

// 유니크 무기 "잔광" 생성
export function createJangwang(): SwordCard {
  return createSwordCard(SWORD_ID.JANGWANG)!;
}

// 녹슨 검 생성 (일회용)
export function createRustySword(swordId: SwordId): SwordCard | null {
  return createSwordCard(swordId, 'rusty');
}

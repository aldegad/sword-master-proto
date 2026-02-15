import type { SkillCard } from '../types';
import { SKILL_ID_LIST, type SkillId, type SwordId } from '../constants/gameIds';
import { GAME_START_CONFIG } from '../constants/gameStart';

// 스킬 데이터베이스 (마나 0~3 범위로 밸런스 조정)
// attackCount: 무기 타수에 곱해지는 배율 (1 = 무기 타수 그대로, 2 = 2배)
// reach: 'single'이면 무기 범위 사용, 그 외(double/triple/all)는 스킬 자체 범위
// durabilityCost: 0 (실제 소모는 타수만큼 자동 계산)
export const SKILLS: Record<string, SkillCard> = {
  // ===== 기본 공격기 =====
  slash: {
    id: 'slash',
    name: '베기',
    emoji: '⚔️',
    type: 'attack',
    attackMultiplier: 1.5,
    attackCount: 1,  // 무기 타수 x1
    reach: 'single', // 무기 범위 사용
    defenseBonus: 0,
    durabilityCost: 0,  // 타수만큼 자동 소모
    manaCost: 1,
    description: '무기 범위에 기본 베기. 공격 배율 x1.5.',
  },
  thrust: {
    id: 'thrust',
    name: '찌르기',
    emoji: '🗡️',
    type: 'attack',
    attackMultiplier: 1.5,
    attackCount: 1,  // 무기 타수 x1
    reach: 'single', // 무기 범위 사용
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 1,
    description: '무기 범위 찌르기. 공격 배율 x1.5, 관통 +3(적 방어 3 무시).',
    effect: { type: 'pierce', value: 3 },
  },

  // ===== 연속기 (타수 배율 증가) =====
  consecutiveSlash: {
    id: 'consecutiveSlash',
    name: '연속베기',
    emoji: '⚡',
    type: 'attack',
    attackMultiplier: 0.7,
    attackCount: 2,  // 무기 타수 x2
    reach: 'single', // 무기 범위 사용
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 1,
    description: '무기 범위 연속 베기. 공격 배율 x0.7, 무기 타수 x2.',
  },
  flurry: {
    id: 'flurry',
    name: '유수격',
    emoji: '🌪️',
    type: 'attack',
    attackMultiplier: 0.5,
    attackCount: 5,  // 무기 타수 x5
    reach: 'single', // 무기 범위 사용
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 2,
    description: '무기 범위 5연속 베기. 공격 배율 x0.5, 무기 타수 x5.',
  },

  // ===== 범위 공격기 (자체 범위 사용) =====
  sweepingBlow: {
    id: 'sweepingBlow',
    name: '횡베기',
    emoji: '↔️',
    type: 'attack',
    attackMultiplier: 1,
    attackCount: 1,
    reach: 'swordDouble',  // 무기 범위의 2배
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 1,
    description: '무기 범위를 2배로 확장해 공격.',
  },
  whirlwind: {
    id: 'whirlwind',
    name: '회전참',
    emoji: '🌀',
    type: 'attack',
    attackMultiplier: 1,
    attackCount: 2,
    reach: 'all',  // 자체 범위: 전체
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 3,
    description: '전체 범위를 2연타로 공격.',
  },
  crescent: {
    id: 'crescent',
    name: '월아참',
    emoji: '🌙',
    type: 'attack',
    attackMultiplier: 1.2,
    attackCount: 1,
    reach: 'swordDouble',  // 무기 범위 x2
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 2,
    description: '무기 범위를 2배로 확장해 공격 배율 x1.2 일격.',
  },

  // ===== 강타기 (카운트 기반) =====
  powerStrike: {
    id: 'powerStrike',
    name: '강타',
    emoji: '💥',
    type: 'attack',
    attackMultiplier: 3.0,
    attackCount: 1,
    reach: 'single', // 무기 범위 사용
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 2,
    description: '즉시 타격하지 않고 1대기 후 발동. 공격 배율 x3.0.',
    effect: { type: 'chargeAttack', value: 3.0, duration: 1 },
  },
  heavenSplitter: {
    id: 'heavenSplitter',
    name: '천지개벽',
    emoji: '⚡',
    type: 'attack',
    attackMultiplier: 3.5,
    attackCount: 1,
    reach: 'single', // 무기 범위 사용
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 3,
    description: '공격 배율 x3.5 일격 후 1턴 기절 부여.',
    effect: { type: 'stun', value: 1, duration: 1 },
  },

  // ===== 특수 공격기 =====
  bleedingEdge: {
    id: 'bleedingEdge',
    name: '출혈검',
    emoji: '🩸',
    type: 'attack',
    attackMultiplier: 0.8,
    attackCount: 1,
    reach: 'single', // 무기 범위 사용
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 1,
    description: '공격 후 출혈 15 피해를 3턴 부여.',
    effect: { type: 'bleed', value: 15, duration: 3 },
  },
  vampireSlash: {
    id: 'vampireSlash',
    name: '흡혈참',
    emoji: '🧛',
    type: 'attack',
    attackMultiplier: 0.9,
    attackCount: 1,
    reach: 'single', // 무기 범위 사용
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 2,
    description: '가한 피해의 30%를 체력으로 회복.',
    effect: { type: 'lifesteal', value: 0.3 },
  },
  armorBreaker: {
    id: 'armorBreaker',
    name: '파갑술',
    emoji: '🔨',
    type: 'attack',
    attackMultiplier: 1.5,
    attackCount: 1,
    reach: 'single', // 무기 범위 사용
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 1,
    description: '방어를 완전히 무시하고 공격. 적 방어력 영구 -5.',
    effect: { type: 'armorBreaker', value: 5 },
  },
  
  // ===== 복합 스킬 (공격+드로우) =====
  slashAndDraw: {
    id: 'slashAndDraw',
    name: '베며 가다듬기',
    emoji: '🎴',
    type: 'attack',
    attackMultiplier: 0.7,
    attackCount: 1,
    reach: 'single', // 무기 범위 사용
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 1,
    description: '공격 후 카드 1장 드로우.',
    effect: { type: 'draw', value: 1 },
  },

  // ===== 신속 공격 (적 대기턴 감소 없음) =====
  quickSlash: {
    id: 'quickSlash',
    name: '빈틈!',
    emoji: '💨',
    type: 'attack',
    attackMultiplier: 1,
    attackCount: 1,
    reach: 'single', // 무기 범위 사용
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 1,
    description: '신속. 공격 배율 x1.0, 무기 타수 x1. 방어를 무시하며 단검 장착 시 크리티컬 x2.0.',
    isSwift: true,
    isPiercing: true,           // 방어 무시
    criticalCondition: 'dagger', // 단검 크리티컬
  },
  flashStrike: {
    id: 'flashStrike',
    name: '섬광참',
    emoji: '⚡',
    type: 'attack',
    attackMultiplier: 0.8,
    attackCount: 2,  // 무기 타수 x2
    reach: 'single', // 무기 범위 사용
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 1,
    description: '신속 2연타. 공격 배율 x0.8, 적 대기턴을 감소시키지 않음.',
    isSwift: true,
  },
  followUpSlash: {
    id: 'followUpSlash',
    name: '이어베기',
    emoji: '🔗',
    type: 'attack',
    attackMultiplier: 1.2,
    attackCount: 1,
    reach: 'single', // 무기 범위 사용
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 0,
    description: '신속 연계기. 이번 턴에 공격/무기 사용 후에만 사용 가능, 공격 배율 x1.2.',
    isSwift: true,
    effect: { type: 'followUp', value: 1.2 },  // followUp: 공격 후에만 사용 가능
  },
  
  // ===== 도발 스킬 =====
  taunt: {
    id: 'taunt',
    name: '조롱',
    emoji: '😤',
    type: 'buff',
    attackMultiplier: 0,
    attackCount: 0,
    reach: 'single',
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 1,
    description: '적 전체 대기턴 -1, 카드 1장 드로우.',
    effect: { type: 'taunt', value: 1 },
  },

  // ===== 방어기 (카운트 기반) =====
  parry: {
    id: 'parry',
    name: '검 얽기',
    emoji: '🛡️',
    type: 'defense',
    attackMultiplier: 1.0,  // 반격 배수
    attackCount: 0,
    reach: 'single',
    defenseBonus: 1,
    durabilityCost: 1,
    manaCost: 1,
    description: '신속 카운트 방어. 방어율 x5, 성공 시 반격 x1.0 (1회 방어 후 소멸).',
    isSwift: true,
    effect: { 
      type: 'countDefense', 
      value: 5,              // 방어율 배수
      duration: 2,           // 대기 시간
      counterAttack: true,   // 반격 O
      counterMultiplier: 1.0,// 반격 배수
      consumeOnSuccess: true,// 방어 성공 시 소멸
    },
  },
  ironWall: {
    id: 'ironWall',
    name: '쳐내기',
    emoji: '🏰',
    type: 'defense',
    attackMultiplier: 0,
    attackCount: 0,
    reach: 'single',
    defenseBonus: 1,
    durabilityCost: 0,
    manaCost: 1,
    description: '카운트 방어. 방어율 x10, 반격 없음 (1회 방어 후 소멸).',
    effect: { 
      type: 'countDefense', 
      value: 10,             // 방어율 배수
      duration: 3,           // 대기 시간
      counterAttack: false,  // 반격 X
      consumeOnSuccess: true,// 방어 성공 시 소멸
    },
  },
  flowRead: {
    id: 'flowRead',
    name: '흐름을 읽다',
    emoji: '👁️',
    type: 'defense',
    attackMultiplier: 2.0,  // 최대 반격 배수
    attackCount: 0,
    reach: 'single',
    defenseBonus: 1,
    durabilityCost: 1,
    manaCost: 3,
    description: '카운트 방어 5단계. 대기할수록 방어 x1→2→4→6→8, 반격 x0.25→0.5→1.0→1.5→2.0.',
    effect: { 
      type: 'flowRead', 
      value: 8,              // 최대 방어율 배수
      duration: 5,           // 대기 시간
      counterAttack: true,   // 반격 O
      defenseScaling: [1, 2, 4, 6, 8],       // 대기별 방어 배율 (1~5)
      counterScaling: [0.25, 0.5, 1.0, 1.5, 2.0], // 대기별 반격 배율 (1~5)
      consumeOnSuccess: true,// 방어 성공 시 소멸
    },
  },
  // ===== 버프기 (신속 - 적 대기턴 감소 없음) =====
  focus: {
    id: 'focus',
    name: '집중',
    emoji: '🎯',
    type: 'buff',
    attackMultiplier: 0,
    attackCount: 0,
    reach: 'single',
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 1,
    description: '신속. 다음 공격 최종 피해 배율 +50%.',
    isSwift: true,
    effect: { type: 'focus', value: 0.5, duration: 1 },
  },
  sharpen: {
    id: 'sharpen',
    name: '연마',
    emoji: '✨',
    type: 'buff',
    attackMultiplier: 0,
    attackCount: 0,
    reach: 'single',
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 1,
    description: '신속 1회용. 3턴간 공격력 +5, 덱의 모든 검 내구도 +1.',
    isSwift: true,
    isConsumable: true,
    effect: { type: 'sharpen', value: 5, duration: 3 },
  },
  
  // ===== 특수 스킬 (신속) =====
  bladeDance: {
    id: 'bladeDance',
    name: '검의 춤',
    emoji: '💃',
    type: 'special',
    attackMultiplier: 0,
    attackCount: 0,
    reach: 'single',
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 3,
    description: '신속. 카드 3장 드로우 후, 뽑은 카드를 즉시 자동 발동.',
    effect: { type: 'bladeDance', value: 3 },
    isSwift: true,
  },
  sheathe: {
    id: 'sheathe',
    name: '납도',
    emoji: '⚔️',
    type: 'buff',
    attackMultiplier: 0,
    attackCount: 0,
    reach: 'single',
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 0,
    description: '신속. 현재 장착 무기를 손패로 되돌리고, 발도 스킬을 즉시 재시전.',
    effect: { type: 'sheathe', value: 1 },
    isSwift: true,
  },
  
  // ===== 드로우/서치 스킬 (신속) =====
  setupBoard: {
    id: 'setupBoard',
    name: '판 짜기',
    emoji: '🎴',
    type: 'draw',
    attackMultiplier: 0,
    attackCount: 0,
    reach: 'single',
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 1,
    description: '덱에서 카드 2장 드로우.',
    effect: { type: 'draw', value: 2 },
  },
  bladeSeeker: {
    id: 'bladeSeeker',
    name: '검 잡기',
    emoji: '🔍',
    type: 'draw',
    attackMultiplier: 0,
    attackCount: 0,
    reach: 'single',
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 2,
    description: '신속. 덱 상단에서 첫 검은 즉시 장착+발도, 다음 검은 손패로.',
    effect: { type: 'bladeGrab', value: 1 },
    isSwift: true,
  },
  soulRecall: {
    id: 'soulRecall',
    name: '되짚기',
    emoji: '↩️',
    type: 'buff',
    attackMultiplier: 0,
    attackCount: 0,
    reach: 'single',
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 1,
    description: '신속. 무덤(버린 더미) 상단 카드 2장을 손패로 회수.',
    effect: { type: 'graveDrawTop', value: 2 },
    isSwift: true,
  },
  ancestorBlade: {
    id: 'ancestorBlade',
    name: '검 차올리기',
    emoji: '⚰️',
    type: 'draw',
    attackMultiplier: 0,
    attackCount: 0,
    reach: 'single',
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 1,
    description: '신속. 무덤의 검 후보 중 하나를 선택해 즉시 장착 후 발도.',
    effect: { type: 'graveEquip', value: 1 },
    isSwift: true,
  },

  // ===== 특수기 (강한 스킬: 자체 범위 사용) =====
  sweepSlash: {
    id: 'sweepSlash',
    name: '쓸어내기',
    emoji: '🌊',
    type: 'special',
    attackMultiplier: 2.0,
    attackCount: 1,
    reach: 'swordDouble',  // 무기 범위 x2
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 2,
    description: '무기 범위 x2로 공격 배율 x2.0 일격.',
    effect: { type: 'sweep', value: 3 },
  },
  bladeStorm: {
    id: 'bladeStorm',
    name: '난무',
    emoji: '🌪️',
    type: 'special',
    attackMultiplier: 0.8,
    attackCount: 3,  // 무기 타수 x3
    reach: 'all',  // 자체 범위: 전체
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 3,
    description: '전체 범위 난무. 공격 배율 x0.8, 무기 타수 x3.',
  },
  finalJudgment: {
    id: 'finalJudgment',
    name: '파단',
    emoji: '💀',
    type: 'special',
    attackMultiplier: 5.0,
    attackCount: 1,
    reach: 'single', // 무기 범위 사용
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 4,
    description: '초고배율 일격(x5.0) 후 현재 무기 즉시 파괴.',
    effect: { type: 'destroyWeapon', value: 0 },
  },
};

// 스킬 생성 헬퍼 함수
export function createSkillCard(skillId: SkillId): SkillCard | null {
  const template = SKILLS[skillId];
  if (!template) return null;
  
  return { ...template };
}

// 랜덤 스킬 생성
export function getRandomSkill(): SkillCard {
  const randomId = SKILL_ID_LIST[Math.floor(Math.random() * SKILL_ID_LIST.length)];
  return createSkillCard(randomId)!;
}

// 타입별 스킬 필터
export function getSkillsByType(type: SkillCard['type']): SkillId[] {
  return SKILL_ID_LIST.filter((id) => SKILLS[id]?.type === type);
}

// 기본 덱 구성 (동양검만 사용)
export function getStarterDeck(): { swords: SwordId[]; skills: SkillId[] } {
  return {
    // 설정값을 복사 반환하여 런타임 변조로부터 원본 보호
    swords: [...GAME_START_CONFIG.starterDeck.swords],
    skills: [...GAME_START_CONFIG.starterDeck.skills],
  };
}

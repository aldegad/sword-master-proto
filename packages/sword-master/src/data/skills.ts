import type { SkillCard } from '../types';

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
    attackMultiplier: 1.0,
    attackCount: 1,  // 무기 타수 x1
    reach: 'single', // 무기 범위 사용
    defenseBonus: 0,
    durabilityCost: 0,  // 타수만큼 자동 소모
    manaCost: 1,
    description: '기본 베기 공격. 무기 타수/범위 사용.',
  },
  thrust: {
    id: 'thrust',
    name: '찌르기',
    emoji: '🗡️',
    type: 'attack',
    attackMultiplier: 1.2,
    attackCount: 1,  // 무기 타수 x1
    reach: 'single', // 무기 범위 사용
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 1,
    description: '관통력 있는 찌르기. 적 방어력 -3.',
    effect: { type: 'pierce', value: 3 },
  },

  // ===== 연속기 (타수 배율 증가) =====
  doubleSlash: {
    id: 'doubleSlash',
    name: '이연격',
    emoji: '⚡',
    type: 'attack',
    attackMultiplier: 0.7,
    attackCount: 2,  // 무기 타수 x2
    reach: 'single', // 무기 범위 사용
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 1,
    description: '두 번 베기. 무기 타수x2!',
  },
  tripleThrust: {
    id: 'tripleThrust',
    name: '삼연자',
    emoji: '💨',
    type: 'attack',
    attackMultiplier: 0.5,
    attackCount: 3,  // 무기 타수 x3
    reach: 'single', // 무기 범위 사용
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 1,
    description: '세 번 연속 찌르기. 무기 타수x3!',
  },
  flurry: {
    id: 'flurry',
    name: '난무',
    emoji: '🌪️',
    type: 'attack',
    attackMultiplier: 0.3,
    attackCount: 5,  // 무기 타수 x5
    reach: 'single', // 무기 범위 사용
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 2,
    description: '정신없이 휘두르기. 무기 타수x5!',
  },

  // ===== 범위 공격기 (자체 범위 사용) =====
  sweepingBlow: {
    id: 'sweepingBlow',
    name: '횡베기',
    emoji: '↔️',
    type: 'attack',
    attackMultiplier: 0.8,
    attackCount: 1,
    reach: 'swordDouble',  // 무기 범위의 2배
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 1,
    description: '옆으로 크게 휘둘러 무기 범위x2 공격.',
  },
  whirlwind: {
    id: 'whirlwind',
    name: '회전참',
    emoji: '🌀',
    type: 'attack',
    attackMultiplier: 0.6,
    attackCount: 1,
    reach: 'all',  // 자체 범위: 전체
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 3,
    description: '회전하며 모든 적을 공격!',
  },
  crescent: {
    id: 'crescent',
    name: '월아참',
    emoji: '🌙',
    type: 'attack',
    attackMultiplier: 1.0,
    attackCount: 1,
    reach: 'triple',  // 자체 범위: 3적
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 2,
    description: '초승달 궤적으로 3적 베기.',
  },

  // ===== 강타기 (카운트 기반) =====
  powerStrike: {
    id: 'powerStrike',
    name: '강타',
    emoji: '💥',
    type: 'attack',
    attackMultiplier: 2.0,
    attackCount: 1,
    reach: 'single', // 무기 범위 사용
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 2,
    description: '1대기 후 강력한 일격! x2.0 데미지.',
    effect: { type: 'chargeAttack', value: 2.0, duration: 1 },
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
    description: '궁극의 일격! x3.5 + 스턴.',
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
    description: '깊은 상처로 출혈 유발. 3턴간 3피해.',
    effect: { type: 'bleed', value: 3, duration: 3 },
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
    description: '피해의 30%를 HP로 흡수!',
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
    description: '방어 완전 무시! x1.5. 적 방어력 -5.',
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
    description: '적을 베면서 카드 1장 드로우!',
    effect: { type: 'draw', value: 1 },
  },

  // ===== 신속 공격 (적 대기턴 감소 없음) =====
  quickSlash: {
    id: 'quickSlash',
    name: '빈틈!',
    emoji: '💨',
    type: 'attack',
    attackMultiplier: 0.6,
    attackCount: 1,
    reach: 'single', // 무기 범위 사용
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 1,
    description: '신속 공격! 적 대기턴을 줄이지 않음.',
    isSwift: true,
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
    description: '신속 2연타! 적 대기턴을 줄이지 않음.',
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
    description: '신속! 이번 턴에 공격/무기 사용 후에만 낼 수 있음.',
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
    description: '적을 도발! 적 대기턴 -1, 카드 1장 드로우.',
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
    description: '2대기 동안 방어율 x5. 방어 성공 시 반격!',
    effect: { 
      type: 'countDefense', 
      value: 5,              // 방어율 배수
      duration: 2,           // 대기 시간 (1 → 2)
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
    description: '3대기 동안 방어율 x10. 1회 방어 후 소멸.',
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
    description: '5대기 동안 흐름을 읽는다. 대기가 길수록 방어율/반격력 증가!',
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
    manaCost: 0,
    description: '다음 공격의 배율 +50%!',
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
    description: '3턴간 공격력+5. 덱의 모든 검 내구도 1회복. (1회용)',
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
    description: '카드 3장 드로우! 드로우한 모든 카드 즉시 발동!',
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
    description: '현재 무기의 발도 스킬 재시전!',
    effect: { type: 'sheathe', value: 1 },
    isSwift: true,
  },
  
  // ===== 드로우/서치 스킬 (신속) =====
  drawSword: {
    id: 'drawSword',
    name: '검 꺼내기',
    emoji: '🎴',
    type: 'buff',
    attackMultiplier: 0,
    attackCount: 0,
    reach: 'single',
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 1,
    description: '덱 상위에서 검 3자루를 손패로 가져온다.',
    effect: { type: 'drawSwords', value: 3 },
    isSwift: true,
  },
  bladeSeeker: {
    id: 'bladeSeeker',
    name: '검 잡기',
    emoji: '🔍',
    type: 'buff',
    attackMultiplier: 0,
    attackCount: 0,
    reach: 'single',
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 2,
    description: '덱 최상위 검 즉시 장착+발도! 그 다음 검은 손패로.',
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
    description: '무덤 상위 카드 2장을 손패로 가져온다.',
    effect: { type: 'graveDrawTop', value: 2 },
    isSwift: true,
  },
  ancestorBlade: {
    id: 'ancestorBlade',
    name: '검 차올리기',
    emoji: '⚰️',
    type: 'buff',
    attackMultiplier: 0,
    attackCount: 0,
    reach: 'single',
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 1,
    description: '무덤에 있는 검 중 랜덤 장착 및 발도스킬 시전.',
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
    reach: 'triple',  // 자체 범위: 3적
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 2,
    description: '검을 크게 휘둘러 3적을 x2.0으로 벤다.',
    effect: { type: 'sweep', value: 3 },
  },
  bladeStorm: {
    id: 'bladeStorm',
    name: '검기폭풍',
    emoji: '🌪️',
    type: 'special',
    attackMultiplier: 0.8,
    attackCount: 3,  // 무기 타수 x3
    reach: 'all',  // 자체 범위: 전체
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 3,
    description: '검기 방출! 전체 x무기타수x3!',
  },
  finalJudgment: {
    id: 'finalJudgment',
    name: '최후심판',
    emoji: '💀',
    type: 'special',
    attackMultiplier: 5.0,
    attackCount: 1,
    reach: 'single', // 무기 범위 사용
    defenseBonus: 0,
    durabilityCost: 0,
    manaCost: 3,
    description: '궁극기! x5.0! 적 방어력 -5.',
    effect: { type: 'pierce', value: 5 },
  },
};

// 스킬 생성 헬퍼 함수
export function createSkillCard(skillId: string): SkillCard | null {
  const template = SKILLS[skillId];
  if (!template) return null;
  
  return { ...template };
}

// 랜덤 스킬 생성
export function getRandomSkill(): SkillCard {
  const skillIds = Object.keys(SKILLS);
  const randomId = skillIds[Math.floor(Math.random() * skillIds.length)];
  return createSkillCard(randomId)!;
}

// 타입별 스킬 필터
export function getSkillsByType(type: SkillCard['type']): string[] {
  return Object.entries(SKILLS)
    .filter(([_, skill]) => skill.type === type)
    .map(([id]) => id);
}

// 기본 덱 구성 (동양검만 사용)
export function getStarterDeck(): { swords: string[]; skills: string[] } {
  return {
    swords: [
      'katana', 'samjeongdo', 'wakizashi',  // 기본 3종 (동양검)
      'yedogeom', 'bongukgeom',  // 추가 2종 (동양검)
      'haegapdo', 'katana',  // 칼 2개 추가
    ],
    skills: [
      'slash', 'slash',
      'thrust',              // thrust 하나 줄임
      'doubleSlash',         // doubleSlash 하나 줄임
      'parry', 'parry',
      'quickSlash',
      'focus',
      'powerStrike',
      'sweepingBlow',
      'slashAndDraw',        // 베며 가다듬기
      'drawSword', 'drawSword',
    ],
  };
}

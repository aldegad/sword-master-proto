import type { Enemy, EnemyAction } from '../types';

// 적 행동 템플릿
interface EnemyActionTemplate {
  id: string;
  name: string;
  type: 'attack' | 'charge' | 'defend' | 'special' | 'buff' | 'taunt';
  damage: number;
  delay: number;
  description: string;
  defenseIncrease?: number;  // 방어력 증가 (defend/taunt 타입에서 사용)
  hitCount?: number;         // 다중 타격 (각 타격마다 개별 방어 판정)
  effect?: {
    type: 'bleed' | 'stun' | 'debuff' | 'heal' | 'taunt' | 'summon' | 'poison';
    value: number;
    duration?: number;
  };
}

// 적 템플릿 (attack 스탯 제거 - 스킬에 데미지가 직접 명시됨)
interface EnemyTemplate {
  name: string;
  emoji: string;
  hp: number;
  defense: number;
  actions: EnemyActionTemplate[];
  actionsPerTurn?: { min: number; max: number };  // 턴당 스킬 사용 수 (미지정 시 전체 스킬 사용)
  silverDrop?: { min: number; max: number };  // 은전 드롭량
  startWithTaunt?: boolean;  // 전투 시작 시 도발 자동 사용
}

// ===== 1~10 스테이지 적 (산적/도적 테마) =====
export const ENEMIES_TIER1: Record<string, EnemyTemplate> = {
  // 일반 적
  bandit: {
    name: '산적',
    emoji: '🥷',
    hp: 32,
    defense: 1,
    actions: [
      { id: 'slash', name: '베기', type: 'attack', damage: 9, delay: 3, description: '칼을 휘두른다' },
    ],
    silverDrop: { min: 5, max: 10 },
  },
  archer: {
    name: '산적 궁수',
    emoji: '🏹',
    hp: 26,
    defense: 0,
    actions: [
      { id: 'arrow', name: '사격', type: 'attack', damage: 10, delay: 2, description: '화살을 쏜다' },
      { id: 'powerShot', name: '강사', type: 'attack', damage: 16, delay: 4, description: '집중 조준!' },
    ],
    actionsPerTurn: { min: 1, max: 1 },
    silverDrop: { min: 5, max: 10 },
  },
  swordsman: {
    name: '산채식객',
    emoji: '⚔️',
    hp: 45,
    defense: 3,
    actions: [
      { id: 'quickSlash', name: '속검', type: 'attack', damage: 10, delay: 2, description: '빠르게 벤다' },
      { id: 'powerSlash', name: '강참', type: 'attack', damage: 18, delay: 4, description: '힘을 모아 벤다' },
    ],
    actionsPerTurn: { min: 1, max: 2 },
    silverDrop: { min: 8, max: 15 },
  },
  shieldman: {
    name: '산적 방패꾼',
    emoji: '🛡️',
    hp: 30,
    defense: 8,
    actions: [
      { id: 'taunt', name: '도발', type: 'taunt', damage: 0, delay: 1, description: '나를 노려라!', defenseIncrease: 1, effect: { type: 'taunt', value: 1, duration: 3 } },
      { id: 'guard', name: '방어', type: 'defend', damage: 0, delay: 2, description: '방패를 세운다' },
      { id: 'bash', name: '방패치기', type: 'attack', damage: 12, delay: 3, description: '방패로 친다' },
    ],
    actionsPerTurn: { min: 1, max: 1 },
    silverDrop: { min: 8, max: 15 },
    startWithTaunt: true,
  },
  // 6파부터 등장, 10스테이지 이후에도 계속 등장
  imperialSwordsman: {
    name: '관검객',
    emoji: '🎖️',
    hp: 55,
    defense: 4,
    actions: [
      { id: 'formalSlash', name: '관검', type: 'attack', damage: 14, delay: 2, description: '정석대로 벤다' },
      { id: 'piercingStrike', name: '자상', type: 'attack', damage: 20, delay: 4, description: '급소를 찌른다' },
      { id: 'guardStance', name: '수비', type: 'defend', damage: 0, delay: 3, description: '수비 자세', defenseIncrease: 3 },
    ],
    actionsPerTurn: { min: 1, max: 2 },
    silverDrop: { min: 12, max: 20 },
  },
};

// ===== 11~20 스테이지 적 (무사/암살자 테마) - 1.5배 강화 =====
export const ENEMIES_TIER2: Record<string, EnemyTemplate> = {
  // 일반 적 (1.5배 강화)
  ronin: {
    name: '낭인',
    emoji: '🗡️',
    hp: 60,
    defense: 5,
    actions: [
      { id: 'iai', name: '발도', type: 'attack', damage: 22, delay: 3, description: '발도술!' },
      { id: 'combo', name: '연참', type: 'attack', damage: 12, delay: 2, description: '연속 베기' },
      { id: 'combo2', name: '연참', type: 'attack', damage: 12, delay: 2, description: '연속 베기' },
    ],
    silverDrop: { min: 15, max: 25 },
  },
  knight: {
    name: '파견 기사',
    emoji: '🛡️',
    hp: 80,
    defense: 8,
    actions: [
      { id: 'shieldBash', name: '방패', type: 'defend', damage: 5, delay: 2, description: '방패를 올린다' },
      { id: 'slash', name: '검격', type: 'attack', damage: 15, delay: 3, description: '검을 내려친다' },
      { id: 'charge', name: '돌진', type: 'attack', damage: 25, delay: 5, description: '돌진 준비!' },
    ],
    silverDrop: { min: 15, max: 25 },
  },
  assassin: {
    name: '자객',
    emoji: '🗡️',
    hp: 35,
    defense: 1,
    actions: [
      { id: 'ambush', name: '암습', type: 'attack', damage: 22, delay: 2, description: '암습!' },
      { id: 'vital', name: '급소', type: 'special', damage: 30, delay: 4, description: '급소 노림!', effect: { type: 'bleed', value: 5, duration: 2 } },
    ],
    silverDrop: { min: 15, max: 25 },
  },
  shaman: {
    name: '주술사',
    emoji: '🧙',
    hp: 45,
    defense: 3,
    actions: [
      { id: 'curse', name: '저주', type: 'special', damage: 12, delay: 3, description: '저주를 건다', effect: { type: 'debuff', value: 3, duration: 2 } },
      { id: 'heal', name: '회복', type: 'buff', damage: 0, delay: 4, description: '아군을 치유', effect: { type: 'heal', value: 20 } },
      { id: 'bolt', name: '마탄', type: 'attack', damage: 15, delay: 2, description: '마력탄 발사' },
    ],
    silverDrop: { min: 15, max: 25 },
  },
  samurai: {
    name: '무사',
    emoji: '⚔️',
    hp: 70,
    defense: 6,
    actions: [
      { id: 'katanaSlash', name: '일섬', type: 'attack', damage: 20, delay: 2, description: '빠른 일격' },
      { id: 'dualStrike', name: '쌍검', type: 'attack', damage: 16, delay: 2, description: '쌍검으로 벤다' },
      { id: 'counter', name: '반격', type: 'defend', damage: 0, delay: 3, description: '반격 자세' },
    ],
    actionsPerTurn: { min: 1, max: 2 },
    silverDrop: { min: 20, max: 30 },
  },
  spearShield: {
    name: '창방패무사',
    emoji: '🔱',
    hp: 45,
    defense: 7,
    actions: [
      { id: 'taunt', name: '진지도발', type: 'taunt', damage: 0, delay: 1, description: '나를 상대하라!', defenseIncrease: 2, effect: { type: 'taunt', value: 1, duration: 3 } },
      { id: 'spearGuard', name: '창방어', type: 'defend', damage: 0, delay: 2, description: '창을 세워 방어' },
      { id: 'spearThrust', name: '관통찌르기', type: 'attack', damage: 18, delay: 3, description: '창으로 깊이 찌른다' },
      { id: 'sweepAttack', name: '창휩쓸기', type: 'attack', damage: 15, delay: 4, description: '창을 크게 휘두른다' },
    ],
    actionsPerTurn: { min: 1, max: 2 },
    silverDrop: { min: 15, max: 25 },
    startWithTaunt: true,
  },
};

// ===== 중간 보스 (5, 15 스테이지) =====
export const MID_BOSSES: Record<string, EnemyTemplate> = {
  swordMaster: {
    name: '검귀',
    emoji: '👹',
    hp: 200,
    defense: 6,
    actions: [
      { id: 'windSlash', name: '검풍', type: 'attack', damage: 20, delay: 2, description: '검풍!' },
      { id: 'combo', name: '연환삼격', type: 'attack', damage: 14, delay: 3, description: '3연속 공격! (각 타격마다 방어 가능)', hitCount: 3 },
      { id: 'ultimate', name: '필살', type: 'special', damage: 40, delay: 6, description: '필살기...!', effect: { type: 'stun', value: 1 } },
    ],
    actionsPerTurn: { min: 2, max: 3 },
    silverDrop: { min: 50, max: 80 },
  },
  banditLeader: {
    name: '산채두목',
    emoji: '💀',
    hp: 120,
    defense: 5,
    actions: [
      { id: 'heavyBlow', name: '강타', type: 'attack', damage: 25, delay: 3, description: '무거운 일격!' },
      { id: 'callMinions', name: '호출', type: 'special', damage: 0, delay: 2, description: '부하를 부른다!', effect: { type: 'summon', value: 1 } },
      { id: 'poisonBlade', name: '독도', type: 'special', damage: 12, delay: 2, description: '독 바른 칼로 비열하게 찌른다', effect: { type: 'poison', value: 8, duration: 3 } },
    ],
    actionsPerTurn: { min: 1, max: 2 },
    silverDrop: { min: 50, max: 80 },
  },
};

// ===== 강한 보스 (10, 20 스테이지) =====
export const STRONG_BOSSES: Record<string, EnemyTemplate> = {
  dragonWarrior: {
    name: '용전사',
    emoji: '🐉',
    hp: 200,
    defense: 10,
    actions: [
      { id: 'greatSlash', name: '대참', type: 'attack', damage: 25, delay: 3, description: '대검 휘두르기' },
      { id: 'guard', name: '철벽', type: 'defend', damage: 0, delay: 2, description: '철벽 방어' },
      { id: 'dragonBreath', name: '용염', type: 'special', damage: 35, delay: 5, description: '용의 숨결!', effect: { type: 'bleed', value: 8, duration: 3 } },
      { id: 'dragonStrike', name: '용격', type: 'attack', damage: 50, delay: 7, description: '용의 일격!' },
    ],
    actionsPerTurn: { min: 2, max: 3 },
    silverDrop: { min: 100, max: 150 },
  },
  toposa: {
    name: '토포사',
    emoji: '⚔️',
    hp: 220,
    defense: 8,
    actions: [
      { id: 'officialSlash', name: '관도', type: 'attack', damage: 22, delay: 2, description: '관군 검법으로 벤다' },
      { id: 'arrest', name: '포박', type: 'special', damage: 10, delay: 3, description: '포승줄을 던진다', effect: { type: 'stun', value: 1 } },
      { id: 'corruption', name: '뇌물', type: 'buff', damage: 0, delay: 4, description: '타락한 권력으로 부하를 부른다', effect: { type: 'summon', value: 1 } },
      { id: 'execution', name: '참수', type: 'attack', damage: 45, delay: 6, description: '도적 토벌의 이름으로 처형한다!' },
    ],
    actionsPerTurn: { min: 2, max: 3 },
    silverDrop: { min: 100, max: 150 },
  },
};

let enemyIdCounter = 0;

// 적 생성 함수
export function createEnemy(template: EnemyTemplate, x: number = 900, templateId: string = 'unknown'): Enemy {
  const actions: EnemyAction[] = template.actions.map(action => ({
    ...action,
    currentDelay: action.delay,
  }));

  const enemy: Enemy = {
    id: `enemy_${enemyIdCounter++}`,
    templateId,
    name: template.name,
    emoji: template.emoji,
    hp: template.hp,
    maxHp: template.hp,
    defense: template.defense,
    x,
    actions,
    actionQueue: [],  // EnemyManager에서 초기화됨
    currentActionIndex: 0,
    isStunned: 0,
    bleeds: [],  // 출혈 중첩 배열
    poisons: [],  // 독 중첩 배열
    actionsPerTurn: template.actionsPerTurn,  // 턴당 스킬 수 제한
    isTaunting: false,  // 도발 상태
    tauntDuration: 0,   // 도발 남은 턴
  };
  
  // startWithTaunt는 더 이상 즉시 도발 상태로 만들지 않음
  // 대신 resetEnemyActionQueue에서 도발 스킬을 먼저 사용하도록 처리
  // (유저에게 선제공격/대응 기회 제공)
  
  return enemy;
}

// 스테이지별 적 등장 풀
const STAGE_ENEMY_POOLS: Record<number, string[]> = {
  // 스테이지 1, 2: 산적, 궁수만
  1: ['bandit', 'archer'],
  2: ['bandit', 'archer'],
  // 스테이지 3: 산적 방패꾼 추가
  3: ['bandit', 'archer', 'shieldman'],
  // 스테이지 4: 산채식객 추가
  4: ['bandit', 'archer', 'shieldman', 'swordsman'],
  // 스테이지 6~9: 관검객 추가
  6: ['bandit', 'archer', 'shieldman', 'swordsman', 'imperialSwordsman'],
  7: ['bandit', 'archer', 'shieldman', 'swordsman', 'imperialSwordsman'],
  8: ['bandit', 'archer', 'shieldman', 'swordsman', 'imperialSwordsman'],
  9: ['bandit', 'archer', 'shieldman', 'swordsman', 'imperialSwordsman'],
  // 스테이지 11, 12: 자객, 무사, 창방패무사
  11: ['assassin', 'samurai', 'spearShield'],
  12: ['assassin', 'samurai', 'spearShield'],
  // 스테이지 13~19: 관검객도 등장 (10스테이지 이후에도 계속)
  13: ['assassin', 'samurai', 'spearShield', 'imperialSwordsman'],
  14: ['assassin', 'samurai', 'spearShield', 'imperialSwordsman'],
  16: ['assassin', 'samurai', 'spearShield', 'imperialSwordsman'],
  17: ['assassin', 'samurai', 'spearShield', 'imperialSwordsman'],
  18: ['assassin', 'samurai', 'spearShield', 'imperialSwordsman'],
  19: ['assassin', 'samurai', 'spearShield', 'imperialSwordsman'],
};

// 티어별 랜덤 적 생성 (wave 정보로 특정 스테이지 풀 사용)
function getRandomEnemyFromTier(tier: 1 | 2, wave?: number): Enemy {
  const pool = tier === 1 ? ENEMIES_TIER1 : ENEMIES_TIER2;
  
  // 특정 스테이지에서는 제한된 적만 등장
  let keys: string[];
  if (wave && STAGE_ENEMY_POOLS[wave]) {
    keys = STAGE_ENEMY_POOLS[wave];
  } else {
    keys = Object.keys(pool);
  }
  
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  
  // 해당 티어 풀에 없으면 티어1 풀에서 찾기 (관검객 등 티어 공유 적)
  let template = pool[randomKey];
  if (!template) {
    template = ENEMIES_TIER1[randomKey];
  }
  
  return createEnemy(template, 900, randomKey);
}

// 보스 여부 확인 (5의 배수)
export function isBossWave(wave: number): boolean {
  return wave > 0 && wave % 5 === 0;
}

// 강한 보스 여부 확인 (10의 배수)
export function isStrongBossWave(wave: number): boolean {
  return wave > 0 && wave % 10 === 0;
}

// 현재 티어 확인 (1~10: 티어1, 11~20: 티어2, ...)
export function getCurrentTier(wave: number): 1 | 2 {
  const tierCycle = Math.ceil(wave / 10);
  return tierCycle % 2 === 1 ? 1 : 2;
}

// 보스 생성 (특정 웨이브는 고정 보스)
function createBoss(wave: number): Enemy {
  let template: EnemyTemplate;
  let templateId: string;

  // 특정 웨이브 고정 보스
  if (wave === 5) {
    // 5웨이브: 산채두목 고정
    template = MID_BOSSES.banditLeader;
    templateId = 'banditLeader';
  } else if (wave === 10) {
    // 10웨이브: 토포사 고정
    template = STRONG_BOSSES.toposa;
    templateId = 'toposa';
  } else if (wave === 15) {
    // 15웨이브: 검귀 고정
    template = MID_BOSSES.swordMaster;
    templateId = 'swordMaster';
  } else if (wave === 20) {
    // 20웨이브: 용전사 고정
    template = STRONG_BOSSES.dragonWarrior;
    templateId = 'dragonWarrior';
  } else {
    // 그 외: 랜덤 보스
    const isStrong = isStrongBossWave(wave);
    const bossPool = isStrong ? STRONG_BOSSES : MID_BOSSES;
    const bossKeys = Object.keys(bossPool);
    templateId = bossKeys[Math.floor(Math.random() * bossKeys.length)];
    template = bossPool[templateId];
  }

  // 웨이브에 따라 보스 강화 (10웨이브마다 15% 씩 강화)
  const waveMultiplier = 1 + Math.floor(wave / 10) * 0.15;

  const scaledTemplate: EnemyTemplate = {
    ...template,
    hp: Math.floor(template.hp * waveMultiplier),
    defense: Math.floor(template.defense * waveMultiplier),
  };

  const enemy = createEnemy(scaledTemplate, 700, templateId);
  enemy.isBoss = true;
  enemy.actionTemplates = template.actions.map(action => ({
    ...action,
    currentDelay: action.delay,
  }));

  return enemy;
}

// 웨이브별 적 생성 (새로운 시스템)
export function createWaveEnemies(wave: number): Enemy[] {
  const enemies: Enemy[] = [];
  const tier = getCurrentTier(wave);
  
  // 보스 웨이브 (5, 10, 15, 20...)
  if (isBossWave(wave)) {
    const boss = createBoss(wave);
    enemies.push(boss);
    return enemies;
  }
  
  // 일반 웨이브 - 적 수 결정
  let minEnemies: number;
  let maxEnemies: number;
  
  const waveInTier = ((wave - 1) % 10) + 1;  // 1~10 범위로 정규화
  
  if (tier === 1) {
    // 티어 1 (1~10 스테이지)
    if (waveInTier <= 4) {
      // 1~4 웨이브: 2~3명
      minEnemies = 2;
      maxEnemies = 3;
    } else {
      // 6~9 웨이브: 2~3명
      minEnemies = 2;
      maxEnemies = 3;
    }
  } else {
    // 티어 2 (11~20 스테이지)
    if (waveInTier <= 4) {
      // 11~14 웨이브: 2~3명
      minEnemies = 2;
      maxEnemies = 3;
    } else {
      // 16~19 웨이브: 3~4명
      minEnemies = 3;
      maxEnemies = 4;
    }
  }
  
  const enemyCount = minEnemies + Math.floor(Math.random() * (maxEnemies - minEnemies + 1));
  
  for (let i = 0; i < enemyCount; i++) {
    const x = 500 + i * 150;
    const enemy = getRandomEnemyFromTier(tier, wave);
    enemy.x = x;
    enemies.push(enemy);
  }
  
  return enemies;
}

// 은전 드롭량 계산
export function calculateSilverDrop(enemy: Enemy): number {
  // 기본 드롭량 (HP 기반)
  let baseDrop = Math.floor(enemy.maxHp / 5);
  
  // 보스는 추가 드롭
  if (enemy.isBoss) {
    baseDrop *= 3;
  }
  
  // 약간의 랜덤 변동
  const variance = Math.floor(baseDrop * 0.3);
  return baseDrop + Math.floor(Math.random() * variance * 2) - variance;
}

// 레거시 함수 호환성 (구버전 코드 지원)
export function createRandomEnemy(difficulty: number, x: number = 900): Enemy {
  const tier = getCurrentTier(difficulty);
  const enemy = getRandomEnemyFromTier(tier);
  enemy.x = x;
  return enemy;
}

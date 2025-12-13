import type { Enemy, EnemyAction } from '../types';

// 적 행동 템플릿
interface EnemyActionTemplate {
  id: string;
  name: string;
  type: 'attack' | 'charge' | 'defend' | 'special' | 'buff';
  damage: number;
  delay: number;
  description: string;
  effect?: {
    type: 'bleed' | 'stun' | 'debuff' | 'heal';
    value: number;
    duration?: number;
  };
}

// 적 템플릿
interface EnemyTemplate {
  name: string;
  emoji: string;
  hp: number;
  attack: number;
  defense: number;
  actions: EnemyActionTemplate[];
  actionsPerTurn?: { min: number; max: number };  // 턴당 스킬 사용 수 (미지정 시 전체 스킬 사용)
}

export const ENEMIES: Record<string, EnemyTemplate> = {
  // ===== 일반 적 =====
  bandit: {
    name: '산적',
    emoji: '🥷',
    hp: 30,
    attack: 8,
    defense: 1,  // 2 → 1
    actions: [
      { id: 'slash', name: '베기', type: 'attack', damage: 8, delay: 3, description: '칼을 휘두른다' },
      { id: 'slash2', name: '베기', type: 'attack', damage: 8, delay: 3, description: '칼을 휘두른다' },
    ],
  },
  swordsman: {
    name: '검객',
    emoji: '⚔️',
    hp: 45,
    attack: 12,
    defense: 4,  // 5 → 4
    actions: [
      { id: 'quickSlash', name: '속검', type: 'attack', damage: 10, delay: 2, description: '빠르게 벤다' },
      { id: 'powerSlash', name: '강참', type: 'attack', damage: 18, delay: 4, description: '힘을 모아 벤다' },
    ],
    actionsPerTurn: { min: 1, max: 2 },  // 턴당 1~2개 스킬 랜덤 사용
  },
  archer: {
    name: '궁수',
    emoji: '🏹',
    hp: 25,
    attack: 10,
    defense: 0,  // 1 → 0
    actions: [
      { id: 'arrow', name: '사격', type: 'attack', damage: 10, delay: 2, description: '화살을 쏜다' },
      { id: 'powerShot', name: '강사', type: 'attack', damage: 16, delay: 4, description: '집중 조준!' },
    ],
  },
  spearman: {
    name: '창병',
    emoji: '🔱',
    hp: 40,
    attack: 14,
    defense: 7,  // 8 → 7
    actions: [
      { id: 'guard', name: '방어', type: 'defend', damage: 0, delay: 2, description: '창을 세운다' },
      { id: 'thrust', name: '찌르기', type: 'attack', damage: 14, delay: 3, description: '창으로 찌른다' },
      { id: 'sweep', name: '휩쓸기', type: 'attack', damage: 12, delay: 4, description: '창을 휘두른다' },
    ],
    actionsPerTurn: { min: 1, max: 1 },  // 턴당 1개 스킬만 사용
  },
  
  // ===== 강적 =====
  ronin: {
    name: '낭인',
    emoji: '🗡️',
    hp: 60,
    attack: 18,
    defense: 5,  // 6 → 5
    actions: [
      { id: 'iai', name: '발도', type: 'attack', damage: 22, delay: 3, description: '발도술!' },
      { id: 'combo', name: '연참', type: 'attack', damage: 12, delay: 2, description: '연속 베기' },
      { id: 'combo2', name: '연참', type: 'attack', damage: 12, delay: 2, description: '연속 베기' },
    ],
  },
  knight: {
    name: '기사',
    emoji: '🛡️',
    hp: 80,
    attack: 15,
    defense: 11,  // 12 → 11
    actions: [
      { id: 'shieldBash', name: '방패', type: 'defend', damage: 5, delay: 2, description: '방패를 올린다' },
      { id: 'slash', name: '검격', type: 'attack', damage: 15, delay: 3, description: '검을 내려친다' },
      { id: 'charge', name: '돌진', type: 'attack', damage: 25, delay: 5, description: '돌진 준비!' },
    ],
  },
  assassin: {
    name: '자객',
    emoji: '🗡️',
    hp: 35,
    attack: 22,
    defense: 1,  // 2 → 1
    actions: [
      { id: 'ambush', name: '암습', type: 'attack', damage: 22, delay: 2, description: '암습!' },
      { id: 'vital', name: '급소', type: 'special', damage: 30, delay: 4, description: '급소 노림!', effect: { type: 'bleed', value: 5, duration: 2 } },
    ],
  },
  shaman: {
    name: '주술사',
    emoji: '🧙',
    hp: 30,
    attack: 8,
    defense: 2,  // 3 → 2
    actions: [
      { id: 'curse', name: '저주', type: 'special', damage: 8, delay: 3, description: '저주를 건다', effect: { type: 'debuff', value: 3, duration: 2 } },
      { id: 'heal', name: '회복', type: 'buff', damage: 0, delay: 4, description: '아군을 치유', effect: { type: 'heal', value: 15 } },
      { id: 'bolt', name: '마탄', type: 'attack', damage: 12, delay: 2, description: '마력탄 발사' },
    ],
  },
  
  // ===== 보스 =====
  swordMaster: {
    name: '검귀',
    emoji: '👹',
    hp: 150,
    attack: 25,
    defense: 9,  // 10 → 9
    actions: [
      { id: 'windSlash', name: '검풍', type: 'attack', damage: 20, delay: 2, description: '검풍!' },
      { id: 'combo1', name: '연환', type: 'attack', damage: 16, delay: 2, description: '연환격 1타' },
      { id: 'combo2', name: '연환', type: 'attack', damage: 16, delay: 2, description: '연환격 2타' },
      { id: 'ultimate', name: '필살', type: 'special', damage: 40, delay: 6, description: '필살기...!', effect: { type: 'stun', value: 1 } },
    ],
  },
  dragonWarrior: {
    name: '용전사',
    emoji: '🐉',
    hp: 200,
    attack: 30,
    defense: 14,  // 15 → 14
    actions: [
      { id: 'greatSlash', name: '대참', type: 'attack', damage: 25, delay: 3, description: '대검 휘두르기' },
      { id: 'guard', name: '철벽', type: 'defend', damage: 0, delay: 2, description: '철벽 방어' },
      { id: 'dragonBreath', name: '용염', type: 'special', damage: 35, delay: 5, description: '용의 숨결!', effect: { type: 'bleed', value: 8, duration: 3 } },
      { id: 'dragonStrike', name: '용격', type: 'attack', damage: 50, delay: 7, description: '용의 일격!' },
    ],
  },
};

let enemyIdCounter = 0;

// 적 생성 함수
export function createEnemy(templateId: string, x: number = 900): Enemy | null {
  const template = ENEMIES[templateId];
  if (!template) return null;
  
  const actions: EnemyAction[] = template.actions.map(action => ({
    ...action,
    currentDelay: action.delay,
  }));
  
  return {
    id: `enemy_${enemyIdCounter++}`,
    name: template.name,
    emoji: template.emoji,
    hp: template.hp,
    maxHp: template.hp,
    attack: template.attack,
    defense: template.defense,
    x,
    actions,
    actionQueue: [],  // EnemyManager에서 초기화됨
    currentActionIndex: 0,
    isStunned: 0,
    actionsPerTurn: template.actionsPerTurn,  // 턴당 스킬 수 제한
  };
}

// 랜덤 적 생성 (난이도별)
export function createRandomEnemy(difficulty: number, x: number = 900): Enemy {
  const enemyPool: string[] = [];
  
  if (difficulty < 3) {
    enemyPool.push('bandit', 'archer');
  } else if (difficulty < 6) {
    enemyPool.push('bandit', 'swordsman', 'archer', 'spearman');
  } else if (difficulty < 10) {
    enemyPool.push('swordsman', 'spearman', 'ronin', 'knight', 'assassin', 'shaman');
  } else {
    enemyPool.push('ronin', 'knight', 'assassin', 'shaman');
  }
  
  if (difficulty > 0 && difficulty % 5 === 0) {
    const bosses = ['swordMaster', 'dragonWarrior'];
    const bossId = bosses[Math.floor(Math.random() * bosses.length)];
    return createEnemy(bossId, x)!;
  }
  
  const randomId = enemyPool[Math.floor(Math.random() * enemyPool.length)];
  return createEnemy(randomId, x)!;
}

// 웨이브별 적 생성
export function createWaveEnemies(wave: number): Enemy[] {
  const enemies: Enemy[] = [];
  
  let enemyCount = Math.min(1 + Math.floor(wave / 2), 4);
  
  if (wave % 5 === 0) {
    enemies.push(createRandomEnemy(wave, 700)!);
    return enemies;
  }
  
  for (let i = 0; i < enemyCount; i++) {
    const x = 500 + i * 150;
    enemies.push(createRandomEnemy(wave, x)!);
  }
  
  return enemies;
}

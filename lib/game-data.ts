export type CardType = 'attack' | 'defend';

export interface CardDef {
  key: string;
  name: string;
  cost: number;
  type: CardType;
  value: number;
  desc: string;
}

export interface StarterDeckItem {
  key: string;
  count: number;
}

export interface Enemy {
  id: number;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  delay: number;
  delayMax: number;
  reward: number;
}

export const PLAYER_BASE: { hp: number; mana: number } = {
  hp: 80,
  mana: 3,
};

export const CARD_POOL: CardDef[] = [
  { key: 'slash', name: '베기', cost: 1, type: 'attack', value: 9, desc: '적 1명에게 9 피해' },
  { key: 'thrust', name: '찌르기', cost: 1, type: 'attack', value: 7, desc: '적 1명에게 7 피해' },
  { key: 'power', name: '강타', cost: 2, type: 'attack', value: 16, desc: '적 1명에게 16 피해' },
  { key: 'guard', name: '가드', cost: 1, type: 'defend', value: 8, desc: '방어 +8' },
  { key: 'iron', name: '철벽', cost: 2, type: 'defend', value: 14, desc: '방어 +14' },
];

export const STARTER_DECK: StarterDeckItem[] = [
  { key: 'slash', count: 4 },
  { key: 'thrust', count: 3 },
  { key: 'power', count: 2 },
  { key: 'guard', count: 3 },
  { key: 'iron', count: 2 },
];

export const ENEMY_NAMES = ['잔철 망령', '심연 파수병', '붉은 추적자'] as const;

export function getWaveEnemyCount(wave: number): number {
  return Math.min(1 + Math.floor((wave - 1) / 2), 3);
}

export function buildEnemy(wave: number, index: number, id: number): Enemy {
  const hp = 26 + wave * 7 + index * 6;
  const delayMax = 2 + (index % 2);

  return {
    id,
    name: ENEMY_NAMES[index] ?? `균열체 ${index + 1}`,
    hp,
    maxHp: hp,
    attack: 7 + Math.floor(wave * 1.4) + index,
    delay: delayMax,
    delayMax,
    reward: 4 + wave,
  };
}

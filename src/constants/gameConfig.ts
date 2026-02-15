/**
 * 게임 전역 설정
 * - 룰 상수와 기본 플레이어 시작 스탯을 한 곳에서 관리한다.
 */

export const GAME_CONSTANTS = {
  MAX_HAND_SIZE: 12,
  INITIAL_DRAW: 5,
  DRAW_PER_TURN: 2,
  INITIAL_MANA: 3,
  MAX_MANA: 10,
  DECK_SIZE: 20,
} as const;

export interface PlayerStartStats {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  defense: number;
  exp: number;
  level: number;
  silver: number;
}

export const DEFAULT_PLAYER_START_STATS: PlayerStartStats = {
  hp: 50,
  maxHp: 50,
  mana: GAME_CONSTANTS.INITIAL_MANA,
  maxMana: GAME_CONSTANTS.INITIAL_MANA,
  defense: 0,
  exp: 0,
  level: 1,
  silver: 0,
};

/**
 * 공용 타입 정의
 */

// 공격 범위 타입
// swordDouble: 무기 범위의 2배 (single→2, double→4, triple→6)
export type ReachType = 'single' | 'double' | 'triple' | 'all' | 'swordDouble';

// 게임 상수
export const GAME_CONSTANTS = {
  MAX_HAND_SIZE: 12,
  INITIAL_DRAW: 5,
  DRAW_PER_TURN: 2,
  INITIAL_MANA: 5,
  MAX_MANA: 10,
  DECK_SIZE: 20,
} as const;


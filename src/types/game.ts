/**
 * 게임 상태 관련 타입 정의
 */
import type { Enemy } from './enemy';

// 게임 페이즈
export type GamePhase = 'running' | 'combat' | 'victory' | 'paused' | 'gameOver' | 'event';

// 게임 상태
export interface GameState {
  phase: GamePhase;
  turn: number;
  score: number;
  distance: number;
  enemies: Enemy[];
  currentWave: number;
  enemiesDefeated: number;
  eventsThisTier: number;
  lastEventWave: number;
}


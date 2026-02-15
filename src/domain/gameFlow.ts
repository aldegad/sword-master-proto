import type { GamePhase, GameState } from '../types';

export const GAME_PHASES: readonly GamePhase[] = [
  'running',
  'combat',
  'victory',
  'paused',
  'gameOver',
  'event',
] as const;

export const GAME_PHASE_TRANSITIONS: Record<GamePhase, readonly GamePhase[]> = {
  running: ['running', 'combat', 'event', 'paused', 'gameOver'],
  combat: ['combat', 'victory', 'paused', 'gameOver'],
  victory: ['victory', 'running', 'paused', 'gameOver'],
  paused: ['paused', 'running', 'combat', 'victory', 'event', 'gameOver'],
  gameOver: ['gameOver'],
  event: ['event', 'running', 'combat', 'paused', 'gameOver'],
};

export interface GamePhaseTransitionOptions {
  force?: boolean;
}

export interface GamePhaseTransitionResult {
  from: GamePhase;
  to: GamePhase;
  accepted: boolean;
  changed: boolean;
}

export function isGamePhase(value: unknown): value is GamePhase {
  return typeof value === 'string' && (GAME_PHASES as readonly string[]).includes(value);
}

export function canTransitionGamePhase(from: GamePhase, to: GamePhase): boolean {
  return GAME_PHASE_TRANSITIONS[from].includes(to);
}

export function transitionGamePhase(
  gameState: Pick<GameState, 'phase'>,
  nextPhase: GamePhase,
  options: GamePhaseTransitionOptions = {},
): GamePhaseTransitionResult {
  const from = gameState.phase;
  const accepted = options.force === true || canTransitionGamePhase(from, nextPhase);

  if (accepted) {
    gameState.phase = nextPhase;
  }

  return {
    from,
    to: nextPhase,
    accepted,
    changed: accepted && from !== nextPhase,
  };
}

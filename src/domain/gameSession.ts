import type { Card, GameState, PassiveTemplate, PlayerState } from '../types';
import type { EventOutcome } from '../data/events';
import { isGamePhase } from './gameFlow';

export type SkillSelectType = 'searchSword' | 'graveRecall' | 'graveEquip';

export interface SavedGameSnapshot {
  version: number;
  savedAt: string;
  playerState: PlayerState;
  gameState: GameState;
  runtime: {
    isMoving: boolean;
    moveDistance: number;
    rewardCards: Card[];
    levelUpSkillCards: Card[];
    levelUpPassives: PassiveTemplate[];
    bossRewardCards: Card[];
    skillSelectCards: Card[];
    skillSelectType: SkillSelectType | null;
    pendingSkillCard: Card | null;
    pendingEventReward: EventOutcome | null;
    pendingEvent: boolean;
    pendingLevelUp: boolean;
    isEventSkillSelection: boolean;
  };
}

export interface SessionStorageOptions {
  storageKey?: string;
  version?: number;
}

export interface LoadedSavedSnapshot {
  raw: string;
  snapshot: SavedGameSnapshot;
}

export const GAME_SESSION_STORAGE_KEY = 'sword-master-save-v1';
export const GAME_SESSION_VERSION = 1;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function parseSavedSnapshot(
  raw: string,
  expectedVersion: number = GAME_SESSION_VERSION,
): SavedGameSnapshot | null {
  try {
    const parsed = JSON.parse(raw) as Partial<SavedGameSnapshot>;
    if (!isObject(parsed)) return null;
    if (parsed.version !== expectedVersion) return null;
    if (!isObject(parsed.playerState) || !isObject(parsed.gameState) || !isObject(parsed.runtime)) {
      return null;
    }

    const player = parsed.playerState as PlayerState;
    const game = parsed.gameState as GameState;
    const runtime = parsed.runtime as SavedGameSnapshot['runtime'];

    if (!Array.isArray(player.hand) || !Array.isArray(player.deck) || !Array.isArray(player.discard)) return null;
    if (!Array.isArray(player.buffs) || !Array.isArray(player.countEffects) || !Array.isArray(player.passives)) return null;
    if (!Array.isArray(game.enemies) || !isGamePhase(game.phase)) return null;
    if (!Array.isArray(runtime.rewardCards) || !Array.isArray(runtime.levelUpSkillCards)) return null;
    if (!Array.isArray(runtime.levelUpPassives) || !Array.isArray(runtime.bossRewardCards)) return null;
    if (!Array.isArray(runtime.skillSelectCards)) return null;

    return parsed as SavedGameSnapshot;
  } catch {
    return null;
  }
}

export function loadSavedSnapshot(
  storage: Storage,
  options: SessionStorageOptions = {},
): LoadedSavedSnapshot | null {
  const storageKey = options.storageKey ?? GAME_SESSION_STORAGE_KEY;
  const version = options.version ?? GAME_SESSION_VERSION;

  try {
    const raw = storage.getItem(storageKey);
    if (!raw) return null;

    const snapshot = parseSavedSnapshot(raw, version);
    if (!snapshot) {
      storage.removeItem(storageKey);
      return null;
    }

    return { raw, snapshot };
  } catch {
    try {
      storage.removeItem(storageKey);
    } catch {
      // noop
    }
    return null;
  }
}

export function hasRestorableSavedSnapshot(
  storage: Storage,
  options: SessionStorageOptions = {},
): boolean {
  return loadSavedSnapshot(storage, options) !== null;
}

export function serializeSavedSnapshot(snapshot: SavedGameSnapshot): string {
  return JSON.stringify(snapshot);
}

export function persistSavedSnapshotPayload(
  storage: Storage,
  payload: string,
  options: SessionStorageOptions = {},
): boolean {
  const storageKey = options.storageKey ?? GAME_SESSION_STORAGE_KEY;

  try {
    storage.setItem(storageKey, payload);
    return true;
  } catch {
    return false;
  }
}

export function clearSavedSnapshot(
  storage: Storage,
  options: SessionStorageOptions = {},
) {
  const storageKey = options.storageKey ?? GAME_SESSION_STORAGE_KEY;

  try {
    storage.removeItem(storageKey);
  } catch {
    // noop
  }
}

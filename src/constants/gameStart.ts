import {
  SKILL_ID,
  SWORD_ID,
  type SkillId,
  type SwordId,
} from './gameIds';
import {
  DEFAULT_PLAYER_START_STATS,
  type PlayerStartStats,
} from './gameConfig';

export interface GameStartConfig {
  equippedSwordId: SwordId;
  starterDeck: {
    swords: SwordId[];
    skills: SkillId[];
  };
  player: PlayerStartStats;
}

/**
 * 새 게임 시작 설정
 * - 기본 무장(장착 검), 시작 덱, 초기 스탯을 한 곳에서 관리한다.
 * - 문자열 직접 입력 대신 `SWORD_ID.*`, `SKILL_ID.*` 상수를 사용한다.
 */
export const GAME_START_CONFIG: GameStartConfig = {
  // 시작 시 장착된 검 ID
  equippedSwordId: SWORD_ID.KATANA,

  // 시작 덱 구성
  starterDeck: {
    swords: [
      SWORD_ID.SAMJEONGDO,
      SWORD_ID.SAMJEONGDO,
      SWORD_ID.SAMJEONGDO,
      SWORD_ID.BONGUKGEOM,
      SWORD_ID.BYEONGDO,
      SWORD_ID.KATANA,
    ],
    skills: [
      SKILL_ID.SLASH,
      SKILL_ID.SLASH,
      SKILL_ID.THRUST,
      SKILL_ID.CONSECUTIVE_SLASH,
      SKILL_ID.PARRY,
      SKILL_ID.PARRY,
      SKILL_ID.QUICK_SLASH,
      SKILL_ID.FOCUS,
      SKILL_ID.POWER_STRIKE,
      SKILL_ID.SWEEPING_BLOW,
      SKILL_ID.SLASH_AND_DRAW,
      SKILL_ID.SETUP_BOARD,
      SKILL_ID.SETUP_BOARD,
      SKILL_ID.FOLLOW_UP_SLASH,
    ],
  },

  // 플레이어 초기 스탯
  player: { ...DEFAULT_PLAYER_START_STATS },
};

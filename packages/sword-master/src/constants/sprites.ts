/**
 * 스프라이트 애니메이션 설정
 * 
 * 스프라이트 이미지 위치: public/assets/sprites/
 * 
 * 필요한 파일:
 * 1. player-idle.png + player-idle.json   - 아이들(대기) 모션
 * 2. player-walk.png + player-walk.json   - 걷기/달리기 모션
 * 3. player-action.png + player-action.json - 스킬/무기교체 모션
 * 
 * PNG와 JSON은 sprite-generator 도구로 생성할 수 있습니다.
 */

export interface SpriteConfig {
  key: string;           // Phaser에서 사용할 키
  imagePath: string;     // PNG 파일 경로
  jsonPath: string;      // JSON 메타데이터 경로
  animations: AnimationConfig[];
}

export interface AnimationConfig {
  key: string;           // 애니메이션 키
  startFrame?: number;   // 시작 프레임 (JSON에서 자동 계산 시 생략 가능)
  endFrame?: number;     // 끝 프레임 (JSON에서 자동 계산 시 생략 가능)
  frameRate: number;     // FPS
  repeat: number;        // -1: 무한반복, 0: 한번만
}

/**
 * 스프라이트 시트 JSON 메타데이터 형식 (sprite-generator 출력)
 */
export interface SpriteSheetMeta {
  frames: {
    filename: string;
    frame: { x: number; y: number; w: number; h: number };
    duration: number;
  }[];
  meta: {
    image: string;
    size: { width: number; height: number };
    frameWidth: number;
    frameHeight: number;
    columns: number;
    rows: number;
    totalFrames: number;
  };
}

/**
 * 플레이어 스프라이트 설정
 * 
 * 애니메이션 흐름:
 * - idle: 기본 서있는 상태 (122프레임, 무한 반복)
 * - idle-to-work: idle → work 전환 애니메이션 (25프레임, 1회)
 * - work: 작업/공격 상태 (46프레임, 1회 또는 반복)
 * - work-to-idle: work → idle 전환 (idle-to-work 역재생)
 */
export const PLAYER_SPRITES: SpriteConfig[] = [
  {
    key: 'player-idle',
    imagePath: 'assets/sprites/idle.png',
    jsonPath: 'assets/sprites/idle.json',
    animations: [
      {
        key: 'idle',
        frameRate: 24,    // 24fps
        repeat: -1,       // 무한 반복
      },
    ],
  },
  {
    key: 'player-idle-work',
    imagePath: 'assets/sprites/idle-work.png',
    jsonPath: 'assets/sprites/idle-work.json',
    animations: [
      {
        key: 'idle-to-work',
        frameRate: 24,    // 24fps
        repeat: 0,        // 1회만
      },
      {
        key: 'work-to-idle',
        frameRate: 24,    // 24fps
        repeat: 0,
      },
    ],
  },
  {
    key: 'player-work',
    imagePath: 'assets/sprites/work.png',
    jsonPath: 'assets/sprites/work.json',
    animations: [
      {
        key: 'work',
        frameRate: 24,    // 24fps - 이동 중 재생
        repeat: 0,        // 1회
      },
      {
        key: 'work-loop',
        frameRate: 24,    // 24fps
        repeat: -1,       // 반복 버전 (이동용)
      },
    ],
  },
  {
    key: 'player-attak',
    imagePath: 'assets/sprites/attak.png',
    jsonPath: 'assets/sprites/attak.json',
    animations: [
      {
        key: 'attak',
        frameRate: 24,    // 24fps - 공격/장착 시 재생
        repeat: 0,        // 1회
      },
    ],
  },
  {
    key: 'player-damaged',
    imagePath: 'assets/sprites/damaged.png',
    jsonPath: 'assets/sprites/damaged.json',
    animations: [
      {
        key: 'damaged',
        frameRate: 24,    // 24fps - 피격 시 재생
        repeat: 0,        // 1회
      },
    ],
  },
];

/**
 * 스프라이트 사용 여부
 * false면 기존 이모지/텍스트 기반 렌더링 사용
 */
export const USE_SPRITES = true;

/**
 * UI 스케일 (1920x1080 / 1024x768 = 약 1.875배)
 */
export const UI_SCALE = 1.875;

/**
 * 스프라이트 스케일
 * 원본 560x560을 화면에 맞게 (0.4 * 1.875 ≈ 0.75)
 */
export const SPRITE_SCALE = 0.75;

/**
 * 로드된 스프라이트 메타데이터 저장소
 */
export const loadedSpriteMeta: Map<string, SpriteSheetMeta> = new Map();

/**
 * SVG 에셋 설정
 */
export interface SvgAssetConfig {
  key: string;
  path: string;
}

/**
 * 검 SVG 에셋
 */
export const SWORD_SVG_ASSETS: SvgAssetConfig[] = [
  { key: 'svg-katana', path: 'assets/svg/swords/katana.svg' },
  { key: 'svg-wakizashi', path: 'assets/svg/swords/wakizashi.svg' },
  { key: 'svg-pagapdo', path: 'assets/svg/swords/pagapdo.svg' },
  { key: 'svg-nodachi', path: 'assets/svg/swords/nodachi.svg' },
  { key: 'svg-bongukgeom', path: 'assets/svg/swords/bongukgeom.svg' },
  { key: 'svg-muramasa', path: 'assets/svg/swords/muramasa.svg' },
  { key: 'svg-masamune', path: 'assets/svg/swords/masamune.svg' },
  { key: 'svg-kusanagi', path: 'assets/svg/swords/kusanagi.svg' },
];

/**
 * 적 SVG 에셋
 */
export const ENEMY_SVG_ASSETS: SvgAssetConfig[] = [
  { key: 'svg-samurai', path: 'assets/svg/enemies/samurai.svg' },
  { key: 'svg-bandit', path: 'assets/svg/enemies/bandit.svg' },
  { key: 'svg-ronin', path: 'assets/svg/enemies/ronin.svg' },
  { key: 'svg-ninja', path: 'assets/svg/enemies/ninja.svg' },
  { key: 'svg-boss', path: 'assets/svg/enemies/boss.svg' },
];

/**
 * UI SVG 에셋
 */
export const UI_SVG_ASSETS: SvgAssetConfig[] = [
  { key: 'svg-card-bg', path: 'assets/svg/ui/card-bg.svg' },
  { key: 'svg-slot-bg', path: 'assets/svg/ui/slot-bg.svg' },
];

/**
 * 배경 SVG 에셋
 */
export const BG_SVG_ASSETS: SvgAssetConfig[] = [
  { key: 'svg-dojo', path: 'assets/svg/backgrounds/dojo.svg' },
];

/**
 * 모든 SVG 에셋
 */
export const ALL_SVG_ASSETS: SvgAssetConfig[] = [
  ...SWORD_SVG_ASSETS,
  ...ENEMY_SVG_ASSETS,
  ...UI_SVG_ASSETS,
  ...BG_SVG_ASSETS,
];

/**
 * SVG 사용 여부
 * false면 기존 이모지 기반 렌더링 사용
 */
export const USE_SVG = true;

/**
 * 검 ID → SVG 키 매핑
 */
export const SWORD_ID_TO_SVG: Record<string, string> = {
  'katana': 'svg-katana',
  'wakizashi': 'svg-wakizashi',
  'pagapdo': 'svg-pagapdo',
  'nodachi': 'svg-nodachi',
  'bongukgeom': 'svg-bongukgeom',
  'muramasa': 'svg-muramasa',
  'masamune': 'svg-masamune',
  'kusanagi': 'svg-kusanagi',
};

/**
 * 적 ID → SVG 키 매핑
 * 비슷한 적들은 같은 SVG 사용
 */
export const ENEMY_TYPE_TO_SVG: Record<string, string> = {
  // Tier 1 (산적/도적)
  'bandit': 'svg-bandit',
  'archer': 'svg-bandit',
  'swordsman': 'svg-ronin',
  'shieldman': 'svg-samurai',
  'imperialSwordsman': 'svg-samurai',

  // Tier 2 (무사/암살자)
  'ronin': 'svg-ronin',
  'knight': 'svg-samurai',
  'assassin': 'svg-ninja',
  'shaman': 'svg-ronin',
  'samurai': 'svg-samurai',
  'spearShield': 'svg-samurai',

  // 보스
  'swordMaster': 'svg-boss',
  'banditLeader': 'svg-boss',
  'dragonWarrior': 'svg-boss',
  'toposa': 'svg-boss',
};

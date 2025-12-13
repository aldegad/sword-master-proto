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
 */
export const PLAYER_SPRITES: SpriteConfig[] = [
  {
    key: 'player-idle',
    imagePath: 'assets/sprites/player-idle.png',
    jsonPath: 'assets/sprites/player-idle.json',
    animations: [
      {
        key: 'idle',
        frameRate: 8,
        repeat: -1,   // 무한 반복
      },
    ],
  },
  {
    key: 'player-walk',
    imagePath: 'assets/sprites/player-walk.png',
    jsonPath: 'assets/sprites/player-walk.json',
    animations: [
      {
        key: 'walk',
        frameRate: 12,
        repeat: -1,
      },
    ],
  },
  {
    key: 'player-action',
    imagePath: 'assets/sprites/player-action.png',
    jsonPath: 'assets/sprites/player-action.json',
    animations: [
      {
        key: 'attack',
        startFrame: 0,
        endFrame: 4,       // 예: 0~4 프레임 (5프레임)
        frameRate: 15,
        repeat: 0,
      },
      {
        key: 'skill',
        startFrame: 5,
        endFrame: 9,       // 예: 5~9 프레임
        frameRate: 12,
        repeat: 0,
      },
      {
        key: 'equip',
        startFrame: 10,
        endFrame: 13,      // 예: 10~13 프레임
        frameRate: 10,
        repeat: 0,
      },
    ],
  },
];

/**
 * 스프라이트 사용 여부
 * false면 기존 이모지/텍스트 기반 렌더링 사용
 */
export const USE_SPRITES = false;

/**
 * 스프라이트 스케일
 */
export const SPRITE_SCALE = 1.5;

/**
 * 로드된 스프라이트 메타데이터 저장소
 */
export const loadedSpriteMeta: Map<string, SpriteSheetMeta> = new Map();

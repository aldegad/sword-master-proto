/**
 * 타이포그래피 상수 - 폰트 크기, 웨이트 중앙화
 * 모든 텍스트 스타일은 여기서 관리
 */

// 폰트 크기 (기존 대비 +1)
export const FONT_SIZES = {
  // 제목
  title: {
    hero: 43,      // 메인 타이틀 (42 → 43)
    large: 33,     // 대형 제목 (32 → 33)
    medium: 23,    // 중형 제목 (22 → 23)
    small: 19,     // 소형 제목 (18 → 19)
  },
  
  // 본문
  body: {
    large: 17,     // 큰 본문 (16 → 17)
    medium: 14,    // 중간 본문 (13 → 14)
    small: 13,     // 작은 본문 (12 → 13)
    tiny: 11,      // 아주 작은 텍스트 (10 → 11)
  },
  
  // UI 요소
  ui: {
    button: 17,    // 버튼 텍스트 (16 → 17)
    label: 14,     // 라벨 (13 → 14)
    badge: 13,     // 배지/태그 (12 → 13)
    hint: 11,      // 힌트/설명 (10 → 11)
  },
  
  // 카드
  card: {
    name: 14,      // 카드 이름 (13 → 14)
    stat: 11,      // 카드 스탯 (10 → 11)
    key: 13,       // 단축키 표시 (12 → 13)
    mana: 13,      // 마나 비용 (12 → 13)
  },
  
  // 게임 요소
  game: {
    damage: 21,    // 데미지 숫자 (20 → 21)
    hp: 13,        // HP 바 텍스트 (12 → 13)
    enemy: 14,     // 적 이름 (13 → 14)
    message: 21,   // 게임 메시지 (20 → 21)
  },
} as const;

// 폰트 웨이트
export const FONT_WEIGHTS = {
  normal: '',
  bold: 'bold ',
  black: '900 ',
} as const;

// 폰트 패밀리
export const FONT_FAMILY = 'monospace';

/**
 * 폰트 스타일 문자열 생성 헬퍼
 * @example getFont('bold', 16) => 'bold 16px monospace'
 */
export function getFont(
  weight: keyof typeof FONT_WEIGHTS = 'normal',
  size: number
): string {
  return `${FONT_WEIGHTS[weight]}${size}px ${FONT_FAMILY}`;
}

/**
 * 미리 정의된 폰트 스타일
 */
export const FONTS = {
  // 제목
  titleHero: getFont('bold', FONT_SIZES.title.hero),
  titleLarge: getFont('bold', FONT_SIZES.title.large),
  titleMedium: getFont('bold', FONT_SIZES.title.medium),
  titleSmall: getFont('bold', FONT_SIZES.title.small),
  
  // 본문
  bodyLarge: getFont('normal', FONT_SIZES.body.large),
  bodyMedium: getFont('normal', FONT_SIZES.body.medium),
  bodySmall: getFont('normal', FONT_SIZES.body.small),
  bodyTiny: getFont('normal', FONT_SIZES.body.tiny),
  
  // UI
  button: getFont('bold', FONT_SIZES.ui.button),
  buttonSmall: getFont('bold', FONT_SIZES.body.medium),
  label: getFont('normal', FONT_SIZES.ui.label),
  labelBold: getFont('bold', FONT_SIZES.ui.label),
  badge: getFont('bold', FONT_SIZES.ui.badge),
  hint: getFont('normal', FONT_SIZES.ui.hint),
  
  // 카드
  cardName: getFont('bold', FONT_SIZES.card.name),
  cardStat: getFont('normal', FONT_SIZES.card.stat),
  cardKey: getFont('bold', FONT_SIZES.card.key),
  cardMana: getFont('normal', FONT_SIZES.card.mana),
  
  // 게임
  damage: getFont('bold', FONT_SIZES.game.damage),
  hp: getFont('normal', FONT_SIZES.game.hp),
  enemy: getFont('bold', FONT_SIZES.game.enemy),
  message: getFont('bold', FONT_SIZES.game.message),
} as const;

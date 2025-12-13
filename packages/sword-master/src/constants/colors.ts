/**
 * 게임 전체 색상 팔레트 - 동양풍 테마
 * 모든 UI 색상은 이 파일에서 관리
 */

// ========== 기본 색상 (16진수) ==========
export const COLORS = {
  // 프라이머리 - 금색 계열 (강조, 중요 정보)
  primary: {
    main: 0xf0c850,      // 밝은 금색
    dark: 0xd4af37,      // 어두운 금색
    light: 0xf5deb3,     // 밝은 베이지
  },
  
  // 세컨더리 - 주홍색 계열 (경고, 공격, 체력)
  secondary: {
    main: 0xe85a4a,      // 밝은 주홍
    dark: 0xc44536,      // 어두운 주홍
    light: 0xff6b6b,     // 밝은 빨강
  },
  
  // 성공/회복 - 청록색 계열
  success: {
    main: 0x5a9c69,      // 밝은 청록
    dark: 0x4a7c59,      // 어두운 청록
    light: 0x6abc79,     // 더 밝은 청록
  },
  
  // 배경 색상
  background: {
    dark: 0x1a1512,      // 가장 어두운 배경
    medium: 0x2a2018,    // 중간 배경
    light: 0x3a3028,     // 밝은 배경 (카드 등)
    overlay: 0x0f0d0a,   // 오버레이 배경
  },
  
  // 테두리/구분선
  border: {
    dark: 0x4a3a28,      // 어두운 테두리
    medium: 0x8b4513,    // 중간 테두리 (갈색)
    light: 0xa86030,     // 밝은 테두리
  },
  
  // 텍스트 색상
  text: {
    primary: 0xf5ead8,   // 주요 텍스트 (밝은 아이보리)
    secondary: 0xd4c4a0, // 보조 텍스트 (베이지)
    muted: 0xb8a080,     // 흐린 텍스트
    disabled: 0x4a3a28,  // 비활성화 텍스트
  },
  
  // 등급별 색상
  rarity: {
    common: 0xf5ead8,    // 일반 - 밝은 아이보리
    uncommon: 0x5a9c69,  // 고급 - 청록
    rare: 0xe85a4a,      // 희귀 - 주홍
    unique: 0xf0c850,    // 유일 - 금색
  },
  
  // 카드 타입별 색상
  card: {
    sword: 0xe85a4a,     // 무기 카드 - 주홍
    skill: 0x5a9c69,     // 일반 스킬 - 청록
    swift: 0xf0c850,     // 신속 스킬 - 금색
  },
  
  // 상태 색상
  status: {
    hp: {
      full: 0x5a9c69,    // 체력 만땅 - 청록
      half: 0xf0c850,    // 체력 절반 - 금색
      low: 0xe85a4a,     // 체력 위험 - 주홍
    },
    mana: {
      active: 0xf0c850,  // 마나 있음 - 금색
      empty: 0x2a2018,   // 마나 없음 - 어두운 배경
    },
  },
  
  // 데미지/효과 색상
  effect: {
    damage: 0xff6b6b,    // 데미지 숫자
    heal: 0x5a9c69,      // 회복 숫자
    buff: 0xf0c850,      // 버프 효과
    debuff: 0xe85a4a,    // 디버프 효과
  },
} as const;

// ========== CSS 색상 문자열 ==========
export const COLORS_STR = {
  primary: {
    main: '#f0c850',
    dark: '#d4af37',
    light: '#f5deb3',
  },
  secondary: {
    main: '#e85a4a',
    dark: '#c44536',
    light: '#ff6b6b',
  },
  success: {
    main: '#5a9c69',
    dark: '#4a7c59',
    light: '#6abc79',
  },
  background: {
    dark: '#1a1512',
    medium: '#2a2018',
    light: '#3a3028',
  },
  border: {
    dark: '#4a3a28',
    medium: '#8b4513',
    light: '#a86030',
  },
  text: {
    primary: '#f5ead8',
    secondary: '#d4c4a0',
    muted: '#b8a080',
    disabled: '#4a3a28',
  },
  rarity: {
    common: '#f5ead8',
    uncommon: '#5a9c69',
    rare: '#e85a4a',
    unique: '#f0c850',
  },
  card: {
    sword: '#e85a4a',
    skill: '#5a9c69',
    swift: '#f0c850',
  },
} as const;

// ========== 헬퍼 함수 ==========

/**
 * 16진수 색상을 CSS 문자열로 변환
 */
export function toColorStr(hex: number): string {
  return '#' + hex.toString(16).padStart(6, '0');
}

/**
 * 등급에 따른 색상 반환
 */
export function getRarityColor(rarity: string): number {
  return COLORS.rarity[rarity as keyof typeof COLORS.rarity] || COLORS.rarity.common;
}

export function getRarityColorStr(rarity: string): string {
  return COLORS_STR.rarity[rarity as keyof typeof COLORS_STR.rarity] || COLORS_STR.rarity.common;
}

/**
 * 카드 타입에 따른 테두리 색상 반환
 */
export function getCardBorderColor(isSword: boolean, isSwift: boolean = false): number {
  if (isSword) return COLORS.card.sword;
  return isSwift ? COLORS.card.swift : COLORS.card.skill;
}

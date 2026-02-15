/**
 * 게임 ID 상수
 * - 문자열 오타를 방지하기 위한 enum-like constants
 * - IDE 자동완성과 JSDoc 설명을 함께 제공
 *
 * 이 파일은 scripts/generate-game-ids.js 로 갱신할 수 있다.
 */

export const SWORD_ID = {
  /** 삼정도: 조선 군관의 제식 도검. 공격과 방어의 균형이 좋은 안정적인 기본 무기. */
  SAMJEONGDO: 'samjeongdo',
  /** 카타나: 일본 보병의 대표 도검. 베기 성능이 뛰어나 단일 대상 압박에 특화. */
  KATANA: 'katana',
  /** 병도: 중국 보병용 제식 도검. 단순하고 실전적인 구조로 집단 전투에서 효율적. */
  BYEONGDO: 'byeongdo',
  /** 나가마키: 긴 자루와 긴 도날을 결합한 일본 장병기. 강한 베기와 충격 전달로 중장갑 보병 압박에 유리. */
  NAGAMAKI: 'nagamaki',
  /** 중도: 두껍고 넓은 칼날의 중국도. 방패·중장 보병 대응에 적합한 높은 관통력. */
  JUNGDO: 'jungdo',
  /** 본국검: 본국검법의 정수. 상대의 공격 흐름을 끊어내는 방어적·통제형 무기. */
  BONGUKGEOM: 'bongukgeom',
  /** 격검용 카타나: 거합·카운터 중심 운용의 기술 특화 검. 타이밍 의존도가 높은 숙련자 보상형. */
  GEKKENKATANA: 'gekkenkatana',
  /** 젠: 찌르기와 정밀 공격 중심의 검. 공격력은 낮지만 기술 계수가 우수한 컨트롤형. */
  JIAN: 'jian',
  /** 비수: 간결하고 실용적인 단검. 은신·호위·암습에 특화된 빠른 선제 공격용. */
  BISU: 'bisu',
  /** 와키자시: 보조검. 빠른 연속 공격과 조건부 크리티컬에 특화. */
  WAKIZASHI: 'wakizashi',
  /** 요이도로시: 갑옷 관통 단검. 출혈·지속 피해에 특화된 중장 상대 대응용. */
  YOROIDOSHI: 'yoroidoshi',
  /** 자객 단검: 암살 및 근접 제압용 단검. 독 계열 상태 이상에 특화. */
  JAGAEKDANGEOM: 'jagaekdangeom',
  /** 월도: 장수용 대형 도검. 다수 대상 공격과 범위 피해에 특화. */
  WOLDO: 'woldo',
  /** 노다치: 초대형 장검. 압도적인 공격력과 긴 리치의 선공 압박형 무기. */
  NODACHI: 'nodachi',
  /** 언월도: 청룡언월도. 위압감이 강해 사기 저하·공격력 감소 효과와 궁합이 좋음. */
  GUANDAO: 'guandao',
  /** 잔광: 모든 것을 내려놓은 순간. 번뜩이는 검의 깨달음. */
  JANGWANG: 'jangwang',
  /** 성흔절도: 붕괴한 성좌의 파편을 봉인한 연격형 마검. */
  CHILSEONG: 'chilseong',
  /** 공허침식도: 공간 균열을 먹어치우며 칼날을 증식시키는 침식도. */
  SAINGUM: 'saingum',
  /** 폭풍유리검: 폭풍핵으로 제련된 유리 칼날이 연타마다 흔들린다. */
  MURAMASA: 'muramasa',
  /** 야식맹세검: 심야 의식을 통해 계약된 일격 특화형 맹세검. */
  MASAMUNE: 'masamune',
  /** 여명파열도: 여명 직전의 균열광을 칼날로 압축한 파열형 도검. */
  KUSANAGI: 'kusanagi',
} as const;

export type SwordId = (typeof SWORD_ID)[keyof typeof SWORD_ID];
export const SWORD_ID_LIST = Object.values(SWORD_ID) as SwordId[];

export const SKILL_ID = {
  /** 베기: 무기 범위에 기본 베기. 공격 배율 x1.5. */
  SLASH: 'slash',
  /** 찌르기: 무기 범위 찌르기. 공격 배율 x1.5, 관통 +3(적 방어 3 무시). */
  THRUST: 'thrust',
  /** 연속베기: 무기 범위 연속 베기. 공격 배율 x0.7, 무기 타수 x2. */
  CONSECUTIVE_SLASH: 'consecutiveSlash',
  /** 유수격: 무기 범위 5연속 베기. 공격 배율 x0.5, 무기 타수 x5. */
  FLURRY: 'flurry',
  /** 횡베기: 무기 범위를 2배로 확장해 공격. */
  SWEEPING_BLOW: 'sweepingBlow',
  /** 회전참: 전체 범위를 2연타로 공격. */
  WHIRLWIND: 'whirlwind',
  /** 월아참: 무기 범위를 2배로 확장해 공격 배율 x1.2 일격. */
  CRESCENT: 'crescent',
  /** 강타: 즉시 타격하지 않고 1대기 후 발동. 공격 배율 x3.0. */
  POWER_STRIKE: 'powerStrike',
  /** 천지개벽: 공격 배율 x3.5 일격 후 1턴 기절 부여. */
  HEAVEN_SPLITTER: 'heavenSplitter',
  /** 출혈검: 공격 후 출혈 15 피해를 3턴 부여. */
  BLEEDING_EDGE: 'bleedingEdge',
  /** 흡혈참: 가한 피해의 30%를 체력으로 회복. */
  VAMPIRE_SLASH: 'vampireSlash',
  /** 파갑술: 방어를 완전히 무시하고 공격. 적 방어력 영구 -5. */
  ARMOR_BREAKER: 'armorBreaker',
  /** 베며 가다듬기: 공격 후 카드 1장 드로우. */
  SLASH_AND_DRAW: 'slashAndDraw',
  /** 빈틈!: 신속. 공격 배율 x1.0, 무기 타수 x1. 방어를 무시하며 단검 장착 시 크리티컬 x2.0. */
  QUICK_SLASH: 'quickSlash',
  /** 섬광참: 신속 2연타. 공격 배율 x0.8, 적 대기턴을 감소시키지 않음. */
  FLASH_STRIKE: 'flashStrike',
  /** 이어베기: 신속 연계기. 이번 턴에 공격/무기 사용 후에만 사용 가능, 공격 배율 x1.2. */
  FOLLOW_UP_SLASH: 'followUpSlash',
  /** 조롱: 적 전체 대기턴 -1, 카드 1장 드로우. */
  TAUNT: 'taunt',
  /** 검 얽기: 신속 카운트 방어. 방어율 x5, 성공 시 반격 x1.0 (1회 방어 후 소멸). */
  PARRY: 'parry',
  /** 쳐내기: 카운트 방어. 방어율 x10, 반격 없음 (1회 방어 후 소멸). */
  IRON_WALL: 'ironWall',
  /** 흐름을 읽다: 카운트 방어 5단계. 대기할수록 방어 x1→2→4→6→8, 반격 x0.25→0.5→1.0→1.5→2.0. */
  FLOW_READ: 'flowRead',
  /** 집중: 신속. 다음 공격 최종 피해 배율 +50%. */
  FOCUS: 'focus',
  /** 연마: 신속 1회용. 3턴간 공격력 +5, 덱의 모든 검 내구도 +1. */
  SHARPEN: 'sharpen',
  /** 검의 춤: 신속. 카드 3장 드로우 후, 뽑은 카드를 즉시 자동 발동. */
  BLADE_DANCE: 'bladeDance',
  /** 납도: 신속. 현재 장착 무기를 손패로 되돌리고, 발도 스킬을 즉시 재시전. */
  SHEATHE: 'sheathe',
  /** 판 짜기: 덱에서 카드 2장 드로우. */
  SETUP_BOARD: 'setupBoard',
  /** 검 잡기: 신속. 덱 상단에서 첫 검은 즉시 장착+발도, 다음 검은 손패로. */
  BLADE_SEEKER: 'bladeSeeker',
  /** 되짚기: 신속. 무덤(버린 더미) 상단 카드 2장을 손패로 회수. */
  SOUL_RECALL: 'soulRecall',
  /** 검 차올리기: 신속. 무덤의 검 후보 중 하나를 선택해 즉시 장착 후 발도. */
  ANCESTOR_BLADE: 'ancestorBlade',
  /** 쓸어내기: 무기 범위 x2로 공격 배율 x2.0 일격. */
  SWEEP_SLASH: 'sweepSlash',
  /** 난무: 전체 범위 난무. 공격 배율 x0.8, 무기 타수 x3. */
  BLADE_STORM: 'bladeStorm',
  /** 파단: 초고배율 일격(x5.0) 후 현재 무기 즉시 파괴. */
  FINAL_JUDGMENT: 'finalJudgment',
} as const;

export type SkillId = (typeof SKILL_ID)[keyof typeof SKILL_ID];
export const SKILL_ID_LIST = Object.values(SKILL_ID) as SkillId[];

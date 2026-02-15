// 랜덤 이벤트 시스템

export interface GameEvent {
  id: string;
  name: string;
  emoji: string;
  description: string;
  eventType?: 'normal' | 'shop' | 'skill_select';  // 이벤트 특수 타입
  choices: EventChoice[];
}

export interface EventChoice {
  text: string;
  outcomes: EventOutcome[];
}

export interface EventOutcome {
  probability: number;  // 0~1
  type: 'combat' | 'reward' | 'nothing' | 'damage' | 'heal' | 'shop' | 'skill_select' | 'skill_select_paid' | 'combat_then_reward' | 'combat_then_choose';
  message: string;
  value?: number;  // 은전량, 데미지량 등
  enemyType?: string;  // combat 시 적 타입
  rewardOptions?: {  // combat_then_choose 시 보상 옵션
    heal?: number;
    silver?: number;
  };
  silverCost?: number;  // skill_select_paid 시 은전 비용
}

// 1~10 스테이지 이벤트
export const TIER1_EVENTS: GameEvent[] = [
  {
    id: 'wounded_traveler',
    name: '부상당한 여행자',
    emoji: '🧑‍🦯',
    description: '길가에 부상당한 여행자가 쓰러져 있다.\n도와줄 것인가?',
    choices: [
      {
        text: '도와준다',
        outcomes: [
          { probability: 0.6, type: 'reward', message: '감사합니다! 이것을 드릴게요.', value: 30 },
          { probability: 0.3, type: 'combat', message: '함정이다! 산적이 나타났다!', enemyType: 'bandit' },
          { probability: 0.1, type: 'reward', message: '고맙습니다... 이건 가보로 받으세요.', value: 80 },
        ],
      },
      {
        text: '무시하고 지나간다',
        outcomes: [
          { probability: 1.0, type: 'nothing', message: '당신은 그냥 지나쳤다.' },
        ],
      },
    ],
  },
  {
    id: 'traveling_merchant',
    name: '떠돌이 상인',
    emoji: '🧳',
    description: '"좋은 물건 있습니다, 검사 나리!"\n상인이 검을 펼쳐 보인다.',
    eventType: 'shop',
    choices: [
      {
        text: '물건을 구경한다',
        outcomes: [
          { probability: 1.0, type: 'shop', message: '상인이 물건을 펼쳐 보인다.' },
        ],
      },
      {
        text: '지나친다',
        outcomes: [
          { probability: 1.0, type: 'nothing', message: '상인이 아쉬워하며 짐을 쌌다.' },
        ],
      },
    ],
  },
  {
    id: 'old_shrine',
    name: '오래된 사당',
    emoji: '⛩️',
    description: '길가에 오래된 사당이 있다.\n기도를 드릴 것인가?',
    choices: [
      {
        text: '기도를 드린다',
        outcomes: [
          { probability: 0.5, type: 'heal', message: '신의 축복을 받았다!', value: 30 },
          { probability: 0.3, type: 'reward', message: '사당 앞에 누군가 둔 은전이 있다.', value: 25 },
          { probability: 0.2, type: 'nothing', message: '평온함을 느꼈다.' },
        ],
      },
      {
        text: '지나친다',
        outcomes: [
          { probability: 1.0, type: 'nothing', message: '당신은 그냥 지나쳤다.' },
        ],
      },
    ],
  },
  {
    id: 'bandit_ambush',
    name: '수상한 기척',
    emoji: '👁️',
    description: '어디선가 시선이 느껴진다.\n주변을 살필 것인가?',
    choices: [
      {
        text: '경계하며 살핀다',
        outcomes: [
          { probability: 0.5, type: 'combat', message: '매복한 산적을 발견했다!', enemyType: 'bandit' },
          { probability: 0.3, type: 'reward', message: '도망친 산적이 떨어뜨린 전리품을 발견!', value: 35 },
          { probability: 0.2, type: 'nothing', message: '아무것도 발견하지 못했다.' },
        ],
      },
      {
        text: '무시하고 빠르게 이동한다',
        outcomes: [
          { probability: 0.7, type: 'nothing', message: '아무 일 없이 지나갔다.' },
          { probability: 0.3, type: 'damage', message: '갑자기 공격당했다!', value: 8 },
        ],
      },
    ],
  },
  {
    id: 'secret_scroll',
    name: '비급 발견',
    emoji: '📜',
    description: '바위 틈에서 오래된 두루마리가 보인다.\n무림의 비급인 것 같다!',
    eventType: 'skill_select',
    choices: [
      {
        text: '비급을 살펴본다',
        outcomes: [
          { probability: 1.0, type: 'skill_select', message: '비급의 내용을 확인한다...' },
        ],
      },
      {
        text: '위험할 수 있다. 지나친다',
        outcomes: [
          { probability: 1.0, type: 'nothing', message: '혹시 모를 함정을 피했다.' },
        ],
      },
    ],
  },
];

// 11~20 스테이지 이벤트 (더 위험하고 보상도 큼)
export const TIER2_EVENTS: GameEvent[] = [
  {
    id: 'captured_warrior',
    name: '포로가 된 무사',
    emoji: '⚔️',
    description: '자객들에게 포위된 무사가 보인다.\n도와줄 것인가?',
    choices: [
      {
        text: '함께 싸운다',
        outcomes: [
          { 
            probability: 1.0, 
            type: 'combat_then_choose', 
            message: '자객들과 전투 개시!', 
            enemyType: 'assassin',
            rewardOptions: {
              heal: 40,
              silver: 80,
            }
          },
        ],
      },
      {
        text: '무시한다',
        outcomes: [
          { probability: 1.0, type: 'nothing', message: '당신은 무관심하게 지나쳤다.' },
        ],
      },
    ],
  },
  {
    id: 'cursed_altar',
    name: '저주받은 제단',
    emoji: '💀',
    description: '검은 기운이 맴도는 제단이 있다.\n조사할 것인가?',
    choices: [
      {
        text: '조사한다',
        outcomes: [
          { probability: 0.3, type: 'reward', message: '고대의 보물을 발견했다!', value: 100 },
          { probability: 0.4, type: 'damage', message: '저주에 당했다!', value: 15 },
          { probability: 0.3, type: 'combat', message: '악령이 깨어났다!', enemyType: 'shaman' },
        ],
      },
      {
        text: '피해간다',
        outcomes: [
          { probability: 1.0, type: 'nothing', message: '현명한 선택일지도...' },
        ],
      },
    ],
  },
  {
    id: 'ronin_duel',
    name: '낭인의 결투 신청',
    emoji: '🗡️',
    description: '한 낭인이 다가와 결투를 신청한다.\n"당신의 검술을 보고 싶소."',
    choices: [
      {
        text: '결투를 받아들인다',
        outcomes: [
          { 
            probability: 1.0, 
            type: 'combat_then_reward', 
            message: '결투 시작!', 
            enemyType: 'ronin',
            value: 60,  // 승리 시 은전
          },
        ],
      },
      {
        text: '거절한다',
        outcomes: [
          { probability: 0.9, type: 'nothing', message: '낭인이 아쉬워하며 떠났다.' },
          { probability: 0.1, type: 'combat', message: '낭인이 "그래도 싸우겠소!"라며 덤볐다!', enemyType: 'ronin' },
        ],
      },
    ],
  },
  {
    id: 'sacred_shrine',
    name: '신성한 사당',
    emoji: '⛩️',
    description: '검술의 신을 모신 사당이다.\n"공물을 바치면 검의 비급을 내리리라..."',
    eventType: 'skill_select',
    choices: [
      {
        text: '은전 50을 공물로 바친다',
        outcomes: [
          { probability: 1.0, type: 'skill_select_paid', message: '신의 계시가 내린다...', silverCost: 50 },
        ],
      },
      {
        text: '기도만 드린다',
        outcomes: [
          { probability: 0.7, type: 'heal', message: '신의 축복을 받았다.', value: 20 },
          { probability: 0.3, type: 'nothing', message: '마음이 평온해졌다.' },
        ],
      },
      {
        text: '지나친다',
        outcomes: [
          { probability: 1.0, type: 'nothing', message: '당신은 그냥 지나쳤다.' },
        ],
      },
    ],
  },
  {
    id: 'weapon_merchant',
    name: '무기 상인',
    emoji: '⚔️',
    description: '"명검을 찾으시오?"\n무기 상인이 귀한 검들을 펼쳐 보인다.',
    eventType: 'shop',
    choices: [
      {
        text: '검을 구경한다',
        outcomes: [
          { probability: 1.0, type: 'shop', message: '상인이 검들을 보여준다.' },
        ],
      },
      {
        text: '필요 없다',
        outcomes: [
          { probability: 1.0, type: 'nothing', message: '상인이 고개를 숙여 인사했다.' },
        ],
      },
    ],
  },
];

/**
 * 티어에 맞는 랜덤 이벤트 반환
 * 상인 이벤트는 6~9, 16~19 웨이브에서만 발생
 */
export function getRandomEvent(tier: 1 | 2, wave: number): GameEvent {
  const events = tier === 1 ? TIER1_EVENTS : TIER2_EVENTS;
  
  // 상인 이벤트는 6~9, 16~19 웨이브에서만 발생
  const isShopWave = (wave >= 6 && wave <= 9) || (wave >= 16 && wave <= 19);
  const filteredEvents = isShopWave 
    ? events 
    : events.filter(e => e.eventType !== 'shop');
  
  if (filteredEvents.length === 0) {
    return events[0]; // fallback
  }
  
  return filteredEvents[Math.floor(Math.random() * filteredEvents.length)];
}

/**
 * 결과 확률에 따라 랜덤 선택
 */
export function getRandomOutcome(outcomes: EventOutcome[]): EventOutcome {
  const roll = Math.random();
  let cumulative = 0;
  
  for (const outcome of outcomes) {
    cumulative += outcome.probability;
    if (roll < cumulative) {
      return outcome;
    }
  }
  
  // 확률 합계가 1 미만인 경우 마지막 반환
  return outcomes[outcomes.length - 1];
}

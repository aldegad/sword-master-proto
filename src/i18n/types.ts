// i18n 타입 정의

export type Locale = 'ko' | 'en';

export interface TranslationParams {
  [key: string]: string | number;
}

// 번역 데이터 구조
export interface Translations {
  ui: {
    topBar: {
      health: string;
      mana: string;
      level: string;
      wave: string;
      turn: string;
      score: string;
      silver: string;
      passive: string;
    };
    phases: {
      running: string;
      combat: string;
      victory: string;
      paused: string;
      gameOver: string;
      event: string;
    };
    buttons: {
      endTurn: string;
      wait: string;
      cancel: string;
      exchange: string;
      restart: string;
      exit: string;
      purchase: string;
      skip: string;
      confirm: string;
      select: string;
      close: string;
    };
    cards: {
      hand: string;
      deck: string;
      grave: string;
      handMax: string;
      attack: string;
      defense: string;
      durability: string;
      mana: string;
      range: string;
      pierce: string;
      attackCount: string;
    };
    range: {
      single: string;
      double: string;
      triple: string;
      all: string;
    };
    shop: {
      title: string;
      notEnough: string;
      purchased: string;
      merchantLeft: string;
      price: string;
    };
    reward: {
      title: string;
      skip: string;
      bossReward: string;
      selectSword: string;
    };
    levelUp: {
      title: string;
      selectSkill: string;
      step: string;
    };
    event: {
      title: string;
    };
    deckViewer: {
      title: string;
      empty: string;
    };
    tooltip: {
      drawAttack: string;
      swift: string;
      unique: string;
      effect: string;
    };
    messages: {
      victory: string;
      defeat: string;
      newWave: string;
      bossAppear: string;
    };
    landing: {
      title: string;
      subtitle: string;
      start: string;
      demo: string;
      steamSoon: string;
      madeIn: string;
    };
  };
  data: {
    swords: Record<string, {
      name: string;
      description: string;
      drawAttack?: {
        name: string;
        effect: string;
      };
      specialEffect?: string;
    }>;
    prefixes: Record<string, { name: string }>;
    skills: Record<string, {
      name: string;
      description: string;
    }>;
    enemies: Record<string, {
      name: string;
      actions?: Record<string, {
        name: string;
        description?: string;
      }>;
    }>;
    passives: Record<string, {
      name: string;
      description: string;
    }>;
    events: Record<string, {
      name: string;
      description: string;
      choices: Record<string, string>;
      outcomes?: Record<string, string>;
    }>;
  };
}

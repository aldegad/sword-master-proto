type Locale = 'ko' | 'en';

const STORAGE_KEY = 'sword-master-locale';

const translations = {
  ko: {
    badge: '🎮 무료 데모 • Steam 출시 예정',
    title: '검을 두른 채 걷다',
    desc: '전설의 검을 수집하고, 카드를 조합하여<br>당신만의 전투 스타일을 완성하세요',
    startBtn: '게임 시작',
    playBtn: '🎮 플레이',
    rulebookBtn: '📖 룰북',
    features: {
      title: '게임 특징',
      sword: { title: '전설의 검 수집', desc: '카타나, 무라마사, 쿠사나기 등 각자 고유한 능력을 가진 전설의 검들을 수집하고 마스터하세요.' },
      deck: { title: '전략적 덱빌딩', desc: '공격, 방어, 스킬 카드를 조합하여 상황에 맞는 최적의 전략을 구사하세요.' },
      skill: { title: '스킬 성장', desc: '레벨업을 통해 강력한 패시브 스킬을 해금하고 캐릭터를 강화하세요.' },
      boss: { title: '도전적인 보스', desc: '웨이브를 클리어하고 강력한 보스에 도전하여 희귀한 보상을 획득하세요.' },
    },
    controls: {
      title: '조작법',
      click: { key: '클릭', desc: '카드 선택/사용' },
      drag: { key: '드래그', desc: '카드로 공격' },
      space: { desc: '턴 종료' },
      d: { desc: '덱 보기' },
    },
    faq: {
      title: '자주 묻는 질문',
      mobile: { q: '모바일에서도 플레이할 수 있나요?', a: '네, 모바일 브라우저에서도 터치로 플레이할 수 있습니다.' },
      save: { q: '게임 진행이 저장되나요?', a: '현재 웹 데모 버전에서는 세션 중에만 진행이 유지됩니다. Steam 정식 버전(v2)에서는 저장 기능이 지원될 예정입니다.' },
      free: { q: '이 게임은 무료인가요?', a: '현재 플레이 중인 버전은 무료 데모입니다. v1 소스코드는 <a href="https://github.com/aldegad/sword-master" target="_blank" rel="noopener noreferrer">GitHub</a>에서 오픈소스로 공개되어 있습니다. 현재 v2를 개발 중이며, Steam 출시를 준비하고 있습니다.' },
    },
    footer: {
      support: '게임이 재밌으셨다면 응원 메시지를 보내주세요! 🙏',
      email: '응원 메일 보내기',
    },
  },
  en: {
    badge: '🎮 Free Demo • Coming to Steam',
    title: 'Walk with the Blade',
    desc: 'Collect legendary swords, combine cards,<br>and forge your own combat style',
    startBtn: 'Start Game',
    playBtn: '🎮 Play',
    rulebookBtn: '📖 Rulebook',
    features: {
      title: 'Features',
      sword: { title: 'Collect Legendary Swords', desc: 'Collect and master legendary swords like Katana, Muramasa, and Kusanagi, each with unique abilities.' },
      deck: { title: 'Strategic Deck Building', desc: 'Combine attack, defense, and skill cards to execute optimal strategies for any situation.' },
      skill: { title: 'Skill Progression', desc: 'Unlock powerful passive skills through leveling up and strengthen your character.' },
      boss: { title: 'Challenging Bosses', desc: 'Clear waves and challenge powerful bosses to earn rare rewards.' },
    },
    controls: {
      title: 'Controls',
      click: { key: 'Click', desc: 'Select/Use Card' },
      drag: { key: 'Drag', desc: 'Attack with Card' },
      space: { desc: 'End Turn' },
      d: { desc: 'View Deck' },
    },
    faq: {
      title: 'FAQ',
      mobile: { q: 'Can I play on mobile?', a: 'Yes, you can play with touch controls on mobile browsers.' },
      save: { q: 'Is progress saved?', a: 'Currently, progress is only maintained during the session in the web demo. Save functionality will be supported in the Steam release (v2).' },
      free: { q: 'Is this game free?', a: 'The version you are playing is a free demo. The v1 source code is open source on <a href="https://github.com/aldegad/sword-master" target="_blank" rel="noopener noreferrer">GitHub</a>. We are currently developing v2 and preparing for Steam release.' },
    },
    footer: {
      support: 'If you enjoyed the game, please send a message of support! 🙏',
      email: 'Send Support Email',
    },
  },
} as const;

function detectBrowserLocale(): Locale {
  const browserLang = navigator.language.split('-')[0];
  return browserLang === 'ko' ? 'ko' : 'en';
}

function getLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'ko' || stored === 'en') return stored;
  return detectBrowserLocale();
}

function setLocale(locale: Locale): void {
  localStorage.setItem(STORAGE_KEY, locale);
  document.documentElement.lang = locale;
  applyTranslations(locale);
}

function t(locale: Locale, key: string): string {
  const keys = key.split('.');
  let value: unknown = translations[locale];

  for (const segment of keys) {
    value = (value as Record<string, unknown>)?.[segment];
    if (value === undefined) {
      return key;
    }
  }

  return typeof value === 'string' ? value : key;
}

function applyTranslations(locale: Locale): void {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (!key) return;

    const text = t(locale, key);
    if (el.dataset.i18nHtml === 'true') {
      el.innerHTML = text;
    } else {
      el.textContent = text;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  let currentLocale = getLocale();
  setLocale(currentLocale);

  const langToggle = document.getElementById('lang-toggle');
  langToggle?.addEventListener('click', () => {
    currentLocale = currentLocale === 'ko' ? 'en' : 'ko';
    setLocale(currentLocale);
  });
});

export {};

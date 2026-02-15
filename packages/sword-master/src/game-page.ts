type Locale = 'ko' | 'en';

const STORAGE_KEY = 'sword-master-locale';

const labels = {
  ko: {
    home: '← 홈',
    rulebook: '📖 룰북',
    fullscreen: '⛶ 전체화면',
    exitFullscreen: '✕ 나가기',
  },
  en: {
    home: '← Home',
    rulebook: '📖 Rulebook',
    fullscreen: '⛶ Fullscreen',
    exitFullscreen: '✕ Exit',
  },
} as const;

function detectLocale(): Locale {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'ko' || saved === 'en') return saved;
  return navigator.language.startsWith('ko') ? 'ko' : 'en';
}

function applyLocale(locale: Locale): void {
  document.documentElement.lang = locale;
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n as keyof (typeof labels)['ko'] | undefined;
    if (!key) return;
    el.textContent = labels[locale][key];
  });
}

function getFullscreenText(locale: Locale): string {
  return document.fullscreenElement ? labels[locale].exitFullscreen : labels[locale].fullscreen;
}

document.addEventListener('DOMContentLoaded', () => {
  const locale = detectLocale();
  applyLocale(locale);

  const fullscreenBtn = document.getElementById('fullscreen-btn');
  if (!fullscreenBtn) return;

  fullscreenBtn.textContent = getFullscreenText(locale);

  fullscreenBtn.addEventListener('click', async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen().catch(() => undefined);
    }
    fullscreenBtn.textContent = getFullscreenText(locale);
  });

  document.addEventListener('fullscreenchange', () => {
    fullscreenBtn.textContent = getFullscreenText(locale);
  });
});

export {};

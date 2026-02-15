export type Locale = 'ko' | 'en';

export const LOCALE_STORAGE_KEY = 'sword-master-locale';
export const LOCALE_EVENT = 'sword-master-locale-change';

export function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'ko';

  const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (saved === 'ko' || saved === 'en') return saved;

  return window.navigator.language.startsWith('ko') ? 'ko' : 'en';
}

export function applyLocale(locale: Locale): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale;
}

export function saveLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  applyLocale(locale);
  window.dispatchEvent(new CustomEvent(LOCALE_EVENT, { detail: locale }));
}

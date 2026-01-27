'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import ko from './locales/ko.json';
import en from './locales/en.json';

export type Locale = 'ko' | 'en';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const translations: Record<Locale, any> = { ko, en };

interface I18nStore {
  locale: Locale;
  _hasHydrated: boolean;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  setHasHydrated: (state: boolean) => void;
}

// 기본 locale (SSR과 CSR 모두 동일해야 hydration 에러 방지)
const DEFAULT_LOCALE: Locale = 'ko';

export const useI18nStore = create<I18nStore>()(
  persist(
    (set, get) => ({
      locale: DEFAULT_LOCALE,
      _hasHydrated: false,
      setLocale: (locale: Locale) => set({ locale }),
      toggleLocale: () => {
        const current = get().locale;
        set({ locale: current === 'ko' ? 'en' : 'ko' });
      },
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
    }),
    {
      name: 'sprite-generator-locale',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

/**
 * 번역 키로 텍스트 가져오기
 */
export function t(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const keys = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = translations[locale];

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) break;
  }

  if (typeof value !== 'string') {
    console.warn(`Missing translation: ${key}`);
    return key;
  }

  if (params) {
    value = value.replace(/\{(\w+)\}/g, (_: string, p: string) =>
      String(params[p] ?? `{${p}}`)
    );
  }

  return value;
}

/**
 * React 훅: SSR 호환 번역 훅
 */
export function useTranslation() {
  const locale = useI18nStore((state) => state.locale);
  const hasHydrated = useI18nStore((state) => state._hasHydrated);

  // SSR에서는 항상 DEFAULT_LOCALE 사용
  const effectiveLocale = hasHydrated ? locale : DEFAULT_LOCALE;

  return {
    t: (key: string, params?: Record<string, string | number>) =>
      t(effectiveLocale, key, params),
    locale: effectiveLocale,
    setLocale: useI18nStore.getState().setLocale,
    toggleLocale: useI18nStore.getState().toggleLocale,
  };
}

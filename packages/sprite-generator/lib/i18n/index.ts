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
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

// 브라우저 언어 감지
function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return 'ko';
  const browserLang = navigator.language.split('-')[0];
  return browserLang === 'ko' ? 'ko' : 'en';
}

export const useI18nStore = create<I18nStore>()(
  persist(
    (set, get) => ({
      locale: detectBrowserLocale(),
      setLocale: (locale: Locale) => set({ locale }),
      toggleLocale: () => {
        const current = get().locale;
        set({ locale: current === 'ko' ? 'en' : 'ko' });
      },
    }),
    {
      name: 'sprite-generator-locale',
      // 저장된 값이 없으면 브라우저 언어 사용
      onRehydrateStorage: () => (state) => {
        if (!state?.locale) {
          state?.setLocale(detectBrowserLocale());
        }
      },
    }
  )
);

/**
 * 번역 키로 텍스트 가져오기
 * @param key 점 표기법 키 (예: 'header.title')
 * @param params 보간 파라미터 (예: { count: 5 })
 * @returns 번역된 텍스트
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

  // 보간: {variable}
  if (params) {
    value = value.replace(/\{(\w+)\}/g, (_: string, p: string) =>
      String(params[p] ?? `{${p}}`)
    );
  }

  return value;
}

/**
 * React 훅: 현재 locale에 맞는 t 함수 반환
 */
export function useTranslation() {
  const locale = useI18nStore((state) => state.locale);

  return {
    t: (key: string, params?: Record<string, string | number>) =>
      t(locale, key, params),
    locale,
    setLocale: useI18nStore.getState().setLocale,
    toggleLocale: useI18nStore.getState().toggleLocale,
  };
}

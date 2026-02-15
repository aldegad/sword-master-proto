// i18n 시스템 - 경량 다국어 지원
import type { Locale, TranslationParams } from './types';
import ko from './locales/ko.json';
import en from './locales/en.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const translations: Record<Locale, any> = { ko, en };

const STORAGE_KEY = 'sword-master-locale';

class I18n {
  private locale: Locale = 'ko';
  private cache: Map<string, string> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadSavedLocale();
  }

  private loadSavedLocale() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale;
      if (saved && translations[saved]) {
        this.locale = saved;
      } else {
        // 브라우저 언어 감지
        const browserLang = navigator.language.split('-')[0];
        this.locale = browserLang === 'ko' ? 'ko' : 'en';
      }
    } catch {
      // localStorage 접근 불가 시 기본값 사용
      this.locale = 'ko';
    }
  }

  setLocale(locale: Locale) {
    if (this.locale === locale) return;

    this.locale = locale;
    this.cache.clear();

    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // localStorage 접근 불가 시 무시
    }

    // 리스너들에게 언어 변경 알림
    this.listeners.forEach(listener => listener());
  }

  getLocale(): Locale {
    return this.locale;
  }

  toggleLocale(): Locale {
    const newLocale = this.locale === 'ko' ? 'en' : 'ko';
    this.setLocale(newLocale);
    return newLocale;
  }

  // 언어 변경 리스너 등록
  onLocaleChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 번역 키로 텍스트 가져오기
   * @param key 점 표기법 키 (예: 'ui.topBar.health')
   * @param params 보간 파라미터 (예: { wave: 5 })
   * @returns 번역된 텍스트
   */
  t(key: string, params?: TranslationParams): string {
    const cacheKey = params ? `${key}:${JSON.stringify(params)}` : key;

    if (!params && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const keys = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = translations[this.locale];

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }

    if (typeof value !== 'string') {
      console.warn(`Missing translation: ${key}`);
      return key;
    }

    // 보간: {{variable}}
    let result: string = value;
    if (params) {
      result = result.replace(/\{\{(\w+)\}\}/g, (_, p: string) =>
        String(params[p] ?? `{{${p}}}`)
      );
    }

    if (!params) {
      this.cache.set(cacheKey, result);
    }

    return result;
  }

  // === 데이터 헬퍼 함수 ===

  getSwordName(id: string): string {
    return this.t(`data.swords.${id}.name`);
  }

  getSwordDescription(id: string): string {
    return this.t(`data.swords.${id}.description`);
  }

  getSwordDrawAttackName(id: string): string {
    return this.t(`data.swords.${id}.drawAttack.name`);
  }

  getSwordDrawAttackEffect(id: string): string {
    return this.t(`data.swords.${id}.drawAttack.effect`);
  }

  getSwordSpecialEffect(id: string): string {
    return this.t(`data.swords.${id}.specialEffect`);
  }

  getPrefixName(id: string): string {
    return this.t(`data.prefixes.${id}.name`);
  }

  getSkillName(id: string): string {
    return this.t(`data.skills.${id}.name`);
  }

  getSkillDescription(id: string): string {
    return this.t(`data.skills.${id}.description`);
  }

  getEnemyName(id: string): string {
    return this.t(`data.enemies.${id}.name`);
  }

  getEnemyActionName(enemyId: string, actionId: string): string {
    return this.t(`data.enemies.${enemyId}.actions.${actionId}.name`);
  }

  getPassiveName(id: string): string {
    return this.t(`data.passives.${id}.name`);
  }

  getPassiveDescription(id: string): string {
    return this.t(`data.passives.${id}.description`);
  }

  getEventName(id: string): string {
    return this.t(`data.events.${id}.name`);
  }

  getEventDescription(id: string): string {
    return this.t(`data.events.${id}.description`);
  }

  getEventChoice(eventId: string, choiceId: string): string {
    return this.t(`data.events.${eventId}.choices.${choiceId}`);
  }

  getEventOutcome(eventId: string, outcomeId: string): string {
    return this.t(`data.events.${eventId}.outcomes.${outcomeId}`);
  }

  // 범위 텍스트
  getRangeText(reach: string): string {
    if (reach === 'single') return this.t('ui.range.single');
    if (reach === 'double') return this.t('ui.range.double');
    if (reach === 'triple') return this.t('ui.range.triple');
    if (reach === 'all') return this.t('ui.range.all');
    if (reach === 'swordDouble') return this.t('ui.range.swordDouble');
    if (reach === 'weapon') return this.t('ui.range.weapon');
    return reach;
  }
}

export const i18n = new I18n();
export const t = i18n.t.bind(i18n);
export { Locale, TranslationParams };

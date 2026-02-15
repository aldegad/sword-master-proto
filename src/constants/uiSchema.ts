export type TopRightHudTextId = 'turn' | 'score' | 'silver';

export const TOP_RIGHT_HUD_TEXT_ITEMS = [
  { id: 'turn', yKey: 'turn' },
  { id: 'score', yKey: 'score' },
  { id: 'silver', yKey: 'silver' },
] as const;

export type TopLeftHudSectionId = 'hp' | 'mana' | 'swordInfo' | 'passive';

export const TOP_LEFT_HUD_SECTIONS = [
  { id: 'hp' },
  { id: 'mana' },
  { id: 'swordInfo' },
  { id: 'passive' },
] as const;

export type SettingsMenuActionId = 'fullscreen' | 'locale' | 'rulebook' | 'restart' | 'mainMenu';

export const SETTINGS_MENU_ITEMS = [
  { id: 'fullscreen', yKey: 'fullscreen', iconKey: 'icon-fullscreen' },
  { id: 'locale', yKey: 'locale', iconKey: 'icon-language' },
  { id: 'rulebook', yKey: 'rulebook', iconKey: 'icon-book' },
  { id: 'restart', yKey: 'restart', iconKey: 'icon-restart' },
  { id: 'mainMenu', yKey: 'mainMenu', iconKey: 'icon-home' },
] as const;

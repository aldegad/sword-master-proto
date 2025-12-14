import type { PassiveTemplate, PlayerPassive } from '../types';

// 패시브 스킬 템플릿
export const PASSIVES: Record<string, PassiveTemplate> = {
  waitIncrease: {
    id: 'waitIncrease',
    name: '인내심',
    description: '턴당 대기 가능 횟수 +1',
    maxLevel: 3,
    effect: { type: 'waitIncrease', value: 1 },
  },
  perfectCast: {
    id: 'perfectCast',
    name: '비전의 경지',
    description: '내구도와 상관없이 스킬을 완벽하게 시전합니다',
    maxLevel: 1,
    effect: { type: 'perfectCast', value: 1 },
  },
  defenseBonus: {
    id: 'defenseBonus',
    name: '강철 피부',
    description: '방어율 1% 증가',
    maxLevel: 10,
    effect: { type: 'defenseBonus', value: 1 },
  },
};

/**
 * 랜덤 패시브 스킬 템플릿 반환
 */
export function getRandomPassive(): PassiveTemplate {
  const passiveIds = Object.keys(PASSIVES);
  const randomId = passiveIds[Math.floor(Math.random() * passiveIds.length)];
  return PASSIVES[randomId];
}

/**
 * 패시브 스킬을 플레이어에게 추가/레벨업
 */
export function addOrUpgradePassive(passives: PlayerPassive[], passiveId: string): PlayerPassive[] {
  const template = PASSIVES[passiveId];
  if (!template) return passives;
  
  const existing = passives.find(p => p.id === passiveId);
  
  if (existing) {
    // 이미 있으면 레벨업 (최대 레벨 체크)
    if (existing.level < existing.maxLevel) {
      existing.level++;
    }
    return passives;
  } else {
    // 없으면 새로 추가
    const newPassive: PlayerPassive = {
      id: template.id,
      name: template.name,
      description: template.description,
      level: 1,
      maxLevel: template.maxLevel,
      effect: { ...template.effect },
    };
    return [...passives, newPassive];
  }
}

/**
 * 특정 패시브가 있는지 확인
 */
export function hasPassive(passives: PlayerPassive[], passiveId: string): boolean {
  return passives.some(p => p.id === passiveId && p.level > 0);
}

/**
 * 패시브 레벨 반환 (없으면 0)
 */
export function getPassiveLevel(passives: PlayerPassive[], passiveId: string): number {
  const passive = passives.find(p => p.id === passiveId);
  return passive ? passive.level : 0;
}


import type { ResolvedReachType } from '../types';

const REACH_ORDER: ResolvedReachType[] = ['single', 'double', 'triple', 'all'];

const REACH_TO_COUNT: Record<ResolvedReachType, number> = {
  single: 1,
  double: 2,
  triple: 3,
  all: 999,
};

function normalizeResolvedReach(reach: string): ResolvedReachType {
  if (reach === 'single' || reach === 'double' || reach === 'triple' || reach === 'all') {
    return reach;
  }
  return 'single';
}

function reachFromCount(targetCount: number): ResolvedReachType {
  if (targetCount >= 4) return 'all';
  if (targetCount >= 3) return 'triple';
  if (targetCount >= 2) return 'double';
  return 'single';
}

/**
 * 무기 범위와 스킬 범위를 우선순위로 합친다.
 */
export function combineReachByPriority(swordReach: string, skillReach: string): ResolvedReachType {
  const normalizedSword = normalizeResolvedReach(swordReach);
  const normalizedSkill = normalizeResolvedReach(skillReach);
  const swordIdx = REACH_ORDER.indexOf(normalizedSword);
  const skillIdx = REACH_ORDER.indexOf(normalizedSkill);
  return REACH_ORDER[Math.max(swordIdx, skillIdx)];
}

/**
 * 스킬의 최종 적용 범위를 계산한다.
 * - `single`/`weapon`: 무기 범위 사용
 * - `swordDouble`: 무기 범위를 타겟 수 기준으로 2배 확장 후 범위 환산
 * - 그 외: 스킬 자체 범위 사용
 */
export function resolveReachWithSword(skillReach: string, swordReach: string): ResolvedReachType {
  const normalizedSword = normalizeResolvedReach(swordReach);

  if (skillReach === 'single' || skillReach === 'weapon') {
    return normalizedSword;
  }

  if (skillReach === 'swordDouble') {
    const doubled = REACH_TO_COUNT[normalizedSword] * 2;
    return reachFromCount(doubled);
  }

  return normalizeResolvedReach(skillReach);
}

/**
 * 범위 값을 타겟 수로 변환한다.
 * - 문자 범위(single/double/triple/all) + 숫자 문자열("2", "3") 모두 처리
 */
export function getTargetCountByReach(reach: string): number {
  if (reach === 'single' || reach === 'double' || reach === 'triple' || reach === 'all') {
    return REACH_TO_COUNT[reach];
  }

  const parsed = Number.parseInt(reach, 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return 1;
}

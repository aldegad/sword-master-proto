/**
 * 공용 타입 정의
 */

// 공격 범위 타입
// swordDouble: 무기 범위의 2배 (single→2, double→4, triple→6)
export type ReachType = 'single' | 'double' | 'triple' | 'all' | 'swordDouble';

// 실제 타겟 판정 시 사용하는 확정 범위 타입
export type ResolvedReachType = Exclude<ReachType, 'swordDouble'>;

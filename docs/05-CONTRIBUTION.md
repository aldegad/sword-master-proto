# 소드마스터 - 개발 가이드

## 1) 기본 명령어

```bash
pnpm install
pnpm dev
pnpm build
pnpm test:e2e
pnpm run deploy
```

## 2) 작업 원칙

- 런타임 로직은 `app/game/PixiGame.tsx` 중심으로 유지
- 밸런스 데이터는 `lib/game-data.ts`를 단일 소스로 사용
- 룰 설명은 `app/rulebook/page.tsx`와 `docs/*`를 함께 업데이트
- 문서에 현재 미구현 기능을 구현된 것처럼 쓰지 않기

## 3) 기능 수정 체크리스트

### 카드/적 밸런스 변경

1. `lib/game-data.ts` 수정
2. `app/rulebook/page.tsx` 표/설명 확인
3. `docs/02-GAME-SYSTEMS.md`, `docs/04-DATA-REFERENCE.md` 동기화
4. `pnpm build` + `pnpm test:e2e` 실행

### Pixi 렌더/UI 변경

1. `app/game/PixiGame.tsx` 수정
2. 모바일 뷰포트(최소 390px 폭) 확인
3. 캔버스 초기화/resize/cleanup 누락 여부 확인

### 페이지/네비게이션 변경

1. `app/layout.tsx`, `components/common/SiteNav.tsx` 확인
2. `/`, `/game`, `/rulebook` 링크 무결성 확인
3. 정적 빌드 후 직접 라우팅 테스트

## 4) 테스트 기준

최소 기준:
- `pnpm build` 성공
- e2e 스크린샷 테스트 통과
- `/game`에서 캔버스 렌더 및 카드 클릭 동작
- `/rulebook` 주요 섹션 렌더

## 5) 배포 절차

1. 로컬 검증 (`build`, `test:e2e`)
2. `pnpm run deploy`
3. 배포 URL에서 `/`, `/game`, `/rulebook` 실확인
4. 배포 후 README의 데모 링크가 최신인지 점검

## 6) 커밋 가이드

- 한 커밋에 한 목적(예: 밸런스 조정, 룰북 수정, 아키텍처 정리)
- 변경 이유가 드러나는 메시지 사용
- 문서 동기화가 필요한 변경은 같은 커밋에 포함

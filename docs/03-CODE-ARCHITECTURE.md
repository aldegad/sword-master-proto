# 소드마스터 - 코드 아키텍처

## 1) 리포지토리 구조

이 리포지토리는 **단일 프로젝트(Next.js App Router)** 구조입니다.
모노레포 하위 앱 분리 없이, 랜딩/게임/룰북을 한 앱에서 라우팅합니다.

```text
app/
  layout.tsx               # 공통 레이아웃 + 상단 네비게이션
  page.tsx                 # 랜딩 페이지
  game/
    page.tsx               # 게임 페이지 엔트리
    PixiGame.tsx           # Pixi 런타임(실제 게임 로직)
  rulebook/
    page.tsx               # 룰북 페이지
components/
  common/SiteNav.tsx       # 공통 네비게이션
  landing/LandingContent.tsx
lib/
  game-data.ts             # 카드/적/기본값 데이터 소스
e2e/
  game/screenshot.spec.ts  # 기본 화면 회귀 테스트
```

## 2) 런타임 책임 분리

- Next.js 페이지: 라우팅, 정적 콘텐츠, 문서 렌더링
- PixiGame: 전투 상태/입력/렌더링을 포함한 게임 런타임
- game-data: 밸런스 상수와 데이터 정의의 단일 소스

핵심 원칙:
- 웹 페이지 레이어와 게임 엔진 레이어를 분리
- 룰북 표/설명은 가능하면 `lib/game-data.ts` 값을 재사용

## 3) PixiGame 내부 구조

`app/game/PixiGame.tsx`는 하나의 React 클라이언트 컴포넌트로 동작합니다.

초기화 흐름:
1. `useEffect`에서 Pixi `Application` 생성
2. 캔버스를 DOM에 연결
3. 시작 덱/웨이브 생성
4. 첫 턴 시작 후 `render()` 호출

주요 상태:
- `player`: hp, mana, block, gold, wave
- `deck/discard/hand`: 카드 순환
- `enemies`: 웨이브 적 상태
- `message`, `gameOver`

주요 함수:
- `startTurn()`
- `playCard(handIndex)`
- `endTurn()`
- `clearWaveIfNeeded()`
- `restart()`
- `render()`

## 4) 렌더링 전략

현재 그래픽 정책은 **단색/미니멀 UI**입니다.

- 배경/패널/카드 모두 단순한 도형 + 텍스트
- 과도한 쉐이더/노이즈/라인 효과 미사용
- 상태가 바뀔 때마다 `render()`로 전체 UI 재구성

이 방식은 프로토타입 단계에서 디버깅과 밸런싱에 유리합니다.

## 5) 페이지 구성

- `/` : 소개/진입 허브
- `/game` : Pixi 캔버스 런타임
- `/rulebook` : 구현 기준 룰 설명

즉, 게임과 랜딩은 URL 레벨에서 분리되어 있습니다.

## 6) 빌드/배포 형태

- `next build`로 정적 출력(`dist/`) 생성
- Firebase Hosting에서 정적 파일 배포

이 구조는 일반적인 정적 빌드 배포 형태이며,
클라이언트 번들 코드가 브라우저에서 로드되는 방식입니다.

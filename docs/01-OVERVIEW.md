# 소드마스터 - 프로젝트 개요

## 프로젝트 성격

현재 리포지토리는 **Next.js(App Router) + Pixi.js** 기반의 웹 게임 프로젝트입니다.

- `/` : 랜딩 페이지
- `/game` : Pixi 런타임 게임 화면
- `/rulebook` : 현재 구현 기준 룰북

## 게임 컨셉

- 장르: 턴제 카드 전투 (웨이브 생존형)
- 핵심 루프: 카드 사용 → 적 대기턴 감소 → 적 행동 → 턴 종료/다음 턴
- 승리 조건: 명시적 엔딩 없음, 가능한 높은 웨이브 도달
- 패배 조건: 플레이어 HP 0

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router, static export) |
| 렌더링 | Pixi.js 8 |
| 언어 | TypeScript |
| 배포 | Firebase Hosting |
| 테스트 | Playwright |

## 로컬 실행

```bash
pnpm install
pnpm dev
```

개발 서버: `http://localhost:3000`

## 빌드/배포

```bash
pnpm build
pnpm run deploy
```

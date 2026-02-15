# 소드마스터 (Sword Master) - 프로젝트 개요

## 🎮 게임 소개

**소드마스터**는 Phaser.js + TypeScript로 개발된 **액션 카드 러너 게임**입니다.

플레이어는 끊임없이 달리며 적들과 조우하고, **검 카드**와 **스킬 카드**를 조합하여 전투를 벌입니다.

## 🎯 핵심 컨셉

- **러너 + 덱빌딩**: 이동 중 적 조우 → 전투 → 승리 → 이동 반복
- **크로노아크 스타일 턴제**: 카드 사용 시 적의 대기턴 감소
- **무기 시스템**: 검마다 공격력, 횟수, 범위, 내구도가 다름
- **스킬 카드**: 검에 의존하는 기술 카드

## 🗂️ 기술 스택

| 분류 | 기술 |
|------|------|
| 언어 | TypeScript |
| 게임 엔진 | Phaser 3 |
| 빌드 도구 | Vite |
| 패키지 매니저 | npm |

## 📁 프로젝트 구조

```
sword-master/
├── src/
│   ├── main.ts              # 게임 진입점
│   ├── types/
│   │   └── index.ts         # 타입 정의
│   ├── data/
│   │   ├── swords.ts        # 검 데이터 (25종)
│   │   ├── skills.ts        # 스킬 데이터 (30종+)
│   │   └── enemies.ts       # 적 데이터
│   └── scenes/
│       ├── BootScene.ts     # 로딩 & 타이틀
│       ├── GameScene.ts     # 메인 게임 로직
│       └── UIScene.ts       # UI 레이어
├── docs/                    # 문서
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🎮 조작법

| 키 | 동작 |
|----|------|
| `1` ~ `0` | 손패 카드 사용 (1번~10번) |
| `SPACE` | 턴 종료 (적 남은 행동 모두 발동) |
| `W` | 대기 (적 대기턴 -1, 턴당 1회) |
| 마우스 | 카드 호버 → 상세 정보 / 클릭 → 사용 |

## 🚀 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

개발 서버: http://localhost:3000


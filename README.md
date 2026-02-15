# Sword Master

**Action Card Runner Game** - 검의 달인이 되어 적을 베어라.

Phaser 3 기반의 덱빌딩 액션 게임 데모 프로젝트입니다.

## Live Demo

- Sword Master (Landing): https://sword-master-a7a97.web.app/
- Sword Master (Game): https://sword-master-a7a97.web.app/game/
- Rulebook: https://sword-master-a7a97.web.app/rulebook/

## Sprite Generator Notice

기존 스프라이트 제네레이터는 이 저장소에서 분리되었습니다.

- Legacy repo: https://github.com/aldegad/artkit-legacy
- Legacy service: https://sprite-generator.web.app/

현재 유지보수되는 최신 프로젝트는 아래입니다.

- Maintained repo: https://github.com/aldegad/artkit
- Maintained service: https://artkit.web.app/

## Features

- 카드 기반 전투 시스템 (공격/방어/스킬)
- 웨이브 진행 + 보스전
- 스킬 성장 및 상점 시스템
- 검 수집/강화
- 한국어/영어 지원

## Tech Stack

- TypeScript
- Phaser 3
- Vite
- Firebase Hosting

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Install

```bash
pnpm install
```

### Dev

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

### Deploy

```bash
pnpm deploy
```

## Project Structure

```
index.html            # Landing page (/)
game/index.html       # Game page (/game/)
rulebook/index.html   # Rulebook page (/rulebook/)
src/                  # Phaser game source
public/               # Static assets
```

## License

PolyForm Noncommercial License 1.0.0

상업적 라이선스 문의: aldegad@gmail.com

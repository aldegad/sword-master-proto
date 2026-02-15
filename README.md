# Sword Master

Sword Master 웹 허브/데모 리포지토리입니다.

현재 구조는 **Next.js(App Router)** 기반이며, 게임 캔버스는 **Phaser.js** 런타임으로 분리되어 있습니다.

## Live Demo

- Landing: https://sword-master-a7a97.web.app/
- Game: https://sword-master-a7a97.web.app/game/
- Rulebook: https://sword-master-a7a97.web.app/rulebook/

## Tech Stack

- Next.js 14 (App Router, Static Export)
- React 18
- Phaser.js 3
- TypeScript
- Firebase Hosting

## Scripts

```bash
yarn install
yarn dev       # http://localhost:3000
yarn build
yarn deploy
yarn test:e2e
```

## Project Structure

```text
app/
  page.tsx              # Landing
  game/page.tsx         # Phaser runtime entry
  game/PhaserGame.tsx   # Phaser bootstrap
src/
  scenes/               # Phaser scenes
  systems/              # Combat/Card/Enemy systems
  rulebook/page.tsx     # Rulebook page
components/
  common/SiteNav.tsx
  landing/LandingContent.tsx
public/
  assets/
```

## Sprite Generator Notice

스프라이트 제네레이터는 별도 저장소로 분리되었습니다.

- Legacy repo: https://github.com/aldegad/artkit-legacy
- Maintained repo: https://github.com/aldegad/artkit
- Maintained service: https://artkit.web.app/

## License

PolyForm Noncommercial License 1.0.0

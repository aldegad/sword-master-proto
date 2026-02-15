# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
yarn install
yarn dev
yarn build
yarn deploy
yarn test:e2e
```

## Architecture

- Next.js App Router structure (`app/`)
- Landing page: `app/page.tsx`
- Game runtime page: `app/game/page.tsx`
- Rulebook page: `app/rulebook/page.tsx`
- Pixi runtime bootstrap: `app/game/PixiGame.tsx`

## Notes

- Game runtime is Pixi.js based.
- Firebase deploys static export output (`dist/`).
- Do NOT add `Co-Authored-By` to commit messages.

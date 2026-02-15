# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies (requires pnpm 8+, Node.js 18+)
pnpm install

# Development server (port 3000)
pnpm dev

# Build
pnpm build

# Deploy to Firebase Hosting
pnpm deploy

# E2E tests
pnpm test:e2e
```

## Project Structure

Single-project repository for Sword Master (Phaser 3 game + static pages).

- `index.html` - Landing page (`/`)
- `game/index.html` - Game page (`/game/`)
- `rulebook/index.html` - Rulebook page (`/rulebook/`)
- `src/main.ts` - Phaser initialization
- `src/scenes/` - BootScene, GameScene, UIScene
- `src/systems/` - Combat/Card/Enemy/Animation systems
- `src/data/` - swords, skills, enemies, events, passives
- `src/ui/` - UI layer for UIScene
- `public/` - assets and sprite sheets

## Language

Code comments are written in Korean (한국어).

## Git Commit Rules

- Do NOT add `Co-Authored-By` to commit messages

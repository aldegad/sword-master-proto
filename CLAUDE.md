# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies (requires pnpm 8+, Node.js 18+)
pnpm install

# Development servers
pnpm dev:game      # Sword Master game on port 3000
pnpm dev:sprite    # Sprite Generator on port 3001

# Build
pnpm build:game    # Build game (tsc && vite build)
pnpm build:sprite  # Build sprite tool (next build)

# Deploy to Firebase Hosting
pnpm deploy:game
pnpm deploy:sprite
```

## Monorepo Structure

This is a pnpm workspace with two independent packages:

### sword-master (Phaser 3 Game)
Action card runner game built with Phaser 3 + TypeScript + Vite.

**Architecture:**
- `src/main.ts` - Game configuration and Phaser initialization (1920x1080 resolution)
- `src/scenes/` - Phaser scenes (BootScene → GameScene → UIScene)
- `src/systems/` - Core game logic separated into systems:
  - `CombatSystem.ts` - Battle mechanics and damage calculation
  - `CardSystem.ts` - Card drawing, playing, and deck management
  - `EnemyManager.ts` - Enemy spawning, AI, and wave progression
  - `AnimationHelper.ts` - Visual effects and animations
- `src/data/` - Game content definitions (swords, skills, enemies, events, passives)
- `src/types/` - TypeScript type definitions organized by domain (sword, skill, enemy, player, game)
- `src/ui/` - UI components rendered in UIScene

**Key patterns:**
- GameScene holds PlayerState and GameState, delegates logic to systems
- Systems receive GameScene reference and operate on shared state
- Events are used for UI updates (e.g., `statsUpdated` event)

### sprite-generator (Next.js Web App)
Video to sprite sheet converter with AI background removal.

**Architecture:**
- `app/` - Next.js App Router (page.tsx, layout.tsx)
- `components/` - React components organized by:
  - `modes/` - Mode-specific UIs (VideoMode, SpriteMode, BgRemoveMode, ExpoAssetsMode)
  - `layout/` - Header, ModeTabs
  - `shared/` - Reusable components across modes (SpriteResult, FramePreview)
  - `common/` - Generic UI primitives (Button, Card, Input, UploadArea)
- `lib/` - Core processing logic:
  - `VideoProcessor` - Frame extraction from video
  - `SpriteGenerator` - Sprite sheet creation
  - `SpriteImporter` - Parse existing sprite sheets
  - `BackgroundRemover` - AI-powered background removal using @huggingface/transformers
- `store/useAppStore.ts` - Zustand store managing all app state (mode, files, settings, results)
- `types/index.ts` - All TypeScript interfaces

**Key patterns:**
- Single Zustand store with mode-specific state sections
- All processing runs client-side in browser
- Supports pixel art-specific background removal options

## Language

Code comments are written in Korean (한국어).

## Git Commit Rules

- Do NOT add `Co-Authored-By` to commit messages

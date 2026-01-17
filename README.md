# Sword Master

**Action Card Runner Game** - 검의 달인이 되어 적을 베어라!

Phaser 3 기반의 액션 카드 러너 게임과 게임 개발 도구 모음입니다.

## Play Now

| Project | Live Demo |
|---------|-----------|
| **Sword Master** (Game) | [https://sword-master-a7a97.web.app](https://sword-master-a7a97.web.app) |
| **Sprite Generator** (Tool) | [https://sprite-generator.web.app](https://sprite-generator.web.app) |

---

## Projects

### Sword Master (Game)

Slay the Spire 스타일의 덱빌딩 + 액션 러너 게임

**Features:**
- 카드 기반 전투 시스템 - 공격, 방어, 스킬 카드를 조합하여 전투
- 다양한 검 수집 - 카타나, 와키자시, 노다치, 무라마사, 쿠사나기 등 전설의 검들
- 스킬 트리 시스템 - 레벨업하며 강력한 스킬 해금
- 웨이브 기반 진행 - 적을 처치하고 보스에 도전
- 상점 시스템 - 골드로 카드와 아이템 구매
- 패시브 능력 - 영구 버프로 캐릭터 강화

**Tech Stack:**
- TypeScript
- Phaser 3 (Game Engine)
- Vite (Build Tool)

### Sprite Generator (Tool)

게임 개발자를 위한 스프라이트 시트 생성 도구

**Features:**
- **Video to Sprite** - 동영상에서 프레임 추출하여 스프라이트 시트 생성
- **Sprite Import** - 기존 스프라이트 시트를 개별 프레임으로 분리
- **AI Background Removal** - Hugging Face Transformers 기반 AI 배경 제거
- **Metadata Export** - Phaser, Unity 호환 JSON 메타데이터 생성

**Tech Stack:**
- TypeScript
- Next.js 14 (App Router)
- Tailwind CSS
- Zustand (State Management)
- @huggingface/transformers (AI)

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/sword-master.git
cd sword-master

# Install dependencies
pnpm install
```

### Development

```bash
# Run Sword Master game (port 3000)
pnpm dev:game

# Run Sprite Generator (port 3001)
pnpm dev:sprite
```

### Build

```bash
# Build game
pnpm build:game

# Build sprite generator
pnpm build:sprite
```

### Deploy

```bash
# Deploy game to Firebase
pnpm deploy:game

# Deploy sprite generator to Firebase
pnpm deploy:sprite
```

---

## Project Structure

```
sword-master/
├── packages/
│   ├── sword-master/           # Phaser 3 Game
│   │   ├── src/
│   │   │   ├── main.ts         # Game entry point
│   │   │   ├── scenes/         # Phaser scenes
│   │   │   ├── systems/        # Game logic systems
│   │   │   ├── data/           # Game content (swords, skills, enemies)
│   │   │   ├── types/          # TypeScript types
│   │   │   └── ui/             # UI components
│   │   └── public/assets/      # Game assets
│   │
│   └── sprite-generator/       # Next.js Web App
│       ├── app/                # Next.js App Router
│       ├── components/         # React components
│       ├── lib/                # Core processing logic
│       ├── store/              # Zustand store
│       └── types/              # TypeScript types
│
├── package.json                # Root package.json (workspaces)
└── pnpm-workspace.yaml         # pnpm workspace config
```

---

## Development Status (v1.0)

### Completed
- Core game loop with wave-based progression
- Card-based combat system (attack, defense, skills)
- Multiple swords with unique abilities
- Skill tree and level-up system
- Shop and economy system
- Enemy AI and boss battles
- Sprite sheet generation from video
- AI-powered background removal
- Firebase Hosting deployment
- **i18n 다국어 지원 (한국어/영어)** - 브라우저 언어 자동 감지

### Known Issues
- AI background removal may not work in production due to ONNX runtime issues

---

## v2 Roadmap

v2 will be developed as a private project, building on the lessons learned from v1:
- Enhanced visual effects and animations
- More diverse enemy types and boss mechanics
- Equipment system beyond swords
- Story mode and progression
- Mobile touch controls
- Multiplayer features

---

## Contributing

This is v1. Feel free to:
- Report issues
- Submit pull requests for bug fixes

---

## License

**PolyForm Noncommercial License 1.0.0**

이 프로젝트는 **비상업적 용도로만** 사용할 수 있습니다.

**허용되는 사용:**
- 포트폴리오 열람 및 코드 학습
- 개인 연구 및 실험
- 교육 목적
- 비영리 단체에서의 사용

**금지되는 사용:**
- 상업적 목적의 포크 또는 배포
- 유료 서비스에 통합
- 상업용 게임 개발에 코드 재사용

상업적 라이센스가 필요하시면 연락주세요: aldegad@gmail.com

자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

---

## Support

게임이 재밌으셨다면 응원 메시지를 보내주세요! 🙏

📧 **aldegad@gmail.com**

---

Built with ❤️ by Soo Hong Kim (김수홍) in Korea 🇰🇷

# Sword Master Monorepo

게임 및 도구 프로젝트 모노레포입니다.

## 프로젝트 구조

```
packages/
├── sword-master/       # 액션 카드 러너 게임
└── sprite-generator/   # 동영상 → 스프라이트 변환 도구
```

## 시작하기

### 필수 요구사항

- Node.js 18+
- pnpm 8+

### 설치

```bash
pnpm install
```

### 개발 서버 실행

```bash
# Sword Master 게임
pnpm dev:game

# Sprite Generator 도구
pnpm dev:sprite
```

### 빌드

```bash
# Sword Master 게임 빌드
pnpm build:game

# Sprite Generator 도구 빌드
pnpm build:sprite
```

## 프로젝트 설명

### Sword Master (sword-master)

Phaser 기반의 액션 카드 러너 게임입니다.

- **포트**: 3000
- **기술 스택**: TypeScript, Phaser 3, Vite

### Sprite Generator (sprite-generator)

동영상 파일에서 프레임을 추출하여 스프라이트 시트를 생성하고 배경을 제거하는 도구입니다.

- **포트**: 3001
- **기술 스택**: TypeScript, Vite, @imgly/background-removal

#### 기능

1. **동영상 프레임 추출**: MP4, WebM, MOV 등의 동영상에서 지정된 FPS로 프레임 추출
2. **스프라이트 시트 생성**: 추출된 프레임을 하나의 스프라이트 시트로 합성
3. **AI 배경 제거**: 머신러닝 기반으로 프레임의 배경을 자동 제거
4. **메타데이터 출력**: JSON 형식의 프레임 메타데이터 생성 (Phaser, Unity 등에서 사용 가능)

## 라이센스

MIT

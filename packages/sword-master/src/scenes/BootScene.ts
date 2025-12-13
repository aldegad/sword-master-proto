import Phaser from 'phaser';
import { COLORS, COLORS_STR } from '../constants/colors';
import { PLAYER_SPRITES, USE_SPRITES, loadedSpriteMeta, type SpriteSheetMeta } from '../constants/sprites';
import { FONTS } from '../constants/typography';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  /**
   * init: JSON 메타데이터를 먼저 fetch로 로드
   */
  async init() {
    if (!USE_SPRITES) return;

    // 모든 JSON 파일을 병렬로 fetch
    const fetchPromises = PLAYER_SPRITES.map(async (sprite) => {
      try {
        const response = await fetch(sprite.jsonPath);
        if (response.ok) {
          const meta: SpriteSheetMeta = await response.json();
          loadedSpriteMeta.set(sprite.key, meta);
        }
      } catch (e) {
        console.warn(`스프라이트 메타데이터 로드 실패: ${sprite.jsonPath}`);
      }
    });

    await Promise.all(fetchPromises);
  }

  preload() {
    // 로딩 진행 표시
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(COLORS.background.dark, 0.9);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
    progressBox.lineStyle(2, COLORS.border.medium);
    progressBox.strokeRect(width / 2 - 160, height / 2 - 25, 320, 50);
    
    const loadingText = this.add.text(width / 2, height / 2 - 50, '준비중...', {
      font: FONTS.message,
      color: COLORS_STR.primary.dark
    }).setOrigin(0.5);
    
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(COLORS.primary.dark, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });
    
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });
    
    // 스프라이트 로드 (atlas 형식으로 변경)
    if (USE_SPRITES) {
      PLAYER_SPRITES.forEach(sprite => {
        // Aseprite/TexturePacker JSON Array 형식은 atlas로 로드
        this.load.atlas(sprite.key, sprite.imagePath, sprite.jsonPath);
      });
    } else {
      // 더미 로드 (바로 넘어가지 않게)
      for (let i = 0; i < 10; i++) {
        this.load.image(`dummy${i}`, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
      }
    }
  }

  /**
   * 스프라이트 애니메이션 생성 (atlas 방식)
   */
  private createAnimations() {
    if (!USE_SPRITES) return;

    PLAYER_SPRITES.forEach(sprite => {
      const meta = loadedSpriteMeta.get(sprite.key);
      const totalFrames = meta?.meta.totalFrames ?? 1;

      sprite.animations.forEach(anim => {
        if (!this.anims.exists(anim.key)) {
          const start = anim.startFrame ?? 0;
          const end = anim.endFrame ?? (totalFrames - 1);

          // atlas에서 프레임 이름으로 애니메이션 생성
          const frameNames: string[] = [];
          
          if (anim.key === 'work-to-idle') {
            // 역재생
            for (let i = end; i >= start; i--) {
              frameNames.push(`frame_${i.toString().padStart(4, '0')}.png`);
            }
          } else {
            // 정방향
            for (let i = start; i <= end; i++) {
              frameNames.push(`frame_${i.toString().padStart(4, '0')}.png`);
            }
          }

          this.anims.create({
            key: anim.key,
            frames: frameNames.map(name => ({ key: sprite.key, frame: name })),
            frameRate: anim.frameRate,
            repeat: anim.repeat,
          });
        }
      });
    });
  }

  create() {
    // 스프라이트 애니메이션 생성
    this.createAnimations();
    
    // 타이틀 화면 (1920x1080 스케일)
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // 배경 그라데이션 효과
    const bg = this.add.graphics();
    bg.fillGradientStyle(COLORS.background.dark, COLORS.background.dark, COLORS.background.medium, COLORS.background.medium, 1);
    bg.fillRect(0, 0, width, height);
    
    // 일본어 서브타이틀 (위)
    this.add.text(width / 2, height / 3 - 112, '剣を纏いて歩く', {
      font: 'bold 36px monospace',
      color: COLORS_STR.secondary.dark,
    }).setOrigin(0.5).setAlpha(0.8);
    
    // 메인 타이틀
    const mainTitle = this.add.text(width / 2, height / 3, '검을 두른 채 걷다', {
      font: 'bold 72px monospace',
      color: COLORS_STR.text.primary,
    }).setOrigin(0.5);
    
    // 타이틀 글로우 효과
    this.tweens.add({
      targets: mainTitle,
      alpha: { from: 1, to: 0.85 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    // 영문 서브타이틀
    this.add.text(width / 2, height / 3 + 94, 'WALK WITH THE BLADE', {
      font: 'bold 24px monospace',
      color: COLORS_STR.primary.dark,
      letterSpacing: 15,
    }).setOrigin(0.5);
    
    // 장식 라인
    const decorLine = this.add.graphics();
    decorLine.lineStyle(3, COLORS.border.medium, 0.6);
    decorLine.lineBetween(width / 2 - 280, height / 3 + 150, width / 2 + 280, height / 3 + 150);
    decorLine.fillStyle(COLORS.primary.dark, 1);
    decorLine.fillCircle(width / 2 - 280, height / 3 + 150, 8);
    decorLine.fillCircle(width / 2 + 280, height / 3 + 150, 8);
    
    // 설명
    this.add.text(width / 2, height / 2 + 56, [
      '검과 검술 카드를 조합하여',
      '끝없이 달려오는 적들을 물리쳐라',
    ], {
      font: '28px monospace',
      color: COLORS_STR.text.muted,
      align: 'center',
      lineSpacing: 15,
    }).setOrigin(0.5);
    
    // 시작 버튼
    const buttonBg = this.add.rectangle(width / 2, height * 0.72, 375, 94, COLORS.background.dark, 0.9);
    buttonBg.setStrokeStyle(4, COLORS.primary.dark);
    
    const startButton = this.add.text(width / 2, height * 0.72, '► 시작', {
      font: 'bold 42px monospace',
      color: COLORS_STR.primary.dark,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    startButton.on('pointerover', () => {
      startButton.setColor(COLORS_STR.primary.light);
      buttonBg.setStrokeStyle(5, COLORS.primary.light);
      buttonBg.setFillStyle(COLORS.primary.dark, 0.1);
      this.tweens.add({
        targets: [startButton, buttonBg],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
      });
    });
    
    startButton.on('pointerout', () => {
      startButton.setColor(COLORS_STR.primary.dark);
      buttonBg.setStrokeStyle(4, COLORS.primary.dark);
      buttonBg.setFillStyle(COLORS.background.dark, 0.9);
      this.tweens.add({
        targets: [startButton, buttonBg],
        scaleX: 1,
        scaleY: 1,
        duration: 100,
      });
    });
    
    startButton.on('pointerdown', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(500, () => {
        this.scene.start('GameScene');
      });
    });
    
    // 조작 설명
    this.add.text(width / 2, height - 130, [
      '1~0 카드사용 | SPACE 턴종료 | W 대기 | X 교환',
    ], {
      font: '22px monospace',
      color: COLORS_STR.text.disabled,
      align: 'center',
    }).setOrigin(0.5);
    
    // 버전 정보
    this.add.text(width - 20, height - 20, 'v0.1.0', {
      font: '18px monospace',
      color: COLORS_STR.text.disabled,
    }).setOrigin(1, 1);
    
    this.cameras.main.fadeIn(800, 0, 0, 0);
  }
}


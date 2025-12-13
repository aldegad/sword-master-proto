import Phaser from 'phaser';
import { COLORS, COLORS_STR } from '../constants/colors';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // 텍스트 기반이라 이미지 로드 없음
    // 나중에 도트 그래픽 추가 시 여기서 로드
    
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
      font: '20px monospace',
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
    
    // 더미 로드 (바로 넘어가지 않게)
    for (let i = 0; i < 10; i++) {
      this.load.image(`dummy${i}`, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    }
  }

  create() {
    // 타이틀 화면
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // 배경 그라데이션 효과
    const bg = this.add.graphics();
    bg.fillGradientStyle(COLORS.background.dark, COLORS.background.dark, COLORS.background.medium, COLORS.background.medium, 1);
    bg.fillRect(0, 0, width, height);
    
    // 일본어 서브타이틀 (위)
    this.add.text(width / 2, height / 3 - 60, '剣を纏いて歩く', {
      font: '18px monospace',
      color: COLORS_STR.secondary.dark,
    }).setOrigin(0.5).setAlpha(0.8);
    
    // 메인 타이틀
    const mainTitle = this.add.text(width / 2, height / 3, '검을 두른 채 걷다', {
      font: 'bold 42px monospace',
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
    this.add.text(width / 2, height / 3 + 50, 'WALK WITH THE BLADE', {
      font: '14px monospace',
      color: COLORS_STR.primary.dark,
      letterSpacing: 8,
    }).setOrigin(0.5);
    
    // 장식 라인
    const decorLine = this.add.graphics();
    decorLine.lineStyle(2, COLORS.border.medium, 0.6);
    decorLine.lineBetween(width / 2 - 150, height / 3 + 80, width / 2 + 150, height / 3 + 80);
    decorLine.fillStyle(COLORS.primary.dark, 1);
    decorLine.fillCircle(width / 2 - 150, height / 3 + 80, 4);
    decorLine.fillCircle(width / 2 + 150, height / 3 + 80, 4);
    
    // 설명
    this.add.text(width / 2, height / 2 + 30, [
      '검과 검술 카드를 조합하여',
      '끝없이 달려오는 적들을 물리쳐라',
    ], {
      font: '16px monospace',
      color: COLORS_STR.text.muted,
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5);
    
    // 시작 버튼
    const buttonBg = this.add.rectangle(width / 2, height * 0.72, 200, 50, COLORS.background.dark, 0.9);
    buttonBg.setStrokeStyle(2, COLORS.primary.dark);
    
    const startButton = this.add.text(width / 2, height * 0.72, '► 시작', {
      font: 'bold 22px monospace',
      color: COLORS_STR.primary.dark,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    startButton.on('pointerover', () => {
      startButton.setColor(COLORS_STR.primary.light);
      buttonBg.setStrokeStyle(3, COLORS.primary.light);
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
      buttonBg.setStrokeStyle(2, COLORS.primary.dark);
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
    this.add.text(width / 2, height - 70, [
      '1~0 카드사용 | SPACE 턴종료 | W 대기 | X 교환',
    ], {
      font: '12px monospace',
      color: COLORS_STR.text.disabled,
      align: 'center',
    }).setOrigin(0.5);
    
    // 버전 정보
    this.add.text(width - 10, height - 10, 'v0.1.0', {
      font: '10px monospace',
      color: COLORS_STR.text.disabled,
    }).setOrigin(1, 1);
    
    this.cameras.main.fadeIn(800, 0, 0, 0);
  }
}


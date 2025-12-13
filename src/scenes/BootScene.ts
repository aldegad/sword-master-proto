import Phaser from 'phaser';

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
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
    
    const loadingText = this.add.text(width / 2, height / 2 - 50, '소드마스터 로딩중...', {
      font: '24px monospace',
      color: '#e94560'
    }).setOrigin(0.5);
    
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xe94560, 1);
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
    
    // 타이틀
    this.add.text(width / 2, height / 3, '⚔️ 소드마스터 ⚔️', {
      font: 'bold 48px monospace',
      color: '#e94560',
    }).setOrigin(0.5);
    
    this.add.text(width / 2, height / 3 + 60, 'SWORD MASTER', {
      font: '24px monospace',
      color: '#ffffff',
    }).setOrigin(0.5);
    
    // 설명
    this.add.text(width / 2, height / 2 + 20, [
      '검과 검술 카드를 조합하여',
      '끝없이 달려오는 적들을 물리쳐라!',
    ], {
      font: '18px monospace',
      color: '#aaaaaa',
      align: 'center',
    }).setOrigin(0.5);
    
    // 시작 버튼
    const startButton = this.add.text(width / 2, height * 0.7, '[ 게임 시작 ]', {
      font: 'bold 28px monospace',
      color: '#4ecca3',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    startButton.on('pointerover', () => {
      startButton.setColor('#7fff7f');
      startButton.setScale(1.1);
    });
    
    startButton.on('pointerout', () => {
      startButton.setColor('#4ecca3');
      startButton.setScale(1);
    });
    
    startButton.on('pointerdown', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(500, () => {
        this.scene.start('GameScene');
      });
    });
    
    // 조작 설명
    this.add.text(width / 2, height - 80, [
      '조작: 1~5 - 카드 사용 | SPACE - 턴 넘기기',
      'Q - 검 교체 | E - 스킬 목록',
    ], {
      font: '14px monospace',
      color: '#666666',
      align: 'center',
    }).setOrigin(0.5);
    
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }
}


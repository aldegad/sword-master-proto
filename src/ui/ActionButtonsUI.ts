import Phaser from 'phaser';
import type { UIScene } from '../scenes/UIScene';

/**
 * 액션 버튼 UI - 턴 종료, 대기, 교환 버튼
 */
export class ActionButtonsUI {
  private scene: UIScene;
  
  private waitBtn!: Phaser.GameObjects.Container;
  private exchangeBtn!: Phaser.GameObjects.Container;
  
  waitUsedThisTurn: boolean = false;
  
  constructor(scene: UIScene) {
    this.scene = scene;
    this.create();
  }
  
  private create() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    // 턴 종료 버튼
    this.createButton(
      width - 140, height - 260,
      '⏭️ 턴 종료',
      'SPACE',
      0xe94560,
      () => {
        if (this.scene.gameScene.gameState.phase === 'combat') {
          this.scene.gameScene.endTurn();
        }
      }
    );
    
    // 대기 버튼
    this.waitBtn = this.createButton(
      width - 140, height - 195,
      '⏳ 대기',
      '(W키)',
      0x4dabf7,
      () => this.useWait()
    );
    
    // 교환 버튼
    this.exchangeBtn = this.createButton(
      width - 140, height - 130,
      '🔄 교환',
      '(X키)',
      0xffcc00,
      () => this.scene.gameScene.toggleExchangeMode()
    );
    
    this.setupKeyboardShortcuts();
  }
  
  private setupKeyboardShortcuts() {
    // W키로 대기
    this.scene.input.keyboard!.on('keydown-W', () => {
      this.useWait();
    });
    
    // X키로 교환
    this.scene.input.keyboard!.on('keydown-X', () => {
      this.scene.gameScene.toggleExchangeMode();
    });
    
    // ESC로 타겟 선택/교환 취소
    this.scene.input.keyboard!.on('keydown-ESC', () => {
      if (this.scene.gameScene.isTargetingMode) {
        this.scene.gameScene.cancelTargeting();
      } else if (this.scene.gameScene.isExchangeMode) {
        this.scene.gameScene.toggleExchangeMode();
      }
    });
  }
  
  private createButton(
    x: number, 
    y: number, 
    label: string, 
    subLabel: string, 
    color: number, 
    callback: () => void
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    const bg = this.scene.add.rectangle(0, 0, 220, 55, 0x1a1a2e, 0.95);
    bg.setStrokeStyle(3, color);
    
    const text = this.scene.add.text(0, -8, label, {
      font: 'bold 18px monospace',
      color: `#${color.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);
    
    const sub = this.scene.add.text(0, 15, subLabel, {
      font: '12px monospace',
      color: '#888888',
    }).setOrigin(0.5);
    
    container.add([bg, text, sub]);
    
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      bg.setStrokeStyle(4, 0xffffff);
      container.setScale(1.05);
    });
    bg.on('pointerout', () => {
      bg.setStrokeStyle(3, color);
      container.setScale(1);
    });
    bg.on('pointerdown', callback);
    
    return container;
  }
  
  useWait() {
    if (this.scene.gameScene.gameState.phase !== 'combat') return;
    if (this.waitUsedThisTurn) {
      this.scene.gameScene.showMessage('대기는 턴당 1번만!', 0xe94560);
      return;
    }
    
    this.waitUsedThisTurn = true;
    this.updateWaitButton();
    
    // 모든 적의 대기턴 -1
    this.scene.gameScene.reduceAllEnemyDelays(1);
    
    // 카운트 효과 감소 (나중에 추가)
    if (this.scene.gameScene.combatSystem.reduceCountEffects) {
      this.scene.gameScene.combatSystem.reduceCountEffects();
    }
    
    this.scene.gameScene.showMessage('대기... 적 대기턴 -1', 0x4dabf7);
    
    this.scene.gameScene.events.emit('statsUpdated');
  }
  
  updateWaitButton() {
    const bg = this.waitBtn.getAt(0) as Phaser.GameObjects.Rectangle;
    const text = this.waitBtn.getAt(1) as Phaser.GameObjects.Text;
    
    if (this.waitUsedThisTurn) {
      bg.setStrokeStyle(2, 0x555555);
      text.setColor('#555555');
      text.setText('⏳ 대기 (사용됨)');
    } else {
      bg.setStrokeStyle(3, 0x4dabf7);
      text.setColor('#4dabf7');
      text.setText('⏳ 대기');
    }
  }
  
  updateExchangeButton() {
    const bg = this.exchangeBtn.getAt(0) as Phaser.GameObjects.Rectangle;
    const text = this.exchangeBtn.getAt(1) as Phaser.GameObjects.Text;
    
    if (this.scene.gameScene.isExchangeMode) {
      bg.setStrokeStyle(4, 0xffffff);
      text.setColor('#ffffff');
      text.setText('🔄 교환중 (ESC취소)');
    } else {
      bg.setStrokeStyle(3, 0xffcc00);
      text.setColor('#ffcc00');
      text.setText('🔄 교환');
    }
  }
  
  resetWaitButton() {
    this.waitUsedThisTurn = false;
    this.updateWaitButton();
  }
}

import Phaser from 'phaser';
import type { UIScene } from '../scenes/UIScene';
import { COLORS, COLORS_STR } from '../constants/colors';

/**
 * 액션 버튼 UI - 턴 종료, 대기, 교환 버튼
 */
export class ActionButtonsUI {
  private scene: UIScene;
  
  private waitBtn!: Phaser.GameObjects.Container;
  private exchangeBtn!: Phaser.GameObjects.Container;
  
  waitUsedThisTurn: boolean = false;
  exchangeUsedThisTurn: boolean = false;
  
  constructor(scene: UIScene) {
    this.scene = scene;
    this.create();
  }
  
  private create() {
    const height = this.scene.cameras.main.height;
    
    // 버튼을 가로로 나열 (왼쪽 하단, 1920x1080 스케일)
    const btnY = height - 316;  // 더 위로 올림
    const btnWidth = 168;  // 버튼 너비
    const btnSpacing = btnWidth + 15;  // 버튼 간격 (버튼 너비 + 여백)
    const startX = 112;  // 왼쪽 여백 (플레이어 쪽)
    
    // 순서: 교환 → 대기 → 턴종료 (역순)
    
    // 교환 버튼 (첫번째)
    this.exchangeBtn = this.createButton(
      startX, btnY,
      '↻ 교환',
      'X',
      COLORS.primary.main,
      () => this.tryExchange()
    );
    
    // 대기 버튼 (두번째)
    this.waitBtn = this.createButton(
      startX + btnSpacing, btnY,
      '‖ 대기',
      'W',
      COLORS.success.main,
      () => this.useWait()
    );
    
    // 턴 종료 버튼 (세번째)
    this.createButton(
      startX + btnSpacing * 2, btnY,
      '▶ 턴종료',
      'SPACE',
      COLORS.secondary.main,
      () => {
        if (this.scene.gameScene.gameState.phase === 'combat') {
          this.scene.gameScene.endTurn();
        }
      }
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
      this.tryExchange();
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
    
    // 버튼 크기 (높이 줄임)
    const bg = this.scene.add.rectangle(0, 0, 168, 56, COLORS.background.dark, 0.95);
    bg.setStrokeStyle(3, color);
    
    const text = this.scene.add.text(0, -8, label, {
      font: 'bold 20px monospace',
      color: `#${color.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);
    
    const sub = this.scene.add.text(0, 16, subLabel, {
      font: '16px monospace',
      color: COLORS_STR.text.muted,
    }).setOrigin(0.5);
    
    container.add([bg, text, sub]);
    
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      bg.setStrokeStyle(4, COLORS.primary.light);
      bg.setFillStyle(color, 0.1);
      container.setScale(1.03);
    });
    bg.on('pointerout', () => {
      bg.setStrokeStyle(3, color);
      bg.setFillStyle(COLORS.background.dark, 0.95);
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
    
    // 아군 카운트 효과 -1 (강타, 패리 등)
    this.scene.gameScene.combatSystem.reduceCountEffects();
    
    this.scene.gameScene.showMessage('대기... 적/아군 대기 -1', COLORS.success.main);
    
    this.scene.gameScene.events.emit('statsUpdated');
  }
  
  tryExchange() {
    if (this.scene.gameScene.gameState.phase !== 'combat') return;
    
    // 이미 교환 모드일 때는 취소 가능
    if (this.scene.gameScene.isExchangeMode) {
      this.scene.gameScene.toggleExchangeMode();
      return;
    }
    
    // 이미 사용한 경우
    if (this.exchangeUsedThisTurn) {
      this.scene.gameScene.showMessage('교환은 턴당 1번만!', 0xe94560);
      return;
    }
    
    // 교환 모드 시작
    this.scene.gameScene.toggleExchangeMode();
  }
  
  // 교환 완료 시 호출 (CardSystem에서 호출됨)
  onExchangeUsed() {
    this.exchangeUsedThisTurn = true;
    this.updateExchangeButton();
  }
  
  updateWaitButton() {
    const bg = this.waitBtn.getAt(0) as Phaser.GameObjects.Rectangle;
    const text = this.waitBtn.getAt(1) as Phaser.GameObjects.Text;
    
    const remaining = this.waitUsedThisTurn ? 0 : 1;
    
    if (this.waitUsedThisTurn) {
      bg.setStrokeStyle(1, COLORS.border.dark);
      text.setColor(COLORS_STR.text.disabled);
      text.setText(`‖ 대기 [${remaining}/1]`);
    } else {
      bg.setStrokeStyle(2, COLORS.success.main);
      text.setColor(COLORS_STR.success.main);
      text.setText(`‖ 대기 [${remaining}/1]`);
    }
  }
  
  updateExchangeButton() {
    const bg = this.exchangeBtn.getAt(0) as Phaser.GameObjects.Rectangle;
    const text = this.exchangeBtn.getAt(1) as Phaser.GameObjects.Text;
    
    const remaining = this.exchangeUsedThisTurn ? 0 : 1;
    
    if (this.scene.gameScene.isExchangeMode) {
      bg.setStrokeStyle(3, COLORS.text.primary);
      text.setColor(COLORS_STR.text.primary);
      text.setText('↻ 교환중... (ESC)');
    } else if (this.exchangeUsedThisTurn) {
      bg.setStrokeStyle(1, COLORS.border.dark);
      text.setColor(COLORS_STR.text.disabled);
      text.setText(`↻ 교환 [${remaining}/1]`);
    } else {
      bg.setStrokeStyle(2, COLORS.primary.main);
      text.setColor(COLORS_STR.primary.main);
      text.setText(`↻ 교환 [${remaining}/1]`);
    }
  }
  
  resetWaitButton() {
    this.waitUsedThisTurn = false;
    this.exchangeUsedThisTurn = false;
    this.updateWaitButton();
    this.updateExchangeButton();
  }
}

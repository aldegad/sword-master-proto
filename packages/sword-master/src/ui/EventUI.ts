import Phaser from 'phaser';
import type { UIScene } from '../scenes/UIScene';
import type { GameEvent, EventChoice, EventOutcome } from '../data/events';
import { COLORS, COLORS_STR } from '../constants/colors';

/**
 * 이벤트 UI - 랜덤 이벤트 표시 및 선택지 처리
 */
export class EventUI {
  private scene: UIScene;
  private container!: Phaser.GameObjects.Container;
  private onChoiceCallback: ((choice: EventChoice) => void) | null = null;
  
  constructor(scene: UIScene) {
    this.scene = scene;
    this.create();
  }
  
  private create() {
    this.container = this.scene.add.container(0, 0);
    this.container.setVisible(false);
    this.container.setDepth(3000);
  }
  
  show(event: GameEvent, onChoice: (choice: EventChoice) => void) {
    this.onChoiceCallback = onChoice;
    
    this.container.removeAll(true);
    
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    // 배경 오버레이
    const overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, COLORS.background.black, 0.85);
    overlay.setInteractive();  // 다른 클릭 차단
    this.container.add(overlay);
    
    // 이벤트 패널
    const panelWidth = 700;
    const panelHeight = 500;
    const panelX = width / 2;
    const panelY = height / 2;
    
    const panel = this.scene.add.rectangle(panelX, panelY, panelWidth, panelHeight, COLORS.background.dark, 0.98);
    panel.setStrokeStyle(4, COLORS.primary.main);
    this.container.add(panel);
    
    // 이벤트 이모지
    const emoji = this.scene.add.text(panelX, panelY - 170, event.emoji, {
      font: '96px Arial',
    }).setOrigin(0.5);
    this.container.add(emoji);
    
    // 이벤트 이름
    const title = this.scene.add.text(panelX, panelY - 80, event.name, {
      font: 'bold 36px monospace',
      color: COLORS_STR.primary.main,
    }).setOrigin(0.5);
    this.container.add(title);
    
    // 이벤트 설명
    const description = this.scene.add.text(panelX, panelY - 10, event.description, {
      font: '22px monospace',
      color: COLORS_STR.text.secondary,
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5);
    this.container.add(description);
    
    // 선택지 버튼들
    const choiceY = panelY + 100;
    const choiceSpacing = 70;
    
    event.choices.forEach((choice, index) => {
      const btnY = choiceY + index * choiceSpacing;
      const btn = this.createChoiceButton(panelX, btnY, choice, index + 1);
      this.container.add(btn);
    });
    
    this.container.setVisible(true);
    
    // 등장 애니메이션
    this.container.setAlpha(0);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
    });
  }
  
  private createChoiceButton(x: number, y: number, choice: EventChoice, num: number): Phaser.GameObjects.Container {
    const btn = this.scene.add.container(x, y);
    
    const bg = this.scene.add.rectangle(0, 0, 500, 55, COLORS.background.medium, 0.95);
    bg.setStrokeStyle(3, COLORS.success.main);
    
    const text = this.scene.add.text(0, 0, `${num}. ${choice.text}`, {
      font: 'bold 24px monospace',
      color: COLORS_STR.success.main,
    }).setOrigin(0.5);
    
    btn.add([bg, text]);
    
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      bg.setStrokeStyle(4, COLORS.primary.light);
      bg.setFillStyle(COLORS.primary.dark, 0.2);
      btn.setScale(1.05);
    });
    bg.on('pointerout', () => {
      bg.setStrokeStyle(3, COLORS.success.main);
      bg.setFillStyle(COLORS.background.medium, 0.95);
      btn.setScale(1);
    });
    bg.on('pointerdown', () => {
      this.selectChoice(choice);
    });
    
    return btn;
  }
  
  private selectChoice(choice: EventChoice) {
    if (this.onChoiceCallback) {
      this.onChoiceCallback(choice);
    }
    this.hide();
  }
  
  hide() {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.container.setVisible(false);
        this.onChoiceCallback = null;
      },
    });
  }
  
  /**
   * 이벤트 결과 표시
   */
  showOutcome(outcome: EventOutcome, onComplete: () => void) {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    const outcomeContainer = this.scene.add.container(width / 2, height / 2);
    outcomeContainer.setDepth(3001);
    
    // 배경
    const bg = this.scene.add.rectangle(0, 0, 600, 200, COLORS.background.dark, 0.95);
    bg.setStrokeStyle(3, this.getOutcomeColor(outcome.type));
    outcomeContainer.add(bg);
    
    // 아이콘
    const icon = this.getOutcomeIcon(outcome.type);
    const iconText = this.scene.add.text(0, -50, icon, {
      font: '60px Arial',
    }).setOrigin(0.5);
    outcomeContainer.add(iconText);
    
    // 메시지
    const message = this.scene.add.text(0, 20, outcome.message, {
      font: '24px monospace',
      color: `#${this.getOutcomeColor(outcome.type).toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5);
    outcomeContainer.add(message);
    
    // 값 표시
    if (outcome.value) {
      const valueText = outcome.type === 'reward' ? `+${outcome.value} 은전` :
                       outcome.type === 'damage' ? `-${outcome.value} HP` :
                       outcome.type === 'heal' ? `+${outcome.value} HP` : '';
      if (valueText) {
        const value = this.scene.add.text(0, 60, valueText, {
          font: 'bold 28px monospace',
          color: COLORS_STR.text.primary,
        }).setOrigin(0.5);
        outcomeContainer.add(value);
      }
    }
    
    // 등장 애니메이션
    outcomeContainer.setScale(0.5);
    outcomeContainer.setAlpha(0);
    
    this.scene.tweens.add({
      targets: outcomeContainer,
      scale: 1,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        // 2초 후 사라짐
        this.scene.time.delayedCall(2000, () => {
          this.scene.tweens.add({
            targets: outcomeContainer,
            alpha: 0,
            y: height / 2 - 50,
            duration: 300,
            onComplete: () => {
              outcomeContainer.destroy();
              onComplete();
            },
          });
        });
      },
    });
  }
  
  private getOutcomeColor(type: EventOutcome['type']): number {
    switch (type) {
      case 'reward': return COLORS.primary.main;
      case 'combat': return COLORS.secondary.main;
      case 'damage': return COLORS.message.error;
      case 'heal': return COLORS.success.main;
      default: return COLORS.text.muted;
    }
  }
  
  private getOutcomeIcon(type: EventOutcome['type']): string {
    switch (type) {
      case 'reward': return '💰';
      case 'combat': return '⚔️';
      case 'combat_then_reward': return '⚔️';
      case 'combat_then_choose': return '⚔️';
      case 'damage': return '💥';
      case 'heal': return '💚';
      case 'shop': return '🧳';
      case 'skill_select': return '📜';
      default: return '🌫️';
    }
  }
  
  /**
   * 보상 선택 UI (전투 후)
   */
  showRewardChoice(healAmount: number, silverAmount: number, onChoice: (choice: 'heal' | 'silver') => void) {
    this.container.removeAll(true);
    
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    // 배경 오버레이
    const overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, COLORS.background.black, 0.85);
    overlay.setInteractive();
    this.container.add(overlay);
    
    // 패널
    const panelWidth = 600;
    const panelHeight = 350;
    const panelX = width / 2;
    const panelY = height / 2;
    
    const panel = this.scene.add.rectangle(panelX, panelY, panelWidth, panelHeight, COLORS.background.dark, 0.98);
    panel.setStrokeStyle(4, COLORS.primary.main);
    this.container.add(panel);
    
    // 제목
    const title = this.scene.add.text(panelX, panelY - 120, '⚔️ 승리! 보상을 선택하세요', {
      font: 'bold 32px monospace',
      color: COLORS_STR.primary.main,
    }).setOrigin(0.5);
    this.container.add(title);
    
    // 부제
    const subtitle = this.scene.add.text(panelX, panelY - 70, '무사가 감사의 뜻을 전합니다.', {
      font: '20px monospace',
      color: COLORS_STR.text.muted,
    }).setOrigin(0.5);
    this.container.add(subtitle);
    
    // 회복 버튼
    const healBtn = this.createRewardButton(
      panelX - 130, panelY + 20,
      '💚 치료',
      `+${healAmount} HP`,
      COLORS.success.main,
      () => {
        this.hide();
        onChoice('heal');
      }
    );
    this.container.add(healBtn);
    
    // 은전 버튼
    const silverBtn = this.createRewardButton(
      panelX + 130, panelY + 20,
      '💰 보답',
      `+${silverAmount} 은전`,
      COLORS.primary.main,
      () => {
        this.hide();
        onChoice('silver');
      }
    );
    this.container.add(silverBtn);
    
    this.container.setVisible(true);
    
    // 등장 애니메이션
    this.container.setAlpha(0);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
    });
  }
  
  private createRewardButton(
    x: number, 
    y: number, 
    label: string, 
    value: string, 
    color: number,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const btn = this.scene.add.container(x, y);
    
    const bg = this.scene.add.rectangle(0, 0, 200, 120, COLORS.background.medium, 0.95);
    bg.setStrokeStyle(3, color);
    
    const labelText = this.scene.add.text(0, -20, label, {
      font: 'bold 24px monospace',
      color: `#${color.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);
    
    const valueText = this.scene.add.text(0, 20, value, {
      font: 'bold 20px monospace',
      color: COLORS_STR.text.primary,
    }).setOrigin(0.5);
    
    btn.add([bg, labelText, valueText]);
    
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      bg.setStrokeStyle(4, COLORS.primary.light);
      bg.setFillStyle(color, 0.2);
      btn.setScale(1.08);
    });
    bg.on('pointerout', () => {
      bg.setStrokeStyle(3, color);
      bg.setFillStyle(COLORS.background.medium, 0.95);
      btn.setScale(1);
    });
    bg.on('pointerdown', callback);
    
    return btn;
  }
}


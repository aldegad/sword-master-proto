import Phaser from 'phaser';
import type { UIScene } from '../scenes/UIScene';
import { COLORS, COLORS_STR } from '../constants/colors';

/**
 * 무기 정보 UI - 장착된 무기 정보 표시
 */
export class SwordInfoUI {
  private scene: UIScene;
  
  private swordInfoText!: Phaser.GameObjects.Text;
  private swordEmoji!: Phaser.GameObjects.Text;
  private deckText!: Phaser.GameObjects.Text;
  
  constructor(scene: UIScene) {
    this.scene = scene;
    this.create();
  }
  
  private create() {
    // 무기 정보 패널 (1920x1080 스케일)
    const infoPanel = this.scene.add.rectangle(38, 160, 488, 188, COLORS.background.dark, 0.95).setOrigin(0);
    infoPanel.setStrokeStyle(3, COLORS.border.medium);
    
    this.scene.add.text(56, 172, '◈ 장착 무기', {
      font: 'bold 26px monospace',
      color: COLORS_STR.secondary.main,
    });
    
    this.swordEmoji = this.scene.add.text(432, 253, '', {
      font: '75px Arial',
    }).setOrigin(0.5);
    
    this.swordInfoText = this.scene.add.text(56, 210, '', {
      font: '22px monospace',
      color: COLORS_STR.text.secondary,
      lineSpacing: 8,
    });
    
    // 덱 정보 - 손패 우측 하단에 배치
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    this.deckText = this.scene.add.text(width - 56, height - 34, '', {
      font: 'bold 26px monospace',
      color: COLORS_STR.text.muted,
    }).setOrigin(1, 0);
    this.deckText.setDepth(100);  // 손패 배경보다 앞으로
  }
  
  update() {
    this.updateSwordInfo();
    this.updateDeckInfo();
  }
  
  private updateSwordInfo() {
    const sword = this.scene.gameScene.playerState.currentSword;
    
    if (!sword) {
      this.swordInfoText.setText('NO WEAPON\n\n무기가 없습니다');
      this.swordEmoji.setText('✊');
      return;
    }
    
    const reachMap: Record<string, string> = {
      single: '①',
      double: '②',
      triple: '③',
      all: '∞',
    };
    
    this.swordEmoji.setText(sword.emoji);
    const displayName = sword.displayName || sword.name;
    this.swordInfoText.setText([
      `${displayName}`,
      `공${sword.attack} 방${sword.defense}% 관${sword.pierce || 0} ${sword.attackCount}타`,
      `범위:${reachMap[sword.reach]} 내구:${sword.currentDurability}/${sword.durability}`,
    ].join('\n'));
    
    // 등급에 따른 색상 변경
    const rarityColor = COLORS_STR.rarity[sword.rarity as keyof typeof COLORS_STR.rarity] || COLORS_STR.rarity.common;
    this.swordInfoText.setColor(rarityColor);
  }
  
  private updateDeckInfo() {
    const player = this.scene.gameScene.playerState;
    // 덱 정보만 표시 (LV은 TopUI로 이동)
    this.deckText.setText(`📚 DECK: ${player.deck.length}`);
  }
}

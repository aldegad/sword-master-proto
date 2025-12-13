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
    // 무기 정보 패널
    const infoPanel = this.scene.add.rectangle(20, 125, 260, 110, COLORS.background.dark, 0.95).setOrigin(0);
    infoPanel.setStrokeStyle(2, COLORS.border.medium);
    
    this.scene.add.text(30, 132, '◈ 장착 무기', {
      font: 'bold 14px monospace',
      color: COLORS_STR.secondary.main,
    });
    
    this.swordEmoji = this.scene.add.text(230, 180, '', {
      font: '44px Arial',
    }).setOrigin(0.5);
    
    this.swordInfoText = this.scene.add.text(30, 158, '', {
      font: '13px monospace',
      color: COLORS_STR.text.secondary,
      lineSpacing: 5,
    });
    
    // 덱 정보 패널
    const deckPanel = this.scene.add.rectangle(20, 240, 260, 50, COLORS.background.dark, 0.95).setOrigin(0);
    deckPanel.setStrokeStyle(1, COLORS.border.dark);
    
    this.deckText = this.scene.add.text(30, 255, '', {
      font: 'bold 13px monospace',
      color: COLORS_STR.text.muted,
    });
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
      `공${sword.attack} 방${sword.defense}% ${sword.attackCount}타`,
      `범위:${reachMap[sword.reach]} 내구:${sword.currentDurability}/${sword.durability}`,
    ].join('\n'));
    
    // 등급에 따른 색상 변경
    const rarityColor = COLORS_STR.rarity[sword.rarity as keyof typeof COLORS_STR.rarity] || COLORS_STR.rarity.common;
    this.swordInfoText.setColor(rarityColor);
  }
  
  private updateDeckInfo() {
    const player = this.scene.gameScene.playerState;
    const expNeeded = player.level * 50;
    this.deckText.setText(
      `LV.${player.level} [${player.exp}/${expNeeded}]  DECK:${player.deck.length} GRAVE:${player.discard.length}`
    );
  }
}

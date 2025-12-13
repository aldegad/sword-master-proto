import Phaser from 'phaser';
import type { UIScene } from '../scenes/UIScene';

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
    const infoPanel = this.scene.add.rectangle(20, 125, 260, 110, 0x1a1a2e, 0.95).setOrigin(0);
    infoPanel.setStrokeStyle(3, 0xe94560);
    
    this.scene.add.text(30, 132, '⚔️ 장착 무기', {
      font: 'bold 16px monospace',
      color: '#e94560',
    });
    
    this.swordEmoji = this.scene.add.text(230, 180, '', {
      font: '44px Arial',
    }).setOrigin(0.5);
    
    this.swordInfoText = this.scene.add.text(30, 158, '', {
      font: '13px monospace',
      color: '#ffffff',
      lineSpacing: 5,
    });
    
    // 덱 정보 패널
    const deckPanel = this.scene.add.rectangle(20, 240, 260, 50, 0x1a1a2e, 0.95).setOrigin(0);
    deckPanel.setStrokeStyle(2, 0x666666);
    
    this.deckText = this.scene.add.text(30, 255, '', {
      font: 'bold 14px monospace',
      color: '#aaaaaa',
    });
  }
  
  update() {
    this.updateSwordInfo();
    this.updateDeckInfo();
  }
  
  private updateSwordInfo() {
    const sword = this.scene.gameScene.playerState.currentSword;
    
    if (!sword) {
      this.swordInfoText.setText('맨손\n\n무기가 없습니다!');
      this.swordEmoji.setText('✊');
      return;
    }
    
    const reachMap: Record<string, string> = {
      single: '1명',
      double: '2명',
      triple: '3명',
      all: '전체',
    };
    
    this.swordEmoji.setText(sword.emoji);
    const displayName = sword.displayName || sword.name;
    this.swordInfoText.setText([
      `${displayName}`,
      `공${sword.attack} 방${sword.defense}% ${sword.attackCount}타`,
      `범위:${reachMap[sword.reach]} 내구:${sword.currentDurability}/${sword.durability}`,
    ].join('\n'));
    
    // 등급에 따른 색상 변경
    if (sword.rarity === 'unique') {
      this.swordInfoText.setColor('#ffcc00');
    } else if (sword.rarity === 'rare') {
      this.swordInfoText.setColor('#4dabf7');
    } else {
      this.swordInfoText.setColor('#ffffff');
    }
  }
  
  private updateDeckInfo() {
    const player = this.scene.gameScene.playerState;
    const expNeeded = player.level * 50;
    this.deckText.setText(
      `Lv.${player.level} (${player.exp}/${expNeeded})  📚${player.deck.length} 🪦${player.discard.length}`
    );
  }
}

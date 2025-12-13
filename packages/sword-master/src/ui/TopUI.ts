import Phaser from 'phaser';
import type { UIScene } from '../scenes/UIScene';
import { GAME_CONSTANTS } from '../types';
import { COLORS, COLORS_STR } from '../constants/colors';
import { FONTS } from '../constants/typography';

/**
 * 상단 UI - HP바, 마나, 턴/웨이브/점수 표시
 */
export class TopUI {
  private scene: UIScene;
  
  // HP UI
  private hpBar!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;
  
  // 마나 UI
  private manaContainer!: Phaser.GameObjects.Container;
  private manaOrbs: Phaser.GameObjects.Arc[] = [];
  
  // 상태 텍스트
  private statsText!: Phaser.GameObjects.Text;
  private turnText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  
  constructor(scene: UIScene) {
    this.scene = scene;
    this.create();
  }
  
  private create() {
    this.createHpBar();
    this.createManaUI();
    this.createStatusTexts();
  }
  
  private createHpBar() {
    // HP 바 배경
    const hpBg = this.scene.add.rectangle(20, 25, 280, 35, COLORS.background.dark).setOrigin(0);
    hpBg.setStrokeStyle(2, COLORS.border.medium);
    
    // HP 바
    this.hpBar = this.scene.add.graphics();
    
    // HP 텍스트
    this.hpText = this.scene.add.text(160, 42, '', {
      font: FONTS.titleSmall,
      color: '#ffffff',
    }).setOrigin(0.5);
    
    // HP 라벨
    this.scene.add.text(20, 5, '❤ 체력', {
      font: FONTS.button,
      color: COLORS_STR.secondary.main,
    });
  }
  
  private createManaUI() {
    this.scene.add.text(20, 68, '◈ 기력', {
      font: FONTS.labelBold,
      color: COLORS_STR.primary.main,
    });
    
    this.manaContainer = this.scene.add.container(105, 82);
    
    for (let i = 0; i < GAME_CONSTANTS.MAX_MANA; i++) {
      const orb = this.scene.add.circle(i * 24, 0, 9, COLORS.primary.main);
      orb.setStrokeStyle(2, COLORS.primary.dark);
      this.manaOrbs.push(orb);
      this.manaContainer.add(orb);
    }
  }
  
  private createStatusTexts() {
    const width = this.scene.cameras.main.width;
    
    // 웨이브 표시
    this.waveText = this.scene.add.text(width / 2, 10, '', {
      font: 'bold 27px monospace',
      color: COLORS_STR.secondary.main,
    }).setOrigin(0.5, 0);
    
    // 페이즈 표시
    this.phaseText = this.scene.add.text(width / 2, 42, '', {
      font: FONTS.titleSmall,
      color: COLORS_STR.primary.main,
    }).setOrigin(0.5, 0);
    
    // 턴 표시
    this.turnText = this.scene.add.text(width - 20, 10, '', {
      font: FONTS.message,
      color: COLORS_STR.primary.dark,
    }).setOrigin(1, 0);
    
    // 점수 표시
    this.scoreText = this.scene.add.text(width - 20, 38, '', {
      font: FONTS.button,
      color: COLORS_STR.primary.main,
    }).setOrigin(1, 0);
    
    // 스탯 표시
    this.statsText = this.scene.add.text(20, 100, '', {
      font: FONTS.labelBold,
      color: COLORS_STR.text.muted,
    });
  }
  
  updateHpBar() {
    const player = this.scene.gameScene.playerState;
    const ratio = Math.max(0, player.hp) / player.maxHp;
    
    this.hpBar.clear();
    
    let color: number = COLORS.status.hp.full;
    if (ratio < 0.5) color = COLORS.status.hp.half;
    if (ratio < 0.25) color = COLORS.status.hp.low;
    
    this.hpBar.fillStyle(color);
    this.hpBar.fillRect(23, 28, 274 * ratio, 29);
    
    if (this.hpText) {
      this.hpText.setText(`${Math.max(0, player.hp)} / ${player.maxHp}`);
    }
  }
  
  updateManaDisplay() {
    const mana = this.scene.gameScene.playerState.mana;
    const maxMana = this.scene.gameScene.playerState.maxMana;
    
    this.manaOrbs.forEach((orb, idx) => {
      if (idx < maxMana) {
        orb.setVisible(true);
        orb.setFillStyle(idx < mana ? COLORS.status.mana.active : COLORS.status.mana.empty);
        orb.setStrokeStyle(2, idx < mana ? COLORS.primary.dark : COLORS.border.dark);
      } else {
        orb.setVisible(false);
      }
    });
  }
  
  updateStats() {
    const player = this.scene.gameScene.playerState;
    const game = this.scene.gameScene.gameState;
    
    this.updateHpBar();
    this.updateManaDisplay();
    
    let statsStr = '';
    // 방어율 표시 (검의 방어력 = 방어율%)
    if (player.currentSword && player.currentSword.defense > 0) {
      let totalParryRate = player.currentSword.defense;
      // 방어 버프 추가
      player.buffs.forEach(b => {
        if (b.type === 'defense') totalParryRate += b.value;
      });
      statsStr += `🛡 방어율: ${totalParryRate}%  `;
    }
    // 방어 외 버프만 표시
    const otherBuffs = player.buffs.filter(b => b.type !== 'defense');
    if (otherBuffs.length > 0) {
      statsStr += `✨ ${otherBuffs.map(b => b.name).join(', ')}`;
    }
    this.statsText.setText(statsStr);
    
    this.waveText.setText(`제 ${game.currentWave} 파`);
    this.turnText.setText(`${game.turn} 순`);
    this.scoreText.setText(`공 ${game.score}`);
    
    const phaseText: Record<string, string> = {
      running: '▶ 이동중...',
      combat: '⚔ 전투!',
      victory: '★ 승리!',
      paused: '‖ 일시정지',
      gameOver: '✕ 패배',
    };
    this.phaseText.setText(phaseText[game.phase] || '');
  }
}

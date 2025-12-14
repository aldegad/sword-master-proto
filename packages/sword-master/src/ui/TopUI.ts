import Phaser from 'phaser';
import type { UIScene } from '../scenes/UIScene';
import { GAME_CONSTANTS } from '../types';
import { COLORS, COLORS_STR } from '../constants/colors';

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
  private silverText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  
  // 패시브 UI
  private passiveContainer!: Phaser.GameObjects.Container;
  private passiveTooltip!: Phaser.GameObjects.Container;
  
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
    // HP 바 배경 (1920x1080 스케일)
    const hpBg = this.scene.add.rectangle(38, 42, 525, 34, COLORS.background.dark).setOrigin(0);
    hpBg.setStrokeStyle(2, COLORS.border.medium);
    
    // HP 바
    this.hpBar = this.scene.add.graphics();
    
    // HP 텍스트
    this.hpText = this.scene.add.text(300, 58, '', {
      font: 'bold 20px monospace',
      color: '#ffffff',
    }).setOrigin(0.5);
    
    // HP 라벨 + LV (체력 옆으로 이동)
    this.scene.add.text(38, 10, '❤ 체력', {
      font: 'bold 22px monospace',
      color: COLORS_STR.secondary.main,
    });
    
    // 레벨 표시 (체력 라벨 옆)
    this.levelText = this.scene.add.text(170, 10, '', {
      font: 'bold 22px monospace',
      color: COLORS_STR.primary.dark,
    });
  }
  
  private createManaUI() {
    this.scene.add.text(38, 90, '◈ 기력', {
      font: 'bold 20px monospace',
      color: COLORS_STR.primary.main,
    });
    
    this.manaContainer = this.scene.add.container(200, 112);
    
    for (let i = 0; i < GAME_CONSTANTS.MAX_MANA; i++) {
      const orb = this.scene.add.circle(i * 45, 0, 17, COLORS.primary.main);
      orb.setStrokeStyle(3, COLORS.primary.dark);
      this.manaOrbs.push(orb);
      this.manaContainer.add(orb);
    }
  }
  
  private createStatusTexts() {
    const width = this.scene.cameras.main.width;
    
    // 웨이브 표시
    this.waveText = this.scene.add.text(width / 2, 20, '', {
      font: 'bold 50px monospace',
      color: COLORS_STR.secondary.main,
    }).setOrigin(0.5, 0);
    
    // 페이즈 표시
    this.phaseText = this.scene.add.text(width / 2, 78, '', {
      font: 'bold 28px monospace',
      color: COLORS_STR.primary.main,
    }).setOrigin(0.5, 0);
    
    // 턴 표시
    this.turnText = this.scene.add.text(width - 38, 20, '', {
      font: 'bold 28px monospace',
      color: COLORS_STR.primary.dark,
    }).setOrigin(1, 0);
    
    // 점수 표시
    this.scoreText = this.scene.add.text(width - 38, 56, '', {
      font: 'bold 22px monospace',
      color: COLORS_STR.primary.main,
    }).setOrigin(1, 0);
    
    // 은전 표시
    this.silverText = this.scene.add.text(width - 38, 88, '', {
      font: 'bold 20px monospace',
      color: '#ffd700',
    }).setOrigin(1, 0);
    
    // 패시브 표시 영역
    this.statsText = this.scene.add.text(38, 560, '', {
      font: 'bold 20px monospace',
      color: COLORS_STR.text.muted,
    });
    this.statsText.setVisible(false);
    
    // 패시브 컨테이너 (아이콘 형태로 표시)
    this.passiveContainer = this.scene.add.container(38, 145);
    
    // 패시브 툴팁 생성
    this.createPassiveTooltip();
  }
  
  private createPassiveTooltip() {
    this.passiveTooltip = this.scene.add.container(38, 200);
    this.passiveTooltip.setVisible(false);
    this.passiveTooltip.setDepth(1000);
  }
  
  private updatePassiveDisplay() {
    this.passiveContainer.removeAll(true);
    
    const passives = this.scene.gameScene.playerState.passives;
    const displayPassives = passives.filter(p => p.level > 0);
    
    if (displayPassives.length === 0) return;
    
    // 패시브 라벨
    const label = this.scene.add.text(0, 0, '🔮 패시브', {
      font: 'bold 18px monospace',
      color: COLORS_STR.rarity.unique,
    });
    this.passiveContainer.add(label);
    
    // 패시브 아이콘들 (가로 배열)
    let xOffset = 120;
    displayPassives.forEach(passive => {
      const icon = this.createPassiveIcon(xOffset, passive);
      this.passiveContainer.add(icon);
      xOffset += 55;
    });
  }
  
  private createPassiveIcon(x: number, passive: import('../types').PlayerPassive): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, 0);
    
    // 배경
    const bg = this.scene.add.rectangle(0, 0, 50, 36, COLORS.background.dark, 0.9);
    bg.setStrokeStyle(2, COLORS.rarity.unique);
    
    // 아이콘 (패시브별로 다른 이모지)
    let emoji = '🔮';
    if (passive.id === 'waitIncrease') emoji = '⏳';
    else if (passive.id === 'perfectCast') emoji = '✨';
    else if (passive.id === 'defenseBonus') emoji = '🛡️';
    
    const icon = this.scene.add.text(-10, 0, emoji, { font: '16px Arial' }).setOrigin(0.5);
    
    // 레벨
    const level = this.scene.add.text(14, 0, `${passive.level}`, {
      font: 'bold 14px monospace',
      color: COLORS_STR.rarity.unique,
    }).setOrigin(0.5);
    
    container.add([bg, icon, level]);
    
    // 툴팁 인터랙션
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => this.showPassiveTooltip(passive, x));
    bg.on('pointerout', () => this.hidePassiveTooltip());
    
    return container;
  }
  
  private showPassiveTooltip(passive: import('../types').PlayerPassive, x: number) {
    this.passiveTooltip.removeAll(true);
    
    const lines = [
      `🔮 ${passive.name} Lv.${passive.level}/${passive.maxLevel}`,
      passive.description,
    ];
    
    const tooltipText = lines.join('\n');
    
    // 배경
    const bg = this.scene.add.rectangle(x, 0, 280, 60, COLORS.background.black, 0.95);
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(2, COLORS.rarity.unique);
    
    // 텍스트
    const text = this.scene.add.text(x + 10, 8, tooltipText, {
      font: '16px monospace',
      color: COLORS_STR.text.secondary,
      lineSpacing: 6,
    });
    
    this.passiveTooltip.add([bg, text]);
    this.passiveTooltip.setVisible(true);
  }
  
  private hidePassiveTooltip() {
    this.passiveTooltip.setVisible(false);
  }
  
  updateHpBar() {
    const player = this.scene.gameScene.playerState;
    const ratio = Math.max(0, player.hp) / player.maxHp;
    
    this.hpBar.clear();
    
    let color: number = COLORS.status.hp.full;
    if (ratio < 0.5) color = COLORS.status.hp.half;
    if (ratio < 0.25) color = COLORS.status.hp.low;
    
    this.hpBar.fillStyle(color);
    this.hpBar.fillRect(42, 46, 517 * ratio, 26);  // 스케일 적용
    
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
    this.updatePassiveDisplay();
    
    // 레벨 표시 업데이트
    const expNeeded = this.scene.gameScene.getExpNeeded();
    this.levelText.setText(`LV.${player.level} [${player.exp}/${expNeeded}]`);
    
    this.waveText.setText(`제 ${game.currentWave} 파`);
    this.turnText.setText(`${game.turn} 순`);
    this.scoreText.setText(`공 ${game.score}`);
    this.silverText.setText(`💰 ${player.silver} 은전`);
    
    const phaseText: Record<string, string> = {
      running: '▶ 이동중...',
      combat: '⚔ 전투!',
      victory: '★ 승리!',
      paused: '‖ 일시정지',
      gameOver: '✕ 패배',
      event: '❗ 이벤트',
    };
    this.phaseText.setText(phaseText[game.phase] || '');
  }
}

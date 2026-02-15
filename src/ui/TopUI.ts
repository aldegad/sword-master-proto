import * as Phaser from 'phaser';
import type { UIScene } from '../scenes/UIScene';
import { GAME_CONSTANTS } from '../types';
import { COLORS, COLORS_STR } from '../constants/colors';
import { UI_LAYOUT } from '../constants/uiLayout';
import { t } from '../i18n';

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
  private manaOrbs: Phaser.GameObjects.Graphics[] = [];  // 마름모꼴
  
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
    const topLeftHud = this.scene.getTopLeftHudStack();
    const hp = UI_LAYOUT.topBar.hp;

    // HP 바 배경 (top-left 앵커 기준)
    const hpBg = this.scene
      .add
      .rectangle(hp.panelX, hp.panelY, hp.panelWidth, hp.panelHeight, COLORS.background.dark)
      .setOrigin(0);
    hpBg.setStrokeStyle(2, COLORS.border.medium);
    topLeftHud.add(hpBg);
    
    // HP 바
    this.hpBar = this.scene.add.graphics();
    this.hpBar.setPosition(hp.panelX, hp.panelY);
    topLeftHud.add(this.hpBar);
    
    // HP 텍스트
    this.hpText = this.scene.add.text(hp.textX, hp.textY, '', {
      font: `bold ${hp.textFontSize}px monospace`,
      color: '#ffffff',
    }).setOrigin(0.5);
    topLeftHud.add(this.hpText);
    
    // HP 라벨 + LV (체력 옆으로 이동)
    const healthLabel = this.scene.add.text(hp.labelX, hp.labelY, t('ui.topBar.health'), {
      font: `bold ${hp.labelFontSize}px monospace`,
      color: COLORS_STR.secondary.main,
    });
    topLeftHud.add(healthLabel);
    
    // 레벨 표시 (체력 라벨 옆)
    this.levelText = this.scene.add.text(hp.levelX, hp.levelY, '', {
      font: `bold ${hp.levelFontSize}px monospace`,
      color: COLORS_STR.primary.dark,
    });
    topLeftHud.add(this.levelText);
  }
  
  private createManaUI() {
    const topLeftHud = this.scene.getTopLeftHudStack();
    const mana = UI_LAYOUT.topBar.mana;

    const manaLabel = this.scene.add.text(mana.labelX, mana.labelY, t('ui.topBar.mana'), {
      font: `bold ${mana.labelFontSize}px monospace`,
      color: COLORS_STR.primary.main,
    });
    topLeftHud.add(manaLabel);
    
    this.manaContainer = this.scene.add.container(mana.containerX, mana.containerY);
    topLeftHud.add(this.manaContainer);
    
    // 마름모꼴 마나 게이지
    const diamondSize = mana.orbSize;
    for (let i = 0; i < GAME_CONSTANTS.MAX_MANA; i++) {
      const diamond = this.scene.add.graphics();
      diamond.setPosition(i * mana.orbSpacing, 0);
      this.drawDiamond(diamond, 0, 0, diamondSize, COLORS.primary.main, COLORS.primary.dark);
      this.manaOrbs.push(diamond);
      this.manaContainer.add(diamond);
    }
  }
  
  /**
   * 마름모 그리기 헬퍼
   */
  private drawDiamond(graphics: Phaser.GameObjects.Graphics, x: number, y: number, size: number, fillColor: number, strokeColor: number) {
    graphics.clear();
    graphics.fillStyle(fillColor, 1);
    graphics.lineStyle(2, strokeColor, 1);
    
    // 마름모 좌표: 위, 오른쪽, 아래, 왼쪽
    graphics.beginPath();
    graphics.moveTo(x, y - size);           // 위
    graphics.lineTo(x + size, y);           // 오른쪽
    graphics.lineTo(x, y + size);           // 아래
    graphics.lineTo(x - size, y);           // 왼쪽
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
  }
  
  private createStatusTexts() {
    const topCenter = this.scene.getUIAnchor('topCenter');
    const topRightStack = this.scene.getTopRightHudStack();
    const topLeftHud = this.scene.getTopLeftHudStack();
    const centerLayout = UI_LAYOUT.topBar.center;
    const rightHud = UI_LAYOUT.hud.topRight;
    const passiveLayout = UI_LAYOUT.topBar.passive;
    
    // 웨이브 표시
    this.waveText = this.scene.add.text(centerLayout.waveX, centerLayout.waveY, '', {
      font: `bold ${centerLayout.waveFontSize}px monospace`,
      color: COLORS_STR.secondary.main,
    }).setOrigin(0.5, 0);
    topCenter.add(this.waveText);
    
    // 페이즈 표시
    this.phaseText = this.scene.add.text(centerLayout.phaseX, centerLayout.phaseY, '', {
      font: `bold ${centerLayout.phaseFontSize}px monospace`,
      color: COLORS_STR.primary.main,
    }).setOrigin(0.5, 0);
    topCenter.add(this.phaseText);
    
    // 우측 상단 HUD 세로 흐름: settings -> turn -> score -> silver
    this.turnText = this.scene.add.text(rightHud.flowX, rightHud.itemY.turn, '', {
      font: `bold ${rightHud.fontSize}px monospace`,
      color: COLORS_STR.text.primary,
    }).setOrigin(1, 0);
    topRightStack.add(this.turnText);

    this.scoreText = this.scene.add.text(rightHud.flowX, rightHud.itemY.score, '', {
      font: `bold ${rightHud.fontSize}px monospace`,
      color: COLORS_STR.primary.main,
    }).setOrigin(1, 0);
    topRightStack.add(this.scoreText);

    this.silverText = this.scene.add.text(rightHud.flowX, rightHud.itemY.silver, '', {
      font: `bold ${rightHud.fontSize}px monospace`,
      color: COLORS_STR.secondary.main,
    }).setOrigin(1, 0);
    topRightStack.add(this.silverText);
    
    // 패시브 표시 영역
    this.statsText = this.scene.add.text(passiveLayout.statsX, passiveLayout.statsY, '', {
      font: `bold ${passiveLayout.statsFontSize}px monospace`,
      color: COLORS_STR.text.muted,
    });
    this.statsText.setVisible(false);
    topLeftHud.add(this.statsText);
    
    // 패시브 컨테이너 (아이콘 형태로 표시)
    this.passiveContainer = this.scene.add.container(passiveLayout.containerX, passiveLayout.containerY);
    topLeftHud.add(this.passiveContainer);
    
    // 패시브 툴팁 생성
    this.createPassiveTooltip();
  }
  
  private createPassiveTooltip() {
    const topLeftHud = this.scene.getTopLeftHudStack();
    const passiveLayout = UI_LAYOUT.topBar.passive;
    this.passiveTooltip = this.scene.add.container(passiveLayout.tooltipX, passiveLayout.tooltipY);
    this.passiveTooltip.setVisible(false);
    this.passiveTooltip.setDepth(1000);
    topLeftHud.add(this.passiveTooltip);
  }
  
  private updatePassiveDisplay() {
    this.passiveContainer.removeAll(true);
    
    const passives = this.scene.gameScene.playerState.passives;
    const displayPassives = passives.filter(p => p.level > 0);
    
    if (displayPassives.length === 0) return;
    
    // 패시브 라벨
    const label = this.scene.add.text(0, 0, t('ui.topBar.passive'), {
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
    const hp = UI_LAYOUT.topBar.hp;
    const player = this.scene.gameScene.playerState;
    const ratio = Math.max(0, player.hp) / player.maxHp;
    
    this.hpBar.clear();
    
    let color: number = COLORS.status.hp.full;
    if (ratio < 0.5) color = COLORS.status.hp.half;
    if (ratio < 0.25) color = COLORS.status.hp.low;
    
    this.hpBar.fillStyle(color);
    this.hpBar.fillRect(hp.fillX, hp.fillY, hp.fillWidth * ratio, hp.fillHeight);  // hpBar(panelX,panelY) 기준 로컬 좌표
    
    if (this.hpText) {
      this.hpText.setText(`${Math.max(0, player.hp)} / ${player.maxHp}`);
    }
  }
  
  updateManaDisplay() {
    const mana = this.scene.gameScene.playerState.mana;
    const maxMana = this.scene.gameScene.playerState.maxMana;
    const diamondSize = UI_LAYOUT.topBar.mana.orbSize;
    
    this.manaOrbs.forEach((diamond, idx) => {
      if (idx < maxMana) {
        diamond.setVisible(true);
        const fillColor = idx < mana ? COLORS.status.mana.active : COLORS.status.mana.empty;
        const strokeColor = idx < mana ? COLORS.primary.dark : COLORS.border.dark;
        this.drawDiamond(diamond, 0, 0, diamondSize, fillColor, strokeColor);
      } else {
        diamond.setVisible(false);
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
    this.levelText.setText(t('ui.topBar.level', { level: player.level, exp: player.exp, expNeeded }));

    this.waveText.setText(t('ui.topBar.wave', { wave: game.currentWave }));
    this.turnText.setText(t('ui.topBar.turn', { turn: game.turn }));
    this.scoreText.setText(t('ui.topBar.score', { score: game.score }));
    this.silverText.setText(t('ui.topBar.silver', { amount: player.silver }));

    const phaseKey = game.phase as 'running' | 'combat' | 'victory' | 'paused' | 'gameOver' | 'event';
    this.phaseText.setText(t(`ui.phases.${phaseKey}`));
  }
}

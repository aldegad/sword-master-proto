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
  private waveText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  
  // 버프 툴팁
  private buffTooltip!: Phaser.GameObjects.Container;
  
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
    
    // 스탯 표시 (버프만, 방어율은 SwordInfoUI에 표시)
    // 반투명 배경과 함께 아래로 배치
    this.statsText = this.scene.add.text(38, 560, '', {
      font: 'bold 20px monospace',
      color: COLORS_STR.text.muted,
      backgroundColor: '#0a0a1580',  // 반투명 배경
      padding: { x: 15, y: 8 },
    });
    
    // 버프 툴팁 생성
    this.createBuffTooltip();
    
    // 버프 텍스트에 마우스 이벤트 추가
    this.statsText.setInteractive({ useHandCursor: true });
    this.statsText.on('pointerover', () => this.showBuffTooltip());
    this.statsText.on('pointerout', () => this.hideBuffTooltip());
  }
  
  private createBuffTooltip() {
    this.buffTooltip = this.scene.add.container(38, 600);
    this.buffTooltip.setVisible(false);
    this.buffTooltip.setDepth(1000);
  }
  
  private showBuffTooltip() {
    const buffs = this.scene.gameScene.playerState.buffs;
    if (buffs.length === 0) return;
    
    // 기존 툴팁 내용 제거
    this.buffTooltip.removeAll(true);
    
    // 툴팁 내용 생성
    const lines: string[] = ['◈ 활성 버프'];
    buffs.forEach(buff => {
      let description = '';
      if (buff.id === 'focus') {
        description = `다음 공격 데미지 +${buff.value * 100}%`;
      } else if (buff.id === 'sharpen') {
        description = `공격력 +${buff.value}`;
      } else if (buff.type === 'defense') {
        description = `방어율 +${buff.value}%`;
      } else {
        description = `공격력 +${buff.value}`;
      }
      lines.push(`  ${buff.name}: ${description} (${buff.duration}턴 남음)`);
    });
    
    const tooltipText = lines.join('\n');
    
    // 배경
    const bg = this.scene.add.rectangle(0, 0, 350, 30 + buffs.length * 28, COLORS.background.black, 0.95);
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(2, COLORS.primary.main);
    
    // 텍스트
    const text = this.scene.add.text(10, 8, tooltipText, {
      font: '16px monospace',
      color: COLORS_STR.text.secondary,
      lineSpacing: 6,
    });
    
    this.buffTooltip.add([bg, text]);
    this.buffTooltip.setVisible(true);
  }
  
  private hideBuffTooltip() {
    this.buffTooltip.setVisible(false);
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
    
    // 레벨 표시 업데이트
    const expNeeded = player.level * 25;  // 필요 경험치 절반
    this.levelText.setText(`LV.${player.level} [${player.exp}/${expNeeded}]`);
    
    // 버프만 표시 (방어율은 SwordInfoUI에서 표시) + 남은 턴수
    const buffs = player.buffs;
    if (buffs.length > 0) {
      const buffTexts = buffs.map(b => `${b.name}(${b.duration})`);
      this.statsText.setText(`✨ ${buffTexts.join(', ')}`);
      this.statsText.setVisible(true);
    } else {
      this.statsText.setText('');
      this.statsText.setVisible(false);  // 버프 없으면 숨김
    }
    
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

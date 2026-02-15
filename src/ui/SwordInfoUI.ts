import * as Phaser from 'phaser';
import type { UIScene } from '../scenes/UIScene';
import { COLORS, COLORS_STR } from '../constants/colors';
import { CardRenderer, CARD_SIZE } from './CardRenderer';
import { i18n } from '../i18n';

/**
 * 무기 정보 UI - 장착된 무기 정보 표시
 */
export class SwordInfoUI {
  private scene: UIScene;
  
  private swordInfoText!: Phaser.GameObjects.Text;
  private swordEmoji!: Phaser.GameObjects.Text;
  private specialEffectText!: Phaser.GameObjects.Text;
  private infoPanel!: Phaser.GameObjects.Rectangle;
  private tooltipContainer!: Phaser.GameObjects.Container;
  private cardRenderer!: CardRenderer;
  
  constructor(scene: UIScene) {
    this.scene = scene;
    this.cardRenderer = new CardRenderer(scene);
    this.create();
  }
  
  private create() {
    // 무기 정보 패널 (1920x1080 스케일)
    this.infoPanel = this.scene.add.rectangle(38, 160, 488, 188, COLORS.background.dark, 0.95).setOrigin(0);
    this.infoPanel.setStrokeStyle(3, COLORS.border.medium);
    
    this.scene.add.text(56, 172, i18n.t('ui.swordInfo.title'), {
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
    
    // 특수효과 텍스트 (패널 하단)
    this.specialEffectText = this.scene.add.text(56, 322, '', {
      font: 'bold 18px monospace',
      color: '#FFD700',
    });
    
    // 툴팁 컨테이너
    this.tooltipContainer = this.scene.add.container(0, 0);
    this.tooltipContainer.setVisible(false);
    this.tooltipContainer.setDepth(1000);
    
    // 호버 이벤트 설정
    this.infoPanel.setInteractive({ useHandCursor: true });
    this.infoPanel.on('pointerover', () => this.showTooltip());
    this.infoPanel.on('pointerout', () => this.hideTooltip());
  }
  
  private showTooltip() {
    const sword = this.scene.gameScene.playerState.currentSword;
    if (!sword) return;
    
    this.tooltipContainer.removeAll(true);
    
    // CardRenderer로 상세 카드 생성
    const detailCard = this.cardRenderer.createDetailCard({ type: 'sword', data: sword }, null);
    
    // 위치: 패널 오른쪽에 표시 (아래로 이동해서 위가 안 잘리게)
    const panelRight = 38 + 488 + 20;
    const tooltipY = CARD_SIZE.DETAIL.height / 2 + 50;  // 상단에서 50px 여유
    
    detailCard.setPosition(panelRight + CARD_SIZE.DETAIL.width / 2, tooltipY);
    this.tooltipContainer.add(detailCard);
    this.tooltipContainer.setVisible(true);
    
    // 패널 하이라이트
    this.infoPanel.setStrokeStyle(4, COLORS.primary.light);
  }
  
  private hideTooltip() {
    this.tooltipContainer.setVisible(false);
    this.infoPanel.setStrokeStyle(3, COLORS.border.medium);
  }
  
  update() {
    this.updateSwordInfo();
  }
  
  private updateSwordInfo() {
    const sword = this.scene.gameScene.playerState.currentSword;
    
    if (!sword) {
      this.swordInfoText.setText(i18n.t('ui.swordInfo.noWeapon'));
      this.swordInfoText.setColor(COLORS_STR.primary.main);
      this.swordEmoji.setText('✊');
      this.specialEffectText.setText('');
      this.stopWarningEffect();
      return;
    }
    
    const reachMap: Record<string, string> = {
      single: i18n.t('ui.range.single'),
      double: i18n.t('ui.range.double'),
      triple: i18n.t('ui.range.triple'),
      all: i18n.t('ui.range.all'),
    };
    
    this.swordEmoji.setText(sword.emoji);
    const displayName = sword.displayName || sword.name;
    this.swordInfoText.setText([
      `${displayName}`,
      i18n.t('ui.swordInfo.stats', { attack: sword.attack, defense: sword.defense, pierce: sword.pierce || 0, count: sword.attackCount }),
      i18n.t('ui.swordInfo.rangeAndDur', { range: reachMap[sword.reach], current: sword.currentDurability, max: sword.durability }),
    ].join('\n'));
    
    // 등급에 따른 색상 변경
    const rarityColor = COLORS_STR.rarity[sword.rarity as keyof typeof COLORS_STR.rarity] || COLORS_STR.rarity.common;
    this.swordInfoText.setColor(rarityColor);
    
    // 특수 효과 표시
    const specialEffects: string[] = [];
    if (sword.specialEffect) {
      specialEffects.push(`✨ ${sword.specialEffect}`);
    }
    if (sword.bleedOnHit) {
      specialEffects.push(i18n.t('ui.swordInfo.bleedEffect'));
    }
    if (sword.poisonOnHit) {
      specialEffects.push(i18n.t('ui.swordInfo.poisonEffect'));
    }
    if (sword.armorBreakOnHit) {
      specialEffects.push(i18n.t('ui.swordInfo.armorBreakEffect'));
    }
    this.specialEffectText.setText(specialEffects.join(' '));
    
    // 내구도 경고 효과 (2 이하일 때 빨간색 반짝임)
    if (sword.currentDurability <= 2) {
      this.startWarningEffect();
    } else {
      this.stopWarningEffect();
    }
  }
  
  private warningTimer: Phaser.Time.TimerEvent | null = null;
  private warningState: boolean = false;
  
  private startWarningEffect() {
    // 이미 경고 효과가 실행 중이면 무시
    if (this.warningTimer) return;
    
    this.warningTimer = this.scene.time.addEvent({
      delay: 400,
      loop: true,
      callback: () => {
        this.warningState = !this.warningState;
        if (this.warningState) {
          this.infoPanel.setStrokeStyle(4, 0xe94560);
          this.infoPanel.setFillStyle(0x3d0a0a, 0.95);
        } else {
          this.infoPanel.setStrokeStyle(3, COLORS.border.medium);
          this.infoPanel.setFillStyle(COLORS.background.dark, 0.95);
        }
      },
    });
    
    // 초기 상태도 빨간색으로
    this.infoPanel.setStrokeStyle(4, 0xe94560);
  }
  
  private stopWarningEffect() {
    if (this.warningTimer) {
      this.warningTimer.destroy();
      this.warningTimer = null;
      this.warningState = false;
      this.infoPanel.setStrokeStyle(3, COLORS.border.medium);
      this.infoPanel.setFillStyle(COLORS.background.dark, 0.95);
    }
  }
}

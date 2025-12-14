import Phaser from 'phaser';
import type { UIScene } from '../scenes/UIScene';
import type { Card } from '../types';
import { CardRenderer, CARD_SIZE } from './CardRenderer';

/**
 * 툴팁 UI - 카드 상세 정보 표시 (CardRenderer 사용)
 */
export class TooltipUI {
  private scene: UIScene;
  private tooltipContainer!: Phaser.GameObjects.Container;
  private cardRenderer!: CardRenderer;
  private isHovering: boolean = false;
  
  constructor(scene: UIScene) {
    this.scene = scene;
    this.cardRenderer = new CardRenderer(scene);
    this.create();
  }
  
  private create() {
    this.tooltipContainer = this.scene.add.container(0, 0);
    this.tooltipContainer.setVisible(false);
    this.tooltipContainer.setDepth(1000);
    
    // 손패 업데이트나 게임 상태 변경 시 툴팁 숨김
    this.scene.gameScene.events.on('handUpdated', () => {
      // 약간의 딜레이 후 체크 (새 카드 렌더링 후 호버 상태 확인)
      this.scene.time.delayedCall(50, () => {
        if (!this.isHovering) {
          this.hide();
        }
      });
    });
    
    // 이벤트/보상 UI 표시 시 툴팁 숨김
    this.scene.gameScene.events.on('showRewardSelection', () => this.hide());
    this.scene.gameScene.events.on('showLevelUpSkillSelection', () => this.hide());
    this.scene.gameScene.events.on('showBossRewardSelection', () => this.hide());
  }
  
  show(x: number, y: number, card: Card) {
    this.isHovering = true;
    this.tooltipContainer.removeAll(true);
    
    // CardRenderer로 상세 카드 생성
    const sword = this.scene.gameScene.playerState.currentSword;
    const detailCard = this.cardRenderer.createDetailCard(card, sword);
    
    // 위치 계산 (카드 위에 표시)
    const screenWidth = this.scene.cameras.main.width;
    const cardWidth = CARD_SIZE.DETAIL.width;
    const cardHeight = CARD_SIZE.DETAIL.height;
    
    // 화면 밖으로 나가지 않도록 조정
    let posX = x;
    let posY = y - cardHeight / 2 - 150;
    
    if (posX - cardWidth / 2 < 10) posX = cardWidth / 2 + 10;
    if (posX + cardWidth / 2 > screenWidth - 10) posX = screenWidth - cardWidth / 2 - 10;
    if (posY - cardHeight / 2 < 10) posY = y + cardHeight / 2 + 50;
    
    detailCard.setPosition(posX, posY);
    this.tooltipContainer.add(detailCard);
    this.tooltipContainer.setVisible(true);
  }
  
  hide() {
    this.isHovering = false;
    this.tooltipContainer.setVisible(false);
  }
}

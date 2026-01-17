import Phaser from 'phaser';
import type { UIScene } from '../scenes/UIScene';
import type { Card } from '../types';
import { CardRenderer, CARD_SIZE } from './CardRenderer';

/**
 * 툴팁 UI - 카드 상세 정보 표시
 * 마우스가 툴팁 영역이나 원본 타겟에서 벗어나면 자동으로 숨김
 */
export class TooltipUI {
  private scene: UIScene;
  private tooltipContainer!: Phaser.GameObjects.Container;
  private cardRenderer!: CardRenderer;
  private hitArea!: Phaser.GameObjects.Rectangle;
  private sourceHitArea: Phaser.GameObjects.Rectangle | null = null;
  
  constructor(scene: UIScene) {
    this.scene = scene;
    this.cardRenderer = new CardRenderer(scene);
    this.create();
  }
  
  private create() {
    this.tooltipContainer = this.scene.add.container(0, 0);
    this.tooltipContainer.setVisible(false);
    this.tooltipContainer.setDepth(1000);
    
    // 툴팁 영역 히트박스 (마우스가 벗어나면 숨김)
    this.hitArea = this.scene.add.rectangle(0, 0, 1, 1, 0x000000, 0);
    this.hitArea.setInteractive();
    this.hitArea.on('pointerout', () => {
      // 원본 타겟 위에 있는지 확인
      if (!this.isPointerOverSource()) {
        this.hide();
      }
    });
    this.tooltipContainer.add(this.hitArea);
  }
  
  /**
   * 마우스가 원본 타겟 위에 있는지 확인
   */
  private isPointerOverSource(): boolean {
    if (!this.sourceHitArea) return false;
    
    const pointer = this.scene.input.activePointer;
    const bounds = this.sourceHitArea.getBounds();
    return bounds.contains(pointer.x, pointer.y);
  }
  
  show(x: number, y: number, card: Card, sourceHitArea?: Phaser.GameObjects.Rectangle) {
    this.tooltipContainer.removeAll(true);
    this.sourceHitArea = sourceHitArea || null;

    // CardRenderer로 상세 카드 생성
    const sword = this.scene.gameScene.swordSlotSystem.getEquippedSword();
    const detailCard = this.cardRenderer.createDetailCard(card, sword);
    
    // 위치 계산
    const screenWidth = this.scene.cameras.main.width;
    const cardWidth = CARD_SIZE.DETAIL.width;
    const cardHeight = CARD_SIZE.DETAIL.height;
    
    let posX = x;
    let posY = y - cardHeight / 2 - 150;
    
    if (posX - cardWidth / 2 < 10) posX = cardWidth / 2 + 10;
    if (posX + cardWidth / 2 > screenWidth - 10) posX = screenWidth - cardWidth / 2 - 10;
    if (posY - cardHeight / 2 < 10) posY = y + cardHeight / 2 + 50;
    
    detailCard.setPosition(posX, posY);
    this.tooltipContainer.add(detailCard);
    
    // 히트 영역 설정 (툴팁 크기와 동일)
    this.hitArea = this.scene.add.rectangle(posX, posY, cardWidth + 20, cardHeight + 20, 0x000000, 0);
    this.hitArea.setInteractive();
    this.hitArea.on('pointerout', () => {
      if (!this.isPointerOverSource()) {
        this.hide();
      }
    });
    this.tooltipContainer.add(this.hitArea);
    
    this.tooltipContainer.setVisible(true);
  }
  
  hide() {
    this.tooltipContainer.setVisible(false);
    this.sourceHitArea = null;
  }
  
  isVisible(): boolean {
    return this.tooltipContainer.visible;
  }
}

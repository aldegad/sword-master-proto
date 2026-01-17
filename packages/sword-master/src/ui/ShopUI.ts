import Phaser from 'phaser';
import type { UIScene } from '../scenes/UIScene';
import type { SwordCard } from '../types';
import { getCleanSword } from '../data/swords';
import { COLORS, COLORS_STR } from '../constants/colors';
import { CardRenderer, CARD_SIZE } from './CardRenderer';
import { USE_SVG, SWORD_ID_TO_SVG } from '../constants/sprites';

interface ShopItem {
  sword: SwordCard;
  price: number;
}

/**
 * 상점 UI - 검 구매 가능
 */
export class ShopUI {
  private scene: UIScene;
  private container!: Phaser.GameObjects.Container;
  private itemsContainer!: Phaser.GameObjects.Container;
  private detailContainer!: Phaser.GameObjects.Container;
  private cardRenderer!: CardRenderer;
  
  private shopItems: ShopItem[] = [];
  private scrollOffset: number = 0;
  private maxScroll: number = 0;
  private onCloseCallback?: () => void;
  
  private readonly ITEM_WIDTH = 180;
  private readonly ITEM_HEIGHT = 260;
  private readonly ITEMS_VISIBLE = 5;
  
  constructor(scene: UIScene) {
    this.scene = scene;
    this.cardRenderer = new CardRenderer(scene);
    this.create();
  }
  
  private create() {
    this.container = this.scene.add.container(0, 0);
    this.container.setVisible(false);
    this.container.setDepth(3000);
    
    this.itemsContainer = this.scene.add.container(0, 0);
    this.detailContainer = this.scene.add.container(0, 0);
    this.detailContainer.setDepth(3100);
  }
  
  show(wave: number, onClose: () => void) {
    this.onCloseCallback = onClose;
    this.scrollOffset = 0;
    
    // 상점 아이템 생성 (5~8개)
    this.generateShopItems(wave);
    
    this.container.removeAll(true);
    this.itemsContainer.removeAll(true);
    this.detailContainer.removeAll(true);
    
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    // 배경 오버레이
    const overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, COLORS.background.black, 0.85);
    overlay.setInteractive();
    this.container.add(overlay);
    
    // 상점 패널
    const panelWidth = 1100;
    const panelHeight = 550;
    const panelX = width / 2;
    const panelY = height / 2;
    
    const panel = this.scene.add.rectangle(panelX, panelY, panelWidth, panelHeight, COLORS.background.dark, 0.98);
    panel.setStrokeStyle(4, COLORS.primary.main);
    this.container.add(panel);
    
    // 제목
    const title = this.scene.add.text(panelX, panelY - panelHeight / 2 + 40, '🧳 떠돌이 상인의 검', {
      font: 'bold 36px monospace',
      color: COLORS_STR.primary.main,
    }).setOrigin(0.5);
    this.container.add(title);
    
    // 현재 은전 표시
    const silver = this.scene.gameScene.playerState.silver;
    const silverText = this.scene.add.text(panelX + panelWidth / 2 - 30, panelY - panelHeight / 2 + 40, `💰 ${silver}`, {
      font: 'bold 28px monospace',
      color: '#ffd700',
    }).setOrigin(1, 0.5);
    this.container.add(silverText);
    
    // 아이템 영역 (스크롤 가능)
    const itemsY = panelY - 30;
    this.itemsContainer.setPosition(panelX - (this.ITEMS_VISIBLE * this.ITEM_WIDTH) / 2 + this.ITEM_WIDTH / 2, itemsY);
    this.container.add(this.itemsContainer);
    
    // 아이템 표시
    this.renderItems();
    
    // 스크롤 버튼
    if (this.shopItems.length > this.ITEMS_VISIBLE) {
      this.createScrollButtons(panelX, itemsY, panelWidth);
    }
    
    // 닫기 버튼
    const closeBtn = this.createButton(panelX, panelY + panelHeight / 2 - 50, '나가기', COLORS.secondary.main, () => {
      this.hide();
    });
    this.container.add(closeBtn);
    
    // 상세 컨테이너 추가
    this.container.add(this.detailContainer);
    
    this.container.setVisible(true);
    
    // 등장 애니메이션
    this.container.setAlpha(0);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
    });
  }
  
  private generateShopItems(wave: number) {
    this.shopItems = [];
    const itemCount = 5 + Math.floor(Math.random() * 4);  // 5~8개
    
    for (let i = 0; i < itemCount; i++) {
      const sword = getCleanSword(wave);  // 상점은 깨끗한 검만 판매
      // 가격 계산: 기본 공격력 * 5 + 등급 보정
      let basePrice = sword.attack * 5;
      
      if (sword.rarity === 'uncommon') basePrice *= 1.5;
      if (sword.rarity === 'rare') basePrice *= 2.5;
      if (sword.rarity === 'unique') basePrice *= 4;
      
      // 상점은 깨끗한 검만 판매하므로 인첸트 가격 조정 불필요
      
      const price = Math.floor(basePrice / 5) * 5;  // 5 단위로 반올림
      
      this.shopItems.push({ sword, price: Math.max(20, price) });
    }
    
    this.maxScroll = Math.max(0, this.shopItems.length - this.ITEMS_VISIBLE);
  }
  
  private renderItems() {
    this.itemsContainer.removeAll(true);
    
    for (let i = 0; i < Math.min(this.shopItems.length, this.ITEMS_VISIBLE); i++) {
      const itemIndex = i + this.scrollOffset;
      if (itemIndex >= this.shopItems.length) break;
      
      const item = this.shopItems[itemIndex];
      const x = i * this.ITEM_WIDTH;
      
      const itemContainer = this.createShopItem(item, x, 0, itemIndex);
      this.itemsContainer.add(itemContainer);
    }
  }
  
  private createShopItem(item: ShopItem, x: number, y: number, _index: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    const silver = this.scene.gameScene.playerState.silver;
    const canAfford = silver >= item.price;
    
    // 카드 배경
    const bg = this.scene.add.rectangle(0, 0, this.ITEM_WIDTH - 10, this.ITEM_HEIGHT, 
      canAfford ? COLORS.background.medium : 0x1a1a2e, 0.95);
    const rarityColor = COLORS.rarity[item.sword.rarity as keyof typeof COLORS.rarity] || COLORS.rarity.common;
    bg.setStrokeStyle(3, canAfford ? rarityColor : COLORS.text.disabled);
    
    // 검 이미지 (SVG 또는 이모지 폴백)
    let swordVisual: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
    const svgKey = SWORD_ID_TO_SVG[item.sword.id];
    if (USE_SVG && svgKey && this.scene.textures.exists(svgKey)) {
      swordVisual = this.scene.add.image(0, -70, svgKey);
      swordVisual.setDisplaySize(56, 56);
    } else {
      swordVisual = this.scene.add.text(0, -70, item.sword.emoji, {
        font: '56px Arial',
      }).setOrigin(0.5);
    }

    // 이름
    const name = this.scene.add.text(0, -10, item.sword.displayName || item.sword.name, {
      font: 'bold 16px monospace',
      color: canAfford ? COLORS_STR.text.primary : COLORS_STR.text.disabled,
      wordWrap: { width: this.ITEM_WIDTH - 20 },
      align: 'center',
    }).setOrigin(0.5);
    
    // 기본 정보
    const info = this.scene.add.text(0, 25, `공${item.sword.attack} ${item.sword.attackCount}타`, {
      font: '14px monospace',
      color: canAfford ? COLORS_STR.text.muted : COLORS_STR.text.disabled,
    }).setOrigin(0.5);
    
    // 가격
    const priceColor = canAfford ? '#ffd700' : '#666666';
    const price = this.scene.add.text(0, 60, `💰 ${item.price}`, {
      font: 'bold 20px monospace',
      color: priceColor,
    }).setOrigin(0.5);
    
    // 구매 버튼 또는 품절 표시
    let buyBtn: Phaser.GameObjects.Container;
    if (canAfford) {
      buyBtn = this.createButton(0, 100, '구매', COLORS.success.main, () => {
        this.purchaseItem(item);
      });
    } else {
      const soldOut = this.scene.add.text(0, 100, '은전 부족', {
        font: '14px monospace',
        color: COLORS_STR.text.disabled,
      }).setOrigin(0.5);
      buyBtn = this.scene.add.container(0, 0);
      buyBtn.add(soldOut);
    }
    
    container.add([bg, swordVisual, name, info, price, buyBtn]);
    
    // 호버 이벤트 - 상세 정보 표시
    bg.setInteractive({ useHandCursor: canAfford });
    bg.on('pointerover', () => {
      this.showItemDetail(item.sword);
      if (canAfford) {
        bg.setStrokeStyle(4, COLORS.primary.light);
        container.setScale(1.05);
      }
    });
    bg.on('pointerout', () => {
      this.hideItemDetail();
      bg.setStrokeStyle(3, canAfford ? rarityColor : COLORS.text.disabled);
      container.setScale(1);
    });
    
    return container;
  }
  
  private showItemDetail(sword: SwordCard) {
    this.detailContainer.removeAll(true);
    
    const width = this.scene.cameras.main.width;
    
    // 상세 카드 생성
    const detailCard = this.cardRenderer.createDetailCard({ type: 'sword', data: sword }, null);
    detailCard.setPosition(width - CARD_SIZE.DETAIL.width / 2 - 50, this.scene.cameras.main.height / 2);
    
    this.detailContainer.add(detailCard);
    this.detailContainer.setVisible(true);
  }
  
  private hideItemDetail() {
    this.detailContainer.setVisible(false);
  }
  
  private purchaseItem(item: ShopItem) {
    const player = this.scene.gameScene.playerState;
    
    if (player.silver < item.price) {
      this.scene.gameScene.animationHelper.showMessage('은전이 부족합니다!', COLORS.message.error);
      return;
    }
    
    // 은전 차감
    player.silver -= item.price;

    // 검을 인벤토리에 추가
    this.scene.gameScene.swordSlotSystem.acquireSword(item.sword);

    // 구매 완료 메시지
    this.scene.gameScene.animationHelper.showMessage(`${item.sword.displayName || item.sword.name} 구매!`, COLORS.message.success);
    
    // 상점에서 제거
    const idx = this.shopItems.indexOf(item);
    if (idx > -1) {
      this.shopItems.splice(idx, 1);
    }
    
    // 스크롤 조정
    if (this.scrollOffset > 0 && this.scrollOffset >= this.shopItems.length - this.ITEMS_VISIBLE + 1) {
      this.scrollOffset--;
    }
    this.maxScroll = Math.max(0, this.shopItems.length - this.ITEMS_VISIBLE);
    
    // 아이템 다시 렌더링
    this.renderItems();
    
    // 은전 표시 업데이트 (상점 다시 열기)
    this.scene.gameScene.events.emit('statsUpdated');
    
    // 아이템이 없으면 상점 닫기
    if (this.shopItems.length === 0) {
      this.scene.gameScene.animationHelper.showMessage('상인이 떠났습니다!', COLORS.message.warning);
      this.hide();
    }
  }
  
  private createScrollButtons(centerX: number, y: number, panelWidth: number) {
    const leftBtn = this.createButton(centerX - panelWidth / 2 + 40, y, '◀', COLORS.primary.main, () => {
      if (this.scrollOffset > 0) {
        this.scrollOffset--;
        this.renderItems();
      }
    });
    this.container.add(leftBtn);
    
    const rightBtn = this.createButton(centerX + panelWidth / 2 - 40, y, '▶', COLORS.primary.main, () => {
      if (this.scrollOffset < this.maxScroll) {
        this.scrollOffset++;
        this.renderItems();
      }
    });
    this.container.add(rightBtn);
  }
  
  private createButton(x: number, y: number, text: string, color: number, callback: () => void): Phaser.GameObjects.Container {
    const btn = this.scene.add.container(x, y);
    
    const bg = this.scene.add.rectangle(0, 0, text.length > 2 ? 120 : 50, 40, COLORS.background.medium, 0.95);
    bg.setStrokeStyle(3, color);
    
    const label = this.scene.add.text(0, 0, text, {
      font: 'bold 20px monospace',
      color: `#${color.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);
    
    btn.add([bg, label]);
    
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      bg.setStrokeStyle(4, COLORS.primary.light);
      btn.setScale(1.05);
    });
    bg.on('pointerout', () => {
      bg.setStrokeStyle(3, color);
      btn.setScale(1);
    });
    bg.on('pointerdown', callback);
    
    return btn;
  }
  
  hide() {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.container.setVisible(false);
        this.detailContainer.setVisible(false);
        if (this.onCloseCallback) {
          this.onCloseCallback();
        }
      },
    });
  }
}


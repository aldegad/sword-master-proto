import Phaser from 'phaser';
import type { UIScene } from '../scenes/UIScene';
import type { Card, SwordCard, SkillCard } from '../types';
import { COLORS, COLORS_STR } from '../constants/colors';
import { CardRenderer } from './CardRenderer';

/**
 * 덱 뷰어 UI - 덱 클릭 시 전체 카드 목록 표시
 * 좌측: 카드 목록 (5개씩, 스크롤 가능)
 * 우측: 선택된 카드 상세 정보
 */
export type ViewMode = 'deck' | 'grave';

export class DeckViewerUI {
  private scene: UIScene;
  private container!: Phaser.GameObjects.Container;
  private cardRenderer!: CardRenderer;
  
  // 현재 보기 모드
  private viewMode: ViewMode = 'deck';
  
  // 스크롤 관련
  private scrollY: number = 0;
  private maxScrollY: number = 0;
  private cardContainer!: Phaser.GameObjects.Container;
  private maskGraphics!: Phaser.GameObjects.Graphics;
  
  // 상세 카드 영역
  private detailContainer!: Phaser.GameObjects.Container;
  
  // 스크롤 버튼
  private upButton!: Phaser.GameObjects.Container;
  private downButton!: Phaser.GameObjects.Container;
  
  // 카드 수 표시 (고정)
  private cardCountText!: Phaser.GameObjects.Text;
  
  // 제목 텍스트
  private titleText!: Phaser.GameObjects.Text;
  
  // 레이아웃 상수
  private readonly CARDS_PER_ROW = 5;
  private readonly CARD_WIDTH = 150;
  private readonly CARD_HEIGHT = 220;
  private readonly CARD_SPACING = 12;
  private readonly LEFT_PANEL_WIDTH = 860;  // 카드 목록 영역 너비
  private readonly LEFT_PANEL_X = 30;       // 왼쪽 패널 시작 X
  private readonly SCROLL_SPEED = 80;
  
  constructor(scene: UIScene) {
    this.scene = scene;
    this.cardRenderer = new CardRenderer(scene);
    this.create();
  }
  
  private create() {
    this.container = this.scene.add.container(0, 0);
    this.container.setVisible(false);
    this.container.setDepth(3000);
    
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    // 배경 오버레이
    const overlay = this.scene.add.rectangle(width/2, height/2, width, height, COLORS.background.black, 0.92);
    this.container.add(overlay);
    
    // 제목 (동적으로 변경됨)
    this.titleText = this.scene.add.text(width/2, 50, '📚 덱 목록', {
      font: 'bold 42px monospace',
      color: COLORS_STR.primary.dark,
    }).setOrigin(0.5);
    this.container.add(this.titleText);
    
    // 카드 영역의 실제 너비 계산 (5장 + 간격)
    const cardsContentWidth = this.CARDS_PER_ROW * this.CARD_WIDTH + (this.CARDS_PER_ROW - 1) * this.CARD_SPACING;
    const leftPanelPadding = (this.LEFT_PANEL_WIDTH - cardsContentWidth) / 2;
    
    // 왼쪽 패널 (카드 목록) 배경
    const leftPanelBg = this.scene.add.rectangle(
      this.LEFT_PANEL_X + this.LEFT_PANEL_WIDTH / 2,
      height / 2 + 30,
      this.LEFT_PANEL_WIDTH,
      height - 180,
      COLORS.background.dark,
      0.8
    );
    leftPanelBg.setStrokeStyle(3, COLORS.border.medium);
    this.container.add(leftPanelBg);
    
    // 오른쪽 패널 (카드 상세) 배경
    const rightPanelX = this.LEFT_PANEL_X + this.LEFT_PANEL_WIDTH + 30 + (width - this.LEFT_PANEL_X - this.LEFT_PANEL_WIDTH - 60) / 2;
    const rightPanelBg = this.scene.add.rectangle(
      rightPanelX,
      height / 2 + 30,
      width - this.LEFT_PANEL_X - this.LEFT_PANEL_WIDTH - 60,
      height - 180,
      COLORS.background.dark,
      0.8
    );
    rightPanelBg.setStrokeStyle(3, COLORS.border.medium);
    this.container.add(rightPanelBg);
    
    // 오른쪽 패널 라벨
    const rightLabel = this.scene.add.text(rightPanelX, 100, '🔍 카드 상세', {
      font: 'bold 28px monospace',
      color: COLORS_STR.primary.main,
    }).setOrigin(0.5);
    this.container.add(rightLabel);
    
    // 상세 카드 컨테이너
    this.detailContainer = this.scene.add.container(rightPanelX, height / 2 + 40);
    this.container.add(this.detailContainer);
    
    // 기본 안내 텍스트
    const hintText = this.scene.add.text(0, 0, '카드에 마우스를\n올려보세요', {
      font: '24px monospace',
      color: COLORS_STR.text.muted,
      align: 'center',
    }).setOrigin(0.5);
    this.detailContainer.add(hintText);
    
    // 카드 수 표시 (고정, 스크롤에 포함 안됨)
    this.cardCountText = this.scene.add.text(
      this.LEFT_PANEL_X + this.LEFT_PANEL_WIDTH / 2, 
      105, 
      '', 
      {
        font: 'bold 18px monospace',
        color: COLORS_STR.text.secondary,
      }
    ).setOrigin(0.5);
    this.container.add(this.cardCountText);
    
    // 카드 목록 컨테이너 (스크롤 대상) - 가운데 정렬
    const cardContainerX = this.LEFT_PANEL_X + leftPanelPadding;
    this.cardContainer = this.scene.add.container(cardContainerX, 140);
    this.container.add(this.cardContainer);
    
    // 마스크 영역 생성 (카드 목록 영역만 보이게, 카드 수 표시 아래부터)
    this.maskGraphics = this.scene.make.graphics({ x: 0, y: 0 });
    this.maskGraphics.fillStyle(0xffffff);
    this.maskGraphics.fillRect(this.LEFT_PANEL_X, 130, this.LEFT_PANEL_WIDTH, height - 230);
    
    const mask = this.maskGraphics.createGeometryMask();
    this.cardContainer.setMask(mask);
    
    // 닫기 버튼
    const closeBtn = this.scene.add.container(width - 60, 50);
    const closeBg = this.scene.add.rectangle(0, 0, 80, 50, COLORS.secondary.dark, 0.9);
    closeBg.setStrokeStyle(2, COLORS.secondary.main);
    const closeText = this.scene.add.text(0, 0, '✕ 닫기', {
      font: 'bold 18px monospace',
      color: COLORS_STR.text.primary,
    }).setOrigin(0.5);
    closeBtn.add([closeBg, closeText]);
    this.container.add(closeBtn);
    
    closeBg.setInteractive({ useHandCursor: true });
    closeBg.on('pointerover', () => {
      closeBg.setStrokeStyle(3, COLORS.secondary.light);
      closeBtn.setScale(1.05);
    });
    closeBg.on('pointerout', () => {
      closeBg.setStrokeStyle(2, COLORS.secondary.main);
      closeBtn.setScale(1);
    });
    closeBg.on('pointerdown', () => {
      this.hide();
    });
    
    // 스크롤 버튼 생성 (콘솔 대응)
    this.createScrollButtons();
    
    // 스크롤 안내
    const scrollHint = this.scene.add.text(this.LEFT_PANEL_X + this.LEFT_PANEL_WIDTH / 2, height - 45, '🖱️ 휠 또는 버튼으로 스크롤', {
      font: '16px monospace',
      color: COLORS_STR.text.muted,
    }).setOrigin(0.5);
    this.container.add(scrollHint);
    
    // 마우스 휠 이벤트
    this.scene.input.on('wheel', this.onWheel, this);
    
    // ESC 키로 닫기
    this.scene.input.keyboard!.on('keydown-ESC', () => {
      if (this.container.visible) {
        this.hide();
      }
    });
  }
  
  private createScrollButtons() {
    const height = this.scene.cameras.main.height;
    // 버튼을 스크롤 영역 중앙에 배치
    const buttonX = this.LEFT_PANEL_X + this.LEFT_PANEL_WIDTH / 2;
    
    // 위로 스크롤 버튼 (스크롤 영역 상단)
    this.upButton = this.scene.add.container(buttonX, 135);
    const upBg = this.scene.add.rectangle(0, 0, 50, 80, COLORS.background.medium, 0.9);
    upBg.setStrokeStyle(2, COLORS.primary.dark);
    const upArrow = this.scene.add.text(0, 0, '▲', {
      font: 'bold 32px monospace',
      color: COLORS_STR.primary.main,
    }).setOrigin(0.5);
    this.upButton.add([upBg, upArrow]);
    this.container.add(this.upButton);
    
    upBg.setInteractive({ useHandCursor: true });
    upBg.on('pointerover', () => {
      upBg.setStrokeStyle(3, COLORS.primary.light);
      upArrow.setColor(COLORS_STR.primary.light);
    });
    upBg.on('pointerout', () => {
      upBg.setStrokeStyle(2, COLORS.primary.dark);
      upArrow.setColor(COLORS_STR.primary.main);
    });
    upBg.on('pointerdown', () => {
      this.scrollUp();
    });
    
    // 아래로 스크롤 버튼 (스크롤 영역 하단)
    this.downButton = this.scene.add.container(buttonX, height - 80);
    const downBg = this.scene.add.rectangle(0, 0, 50, 80, COLORS.background.medium, 0.9);
    downBg.setStrokeStyle(2, COLORS.primary.dark);
    const downArrow = this.scene.add.text(0, 0, '▼', {
      font: 'bold 32px monospace',
      color: COLORS_STR.primary.main,
    }).setOrigin(0.5);
    this.downButton.add([downBg, downArrow]);
    this.container.add(this.downButton);
    
    downBg.setInteractive({ useHandCursor: true });
    downBg.on('pointerover', () => {
      downBg.setStrokeStyle(3, COLORS.primary.light);
      downArrow.setColor(COLORS_STR.primary.light);
    });
    downBg.on('pointerout', () => {
      downBg.setStrokeStyle(2, COLORS.primary.dark);
      downArrow.setColor(COLORS_STR.primary.main);
    });
    downBg.on('pointerdown', () => {
      this.scrollDown();
    });
  }
  
  private scrollUp() {
    this.scrollY -= this.SCROLL_SPEED;
    this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScrollY);
    this.updateScrollPosition();
  }
  
  private scrollDown() {
    this.scrollY += this.SCROLL_SPEED;
    this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScrollY);
    this.updateScrollPosition();
  }
  
  private updateScrollPosition() {
    this.cardContainer.y = 140 - this.scrollY;
  }
  
  private onWheel(_pointer: Phaser.Input.Pointer, _gameObjects: any[], _deltaX: number, deltaY: number) {
    if (!this.container.visible) return;
    
    this.scrollY += deltaY > 0 ? this.SCROLL_SPEED : -this.SCROLL_SPEED;
    this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScrollY);
    
    this.updateScrollPosition();
  }
  
  show(mode: ViewMode = 'deck') {
    this.viewMode = mode;
    this.scrollY = 0;
    
    // 제목 업데이트
    if (mode === 'deck') {
      this.titleText.setText('📚 덱 목록');
    } else {
      this.titleText.setText('🪦 무덤 목록');
    }
    
    this.updateDeckDisplay();
    this.updateDetailCard(null);
    this.container.setVisible(true);
  }
  
  hide() {
    this.container.setVisible(false);
  }
  
  isVisible(): boolean {
    return this.container.visible;
  }
  
  private updateDeckDisplay() {
    this.cardContainer.removeAll(true);
    
    const allCards: { card: Card; location: string }[] = [];
    
    if (this.viewMode === 'deck') {
      // 덱 모드: 장착중 + 손패 + 덱
      
      // 장착 중인 무기
      if (this.scene.gameScene.playerState.currentSword) {
        allCards.push({ 
          card: { type: 'sword', data: this.scene.gameScene.playerState.currentSword },
          location: '장착중'
        });
      }
      
      // 손패
      this.scene.gameScene.playerState.hand.forEach(card => {
        allCards.push({ card, location: '손패' });
      });
      
      // 덱
      this.scene.gameScene.playerState.deck.forEach(card => {
        allCards.push({ card, location: '덱' });
      });
      
      // 카드 수 표시
      const equipped = this.scene.gameScene.playerState.currentSword ? 1 : 0;
      this.cardCountText.setText(
        `총 ${allCards.length}장 (장착: ${equipped} / 손패: ${this.scene.gameScene.playerState.hand.length} / 덱: ${this.scene.gameScene.playerState.deck.length})`
      );
    } else {
      // 무덤 모드: 무덤만
      this.scene.gameScene.playerState.discard.forEach(card => {
        allCards.push({ card, location: '무덤' });
      });
      
      // 카드 수 표시
      this.cardCountText.setText(`총 ${allCards.length}장`);
    }
    
    // 카드 배치
    allCards.forEach((item, index) => {
      const row = Math.floor(index / this.CARDS_PER_ROW);
      const col = index % this.CARDS_PER_ROW;
      
      const x = col * (this.CARD_WIDTH + this.CARD_SPACING) + this.CARD_WIDTH / 2;
      const y = row * (this.CARD_HEIGHT + this.CARD_SPACING) + this.CARD_HEIGHT / 2;
      
      const cardSprite = this.createMiniCard(item.card, item.location, x, y);
      this.cardContainer.add(cardSprite);
    });
    
    // 최대 스크롤 계산
    const totalRows = Math.ceil(allCards.length / this.CARDS_PER_ROW);
    const contentHeight = totalRows * (this.CARD_HEIGHT + this.CARD_SPACING);
    const viewHeight = this.scene.cameras.main.height - 260;
    this.maxScrollY = Math.max(0, contentHeight - viewHeight);
    
    this.updateScrollPosition();
  }
  
  private createMiniCard(card: Card, location: string, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    const isSword = card.type === 'sword';
    const data = card.data;
    
    // 배경
    const bgColor = isSword ? COLORS.background.light : COLORS.background.dark;
    const borderColor = this.getBorderColor(card, location);
    
    const bg = this.scene.add.rectangle(0, 0, this.CARD_WIDTH, this.CARD_HEIGHT, bgColor);
    bg.setStrokeStyle(3, borderColor);
    container.add(bg);
    
    // 이모지
    const emoji = this.scene.add.text(0, -50, data.emoji, {
      font: '42px Arial',
    }).setOrigin(0.5);
    container.add(emoji);
    
    // 이름
    const displayName = isSword ? ((data as SwordCard).displayName || data.name) : data.name;
    const shortName = displayName.length > 6 ? displayName.slice(0, 5) + '..' : displayName;
    const nameText = this.scene.add.text(0, 5, shortName, {
      font: 'bold 16px monospace',
      color: COLORS_STR.text.primary,
    }).setOrigin(0.5);
    container.add(nameText);
    
    // 마나 비용
    const manaText = this.scene.add.text(0, 35, `◈${data.manaCost}`, {
      font: '16px monospace',
      color: COLORS_STR.primary.main,
    }).setOrigin(0.5);
    container.add(manaText);
    
    // 위치 표시
    const locationColor = location === '장착중' ? COLORS_STR.secondary.main : 
                          location === '손패' ? COLORS_STR.primary.light :
                          location === '무덤' ? COLORS_STR.text.muted : COLORS_STR.text.secondary;
    const locationText = this.scene.add.text(0, 65, location, {
      font: 'bold 14px monospace',
      color: locationColor,
    }).setOrigin(0.5);
    container.add(locationText);
    
    // 이가 빠진 표시
    if (isSword && (data as SwordCard).prefix?.id === 'chipped') {
      const chippedBadge = this.scene.add.text(this.CARD_WIDTH/2 - 5, -this.CARD_HEIGHT/2 + 5, '⚠️', {
        font: '16px Arial',
      }).setOrigin(1, 0);
      container.add(chippedBadge);
    }
    
    // 인터랙션
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      bg.setStrokeStyle(4, COLORS.primary.light);
      container.setScale(1.05);
      this.updateDetailCard(card);
    });
    bg.on('pointerout', () => {
      bg.setStrokeStyle(3, borderColor);
      container.setScale(1);
    });
    
    return container;
  }
  
  private getBorderColor(card: Card, location: string): number {
    if (location === '장착중') return COLORS.secondary.main;
    
    if (card.type === 'sword') {
      const sword = card.data as SwordCard;
      return COLORS.rarity[sword.rarity as keyof typeof COLORS.rarity || 'common'];
    }
    
    const skill = card.data as SkillCard;
    return skill.isSwift ? COLORS.card.swift : COLORS.card.skill;
  }
  
  private updateDetailCard(card: Card | null) {
    this.detailContainer.removeAll(true);
    
    if (!card) {
      const hintText = this.scene.add.text(0, 0, '카드에 마우스를\n올려보세요', {
        font: '24px monospace',
        color: COLORS_STR.text.muted,
        align: 'center',
      }).setOrigin(0.5);
      this.detailContainer.add(hintText);
      return;
    }
    
    // 상세 카드 생성
    const detailCard = this.cardRenderer.createDetailCard(
      card,
      card.type === 'skill' ? this.scene.gameScene.playerState.currentSword : null
    );
    this.detailContainer.add(detailCard);
  }
}

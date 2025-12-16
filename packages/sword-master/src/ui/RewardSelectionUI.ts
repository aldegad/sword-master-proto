import Phaser from 'phaser';
import type { UIScene } from '../scenes/UIScene';
import type { Card, SwordCard, SkillCard } from '../types';
import { COLORS, COLORS_STR } from '../constants/colors';
import { CardRenderer, CARD_SIZE } from './CardRenderer';

/**
 * 보상 선택 UI - 전투 승리 후 보상 카드 선택 (CardRenderer 사용)
 */
export class RewardSelectionUI {
  private scene: UIScene;
  private rewardContainer!: Phaser.GameObjects.Container;
  private cardRenderer!: CardRenderer;
  
  constructor(scene: UIScene) {
    this.scene = scene;
    this.cardRenderer = new CardRenderer(scene);
    this.create();
  }
  
  private create() {
    this.rewardContainer = this.scene.add.container(0, 0);
    this.rewardContainer.setVisible(false);
    this.rewardContainer.setDepth(2000);
  }
  
  show() {
    this.rewardContainer.removeAll(true);
    
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const rewardCards = this.scene.gameScene.rewardCards;
    
    if (rewardCards.length === 0) return;
    
    // 배경 오버레이
    const overlay = this.scene.add.rectangle(width/2, height/2, width, height, COLORS.background.overlay, 0.85);
    this.rewardContainer.add(overlay);
    
    // 제목
    const title = this.scene.add.text(width/2, 100, '🎁 보상 카드를 선택하세요!', {
      font: 'bold 48px monospace',
      color: COLORS_STR.primary.dark,
    }).setOrigin(0.5);
    this.rewardContainer.add(title);
    
    // 상세 카드 크기 사용
    const cardWidth = CARD_SIZE.DETAIL.width;
    const spacing = 40;
    const totalWidth = rewardCards.length * cardWidth + (rewardCards.length - 1) * spacing;
    const startX = (width - totalWidth) / 2 + cardWidth / 2;
    
    rewardCards.forEach((card, index) => {
      const x = startX + index * (cardWidth + spacing);
      const y = height / 2 - 80;  // 중앙보다 위로 배치 (겹침 방지)
      
      const cardContainer = this.createRewardCard(card, x, y, index);
      this.rewardContainer.add(cardContainer);
    });
    
    // 건너뛰기 버튼 (아래로 이동 + 은전 추가)
    const skipBtn = this.scene.add.container(width/2, height - 100);
    const skipBg = this.scene.add.rectangle(0, 0, 375, 94, COLORS.background.dark, 0.9);
    skipBg.setStrokeStyle(3, COLORS.primary.dark);
    const skipText = this.scene.add.text(0, -12, '건너뛰기', {
      font: 'bold 32px monospace',
      color: COLORS_STR.text.muted,
    }).setOrigin(0.5);
    const silverText = this.scene.add.text(0, 24, '💰 +20 은전', {
      font: 'bold 22px monospace',
      color: '#ffd700',
    }).setOrigin(0.5);
    skipBtn.add([skipBg, skipText, silverText]);
    
    skipBg.setInteractive({ useHandCursor: true });
    skipBg.on('pointerover', () => {
      skipBg.setStrokeStyle(5, COLORS.primary.light);
      skipText.setColor(COLORS_STR.primary.light);
      skipBtn.setScale(1.05);
    });
    skipBg.on('pointerout', () => {
      skipBg.setStrokeStyle(3, COLORS.primary.dark);
      skipText.setColor(COLORS_STR.text.muted);
      skipBtn.setScale(1);
    });
    skipBg.on('pointerdown', () => {
      this.scene.gameScene.skipReward();
    });
    
    this.rewardContainer.add(skipBtn);
    this.rewardContainer.setVisible(true);
  }
  
  private createRewardCard(card: Card, x: number, y: number, index: number): Phaser.GameObjects.Container {
    const wrapper = this.scene.add.container(x, y);
    
    // CardRenderer로 상세 카드 생성
    const detailCard = this.cardRenderer.createDetailCard(card, null);
    wrapper.add(detailCard);
    
    // 선택 버튼 추가
    const cardHeight = CARD_SIZE.DETAIL.height;
    const selectBtn = this.scene.add.rectangle(0, cardHeight / 2 + 50, 180, 60, COLORS.success.main, 0.9);
    selectBtn.setStrokeStyle(4, COLORS.primary.light);
    const selectText = this.scene.add.text(0, cardHeight / 2 + 50, '선택', {
      font: 'bold 28px monospace',
      color: COLORS_STR.primary.light,
    }).setOrigin(0.5);
    wrapper.add([selectBtn, selectText]);
    
    // 인터랙션 영역 (카드 전체)
    const hitArea = this.scene.add.rectangle(0, 0, CARD_SIZE.DETAIL.width, cardHeight, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    wrapper.add(hitArea);
    
    // 테두리 색상
    const isSword = card.type === 'sword';
    const isSwiftSkill = !isSword && (card.data as SkillCard).isSwift === true;
    const borderColor = isSword 
      ? COLORS.rarity[(card.data as SwordCard).rarity as keyof typeof COLORS.rarity || 'common']
      : (isSwiftSkill ? COLORS.card.swift : COLORS.card.skill);
    
    const onHover = () => {
      wrapper.setScale(1.05);
      // 카드 배경의 테두리 강조 (첫 번째 자식이 배경)
      const bg = detailCard.getAt(0) as Phaser.GameObjects.Rectangle;
      if (bg) bg.setStrokeStyle(8, COLORS.primary.light);
    };
    
    const onOut = () => {
      wrapper.setScale(1);
      const bg = detailCard.getAt(0) as Phaser.GameObjects.Rectangle;
      if (bg) bg.setStrokeStyle(5, borderColor);
    };
    
    const onSelect = () => {
      this.scene.gameScene.selectRewardCard(index);
    };
    
    hitArea.on('pointerover', onHover);
    hitArea.on('pointerout', onOut);
    hitArea.on('pointerdown', onSelect);
    selectBtn.setInteractive({ useHandCursor: true });
    selectBtn.on('pointerover', onHover);
    selectBtn.on('pointerout', onOut);
    selectBtn.on('pointerdown', onSelect);
    
    return wrapper;
  }
  
  hide() {
    this.rewardContainer.removeAll(true);
    this.rewardContainer.setVisible(false);
  }
}

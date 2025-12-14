import Phaser from 'phaser';
import type { UIScene } from '../scenes/UIScene';
import type { Card, SkillCard } from '../types';
import { COLORS, COLORS_STR } from '../constants/colors';
import { CardRenderer, CARD_SIZE } from './CardRenderer';

/**
 * 레벨업 스킬 선택 UI
 */
export class LevelUpSkillUI {
  private scene: UIScene;
  private container!: Phaser.GameObjects.Container;
  private cardRenderer!: CardRenderer;
  
  constructor(scene: UIScene) {
    this.scene = scene;
    this.cardRenderer = new CardRenderer(scene);
    this.create();
  }
  
  private create() {
    this.container = this.scene.add.container(0, 0);
    this.container.setVisible(false);
    this.container.setDepth(2000);
  }
  
  show() {
    this.container.removeAll(true);
    
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const skillCards = this.scene.gameScene.levelUpSkillCards;
    
    if (skillCards.length === 0) return;
    
    // 배경 오버레이
    const overlay = this.scene.add.rectangle(width/2, height/2, width, height, COLORS.background.overlay, 0.85);
    this.container.add(overlay);
    
    // 제목
    const title = this.scene.add.text(width/2, 80, '🎉 레벨 업! 스킬을 선택하세요!', {
      font: 'bold 48px monospace',
      color: COLORS_STR.primary.dark,
    }).setOrigin(0.5);
    this.container.add(title);
    
    // 현재 레벨 표시
    const levelText = this.scene.add.text(width/2, 130, `LV.${this.scene.gameScene.playerState.level}`, {
      font: 'bold 36px monospace',
      color: '#FFD700',
    }).setOrigin(0.5);
    this.container.add(levelText);
    
    // 카드 배치
    const cardWidth = CARD_SIZE.DETAIL.width;
    const spacing = 40;
    const totalWidth = skillCards.length * cardWidth + (skillCards.length - 1) * spacing;
    const startX = (width - totalWidth) / 2 + cardWidth / 2;
    
    skillCards.forEach((card, index) => {
      const x = startX + index * (cardWidth + spacing);
      const y = height / 2;
      
      const cardContainer = this.createSkillCard(card, x, y, index);
      this.container.add(cardContainer);
    });
    
    // 건너뛰기 버튼
    const skipBtn = this.scene.add.container(width/2, height - 100);
    const skipBg = this.scene.add.rectangle(0, 0, 250, 60, COLORS.background.dark, 0.9);
    skipBg.setStrokeStyle(3, COLORS.text.muted);
    const skipText = this.scene.add.text(0, 0, '건너뛰기', {
      font: 'bold 28px monospace',
      color: COLORS_STR.text.muted,
    }).setOrigin(0.5);
    skipBtn.add([skipBg, skipText]);
    
    skipBg.setInteractive({ useHandCursor: true });
    skipBg.on('pointerover', () => {
      skipBg.setStrokeStyle(5, COLORS.primary.light);
      skipText.setColor(COLORS_STR.primary.light);
    });
    skipBg.on('pointerout', () => {
      skipBg.setStrokeStyle(3, COLORS.text.muted);
      skipText.setColor(COLORS_STR.text.muted);
    });
    skipBg.on('pointerdown', () => {
      this.scene.gameScene.skipLevelUpSkill();
    });
    
    this.container.add(skipBtn);
    this.container.setVisible(true);
  }
  
  private createSkillCard(card: Card, x: number, y: number, index: number): Phaser.GameObjects.Container {
    const wrapper = this.scene.add.container(x, y);
    
    // CardRenderer로 상세 카드 생성
    const sword = this.scene.gameScene.playerState.currentSword;
    const detailCard = this.cardRenderer.createDetailCard(card, sword);
    wrapper.add(detailCard);
    
    // 선택 버튼
    const cardHeight = CARD_SIZE.DETAIL.height;
    const selectBtn = this.scene.add.rectangle(0, cardHeight / 2 + 50, 180, 60, COLORS.success.main, 0.9);
    selectBtn.setStrokeStyle(4, COLORS.primary.light);
    const selectText = this.scene.add.text(0, cardHeight / 2 + 50, '선택', {
      font: 'bold 28px monospace',
      color: COLORS_STR.primary.light,
    }).setOrigin(0.5);
    wrapper.add([selectBtn, selectText]);
    
    // 인터랙션 영역
    const hitArea = this.scene.add.rectangle(0, 0, CARD_SIZE.DETAIL.width, cardHeight, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    wrapper.add(hitArea);
    
    const skill = card.data as SkillCard;
    const isSwift = skill.isSwift === true;
    const borderColor = isSwift ? COLORS.card.swift : COLORS.card.skill;
    
    const onHover = () => {
      wrapper.setScale(1.05);
      const bg = detailCard.getAt(0) as Phaser.GameObjects.Rectangle;
      if (bg) bg.setStrokeStyle(8, COLORS.primary.light);
    };
    
    const onOut = () => {
      wrapper.setScale(1);
      const bg = detailCard.getAt(0) as Phaser.GameObjects.Rectangle;
      if (bg) bg.setStrokeStyle(5, borderColor);
    };
    
    const onSelect = () => {
      this.scene.gameScene.selectLevelUpSkill(index);
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
    this.container.setVisible(false);
  }
}

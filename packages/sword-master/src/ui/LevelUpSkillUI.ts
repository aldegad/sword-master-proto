import Phaser from 'phaser';
import type { UIScene } from '../scenes/UIScene';
import type { Card, SkillCard, PassiveTemplate } from '../types';
import { COLORS, COLORS_STR } from '../constants/colors';
import { CardRenderer, CARD_SIZE } from './CardRenderer';

/**
 * 레벨업 선택 UI (스킬 / 패시브 분리)
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
  
  /**
   * 스킬 선택 화면 표시
   */
  showSkills() {
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
    
    // 단계 표시
    const stepText = this.scene.add.text(width/2, 170, '[ 1/2 스킬 선택 ]', {
      font: '24px monospace',
      color: COLORS_STR.text.muted,
    }).setOrigin(0.5);
    this.container.add(stepText);
    
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
  
  /**
   * 패시브 선택 화면 표시
   */
  showPassives() {
    this.container.removeAll(true);
    
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const passives = this.scene.gameScene.levelUpPassives;
    
    if (passives.length === 0) return;
    
    // 배경 오버레이
    const overlay = this.scene.add.rectangle(width/2, height/2, width, height, COLORS.background.overlay, 0.85);
    this.container.add(overlay);
    
    // 제목
    const title = this.scene.add.text(width/2, 80, '🔮 패시브를 선택하세요!', {
      font: 'bold 48px monospace',
      color: COLORS_STR.rarity.unique,
    }).setOrigin(0.5);
    this.container.add(title);
    
    // 현재 레벨 표시
    const levelText = this.scene.add.text(width/2, 130, `LV.${this.scene.gameScene.playerState.level}`, {
      font: 'bold 36px monospace',
      color: '#FFD700',
    }).setOrigin(0.5);
    this.container.add(levelText);
    
    // 단계 표시
    const stepText = this.scene.add.text(width/2, 170, '[ 2/2 패시브 선택 ]', {
      font: '24px monospace',
      color: COLORS_STR.text.muted,
    }).setOrigin(0.5);
    this.container.add(stepText);
    
    // 패시브 카드 배치
    const cardWidth = CARD_SIZE.DETAIL.width;
    const spacing = 40;
    const totalWidth = passives.length * cardWidth + (passives.length - 1) * spacing;
    const startX = (width - totalWidth) / 2 + cardWidth / 2;
    
    passives.forEach((passive, index) => {
      const x = startX + index * (cardWidth + spacing);
      const y = height / 2;
      
      const cardContainer = this.createPassiveCard(passive, x, y, index);
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
      this.scene.gameScene.skipLevelUpPassive();
    });
    
    this.container.add(skipBtn);
    this.container.setVisible(true);
  }
  
  private createSkillCard(card: Card, x: number, y: number, index: number): Phaser.GameObjects.Container {
    const wrapper = this.scene.add.container(x, y);

    // CardRenderer로 상세 카드 생성
    const sword = this.scene.gameScene.swordSlotSystem.getEquippedSword();
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
  
  /**
   * 패시브 카드 생성
   */
  private createPassiveCard(
    passive: PassiveTemplate, 
    x: number, 
    y: number, 
    index: number
  ): Phaser.GameObjects.Container {
    const wrapper = this.scene.add.container(x, y);
    const cardWidth = CARD_SIZE.DETAIL.width;
    const cardHeight = CARD_SIZE.DETAIL.height;
    
    // 카드 배경 (보라색 테두리 - 패시브 전용)
    const bg = this.scene.add.rectangle(0, 0, cardWidth, cardHeight, COLORS.background.dark, 0.95);
    bg.setStrokeStyle(5, COLORS.rarity.unique);
    wrapper.add(bg);
    
    // 패시브 아이콘
    let emoji = '🔮';
    if (passive.id === 'waitIncrease') emoji = '⏳';
    else if (passive.id === 'perfectCast') emoji = '✨';
    else if (passive.id === 'defenseBonus') emoji = '🛡️';
    
    const icon = this.scene.add.text(0, -cardHeight/2 + 80, emoji, {
      font: '80px Arial',
    }).setOrigin(0.5);
    wrapper.add(icon);
    
    // 패시브 타입 라벨
    const typeLabel = this.scene.add.text(0, -cardHeight/2 + 150, '【패시브】', {
      font: 'bold 24px monospace',
      color: COLORS_STR.rarity.unique,
    }).setOrigin(0.5);
    wrapper.add(typeLabel);
    
    // 패시브 이름
    const nameText = this.scene.add.text(0, -cardHeight/2 + 190, passive.name, {
      font: 'bold 32px monospace',
      color: COLORS_STR.text.primary,
    }).setOrigin(0.5);
    wrapper.add(nameText);
    
    // 현재 레벨 표시
    const existingPassive = this.scene.gameScene.playerState.passives.find(p => p.id === passive.id);
    const currentLevel = existingPassive ? existingPassive.level : 0;
    const isMaxLevel = currentLevel >= passive.maxLevel;
    
    let levelDisplay = '';
    if (isMaxLevel) {
      levelDisplay = `Lv.${currentLevel}/${passive.maxLevel} (MAX)`;
    } else if (currentLevel > 0) {
      levelDisplay = `Lv.${currentLevel} → Lv.${currentLevel + 1}`;
    } else {
      levelDisplay = `Lv.1 / ${passive.maxLevel}`;
    }
    
    const levelText = this.scene.add.text(0, -cardHeight/2 + 230, levelDisplay, {
      font: '22px monospace',
      color: isMaxLevel ? COLORS_STR.text.muted : '#FFD700',
    }).setOrigin(0.5);
    wrapper.add(levelText);
    
    // 설명
    const descText = this.scene.add.text(0, -cardHeight/2 + 300, passive.description, {
      font: '24px monospace',
      color: COLORS_STR.text.secondary,
      wordWrap: { width: cardWidth - 40 },
      align: 'center',
    }).setOrigin(0.5, 0);
    wrapper.add(descText);
    
    // 선택 버튼 (최대 레벨이면 비활성화)
    const selectBtn = this.scene.add.rectangle(0, cardHeight / 2 + 50, 180, 60, 
      isMaxLevel ? COLORS.background.medium : COLORS.rarity.unique, 0.9);
    selectBtn.setStrokeStyle(4, isMaxLevel ? COLORS.text.muted : COLORS.primary.light);
    const selectText = this.scene.add.text(0, cardHeight / 2 + 50, 
      isMaxLevel ? 'MAX' : '선택', {
      font: 'bold 28px monospace',
      color: isMaxLevel ? COLORS_STR.text.muted : COLORS_STR.primary.light,
    }).setOrigin(0.5);
    wrapper.add([selectBtn, selectText]);
    
    if (!isMaxLevel) {
      // 인터랙션 영역
      const hitArea = this.scene.add.rectangle(0, 0, cardWidth, cardHeight, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      wrapper.add(hitArea);
      
      const onHover = () => {
        wrapper.setScale(1.05);
        bg.setStrokeStyle(8, COLORS.primary.light);
      };
      
      const onOut = () => {
        wrapper.setScale(1);
        bg.setStrokeStyle(5, COLORS.rarity.unique);
      };
      
      const onSelect = () => {
        // 패시브 선택 시 selectLevelUpPassive 호출
        this.scene.gameScene.selectLevelUpPassive(index);
      };
      
      hitArea.on('pointerover', onHover);
      hitArea.on('pointerout', onOut);
      hitArea.on('pointerdown', onSelect);
      selectBtn.setInteractive({ useHandCursor: true });
      selectBtn.on('pointerover', onHover);
      selectBtn.on('pointerout', onOut);
      selectBtn.on('pointerdown', onSelect);
    }
    
    return wrapper;
  }
  
  hide() {
    this.container.setVisible(false);
  }
}

import Phaser from 'phaser';
import type { UIScene } from '../scenes/UIScene';
import type { Card, SwordCard, SkillCard } from '../types';
import { COLORS, COLORS_STR } from '../constants/colors';

/**
 * 보상 선택 UI - 전투 승리 후 보상 카드 선택
 */
export class RewardSelectionUI {
  private scene: UIScene;
  private rewardContainer!: Phaser.GameObjects.Container;
  
  constructor(scene: UIScene) {
    this.scene = scene;
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
    
    // 제목 (스케일)
    const title = this.scene.add.text(width/2, 150, '🎁 보상 카드를 선택하세요!', {
      font: 'bold 48px monospace',
      color: COLORS_STR.primary.dark,
    }).setOrigin(0.5);
    this.rewardContainer.add(title);
    
    // 카드 3장 표시 (스케일)
    const cardWidth = 375;
    const cardHeight = 563;
    const spacing = 94;
    const totalWidth = rewardCards.length * cardWidth + (rewardCards.length - 1) * spacing;
    const startX = (width - totalWidth) / 2 + cardWidth / 2;
    
    rewardCards.forEach((card, index) => {
      const x = startX + index * (cardWidth + spacing);
      const y = height / 2 - 38;
      
      const cardContainer = this.createRewardCard(card, x, y, cardWidth, cardHeight, index);
      this.rewardContainer.add(cardContainer);
    });
    
    // 건너뛰기 버튼 (스케일)
    const skipBtn = this.scene.add.container(width/2, height - 188);
    const skipBg = this.scene.add.rectangle(0, 0, 375, 94, COLORS.background.dark, 0.9);
    skipBg.setStrokeStyle(3, COLORS.text.muted);
    const skipText = this.scene.add.text(0, 0, '건너뛰기', {
      font: 'bold 32px monospace',
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
      this.scene.gameScene.skipReward();
    });
    
    this.rewardContainer.add(skipBtn);
    this.rewardContainer.setVisible(true);
  }
  
  private createRewardCard(
    card: Card, 
    x: number, 
    y: number, 
    cardWidth: number, 
    cardHeight: number, 
    index: number
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    const isSword = card.type === 'sword';
    const data = card.data;
    const isSwiftSkill = !isSword && (data as SkillCard).isSwift === true;
    
    // 스킬 카드: 신속은 금색, 일반은 청록색
    const skillBorderColor = isSwiftSkill ? COLORS.card.swift : COLORS.card.skill;
    const borderColor = isSword 
      ? COLORS.rarity[(data as SwordCard).rarity as keyof typeof COLORS.rarity || 'common']
      : skillBorderColor;
    
    // 카드 배경 (스케일)
    const bg = this.scene.add.rectangle(0, 0, cardWidth, cardHeight, COLORS.background.dark, 0.98);
    bg.setStrokeStyle(6, borderColor);
    container.add(bg);
    
    // 이모지 (스케일)
    const emoji = this.scene.add.text(0, -188, data.emoji, {
      font: '107px Arial',
    }).setOrigin(0.5);
    container.add(emoji);
    
    // 이름 (스케일)
    const displayName = isSword ? ((data as SwordCard).displayName || data.name) : data.name;
    const nameColor = '#' + borderColor.toString(16).padStart(6, '0');
    const name = this.scene.add.text(0, -75, displayName, {
      font: 'bold 36px monospace',
      color: nameColor,
    }).setOrigin(0.5);
    container.add(name);
    
    // 타입 라벨 (스케일)
    const typeLabel = this.scene.add.text(0, -19, isSword ? '⚔️ 무기' : '📜 스킬', {
      font: '24px monospace',
      color: COLORS_STR.text.muted,
    }).setOrigin(0.5);
    container.add(typeLabel);
    
    // 간략 정보
    let infoText = '';
    if (isSword) {
      const sword = data as SwordCard;
      const drawAtk = sword.drawAttack;
      const reachMap: Record<string, string> = {
        single: '1적', double: '2적', triple: '3적', all: '전체', swordDouble: '무기x2'
      };
      const swiftTag = drawAtk.isSwift ? '⚡' : '';
      infoText = [
        `공격력 ${sword.attack} | ${sword.attackCount}타 | ${reachMap[sword.reach] || sword.reach}`,
        `내구도: ${sword.durability} | 방어: ${sword.defense}`,
        ``,
        `━━ 발도: ${drawAtk.name} ${swiftTag} ━━`,
        `x${drawAtk.multiplier} | ${reachMap[drawAtk.reach] || drawAtk.reach}`,
        drawAtk.effect || '',
      ].filter(line => line !== undefined).join('\n');
    } else {
      const skill = data as SkillCard;
      infoText = `마나: ${skill.manaCost}\n${skill.description}`;
    }
    
    // 정보 텍스트 (스케일)
    const info = this.scene.add.text(0, 60, infoText, {
      font: '20px monospace',
      color: COLORS_STR.text.primary,
      align: 'center',
      lineSpacing: 6,
      wordWrap: { width: cardWidth - 45 },
    }).setOrigin(0.5);
    container.add(info);
    
    // 선택 버튼 (스케일)
    const selectBtn = this.scene.add.rectangle(0, 216, 225, 75, COLORS.success.main, 0.9);
    selectBtn.setStrokeStyle(4, COLORS.primary.light);
    const selectText = this.scene.add.text(0, 216, '선택', {
      font: 'bold 28px monospace',
      color: COLORS_STR.primary.light,
    }).setOrigin(0.5);
    container.add([selectBtn, selectText]);
    
    // 인터랙션
    bg.setInteractive({ useHandCursor: true });
    selectBtn.setInteractive({ useHandCursor: true });
    
    const onHover = () => {
      bg.setStrokeStyle(8, COLORS.primary.light);
      container.setScale(1.05);
    };
    const onOut = () => {
      bg.setStrokeStyle(6, borderColor);
      container.setScale(1);
    };
    const onSelect = () => {
      this.scene.gameScene.selectRewardCard(index);
    };
    
    bg.on('pointerover', onHover);
    bg.on('pointerout', onOut);
    bg.on('pointerdown', onSelect);
    selectBtn.on('pointerover', onHover);
    selectBtn.on('pointerout', onOut);
    selectBtn.on('pointerdown', onSelect);
    
    return container;
  }
  
  hide() {
    this.rewardContainer.removeAll(true);
    this.rewardContainer.setVisible(false);
  }
}

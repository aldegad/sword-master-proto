import Phaser from 'phaser';
import type { UIScene } from '../scenes/UIScene';
import type { Card, SwordCard, SkillCard } from '../types';
import { COLORS, COLORS_STR } from '../constants/colors';
import { i18n } from '../i18n';

/**
 * 스킬 카드 선택 UI - 덱/무덤에서 카드 선택
 */
export class SkillSelectUI {
  private scene: UIScene;
  private skillSelectContainer!: Phaser.GameObjects.Container;
  
  constructor(scene: UIScene) {
    this.scene = scene;
    this.create();
  }
  
  private create() {
    this.skillSelectContainer = this.scene.add.container(0, 0);
    this.skillSelectContainer.setVisible(false);
    this.skillSelectContainer.setDepth(2000);
  }
  
  show() {
    this.skillSelectContainer.removeAll(true);
    
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const cards = this.scene.gameScene.skillSelectCards;
    const selectType = this.scene.gameScene.skillSelectType;
    
    if (cards.length === 0) return;
    
    // 배경 오버레이
    const overlay = this.scene.add.rectangle(width/2, height/2, width, height, COLORS.background.overlay, 0.85);
    this.skillSelectContainer.add(overlay);
    
    // 제목 설정
    let titleText = '';
    let titleColor: string = COLORS_STR.success.dark;
    switch (selectType) {
      case 'searchSword':
        titleText = '🔍 장착할 검을 소환하세요!';
        titleColor = COLORS_STR.secondary.dark;
        break;
      case 'graveRecall':
        titleText = '👻 무덤에서 카드를 선택하세요!';
        titleColor = COLORS_STR.border.medium;
        break;
      case 'graveEquip':
        titleText = '⚰️ 장착할 검을 선택하세요!';
        titleColor = COLORS_STR.secondary.dark;
        break;
    }
    
    const title = this.scene.add.text(width/2, 150, titleText, {
      font: 'bold 48px monospace',
      color: titleColor,
    }).setOrigin(0.5);
    this.skillSelectContainer.add(title);
    
    // 카드 표시 (RewardSelectionUI와 동일한 크기)
    const cardWidth = 375;
    const cardHeight = 563;
    const spacing = 94;
    const totalWidth = cards.length * cardWidth + (cards.length - 1) * spacing;
    const startX = (width - totalWidth) / 2 + cardWidth / 2;
    
    cards.forEach((card, index) => {
      const x = startX + index * (cardWidth + spacing);
      const y = height / 2 - 38;
      
      const cardContainer = this.createSkillSelectCard(card, x, y, cardWidth, cardHeight, index);
      this.skillSelectContainer.add(cardContainer);
    });
    
    // 취소 버튼 (RewardSelectionUI와 동일한 크기)
    const cancelBtn = this.scene.add.container(width/2, height - 188);
    const cancelBg = this.scene.add.rectangle(0, 0, 375, 94, COLORS.background.dark, 0.9);
    cancelBg.setStrokeStyle(3, COLORS.secondary.dark);
    const cancelText = this.scene.add.text(0, 0, i18n.t('ui.buttons.cancel'), {
      font: 'bold 32px monospace',
      color: COLORS_STR.secondary.dark,
    }).setOrigin(0.5);
    cancelBtn.add([cancelBg, cancelText]);
    
    cancelBg.setInteractive({ useHandCursor: true });
    cancelBg.on('pointerover', () => {
      cancelBg.setStrokeStyle(3, COLORS.primary.light);
      cancelText.setColor(COLORS_STR.primary.light);
    });
    cancelBg.on('pointerout', () => {
      cancelBg.setStrokeStyle(2, COLORS.secondary.dark);
      cancelText.setColor(COLORS_STR.secondary.dark);
    });
    cancelBg.on('pointerdown', () => {
      this.scene.gameScene.cancelSkillCardSelection();
    });
    
    this.skillSelectContainer.add(cancelBtn);
    this.skillSelectContainer.setVisible(true);
  }
  
  private createSkillSelectCard(
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
    
    // 카드 배경 (RewardSelectionUI와 동일)
    const bg = this.scene.add.rectangle(0, 0, cardWidth, cardHeight, COLORS.background.dark, 0.98);
    bg.setStrokeStyle(6, borderColor);
    container.add(bg);
    
    // 이모지 (RewardSelectionUI와 동일)
    const emoji = this.scene.add.text(0, -188, data.emoji, {
      font: '107px Arial',
    }).setOrigin(0.5);
    container.add(emoji);
    
    // 이름 (RewardSelectionUI와 동일)
    const displayName = isSword ? ((data as SwordCard).displayName || data.name) : data.name;
    const nameColor = '#' + borderColor.toString(16).padStart(6, '0');
    const name = this.scene.add.text(0, -75, displayName, {
      font: 'bold 36px monospace',
      color: nameColor,
    }).setOrigin(0.5);
    container.add(name);
    
    // 타입 라벨 (RewardSelectionUI와 동일)
    const typeLabel = this.scene.add.text(0, -19, isSword ? '⚔️ 무기' : '📜 스킬', {
      font: '24px monospace',
      color: COLORS_STR.text.muted,
    }).setOrigin(0.5);
    container.add(typeLabel);
    
    // 간략 정보 (RewardSelectionUI와 동일)
    let infoText = '';
    if (isSword) {
      const sword = data as SwordCard;
      const drawAtk = sword.drawAttack;
      const reachMap: Record<string, string> = {
        single: i18n.t('ui.range.single'), double: i18n.t('ui.range.double'), triple: i18n.t('ui.range.triple'), all: i18n.t('ui.range.all'), swordDouble: i18n.t('ui.range.swordDouble')
      };
      const swiftTag = drawAtk.isSwift ? '⚡' : '';
      infoText = [
        `공격력 ${sword.attack} | ${sword.attackCount}타 | ${reachMap[sword.reach] || sword.reach}`,
        `내구도: ${sword.currentDurability}/${sword.durability} | 방어: ${sword.defense}`,
        ``,
        `━━ 발도: ${drawAtk.name} ${swiftTag} ━━`,
        `x${drawAtk.multiplier} | ${reachMap[drawAtk.reach] || drawAtk.reach}`,
        drawAtk.effect || '',
      ].filter(line => line !== undefined).join('\n');
    } else {
      const skill = data as SkillCard;
      infoText = `마나: ${skill.manaCost}\n${skill.description}`;
    }
    
    const info = this.scene.add.text(0, 60, infoText, {
      font: '20px monospace',
      color: COLORS_STR.text.primary,
      align: 'center',
      lineSpacing: 6,
      wordWrap: { width: cardWidth - 45 },
    }).setOrigin(0.5);
    container.add(info);
    
    // 선택 버튼 (RewardSelectionUI와 동일)
    const selectBtn = this.scene.add.rectangle(0, 216, 225, 75, COLORS.success.main, 0.9);
    selectBtn.setStrokeStyle(4, COLORS.primary.light);
    const selectText = this.scene.add.text(0, 216, i18n.t('ui.buttons.select'), {
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
      this.scene.gameScene.selectSkillCard(index);
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
    this.skillSelectContainer.removeAll(true);
    this.skillSelectContainer.setVisible(false);
  }
}

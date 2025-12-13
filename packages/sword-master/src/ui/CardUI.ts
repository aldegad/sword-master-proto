import Phaser from 'phaser';
import type { UIScene } from '../scenes/UIScene';
import type { Card, SwordCard, SkillCard } from '../types';
import { COLORS, COLORS_STR } from '../constants/colors';
import { FONTS } from '../constants/typography';

/**
 * 카드 UI - 손패 표시 및 카드 렌더링
 */
export class CardUI {
  private scene: UIScene;
  
  private cardContainer!: Phaser.GameObjects.Container;
  private cardSprites: Phaser.GameObjects.Container[] = [];
  
  constructor(scene: UIScene) {
    this.scene = scene;
    this.create();
  }
  
  private create() {
    const height = this.scene.cameras.main.height;
    
    // 카드 영역 배경
    const cardAreaBg = this.scene.add.rectangle(
      this.scene.cameras.main.width / 2,
      height - 95,
      980,
      190,
      COLORS.background.dark,
      0.95
    );
    cardAreaBg.setStrokeStyle(2, COLORS.border.medium);
    
    // 손패 라벨
    this.scene.add.text(
      this.scene.cameras.main.width / 2,
      height - 205,
      '─ 손패 (1~0 키) ─',
      {
        font: FONTS.labelBold,
        color: COLORS_STR.primary.main,
      }
    ).setOrigin(0.5);
    
    // 카드 컨테이너
    this.cardContainer = this.scene.add.container(
      this.scene.cameras.main.width / 2,
      height - 90
    );
  }
  
  updateCardDisplay() {
    this.cardSprites.forEach(sprite => sprite.destroy());
    this.cardSprites = [];
    
    const hand = this.scene.gameScene.playerState.hand;
    const cardWidth = 92;
    const spacing = 4;
    const totalWidth = hand.length * (cardWidth + spacing) - spacing;
    const startX = -totalWidth / 2 + cardWidth / 2;
    
    hand.forEach((card, index) => {
      const x = startX + index * (cardWidth + spacing);
      const cardSprite = this.createCardSprite(card, x, 0, index);
      this.cardContainer.add(cardSprite);
      this.cardSprites.push(cardSprite);
    });
  }
  
  private createCardSprite(card: Card, x: number, y: number, index: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    const isSword = card.type === 'sword';
    const isSwiftSkill = !isSword && (card.data as SkillCard).isSwift === true;
    const data = card.data;
    const manaCost = data.manaCost;
    const canAfford = this.scene.gameScene.playerState.mana >= manaCost;
    
    // 무기가 없을 때 공격/특수 스킬은 사용 불가
    const hasWeapon = this.scene.gameScene.playerState.currentSword !== null;
    const needsWeapon = !isSword && ((card.data as SkillCard).type === 'attack' || (card.data as SkillCard).type === 'special');
    const isDisabledByNoWeapon = needsWeapon && !hasWeapon;
    
    // 이어베기: 이번 턴에 공격/무기를 사용했어야 함
    const isFollowUpSkill = !isSword && (card.data as SkillCard).effect?.type === 'followUp';
    const isDisabledByFollowUp = isFollowUpSkill && !this.scene.gameScene.playerState.usedAttackThisTurn;
    
    const isUsable = canAfford && !isDisabledByNoWeapon && !isDisabledByFollowUp;
    
    const bgColor = isSword ? COLORS.background.light : COLORS.background.dark;
    // 신속 스킬은 금색, 일반 스킬은 청록색
    const skillBorderColor = isSwiftSkill ? COLORS.card.swift : COLORS.card.skill;
    const borderColor = isUsable ? (isSword ? COLORS.card.sword : skillBorderColor) : COLORS.border.dark;
    
    // 카드 배경
    const bg = this.scene.add.rectangle(0, 0, 88, 135, bgColor);
    bg.setStrokeStyle(isUsable ? 3 : 2, borderColor);
    container.add(bg);
    
    // 카드 번호
    const numKey = index < 9 ? `${index + 1}` : '0';
    const numText = this.scene.add.text(-36, -60, `[${numKey}]`, {
      font: FONTS.cardKey,
      color: isUsable ? COLORS_STR.primary.main : COLORS_STR.text.disabled,
    });
    container.add(numText);
    
    // 마나 비용
    const manaText = this.scene.add.text(18, -60, `◈${manaCost}`, {
      font: FONTS.cardMana,
      color: isUsable ? COLORS_STR.primary.main : COLORS_STR.text.disabled,
    });
    container.add(manaText);
    
    // 카드 내용
    if (isSword) {
      this.renderSwordCard(container, card.data as SwordCard, isUsable);
    } else {
      this.renderSkillCard(container, card.data as SkillCard, isUsable, isDisabledByNoWeapon);
    }
    
    // 무기 없음으로 비활성화된 경우 오버레이 표시
    if (isDisabledByNoWeapon) {
      const disabledOverlay = this.scene.add.rectangle(0, 0, 88, 135, 0x000000, 0.5);
      const noWeaponIcon = this.scene.add.text(0, 0, '🚫', {
        font: '28px Arial',
      }).setOrigin(0.5);
      container.add([disabledOverlay, noWeaponIcon]);
    }
    
    // 이어베기 비활성화 (먼저 공격해야 함)
    if (isDisabledByFollowUp) {
      const disabledOverlay = this.scene.add.rectangle(0, 0, 88, 135, 0x000000, 0.5);
      const followUpIcon = this.scene.add.text(0, 0, '🔗', {
        font: '28px Arial',
      }).setOrigin(0.5);
      container.add([disabledOverlay, followUpIcon]);
    }
    
    // 교환 모드일 때 교환 표시
    if (this.scene.gameScene.isExchangeMode) {
      const exchangeOverlay = this.scene.add.rectangle(0, 0, 88, 135, COLORS.primary.dark, 0.3);
      const exchangeIcon = this.scene.add.text(0, 0, '↻', {
        font: 'bold 32px monospace',
        color: COLORS_STR.primary.dark,
      }).setOrigin(0.5);
      container.add([exchangeOverlay, exchangeIcon]);
      
      bg.setStrokeStyle(3, COLORS.primary.dark);
    }
    
    // 호버 효과
    bg.setInteractive({ useHandCursor: isUsable || this.scene.gameScene.isExchangeMode });
    bg.on('pointerover', () => {
      if (this.scene.gameScene.isExchangeMode) {
        container.y = y - 20;
        bg.setStrokeStyle(3, COLORS.primary.light);
      } else if (isUsable) {
        container.y = y - 20;
        bg.setStrokeStyle(3, COLORS.primary.light);
      }
      this.scene.tooltipUI.show(
        this.cardContainer.x + x,
        this.cardContainer.y + y,
        card
      );
    });
    bg.on('pointerout', () => {
      container.y = y;
      if (this.scene.gameScene.isExchangeMode) {
        bg.setStrokeStyle(3, COLORS.primary.dark);
      } else {
        bg.setStrokeStyle(isUsable ? 2 : 1, borderColor);
      }
      this.scene.tooltipUI.hide();
    });
    bg.on('pointerdown', () => {
      if (this.scene.gameScene.isExchangeMode) {
        this.scene.gameScene.exchangeCard(index);
        this.scene.tooltipUI.hide();
      } else if (isUsable) {
        this.scene.gameScene.useCard(index);
        this.scene.tooltipUI.hide();
      }
    });
    
    return container;
  }
  
  private renderSwordCard(container: Phaser.GameObjects.Container, sword: SwordCard, canAfford: boolean) {
    // 등급별 색상
    const textColor = canAfford ? COLORS_STR.rarity[sword.rarity as keyof typeof COLORS_STR.rarity || 'common'] : COLORS_STR.text.disabled;
    const subColor = canAfford ? COLORS_STR.text.secondary : COLORS_STR.text.disabled;
    
    // 이모지
    const emoji = this.scene.add.text(0, -45, sword.emoji, {
      font: '27px Arial',
    }).setOrigin(0.5);
    
    // 검 이름 (displayName 사용)
    const displayName = sword.displayName || sword.name;
    const shortName = displayName.length > 6 ? displayName.slice(0, 5) + '..' : displayName;
    const nameText = this.scene.add.text(0, -18, shortName, {
      font: FONTS.cardName,
      color: textColor,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    
    // 스탯 - 간략화
    const reachMap: Record<string, string> = {
      single: '①',
      double: '②',
      triple: '③',
      all: '∞',
    };
    
    const statsText = this.scene.add.text(0, 5, `공${sword.attack} ${sword.attackCount}타 ${reachMap[sword.reach]}`, {
      font: FONTS.cardStat,
      color: subColor,
      align: 'center',
    }).setOrigin(0.5);
    
    // 내구도 (1이면 경고 색상)
    const durColor = sword.durability === 1 ? COLORS_STR.secondary.main : (canAfford ? COLORS_STR.primary.main : COLORS_STR.text.disabled);
    const durText = this.scene.add.text(0, 23, `내구${sword.durability} 방${sword.defense}`, {
      font: FONTS.cardStat,
      color: durColor,
    }).setOrigin(0.5);
    
    // 타입 라벨
    const rarityLabel = sword.rarity === 'unique' ? '★' : 
                        sword.rarity === 'rare' ? '◆' : 
                        sword.rarity === 'uncommon' ? '◇' : '';
    const typeLabel = this.scene.add.text(0, 45, `${rarityLabel}검`, {
      font: FONTS.badge,
      color: textColor,
    }).setOrigin(0.5);
    
    container.add([emoji, nameText, statsText, durText, typeLabel]);
  }
  
  private renderSkillCard(container: Phaser.GameObjects.Container, skill: SkillCard, canAfford: boolean, isDisabledByNoWeapon: boolean = false) {
    // 신속 스킬은 금색, 일반 스킬은 청록
    const isSwift = skill.isSwift === true;
    const skillColor = isSwift ? COLORS_STR.card.swift : COLORS_STR.card.skill;
    
    // 무기 없음으로 비활성화된 경우 더 어둡게
    const textColor = canAfford ? skillColor : (isDisabledByNoWeapon ? COLORS_STR.background.medium : COLORS_STR.text.disabled);
    const subColor = canAfford ? COLORS_STR.text.secondary : (isDisabledByNoWeapon ? COLORS_STR.background.medium : COLORS_STR.text.disabled);
    
    // 이모지
    const emoji = this.scene.add.text(0, -45, skill.emoji, {
      font: '27px Arial',
    }).setOrigin(0.5);
    
    // 스킬 이름
    const nameText = this.scene.add.text(0, -18, skill.name, {
      font: FONTS.cardName,
      color: textColor,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    
    // 타입
    const typeMap: Record<string, string> = {
      attack: '⚔',
      defense: '🛡',
      buff: '✨',
      special: '💥',
    };
    
    // 스탯
    const reachMap: Record<string, string> = {
      single: '①',
      double: '②',
      triple: '③',
      all: '∞',
    };
    
    // 간결한 스탯 표시
    let statLine = typeMap[skill.type];
    if (skill.attackMultiplier > 0) {
      statLine += ` x${skill.attackMultiplier}`;
    }
    if (skill.defenseBonus > 0) {
      statLine += ` +${skill.defenseBonus}`;
    }
    
    const statsText = this.scene.add.text(0, 5, statLine, {
      font: FONTS.cardStat,
      color: subColor,
      align: 'center',
    }).setOrigin(0.5);
    
    // 범위 & 타수배율 표시
    let subLine = '';
    if (skill.type === 'attack' || skill.type === 'special') {
      // 범위: single이면 '무기', 아니면 자체 범위
      const rangeText = skill.reach === 'single' ? '무기' : reachMap[skill.reach];
      // 타수배율: 1이면 '무기', 아니면 x배율
      const hitsText = skill.attackCount === 1 ? '무기' : `x${skill.attackCount}`;
      subLine = `${rangeText} ${hitsText}타`;
    } else if (skill.type === 'defense') {
      subLine = '방어 스킬';
    } else if (skill.type === 'buff') {
      subLine = '버프 스킬';
    }
    
    const costText = this.scene.add.text(0, 23, subLine, {
      font: FONTS.cardStat,
      color: canAfford ? COLORS_STR.primary.dark : COLORS_STR.text.disabled,
    }).setOrigin(0.5);
    
    // 타입 라벨 (신속 스킬은 ⚡ 표시)
    const typeText = isSwift ? '⚡신속' : '스킬';
    const typeLabel = this.scene.add.text(0, 45, typeText, {
      font: FONTS.badge,
      color: textColor,
    }).setOrigin(0.5);
    
    container.add([emoji, nameText, statsText, costText, typeLabel]);
  }
}

import Phaser from 'phaser';
import type { UIScene } from '../scenes/UIScene';
import type { Card, SwordCard, SkillCard } from '../types';

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
      0x1a1a2e,
      0.95
    );
    cardAreaBg.setStrokeStyle(3, 0x4ecca3);
    
    // 손패 라벨
    this.scene.add.text(
      this.scene.cameras.main.width / 2,
      height - 205,
      '🃏 손 패 (숫자키 1~0 사용, 최대 10장)',
      {
        font: 'bold 14px monospace',
        color: '#4ecca3',
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
    
    const bgColor = isSword ? 0x2d3436 : 0x1a1a2e;
    // 신속 스킬은 시안색 테두리
    const skillBorderColor = isSwiftSkill ? 0x00ccff : 0x4ecca3;
    const borderColor = canAfford ? (isSword ? 0xe94560 : skillBorderColor) : 0x444444;
    
    // 카드 배경
    const bg = this.scene.add.rectangle(0, 0, 88, 135, bgColor);
    bg.setStrokeStyle(canAfford ? 3 : 2, borderColor);
    container.add(bg);
    
    // 카드 번호
    const numKey = index < 9 ? `${index + 1}` : '0';
    const numText = this.scene.add.text(-36, -60, `[${numKey}]`, {
      font: 'bold 12px monospace',
      color: canAfford ? '#ffcc00' : '#444444',
    });
    container.add(numText);
    
    // 마나 비용
    const manaText = this.scene.add.text(18, -60, `💧${manaCost}`, {
      font: '12px monospace',
      color: canAfford ? '#4dabf7' : '#444444',
    });
    container.add(manaText);
    
    // 카드 내용
    if (isSword) {
      this.renderSwordCard(container, card.data as SwordCard, canAfford);
    } else {
      this.renderSkillCard(container, card.data as SkillCard, canAfford);
    }
    
    // 교환 모드일 때 교환 표시
    if (this.scene.gameScene.isExchangeMode) {
      const exchangeOverlay = this.scene.add.rectangle(0, 0, 88, 135, 0xffcc00, 0.3);
      const exchangeIcon = this.scene.add.text(0, 0, '🔄', {
        font: '32px Arial',
      }).setOrigin(0.5);
      container.add([exchangeOverlay, exchangeIcon]);
      
      bg.setStrokeStyle(3, 0xffcc00);
    }
    
    // 호버 효과
    bg.setInteractive({ useHandCursor: canAfford || this.scene.gameScene.isExchangeMode });
    bg.on('pointerover', () => {
      if (this.scene.gameScene.isExchangeMode) {
        container.y = y - 20;
        bg.setStrokeStyle(4, 0xffffff);
      } else if (canAfford) {
        container.y = y - 20;
        bg.setStrokeStyle(4, 0xffffff);
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
        bg.setStrokeStyle(3, 0xffcc00);
      } else {
        bg.setStrokeStyle(canAfford ? 3 : 2, borderColor);
      }
      this.scene.tooltipUI.hide();
    });
    bg.on('pointerdown', () => {
      if (this.scene.gameScene.isExchangeMode) {
        this.scene.gameScene.exchangeCard(index);
        this.scene.tooltipUI.hide();
      } else if (canAfford) {
        this.scene.gameScene.useCard(index);
        this.scene.tooltipUI.hide();
      }
    });
    
    return container;
  }
  
  private renderSwordCard(container: Phaser.GameObjects.Container, sword: SwordCard, canAfford: boolean) {
    // 등급별 색상
    const rarityColors: Record<string, string> = {
      common: '#e94560',
      uncommon: '#4ecca3',
      rare: '#4dabf7',
      unique: '#ffcc00',
    };
    const textColor = canAfford ? (rarityColors[sword.rarity || 'common']) : '#444444';
    const subColor = canAfford ? '#ffffff' : '#333333';
    
    // 이모지
    const emoji = this.scene.add.text(0, -45, sword.emoji, {
      font: '26px Arial',
    }).setOrigin(0.5);
    
    // 검 이름 (displayName 사용)
    const displayName = sword.displayName || sword.name;
    const shortName = displayName.length > 6 ? displayName.slice(0, 5) + '..' : displayName;
    const nameText = this.scene.add.text(0, -18, shortName, {
      font: 'bold 13px monospace',
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
      font: '10px monospace',
      color: subColor,
      align: 'center',
    }).setOrigin(0.5);
    
    // 내구도 (1이면 경고 색상)
    const durColor = sword.durability === 1 ? '#ff6b6b' : (canAfford ? '#ffcc00' : '#444444');
    const durText = this.scene.add.text(0, 23, `🔧${sword.durability} 🛡${sword.defense}`, {
      font: '10px monospace',
      color: durColor,
    }).setOrigin(0.5);
    
    // 타입 라벨
    const rarityLabel = sword.rarity === 'unique' ? '★' : 
                        sword.rarity === 'rare' ? '◆' : 
                        sword.rarity === 'uncommon' ? '◇' : '';
    const typeLabel = this.scene.add.text(0, 45, `${rarityLabel}무기`, {
      font: 'bold 10px monospace',
      color: textColor,
    }).setOrigin(0.5);
    
    container.add([emoji, nameText, statsText, durText, typeLabel]);
  }
  
  private renderSkillCard(container: Phaser.GameObjects.Container, skill: SkillCard, canAfford: boolean) {
    // 신속 스킬은 시안색, 일반 스킬은 녹색
    const isSwift = skill.isSwift === true;
    const normalColor = '#4ecca3';  // 녹색 (일반 스킬)
    const swiftColor = '#00ccff';   // 시안색 (신속 스킬)
    const skillColor = isSwift ? swiftColor : normalColor;
    
    const textColor = canAfford ? skillColor : '#444444';
    const subColor = canAfford ? '#ffffff' : '#333333';
    
    // 이모지
    const emoji = this.scene.add.text(0, -45, skill.emoji, {
      font: '26px Arial',
    }).setOrigin(0.5);
    
    // 스킬 이름
    const nameText = this.scene.add.text(0, -18, skill.name, {
      font: 'bold 13px monospace',
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
      if (skill.attackCount > 0) statLine += ` +${skill.attackCount}`;
    }
    if (skill.defenseBonus > 0) {
      statLine += ` +${skill.defenseBonus}`;
    }
    
    const statsText = this.scene.add.text(0, 5, statLine, {
      font: '10px monospace',
      color: subColor,
      align: 'center',
    }).setOrigin(0.5);
    
    // 범위 & 내구도 소모
    let subLine = '';
    if (skill.type === 'attack' || skill.type === 'special') {
      subLine = `${reachMap[skill.reach]} `;
    }
    subLine += skill.durabilityCost > 0 ? `🔧-${skill.durabilityCost}` : '🔧0';
    
    const costText = this.scene.add.text(0, 23, subLine, {
      font: '10px monospace',
      color: canAfford ? '#ff9f43' : '#444444',
    }).setOrigin(0.5);
    
    // 타입 라벨 (신속 스킬은 ⚡ 표시)
    const typeText = isSwift ? '⚡신속' : '스킬';
    const typeLabel = this.scene.add.text(0, 45, typeText, {
      font: 'bold 10px monospace',
      color: textColor,
    }).setOrigin(0.5);
    
    container.add([emoji, nameText, statsText, costText, typeLabel]);
  }
}

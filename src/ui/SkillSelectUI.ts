import Phaser from 'phaser';
import type { UIScene } from '../scenes/UIScene';
import type { Card, SwordCard, SkillCard } from '../types';

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
    const overlay = this.scene.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7);
    this.skillSelectContainer.add(overlay);
    
    // 제목 설정
    let titleText = '';
    let titleColor = '#4ecca3';
    switch (selectType) {
      case 'searchSword':
        titleText = '🔍 덱에서 검을 선택하세요!';
        titleColor = '#e94560';
        break;
      case 'graveRecall':
        titleText = '👻 무덤에서 카드를 선택하세요!';
        titleColor = '#9b59b6';
        break;
      case 'graveEquip':
        titleText = '⚰️ 장착할 검을 선택하세요!';
        titleColor = '#e94560';
        break;
    }
    
    const title = this.scene.add.text(width/2, 80, titleText, {
      font: 'bold 28px monospace',
      color: titleColor,
    }).setOrigin(0.5);
    this.skillSelectContainer.add(title);
    
    // 카드 표시
    const cardWidth = 160;
    const cardHeight = 220;
    const spacing = 40;
    const totalWidth = cards.length * cardWidth + (cards.length - 1) * spacing;
    const startX = (width - totalWidth) / 2 + cardWidth / 2;
    
    cards.forEach((card, index) => {
      const x = startX + index * (cardWidth + spacing);
      const y = height / 2 - 20;
      
      const cardContainer = this.createSkillSelectCard(card, x, y, cardWidth, cardHeight, index);
      this.skillSelectContainer.add(cardContainer);
    });
    
    // 취소 버튼
    const cancelBtn = this.scene.add.container(width/2, height - 100);
    const cancelBg = this.scene.add.rectangle(0, 0, 200, 50, 0x333333, 0.9);
    cancelBg.setStrokeStyle(2, 0xe94560);
    const cancelText = this.scene.add.text(0, 0, '취소', {
      font: 'bold 18px monospace',
      color: '#e94560',
    }).setOrigin(0.5);
    cancelBtn.add([cancelBg, cancelText]);
    
    cancelBg.setInteractive({ useHandCursor: true });
    cancelBg.on('pointerover', () => {
      cancelBg.setStrokeStyle(3, 0xffffff);
      cancelText.setColor('#ffffff');
    });
    cancelBg.on('pointerout', () => {
      cancelBg.setStrokeStyle(2, 0xe94560);
      cancelText.setColor('#e94560');
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
    
    // 등급별 색상
    const rarityColors: Record<string, number> = {
      common: 0xe94560,
      uncommon: 0x4ecca3,
      rare: 0x4dabf7,
      unique: 0xffcc00,
    };
    
    const borderColor = isSword 
      ? rarityColors[(data as SwordCard).rarity || 'common']
      : 0x4ecca3;
    
    // 카드 배경
    const bg = this.scene.add.rectangle(0, 0, cardWidth, cardHeight, 0x1a1a2e, 0.98);
    bg.setStrokeStyle(4, borderColor);
    container.add(bg);
    
    // 이모지
    const emoji = this.scene.add.text(0, -70, data.emoji, {
      font: '48px Arial',
    }).setOrigin(0.5);
    container.add(emoji);
    
    // 이름
    const displayName = isSword ? ((data as SwordCard).displayName || data.name) : data.name;
    const name = this.scene.add.text(0, -25, displayName, {
      font: 'bold 16px monospace',
      color: isSword ? '#' + borderColor.toString(16).padStart(6, '0') : '#4ecca3',
    }).setOrigin(0.5);
    container.add(name);
    
    // 타입 라벨
    const typeLabel = this.scene.add.text(0, 5, isSword ? '⚔️ 무기' : '📜 스킬', {
      font: '14px monospace',
      color: '#aaaaaa',
    }).setOrigin(0.5);
    container.add(typeLabel);
    
    // 간략 정보
    let infoText = '';
    if (isSword) {
      const sword = data as SwordCard;
      infoText = `공${sword.attack} ${sword.attackCount}타\n내구도:${sword.currentDurability}/${sword.durability}`;
    } else {
      const skill = data as SkillCard;
      infoText = `마나:${skill.manaCost}\n${skill.description.slice(0, 20)}...`;
    }
    
    const info = this.scene.add.text(0, 50, infoText, {
      font: '12px monospace',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 4,
    }).setOrigin(0.5);
    container.add(info);
    
    // 선택 버튼
    const selectBtn = this.scene.add.rectangle(0, 90, 100, 35, 0x4ecca3, 0.9);
    selectBtn.setStrokeStyle(2, 0xffffff);
    const selectText = this.scene.add.text(0, 90, '선택', {
      font: 'bold 14px monospace',
      color: '#ffffff',
    }).setOrigin(0.5);
    container.add([selectBtn, selectText]);
    
    // 인터랙션
    bg.setInteractive({ useHandCursor: true });
    selectBtn.setInteractive({ useHandCursor: true });
    
    const onHover = () => {
      bg.setStrokeStyle(5, 0xffffff);
      container.setScale(1.05);
    };
    const onOut = () => {
      bg.setStrokeStyle(4, borderColor);
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

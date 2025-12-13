import Phaser from 'phaser';
import type { UIScene } from '../scenes/UIScene';
import type { Card, SwordCard, SkillCard } from '../types';

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
    const overlay = this.scene.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7);
    this.rewardContainer.add(overlay);
    
    // 제목
    const title = this.scene.add.text(width/2, 80, '🎁 보상 카드를 선택하세요!', {
      font: 'bold 32px monospace',
      color: '#ffcc00',
    }).setOrigin(0.5);
    this.rewardContainer.add(title);
    
    // 카드 3장 표시
    const cardWidth = 200;
    const cardHeight = 300;
    const spacing = 50;
    const totalWidth = rewardCards.length * cardWidth + (rewardCards.length - 1) * spacing;
    const startX = (width - totalWidth) / 2 + cardWidth / 2;
    
    rewardCards.forEach((card, index) => {
      const x = startX + index * (cardWidth + spacing);
      const y = height / 2 - 20;
      
      const cardContainer = this.createRewardCard(card, x, y, cardWidth, cardHeight, index);
      this.rewardContainer.add(cardContainer);
    });
    
    // 건너뛰기 버튼
    const skipBtn = this.scene.add.container(width/2, height - 100);
    const skipBg = this.scene.add.rectangle(0, 0, 200, 50, 0x333333, 0.9);
    skipBg.setStrokeStyle(2, 0x888888);
    const skipText = this.scene.add.text(0, 0, '건너뛰기', {
      font: 'bold 18px monospace',
      color: '#888888',
    }).setOrigin(0.5);
    skipBtn.add([skipBg, skipText]);
    
    skipBg.setInteractive({ useHandCursor: true });
    skipBg.on('pointerover', () => {
      skipBg.setStrokeStyle(3, 0xffffff);
      skipText.setColor('#ffffff');
    });
    skipBg.on('pointerout', () => {
      skipBg.setStrokeStyle(2, 0x888888);
      skipText.setColor('#888888');
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
    const emoji = this.scene.add.text(0, -100, data.emoji, {
      font: '56px Arial',
    }).setOrigin(0.5);
    container.add(emoji);
    
    // 이름
    const displayName = isSword ? ((data as SwordCard).displayName || data.name) : data.name;
    const name = this.scene.add.text(0, -40, displayName, {
      font: 'bold 18px monospace',
      color: isSword ? '#' + borderColor.toString(16).padStart(6, '0') : '#4ecca3',
    }).setOrigin(0.5);
    container.add(name);
    
    // 타입 라벨
    const typeLabel = this.scene.add.text(0, -10, isSword ? '⚔️ 무기' : '📜 스킬', {
      font: '14px monospace',
      color: '#aaaaaa',
    }).setOrigin(0.5);
    container.add(typeLabel);
    
    // 간략 정보 (워드랩으로 잘리지 않게)
    let infoText = '';
    if (isSword) {
      const sword = data as SwordCard;
      infoText = `공격력 ${sword.attack}  ${sword.attackCount}타\n내구도: ${sword.durability}`;
    } else {
      const skill = data as SkillCard;
      infoText = `마나: ${skill.manaCost}\n${skill.description.slice(0, 30)}...`;
    }
    
    const info = this.scene.add.text(0, 40, infoText, {
      font: '13px monospace',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 6,
      wordWrap: { width: cardWidth - 20 },
    }).setOrigin(0.5);
    container.add(info);
    
    // 선택 버튼
    const selectBtn = this.scene.add.rectangle(0, 115, 120, 40, 0x4ecca3, 0.9);
    selectBtn.setStrokeStyle(2, 0xffffff);
    const selectText = this.scene.add.text(0, 115, '선택', {
      font: 'bold 16px monospace',
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

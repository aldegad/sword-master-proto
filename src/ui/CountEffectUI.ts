import Phaser from 'phaser';
import type { UIScene } from '../scenes/UIScene';
import type { CountEffect } from '../types';

/**
 * 카운트 효과 UI - 활성화된 카운트 스킬 효과 표시
 */
export class CountEffectUI {
  private scene: UIScene;
  private container!: Phaser.GameObjects.Container;
  private effectItems: Phaser.GameObjects.Container[] = [];
  private tooltipContainer!: Phaser.GameObjects.Container;
  
  constructor(scene: UIScene) {
    this.scene = scene;
    this.create();
  }
  
  private create() {
    // 카운트 효과 표시 컨테이너 (HP 바 아래)
    this.container = this.scene.add.container(20, 300);
    
    // 툴팁 컨테이너
    this.tooltipContainer = this.scene.add.container(0, 0);
    this.tooltipContainer.setVisible(false);
    this.tooltipContainer.setDepth(1000);
  }
  
  update() {
    // 기존 효과 아이템 제거
    this.effectItems.forEach(item => item.destroy());
    this.effectItems = [];
    
    const countEffects = this.scene.gameScene.playerState.countEffects;
    if (!countEffects || countEffects.length === 0) return;
    
    let yOffset = 0;
    
    countEffects.forEach(effect => {
      const itemContainer = this.createEffectItem(effect, yOffset);
      this.container.add(itemContainer);
      this.effectItems.push(itemContainer);
      
      yOffset += 32;
    });
  }
  
  private createEffectItem(effect: CountEffect, yOffset: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, yOffset);
    
    // 효과 타입별 색상
    let color = '#4ecca3';
    let bgColor = 0x1a1a2e;
    if (effect.type === 'ironWall') {
      color = '#4dabf7';
    } else if (effect.type === 'chargeAttack') {
      color = '#ffcc00';
    }
    
    // 배경
    const bg = this.scene.add.rectangle(80, 0, 180, 26, bgColor, 0.95);
    bg.setStrokeStyle(2, parseInt(color.replace('#', ''), 16));
    bg.setOrigin(0.5, 0.5);
    
    // 텍스트
    const text = this.scene.add.text(0, 0, 
      `${effect.emoji} ${effect.name} ⏳${effect.remainingDelays}`, {
      font: 'bold 14px monospace',
      color: color,
    });
    
    container.add([bg, text]);
    
    // 인터랙션 설정
    bg.setInteractive({ useHandCursor: true });
    
    bg.on('pointerover', () => {
      bg.setStrokeStyle(3, 0xffffff);
      this.showTooltip(effect, this.container.x + 200, this.container.y + yOffset);
    });
    
    bg.on('pointerout', () => {
      bg.setStrokeStyle(2, parseInt(color.replace('#', ''), 16));
      this.hideTooltip();
    });
    
    return container;
  }
  
  private showTooltip(effect: CountEffect, x: number, y: number) {
    this.tooltipContainer.removeAll(true);
    
    // 효과별 설명 생성
    let description = '';
    let title = `${effect.emoji} ${effect.name}`;
    let titleColor = '#4ecca3';
    
    switch (effect.type) {
      case 'parry':
        titleColor = '#4ecca3';
        description = [
          `남은 대기: ${effect.remainingDelays}`,
          '',
          `방어율 x${effect.data.defenseMultiplier || 5} 적용`,
          '방어 성공 시 반격 발동!',
          '',
          `반격 배수: x${effect.data.attackMultiplier || 1.0}`,
        ].join('\n');
        break;
        
      case 'ironWall':
        titleColor = '#4dabf7';
        description = [
          `남은 대기: ${effect.remainingDelays}`,
          '',
          `방어율 x${effect.data.defenseMultiplier || 10} 적용`,
          '1회 방어 시 효과 소멸',
        ].join('\n');
        break;
        
      case 'chargeAttack':
        titleColor = '#ffcc00';
        description = [
          `남은 대기: ${effect.remainingDelays}`,
          '',
          `대기 완료 시 공격 발동!`,
          `공격 배수: x${effect.data.attackMultiplier || 1.0}`,
          effect.data.attackCount ? `추가 타수: +${effect.data.attackCount}` : '',
        ].filter(line => line).join('\n');
        break;
    }
    
    // 툴팁 크기 계산
    const lines = description.split('\n').length;
    const tooltipHeight = 60 + lines * 18;
    const tooltipWidth = 200;
    
    // 배경
    const bg = this.scene.add.rectangle(0, 0, tooltipWidth, tooltipHeight, 0x1a1a2e, 0.98);
    bg.setStrokeStyle(3, parseInt(titleColor.replace('#', ''), 16));
    
    // 제목
    const titleText = this.scene.add.text(0, -tooltipHeight/2 + 15, title, {
      font: 'bold 16px monospace',
      color: titleColor,
    }).setOrigin(0.5, 0);
    
    // 설명
    const descText = this.scene.add.text(0, -tooltipHeight/2 + 45, description, {
      font: '12px monospace',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 4,
    }).setOrigin(0.5, 0);
    
    this.tooltipContainer.add([bg, titleText, descText]);
    
    // 위치 조정 (화면 밖으로 안 나가게)
    let tooltipX = x;
    let tooltipY = y;
    if (tooltipX + tooltipWidth/2 > this.scene.cameras.main.width) {
      tooltipX = this.scene.cameras.main.width - tooltipWidth/2 - 10;
    }
    if (tooltipY + tooltipHeight/2 > this.scene.cameras.main.height) {
      tooltipY = y - tooltipHeight;
    }
    
    this.tooltipContainer.setPosition(tooltipX, tooltipY);
    this.tooltipContainer.setVisible(true);
  }
  
  private hideTooltip() {
    this.tooltipContainer.setVisible(false);
  }
}

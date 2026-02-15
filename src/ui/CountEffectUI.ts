import * as Phaser from 'phaser';
import type { UIScene } from '../scenes/UIScene';
import type { CountEffect } from '../types';
import { COLORS, COLORS_STR } from '../constants/colors';
import { CARD_SIZE } from './CardRenderer';

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
    // 카운트 효과 표시 컨테이너 (아래로 내림, 스케일)
    this.container = this.scene.add.container(38, 560);
    
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
      
      yOffset += 60;  // 간격 늘림
    });
  }
  
  private createEffectItem(effect: CountEffect, yOffset: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, yOffset);
    
    // 효과 타입별 색상
    let color: string = COLORS_STR.success.dark;
    let colorHex: number = COLORS.success.dark;
    if (effect.type === 'countDefense') {
      // 반격 없는 방어는 다른 색상
      if (!effect.data.counterAttack) {
        color = '#6b8e9f';
        colorHex = 0x6b8e9f;
      }
    } else if (effect.type === 'chargeAttack') {
      color = COLORS_STR.primary.dark;
      colorHex = COLORS.primary.dark;
    }
    
    // 배경 (스케일)
    const bg = this.scene.add.rectangle(150, 0, 338, 49, COLORS.background.dark, 0.95);
    bg.setStrokeStyle(3, colorHex);
    bg.setOrigin(0.5, 0.5);
    
    // 텍스트 (배경 중앙에 맞춤)
    const text = this.scene.add.text(150, 0, 
      `${effect.emoji} ${effect.name} ⏳${effect.remainingDelays}`, {
      font: 'bold 26px monospace',
      color: color,
    }).setOrigin(0.5, 0.5);
    
    container.add([bg, text]);
    
    // 인터랙션 설정
    bg.setInteractive({ useHandCursor: true });
    
    bg.on('pointerover', () => {
      bg.setStrokeStyle(4, COLORS.primary.light);
      this.showTooltip(effect, this.container.x + 375, this.container.y + yOffset);
    });
    
    bg.on('pointerout', () => {
      bg.setStrokeStyle(3, colorHex);
      this.hideTooltip();
    });
    
    return container;
  }
  
  private showTooltip(effect: CountEffect, x: number, y: number) {
    this.tooltipContainer.removeAll(true);
    
    // 카드 형식 툴팁
    const width = CARD_SIZE.DETAIL.width;
    let height = 300;
    
    // 효과 타입별 색상
    let titleColor: string = COLORS_STR.success.dark;
    let borderColor: number = COLORS.success.dark;
    
    if (effect.type === 'chargeAttack') {
      titleColor = COLORS_STR.primary.dark;
      borderColor = COLORS.primary.dark;
    } else if (effect.type === 'countDefense' && !effect.data.counterAttack) {
      titleColor = '#6b8e9f';
      borderColor = 0x6b8e9f;
    }
    
    // 카드 형태 배경
    const bg = this.scene.add.rectangle(0, 0, width, height, COLORS.background.dark, 0.98);
    bg.setStrokeStyle(5, borderColor);
    this.tooltipContainer.add(bg);
    
    let yPos = -height / 2 + 30;
    
    // 헤더 (이모지 + 이름)
    const emoji = this.scene.add.text(-width/2 + 20, yPos, effect.emoji, { font: '50px Arial' });
    const name = this.scene.add.text(-width/2 + 80, yPos + 8, effect.name, {
      font: 'bold 24px monospace',
      color: titleColor,
    });
    this.tooltipContainer.add([emoji, name]);
    yPos += 60;
    
    // 대기 시간 (강조)
    const delayText = this.scene.add.text(0, yPos, `⏳ 남은 대기: ${effect.remainingDelays}`, {
      font: 'bold 22px monospace',
      color: '#FFD700',
    }).setOrigin(0.5, 0);
    this.tooltipContainer.add(delayText);
    yPos += 40;
    
    // 구분선
    const line = this.scene.add.rectangle(0, yPos, width - 40, 2, borderColor, 0.5);
    this.tooltipContainer.add(line);
    yPos += 20;
    
    // 효과 정보
    const infoLines: string[] = [];
    
    switch (effect.type) {
      case 'countDefense':
        infoLines.push(`◆ 방어율: x${effect.data.defenseMultiplier || 5}`);
        if (effect.data.counterAttack) {
          infoLines.push('');
          infoLines.push('◆ 방어 성공 시 반격!');
          infoLines.push(`   반격 배수: x${effect.data.attackMultiplier || 1.0}`);
        } else {
          infoLines.push('');
          infoLines.push('◆ 1회 방어 후 소멸');
        }
        break;
        
      case 'chargeAttack':
        infoLines.push('◆ 대기 완료 시 공격 발동!');
        infoLines.push(`   공격 배수: x${effect.data.attackMultiplier || 1.0}`);
        if (effect.data.skillAttackCount && effect.data.skillAttackCount > 1) {
          infoLines.push(`   타수 배율: x${effect.data.skillAttackCount}`);
        }
        break;
        
      case 'flowRead':
        infoLines.push('◆ 대기할수록 강해짐!');
        infoLines.push(`   현재 방어율: x${effect.data.defenseScaling?.[effect.maxDelays! - effect.remainingDelays] || 1}`);
        infoLines.push(`   현재 반격: x${effect.data.counterScaling?.[effect.maxDelays! - effect.remainingDelays] || 0.25}`);
        break;
    }
    
    infoLines.forEach(line => {
      const text = this.scene.add.text(-width/2 + 30, yPos, line, {
        font: '18px monospace',
        color: COLORS_STR.text.secondary,
      });
      this.tooltipContainer.add(text);
      yPos += 26;
    });
    
    // 위치 조정
    let tooltipX = x;
    let tooltipY = y;
    if (tooltipX + width/2 > this.scene.cameras.main.width) {
      tooltipX = this.scene.cameras.main.width - width/2 - 20;
    }
    if (tooltipY + height/2 > this.scene.cameras.main.height) {
      tooltipY = y - height;
    }
    
    this.tooltipContainer.setPosition(tooltipX, tooltipY);
    this.tooltipContainer.setVisible(true);
  }
  
  private hideTooltip() {
    this.tooltipContainer.setVisible(false);
  }
}

import Phaser from 'phaser';
import type { UIScene } from '../scenes/UIScene';
import type { Card, SwordCard, SkillCard } from '../types';

/**
 * 툴팁 UI - 카드 상세 정보 표시
 */
export class TooltipUI {
  private scene: UIScene;
  private tooltipContainer!: Phaser.GameObjects.Container;
  
  constructor(scene: UIScene) {
    this.scene = scene;
    this.create();
  }
  
  private create() {
    this.tooltipContainer = this.scene.add.container(0, 0);
    this.tooltipContainer.setVisible(false);
    this.tooltipContainer.setDepth(1000);
  }
  
  show(x: number, y: number, card: Card) {
    this.tooltipContainer.removeAll(true);
    
    const isSword = card.type === 'sword';
    const data = card.data;
    
    // 데미지 계산
    let damageInfo = '';
    if (!isSword) {
      const skill = data as SkillCard;
      const sword = this.scene.gameScene.playerState.currentSword;
      if (sword && (skill.type === 'attack' || skill.type === 'special')) {
        const baseDmg = sword.attack * skill.attackMultiplier;
        const hits = sword.attackCount + skill.attackCount;
        const totalDmg = baseDmg * hits;
        damageInfo = `\n\n💥 예상 데미지: ${Math.floor(baseDmg)} x ${hits}타 = ${Math.floor(totalDmg)}`;
      } else if (skill.type === 'defense') {
        damageInfo = `\n\n🛡️ 방어력 +${skill.defenseBonus}`;
      }
    } else {
      const sword = data as SwordCard;
      damageInfo = `\n\n⚔️ 기본 공격력: ${sword.attack} x ${sword.attackCount}타`;
    }
    
    // 등급별 색상
    const rarityColors: Record<string, string> = {
      common: '#e94560',
      uncommon: '#4ecca3',
      rare: '#4dabf7',
      unique: '#ffcc00',
    };
    
    const borderColor = isSword 
      ? parseInt(rarityColors[(data as SwordCard).rarity || 'common'].replace('#', ''), 16)
      : 0x4ecca3;
    
    // 무기 카드는 더 큰 툴팁 필요
    const tooltipHeight = isSword ? 280 : 180;
    const bg = this.scene.add.rectangle(0, 0, 300, tooltipHeight, 0x1a1a2e, 0.98);
    bg.setStrokeStyle(3, borderColor);
    
    const emoji = this.scene.add.text(-130, -tooltipHeight/2 + 15, data.emoji, { font: '32px Arial' });
    
    // 검은 displayName 사용
    const displayName = isSword ? ((data as SwordCard).displayName || data.name) : data.name;
    const nameColor = isSword ? rarityColors[(data as SwordCard).rarity || 'common'] : '#4ecca3';
    
    const name = this.scene.add.text(-90, -tooltipHeight/2 + 18, displayName, {
      font: 'bold 16px monospace',
      color: nameColor,
    });
    
    // 무기 카드는 설명만, 스킬 카드는 설명 + 데미지 정보
    const descText = isSword ? data.description : data.description + damageInfo;
    const desc = this.scene.add.text(0, -tooltipHeight/2 + 50, descText, {
      font: '13px monospace',
      color: '#ffffff',
      wordWrap: { width: 280 },
      align: 'center',
      lineSpacing: 3,
    }).setOrigin(0.5, 0);
    
    this.tooltipContainer.add([bg, emoji, name, desc]);
    
    if (isSword) {
      this.addSwordDetails(data as SwordCard, tooltipHeight);
    }
    
    // 위치 조정 (화면 밖으로 안 나가게)
    let tooltipX = x;
    let tooltipY = y - tooltipHeight/2 - 20;
    if (tooltipX < 160) tooltipX = 160;
    if (tooltipX > this.scene.cameras.main.width - 160) tooltipX = this.scene.cameras.main.width - 160;
    if (tooltipY < tooltipHeight/2 + 10) tooltipY = tooltipHeight/2 + 10;
    
    this.tooltipContainer.setPosition(tooltipX, tooltipY);
    this.tooltipContainer.setVisible(true);
  }
  
  private addSwordDetails(sword: SwordCard, _tooltipHeight: number) {
    // 범위 표시
    const reachMap: Record<string, string> = {
      single: '1명',
      double: '2명',
      triple: '3명',
      all: '전체',
    };
    
    // 모든 스탯 표시 (Y 좌표 조정)
    const statsText = this.scene.add.text(0, -50, [
      `⚔️ 공격력: ${sword.attack}  |  타수: ${sword.attackCount}회`,
      `🎯 범위: ${reachMap[sword.reach]}  |  🛡️ 방어율: ${sword.defense}%`,
      `🔧 내구도: ${sword.currentDurability}/${sword.durability}`,
    ].join('\n'), {
      font: '12px monospace',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 6,
    }).setOrigin(0.5, 0);
    this.tooltipContainer.add(statsText);
    
    // 발도 스킬 정보
    const drawAtk = sword.drawAttack;
    const drawText = this.scene.add.text(0, 25, [
      `━━━ 발도: ${drawAtk.name} ━━━`,
      `배율: x${drawAtk.multiplier} | 범위: ${reachMap[drawAtk.reach]}`,
    ].join('\n'), {
      font: 'bold 11px monospace',
      color: '#ffcc00',
      align: 'center',
      lineSpacing: 4,
    }).setOrigin(0.5, 0);
    this.tooltipContainer.add(drawText);
    
    let effectY = 75;
    
    // 인첸트 효과 표시
    if (sword.prefix) {
      const prefixText = this.scene.add.text(0, effectY, `🔮 ${sword.prefix.name}`, {
        font: '12px monospace',
        color: '#ff9f43',
      }).setOrigin(0.5, 0);
      this.tooltipContainer.add(prefixText);
      effectY += 16;
    }
    
    if (sword.suffix) {
      const suffixText = this.scene.add.text(0, effectY, `🔮 ${sword.suffix.name}`, {
        font: '12px monospace',
        color: '#ff9f43',
      }).setOrigin(0.5, 0);
      this.tooltipContainer.add(suffixText);
      effectY += 16;
    }
    
    if (sword.specialEffect) {
      const effect = this.scene.add.text(0, effectY, `✨ ${sword.specialEffect}`, {
        font: '12px monospace',
        color: '#4ecca3',
      }).setOrigin(0.5, 0);
      this.tooltipContainer.add(effect);
      effectY += 16;
    }
    
    // 내구도 1이면 경고
    if (sword.durability === 1) {
      const warnText = this.scene.add.text(0, effectY, '⚠️ 일회용!', {
        font: 'bold 12px monospace',
        color: '#ff6b6b',
      }).setOrigin(0.5, 0);
      this.tooltipContainer.add(warnText);
    }
  }
  
  hide() {
    this.tooltipContainer.setVisible(false);
  }
}

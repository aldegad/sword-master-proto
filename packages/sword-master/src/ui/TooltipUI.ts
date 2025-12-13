import Phaser from 'phaser';
import type { UIScene } from '../scenes/UIScene';
import type { Card, SwordCard, SkillCard } from '../types';
import { COLORS, COLORS_STR } from '../constants/colors';
import { FONTS } from '../constants/typography';

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
        const hits = sword.attackCount * skill.attackCount;  // 곱셈! (무기타수 × 스킬배율)
        const totalDmg = baseDmg * hits;
        
        // 범위/타수 정보
        const reachMap: Record<string, string> = { single: '무기범위', double: '2명', triple: '3명', all: '전체', swordDouble: '무기x2' };
        let rangeText = '';
        if (skill.reach === 'single') {
          rangeText = `무기범위(${sword.reach === 'single' ? '1명' : sword.reach === 'double' ? '2명' : sword.reach === 'triple' ? '3명' : '전체'})`;
        } else if (skill.reach === 'swordDouble') {
          const swordCount = sword.reach === 'single' ? 1 : sword.reach === 'double' ? 2 : sword.reach === 'triple' ? 3 : 999;
          rangeText = `무기x2(${Math.min(swordCount * 2, 6)}명)`;
        } else {
          rangeText = reachMap[skill.reach] || skill.reach;
        }
        const hitsText = skill.attackCount === 1 ? `무기타수(${sword.attackCount}타)` : `무기${sword.attackCount}타 x${skill.attackCount} = ${hits}타`;
        
        damageInfo = `\n\n🎯 범위: ${rangeText} | 타수: ${hitsText}\n💥 예상 데미지: ${Math.floor(baseDmg)} x ${hits}타 = ${Math.floor(totalDmg)}`;
      } else if (skill.type === 'defense') {
        damageInfo = `\n\n🛡️ 방어력 +${skill.defenseBonus}`;
      }
    } else {
      const sword = data as SwordCard;
      damageInfo = `\n\n⚔️ 기본 공격력: ${sword.attack} x ${sword.attackCount}타`;
    }
    
    const borderColor = isSword 
      ? COLORS.rarity[(data as SwordCard).rarity as keyof typeof COLORS.rarity || 'common']
      : COLORS.success.dark;
    
    // 무기 카드는 더 큰 툴팁 필요, 공격 스킬은 범위/타수 정보 추가로 더 큼 (스케일 적용)
    const isAttackSkill = !isSword && ((data as SkillCard).type === 'attack' || (data as SkillCard).type === 'special');
    const tooltipHeight = isSword ? 525 : (isAttackSkill ? 375 : 300);
    const bg = this.scene.add.rectangle(0, 0, 563, tooltipHeight, COLORS.background.dark, 0.98);
    bg.setStrokeStyle(5, borderColor);
    
    const emoji = this.scene.add.text(-244, -tooltipHeight/2 + 28, data.emoji, { font: '62px Arial' });
    
    // 검은 displayName 사용
    const displayName = isSword ? ((data as SwordCard).displayName || data.name) : data.name;
    const nameColor = isSword ? COLORS_STR.rarity[(data as SwordCard).rarity as keyof typeof COLORS_STR.rarity || 'common'] : COLORS_STR.success.dark;
    
    const name = this.scene.add.text(-169, -tooltipHeight/2 + 34, displayName, {
      font: 'bold 28px monospace',
      color: nameColor,
    });
    
    // 무기 카드는 설명만, 스킬 카드는 설명 + 데미지 정보
    const descText = isSword ? data.description : data.description + damageInfo;
    const desc = this.scene.add.text(0, -tooltipHeight/2 + 94, descText, {
      font: '22px monospace',
      color: COLORS_STR.text.primary,
      wordWrap: { width: 525 },
      align: 'center',
      lineSpacing: 6,
    }).setOrigin(0.5, 0);
    
    this.tooltipContainer.add([bg, emoji, name, desc]);
    
    if (isSword) {
      this.addSwordDetails(data as SwordCard, tooltipHeight);
    }
    
    // 위치 조정 (화면 밖으로 안 나가게)
    let tooltipX = x;
    let tooltipY = y - tooltipHeight/2 - 38;
    if (tooltipX < 300) tooltipX = 300;
    if (tooltipX > this.scene.cameras.main.width - 300) tooltipX = this.scene.cameras.main.width - 300;
    if (tooltipY < tooltipHeight/2 + 20) tooltipY = tooltipHeight/2 + 20;
    
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
    
    // 모든 스탯 표시 (Y 좌표 조정, 스케일)
    const statsText = this.scene.add.text(0, -94, [
      `⚔️ 공격력: ${sword.attack}  |  타수: ${sword.attackCount}회`,
      `🎯 범위: ${reachMap[sword.reach]}  |  🛡️ 방어율: ${sword.defense}%`,
      `🔧 내구도: ${sword.currentDurability}/${sword.durability}`,
    ].join('\n'), {
      font: '20px monospace',
      color: COLORS_STR.text.primary,
      align: 'center',
      lineSpacing: 11,
    }).setOrigin(0.5, 0);
    this.tooltipContainer.add(statsText);
    
    // 발도 스킬 정보 (스케일)
    const drawAtk = sword.drawAttack;
    const swiftTag = drawAtk.isSwift ? ' ⚡신속' : '';
    const drawLines = [
      `━━━ 발도: ${drawAtk.name}${swiftTag} ━━━`,
      `배율: x${drawAtk.multiplier} | 범위: ${reachMap[drawAtk.reach]}`,
    ];
    
    // 발도 효과 설명 추가
    if (drawAtk.effect) {
      drawLines.push(`💫 ${drawAtk.effect}`);
    }
    
    const drawText = this.scene.add.text(0, 47, drawLines.join('\n'), {
      font: 'bold 22px monospace',
      color: COLORS_STR.primary.dark,
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5, 0);
    this.tooltipContainer.add(drawText);
    
    // 발도 효과가 있으면 effectY 조정
    let effectY = drawAtk.effect ? 168 : 141;
    
    // 인첸트 효과 표시 (스케일)
    if (sword.prefix) {
      const prefixText = this.scene.add.text(0, effectY, `🔮 ${sword.prefix.name}`, {
        font: '20px monospace',
        color: COLORS_STR.primary.dark,
      }).setOrigin(0.5, 0);
      this.tooltipContainer.add(prefixText);
      effectY += 30;
    }
    
    if (sword.suffix) {
      const suffixText = this.scene.add.text(0, effectY, `🔮 ${sword.suffix.name}`, {
        font: '20px monospace',
        color: COLORS_STR.primary.dark,
      }).setOrigin(0.5, 0);
      this.tooltipContainer.add(suffixText);
      effectY += 30;
    }
    
    if (sword.specialEffect) {
      const effect = this.scene.add.text(0, effectY, `✨ ${sword.specialEffect}`, {
        font: '20px monospace',
        color: COLORS_STR.success.dark,
      }).setOrigin(0.5, 0);
      this.tooltipContainer.add(effect);
      effectY += 30;
    }
    
    // 내구도 1이면 경고 (스케일)
    if (sword.durability === 1) {
      const warnText = this.scene.add.text(0, effectY, '⚠️ 일회용!', {
        font: 'bold 22px monospace',
        color: COLORS_STR.secondary.dark,
      }).setOrigin(0.5, 0);
      this.tooltipContainer.add(warnText);
    }
  }
  
  hide() {
    this.tooltipContainer.setVisible(false);
  }
}

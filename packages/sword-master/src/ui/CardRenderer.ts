import Phaser from 'phaser';
import type { Card, SwordCard, SkillCard, Buff } from '../types';
import { COLORS, COLORS_STR } from '../constants/colors';

// 파란색 하이라이트 색상 (무기에 따라 변하는 수치)
const HIGHLIGHT_COLOR = '#4A90D9';
const BUFF_COLOR = '#2ECC71';  // 버프 적용 시 녹색

// 카드 크기 상수
export const CARD_SIZE = {
  SUMMARY: { width: 165, height: 253 },
  DETAIL: { width: 420, height: 620 },
};

// 공통 맵
const REACH_MAP: Record<string, string> = {
  single: '1적',
  double: '2적',
  triple: '3적',
  all: '전체',
  swordDouble: '무기x2',
};

const TYPE_MAP: Record<string, string> = {
  attack: '⚔ 공격',
  defense: '🛡 방어',
  buff: '✨ 버프',
  special: '💥 특수',
  draw: '🎴 드로우',
};

/**
 * 카드 렌더러 - 요약/상세 카드 통합 렌더링
 */
export class CardRenderer {
  private scene: Phaser.Scene;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  
  /**
   * 현재 버프 정보 가져오기
   */
  private getBuffInfo(): { attackBonus: number; focusMultiplier: number; hasBuffs: boolean } {
    let attackBonus = 0;
    let focusMultiplier = 1.0;
    
    try {
      // UIScene에서 gameScene 접근 시도
      const uiScene = this.scene as any;
      const buffs: Buff[] = uiScene.gameScene?.playerState?.buffs || [];
      
      buffs.forEach(buff => {
        if (buff.type === 'attack') {
          if (buff.id === 'focus') {
            focusMultiplier += buff.value;
          } else {
            attackBonus += buff.value;
          }
        }
      });
    } catch {
      // 버프 정보 접근 실패 시 기본값 사용
    }
    
    return { 
      attackBonus, 
      focusMultiplier, 
      hasBuffs: attackBonus > 0 || focusMultiplier > 1.0 
    };
  }
  
  // ========== 요약 카드 (손패용) ==========
  
  /**
   * 요약 카드 생성 (손패, 애니메이션용)
   */
  createSummaryCard(card: Card, options: {
    canAfford?: boolean;
    isDisabled?: boolean;
    showIndex?: number;
  } = {}): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);
    const { width, height } = CARD_SIZE.SUMMARY;
    const { canAfford = true, isDisabled = false, showIndex } = options;
    
    const isSword = card.type === 'sword';
    const data = card.data;
    
    // 배경
    const bgColor = isSword ? COLORS.background.light : COLORS.background.dark;
    const borderColor = this.getBorderColor(card, canAfford);
    
    const bg = this.scene.add.rectangle(0, 0, width, height, bgColor);
    bg.setStrokeStyle(canAfford ? 5 : 3, borderColor);
    container.add(bg);
    
    // 카드 번호 (옵션)
    if (showIndex !== undefined) {
      const numKey = showIndex < 9 ? `${showIndex + 1}` : '0';
      const numText = this.scene.add.text(-68, -112, `[${numKey}]`, {
        font: 'bold 22px monospace',
        color: canAfford ? COLORS_STR.primary.main : COLORS_STR.text.disabled,
      });
      container.add(numText);
    }
    
    // 마나 비용
    const manaText = this.scene.add.text(34, -112, `◈${data.manaCost}`, {
      font: 'bold 22px monospace',
      color: canAfford ? COLORS_STR.primary.main : COLORS_STR.text.disabled,
    });
    container.add(manaText);
    
    // 카드 내용
    if (isSword) {
      this.renderSwordSummary(container, data as SwordCard, canAfford);
    } else {
      this.renderSkillSummary(container, data as SkillCard, canAfford, isDisabled);
    }
    
    // 비활성화 오버레이
    if (isDisabled) {
      const overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.5);
      const icon = this.scene.add.text(0, 0, '🚫', { font: '52px Arial' }).setOrigin(0.5);
      container.add([overlay, icon]);
    }
    
    return container;
  }
  
  private renderSwordSummary(container: Phaser.GameObjects.Container, sword: SwordCard, canAfford: boolean) {
    const textColor = canAfford 
      ? COLORS_STR.rarity[sword.rarity as keyof typeof COLORS_STR.rarity || 'common'] 
      : COLORS_STR.text.disabled;
    const subColor = canAfford ? COLORS_STR.text.secondary : COLORS_STR.text.disabled;
    
    // 이모지
    const emoji = this.scene.add.text(0, -84, sword.emoji, {
      font: '51px Arial',
    }).setOrigin(0.5);
    
    // 이름
    const displayName = sword.displayName || sword.name;
    const shortName = displayName.length > 6 ? displayName.slice(0, 5) + '..' : displayName;
    const nameText = this.scene.add.text(0, -34, shortName, {
      font: 'bold 22px monospace',
      color: textColor,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    
    // 스탯
    const statsText = this.scene.add.text(0, 9, `공${sword.attack} ${sword.attackCount}타 ${REACH_MAP[sword.reach] || sword.reach}`, {
      font: '18px monospace',
      color: subColor,
      align: 'center',
    }).setOrigin(0.5);
    
    // 내구도/방어 (이가 빠진 인첸트면 빨간색)
    const isChipped = sword.prefix?.id === 'chipped';
    const durColor = isChipped ? '#E74C3C' : 
                     (sword.durability === 1 ? COLORS_STR.secondary.main : 
                     (canAfford ? COLORS_STR.primary.main : COLORS_STR.text.disabled));
    const durText = this.scene.add.text(0, 43, `내구${sword.durability} 방${sword.defense}`, {
      font: isChipped ? 'bold 18px monospace' : '18px monospace',
      color: durColor,
    }).setOrigin(0.5);
    
    // 타입 라벨 (신기루 태그 포함)
    const rarityLabel = sword.rarity === 'unique' ? '★' : 
                        sword.rarity === 'rare' ? '◆' : 
                        sword.rarity === 'uncommon' ? '◇' : '';
    const mirageLabel = sword.isMirage ? '👻' : '';
    const typeLabel = this.scene.add.text(0, 84, `${mirageLabel}${rarityLabel}검`, {
      font: 'bold 18px monospace',
      color: sword.isMirage ? '#9B59B6' : textColor,  // 신기루면 보라색
    }).setOrigin(0.5);
    
    container.add([emoji, nameText, statsText, durText, typeLabel]);
  }
  
  private renderSkillSummary(container: Phaser.GameObjects.Container, skill: SkillCard, canAfford: boolean, isDisabled: boolean) {
    const isSwift = skill.isSwift === true;
    const skillColor = isSwift ? COLORS_STR.card.swift : COLORS_STR.card.skill;
    
    const textColor = canAfford ? skillColor : (isDisabled ? COLORS_STR.background.medium : COLORS_STR.text.disabled);
    const subColor = canAfford ? COLORS_STR.text.secondary : (isDisabled ? COLORS_STR.background.medium : COLORS_STR.text.disabled);
    
    // 이모지
    const emoji = this.scene.add.text(0, -84, skill.emoji, {
      font: '51px Arial',
    }).setOrigin(0.5);
    
    // 이름
    const nameText = this.scene.add.text(0, -34, skill.name, {
      font: 'bold 22px monospace',
      color: textColor,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    
    // 스탯 라인
    let statLine = TYPE_MAP[skill.type]?.split(' ')[0] || '';
    if (skill.attackMultiplier > 0) {
      statLine += ` x${skill.attackMultiplier}`;
    }
    if (skill.defenseBonus > 0) {
      statLine += ` +${skill.defenseBonus}`;
    }
    
    const statsText = this.scene.add.text(0, 9, statLine, {
      font: '18px monospace',
      color: subColor,
      align: 'center',
    }).setOrigin(0.5);
    
    // 범위/타수
    let subLine = '';
    if (skill.type === 'attack' || skill.type === 'special') {
      const rangeText = skill.reach === 'single' ? '무기' : 
                        skill.reach === 'swordDouble' ? '무기x2' : 
                        (REACH_MAP[skill.reach] || skill.reach);
      const hitsText = skill.attackCount === 1 ? '무기' : `x${skill.attackCount}`;
      subLine = `${rangeText} ${hitsText}타`;
    } else if (skill.type === 'defense') {
      subLine = '방어 스킬';
    } else if (skill.type === 'buff') {
      subLine = '버프 스킬';
    }
    
    const costText = this.scene.add.text(0, 43, subLine, {
      font: '18px monospace',
      color: canAfford ? COLORS_STR.primary.dark : COLORS_STR.text.disabled,
    }).setOrigin(0.5);
    
    // 타입 라벨
    const typeText = isSwift ? '⚡신속' : '스킬';
    const typeLabel = this.scene.add.text(0, 84, typeText, {
      font: 'bold 18px monospace',
      color: textColor,
    }).setOrigin(0.5);
    
    container.add([emoji, nameText, statsText, costText, typeLabel]);
  }
  
  // ========== 상세 카드 (툴팁, 대기 스킬, 보상용) ==========
  
  /**
   * 상세 카드 생성 (확대 버전)
   */
  createDetailCard(card: Card, sword?: SwordCard | null): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);
    const isSword = card.type === 'sword';
    
    if (isSword) {
      this.renderSwordDetail(container, card.data as SwordCard);
    } else {
      this.renderSkillDetail(container, card.data as SkillCard, sword);
    }
    
    return container;
  }
  
  private renderSwordDetail(container: Phaser.GameObjects.Container, sword: SwordCard) {
    const width = CARD_SIZE.DETAIL.width;
    const height = CARD_SIZE.DETAIL.height;
    
    const borderColor = COLORS.rarity[sword.rarity as keyof typeof COLORS.rarity || 'common'];
    const textColor = COLORS_STR.rarity[sword.rarity as keyof typeof COLORS_STR.rarity || 'common'];
    
    // 배경
    const bg = this.scene.add.rectangle(0, 0, width, height, COLORS.background.dark, 0.98);
    bg.setStrokeStyle(5, borderColor);
    container.add(bg);
    
    let yPos = -height/2 + 25;
    
    // 헤더 (이모지 + 이름 + 마나)
    const emoji = this.scene.add.text(-width/2 + 20, yPos, sword.emoji, { font: '56px Arial' });
    const name = this.scene.add.text(-width/2 + 90, yPos + 8, sword.displayName || sword.name, {
      font: 'bold 28px monospace',
      color: textColor,
    });
    const mana = this.scene.add.text(width/2 - 70, yPos + 12, `◈${sword.manaCost}`, {
      font: 'bold 24px monospace',
      color: '#5DADE2',
    });
    container.add([emoji, name, mana]);
    yPos += 70;
    
    // 신기루 태그 (사용하지 않으면 턴 종료 시 사라짐)
    if (sword.isMirage) {
      const mirageTag = this.scene.add.text(0, yPos, '👻 신기루 - 사용하지 않으면 턴 종료 시 사라짐', {
        font: 'bold 18px monospace',
        color: '#9B59B6',
        wordWrap: { width: width - 40 },
        align: 'center',
      }).setOrigin(0.5, 0);
      container.add(mirageTag);
      yPos += mirageTag.height + 8;
    }
    
    // 구분선
    const line1 = this.scene.add.rectangle(0, yPos, width - 40, 2, borderColor, 0.5);
    container.add(line1);
    yPos += 18;
    
    const reachText = REACH_MAP[sword.reach] || sword.reach;
    
    // 이가 빠진 인첸트 확인
    const isChipped = sword.prefix?.id === 'chipped';
    
    const stats = [
      `공격력: ${sword.attack}  |  타수: ${sword.attackCount}회`,
      `범위: ${reachText}  |  관통: ${sword.pierce}`,
    ];
    
    stats.forEach(stat => {
      const text = this.scene.add.text(-width/2 + 30, yPos, stat, {
        font: '20px monospace',
        color: COLORS_STR.text.secondary,
        wordWrap: { width: width - 60 },
      });
      container.add(text);
      yPos += text.height > 24 ? text.height + 4 : 28;
    });
    
    // 내구도/방어 (이가 빠진이면 내구도만 빨간색)
    const durLabel = this.scene.add.text(-width/2 + 30, yPos, '내구도: ', {
      font: '20px monospace',
      color: COLORS_STR.text.secondary,
    });
    container.add(durLabel);
    
    const durValue = this.scene.add.text(-width/2 + 30 + durLabel.width, yPos, `${sword.durability}`, {
      font: isChipped ? 'bold 20px monospace' : '20px monospace',
      color: isChipped ? '#E74C3C' : COLORS_STR.text.secondary,
    });
    container.add(durValue);
    
    const defText = this.scene.add.text(-width/2 + 30 + durLabel.width + durValue.width, yPos, `  |  방어: ${sword.defense}%`, {
      font: '20px monospace',
      color: COLORS_STR.text.secondary,
    });
    container.add(defText);
    
    // 이가 빠진 경고 표시
    if (isChipped) {
      const warnText = this.scene.add.text(width/2 - 30, yPos, '⚠️', {
        font: '18px Arial',
      }).setOrigin(1, 0);
      container.add(warnText);
    }
    
    yPos += 28;
    
    yPos += 12;
    
    // 구분선
    const line2 = this.scene.add.rectangle(0, yPos, width - 40, 2, borderColor, 0.3);
    container.add(line2);
    yPos += 18;
    
    // 발도 스킬
    const drawAtk = sword.drawAttack;
    const swiftTag = drawAtk.isSwift ? ' ⚡신속' : '';
    const drawTitle = this.scene.add.text(-width/2 + 20, yPos, `◆ 발도: ${drawAtk.name}${swiftTag}`, {
      font: 'bold 22px monospace',
      color: COLORS_STR.secondary.main,
    });
    container.add(drawTitle);
    yPos += 34;
    
    // 발도 기본 정보
    const drawReach = REACH_MAP[drawAtk.reach] || drawAtk.reach;
    
    // 발도는 항상 1타 (무기 타수와 무관)
    const baseDamage = Math.floor(sword.attack * drawAtk.multiplier);
    const drawHits = 1;  // 발도는 항상 1타!
    const totalDamage = baseDamage * drawHits;
    
    // 버프 정보 가져오기
    const buffInfo = this.getBuffInfo();
    
    const drawLine1 = this.scene.add.text(-width/2 + 30, yPos, 
      `배율: x${drawAtk.multiplier}  |  범위: ${drawReach}`, {
      font: '20px monospace',
      color: COLORS_STR.text.secondary,
    });
    container.add(drawLine1);
    yPos += 28;
    
    // 실제 데미지 표시 (발도는 1타)
    const damageText = this.scene.add.text(-width/2 + 30, yPos,
      `데미지: ${baseDamage} x ${drawHits}타 = ${totalDamage}`, {
      font: 'bold 20px monospace',
      color: HIGHLIGHT_COLOR,
    });
    container.add(damageText);
    yPos += 28;
    
    // 버프 적용 데미지 (버프가 있을 때만)
    if (buffInfo.hasBuffs) {
      const buffedBase = Math.floor((sword.attack + buffInfo.attackBonus) * drawAtk.multiplier * buffInfo.focusMultiplier);
      const buffedTotal = buffedBase * drawHits;
      
      let buffDesc = '';
      if (buffInfo.attackBonus > 0) buffDesc += `+${buffInfo.attackBonus}공`;
      if (buffInfo.focusMultiplier > 1.0) buffDesc += ` x${buffInfo.focusMultiplier}집중`;
      
      const buffedText = this.scene.add.text(-width/2 + 30, yPos,
        `✨버프: ${buffedBase} x ${drawHits}타 = ${buffedTotal} (${buffDesc.trim()})`, {
        font: 'bold 18px monospace',
        color: BUFF_COLOR,
      });
      container.add(buffedText);
      yPos += 28;
    }
    
    const drawLine2 = this.scene.add.text(-width/2 + 30, yPos, 
      `내구 소모: -${drawAtk.durabilityCost}`, {
      font: '20px monospace',
      color: COLORS_STR.text.secondary,
    });
    container.add(drawLine2);
    yPos += 28;
    
    // 발도 특수 효과들 - 크리티컬 조건
    if (drawAtk.criticalCondition) {
      const critMultiplier = drawAtk.criticalMultiplier || 1.5;
      const critPercent = Math.floor(critMultiplier * 100);
      const critDamage = Math.floor(baseDamage * critMultiplier);
      
      // 크리티컬 기본 효과
      let critDesc = `적 대기 1일 때 크리티컬!\n(${critPercent}% = ${critDamage}뎀)`;
      
      // 크리티컬 추가 효과
      const critEffects: string[] = [];
      if (drawAtk.criticalPierce) critEffects.push('방어 무시');
      if (drawAtk.criticalBleed) critEffects.push(`출혈 ${drawAtk.criticalBleed.damage}/${drawAtk.criticalBleed.duration}턴`);
      if (drawAtk.criticalPoison) critEffects.push(`독 ${drawAtk.criticalPoison.damage}/${drawAtk.criticalPoison.duration}턴`);
      if (drawAtk.cancelEnemySkill || drawAtk.criticalCancelEnemySkill) critEffects.push('스킬 취소');
      
      if (critEffects.length > 0) {
        critDesc += `\n+ ${critEffects.join(', ')}`;
      }
      
      const critText = this.scene.add.text(-width/2 + 30, yPos, `⭐ ${critDesc}`, {
        font: 'bold 20px monospace',
        color: '#FF6B6B',
        wordWrap: { width: width - 60 },
      });
      container.add(critText);
      yPos += critText.height + 8;
    }
    
    // effect 텍스트 표시 (볼드 파싱 포함)
    if (drawAtk.effect) {
      yPos = this.addEffectTextWithBold(container, -width/2 + 30, yPos, drawAtk.effect, width - 60);
    }
    
    if (drawAtk.pierce) {
      const pierceText = this.scene.add.text(-width/2 + 30, yPos, `🗡️ 방어 무시 공격!`, {
        font: 'bold 20px monospace',
        color: '#E74C3C',
      });
      container.add(pierceText);
      yPos += 32;
    }
    
    if (drawAtk.armorReduce) {
      const armorText = this.scene.add.text(-width/2 + 30, yPos, `🔨 적 방어력 -${drawAtk.armorReduce} (영구)`, {
        font: 'bold 20px monospace',
        color: '#F39C12',
      });
      container.add(armorText);
      yPos += 32;
    }
    
    // 장착 특수 효과 (출혈, 독, 방어관통 등)
    if (sword.bleedOnHit || sword.poisonOnHit || sword.armorBreakOnHit) {
      yPos += 8;
      const line3 = this.scene.add.rectangle(0, yPos, width - 40, 2, borderColor, 0.3);
      container.add(line3);
      yPos += 18;
      
      const effectTitle = this.scene.add.text(-width/2 + 20, yPos, '◆ 장착 효과', {
        font: 'bold 22px monospace',
        color: '#E74C3C',
      });
      container.add(effectTitle);
      yPos += 34;
      
      if (sword.bleedOnHit) {
        const bleed = this.scene.add.text(-width/2 + 30, yPos, 
          `🩸 모든 공격에 출혈: ${sword.bleedOnHit.damage}뎀 x ${sword.bleedOnHit.duration}턴`, {
          font: '20px monospace',
          color: '#E74C3C',
        });
        container.add(bleed);
        yPos += 32;
      }
      
      if (sword.poisonOnHit) {
        const poison = this.scene.add.text(-width/2 + 30, yPos, 
          `☠️ 모든 공격에 독: ${sword.poisonOnHit.damage}뎀 x ${sword.poisonOnHit.duration}턴`, {
          font: '20px monospace',
          color: '#9B59B6',
        });
        container.add(poison);
        yPos += 32;
      }
      
      if (sword.armorBreakOnHit) {
        const armor = this.scene.add.text(-width/2 + 30, yPos, 
          `💥 모든 공격에 방어력 감소: -${sword.armorBreakOnHit}`, {
          font: '20px monospace',
          color: '#F39C12',
        });
        container.add(armor);
        yPos += 32;
      }
    }
    
    // 설명 섹션 (description + specialEffect)
    if (sword.description || sword.specialEffect) {
      yPos += 8;
      const line4 = this.scene.add.rectangle(0, yPos, width - 40, 2, borderColor, 0.3);
      container.add(line4);
      yPos += 18;
      
      // 기본 설명
      if (sword.description) {
        const descText = this.scene.add.text(0, yPos, sword.description, {
          font: '18px monospace',
          color: COLORS_STR.text.primary,
          wordWrap: { width: width - 50 },
          align: 'center',
        }).setOrigin(0.5, 0);
        container.add(descText);
        yPos += descText.height + 8;
      }
      
      // 특수 효과 설명 (이탤릭)
      if (sword.specialEffect) {
        const effectText = this.scene.add.text(0, yPos, `"${sword.specialEffect}"`, {
          font: 'italic 16px monospace',
          color: COLORS_STR.text.secondary,
          wordWrap: { width: width - 50 },
          align: 'center',
        }).setOrigin(0.5, 0);
        container.add(effectText);
        yPos += effectText.height + 8;
      }
    }
    
    // 등급 표시 제거 (공간 확보)
  }
  
  private renderSkillDetail(container: Phaser.GameObjects.Container, skill: SkillCard, sword?: SwordCard | null) {
    const width = CARD_SIZE.DETAIL.width;
    const height = CARD_SIZE.DETAIL.height;
    
    const isSwift = skill.isSwift === true;
    const borderColor = isSwift ? COLORS.card.swift : COLORS.card.skill;
    const textColor = isSwift ? COLORS_STR.card.swift : COLORS_STR.card.skill;
    
    // 배경
    const bg = this.scene.add.rectangle(0, 0, width, height, COLORS.background.dark, 0.98);
    bg.setStrokeStyle(5, borderColor);
    container.add(bg);
    
    let yPos = -height/2 + 25;
    
    // 헤더
    const swiftTag = isSwift ? ' ⚡' : '';
    const emoji = this.scene.add.text(-width/2 + 20, yPos, skill.emoji, { font: '56px Arial' });
    const name = this.scene.add.text(-width/2 + 90, yPos + 8, skill.name + swiftTag, {
      font: 'bold 28px monospace',
      color: textColor,
    });
    const mana = this.scene.add.text(width/2 - 70, yPos + 12, `◈${skill.manaCost}`, {
      font: 'bold 24px monospace',
      color: '#5DADE2',
    });
    container.add([emoji, name, mana]);
    yPos += 70;
    
    // 설명
    const desc = this.scene.add.text(0, yPos, skill.description, {
      font: '20px monospace',
      color: COLORS_STR.text.primary,
      wordWrap: { width: width - 50 },
      align: 'center',
    }).setOrigin(0.5, 0);
    container.add(desc);
    yPos += desc.height + 18;
    
    // 구분선
    const line1 = this.scene.add.rectangle(0, yPos, width - 40, 2, borderColor, 0.5);
    container.add(line1);
    yPos += 18;
    
    // 스킬 정보
    const infoTitle = this.scene.add.text(-width/2 + 20, yPos, `◆ ${TYPE_MAP[skill.type] || skill.type}`, {
      font: 'bold 22px monospace',
      color: COLORS_STR.primary.main,
    });
    container.add(infoTitle);
    yPos += 34;
    
    // 스킬 스탯
    const skillStats: string[] = [];
    const isAttackSkill = skill.type === 'attack' || skill.type === 'special';
    const isCountDefense = skill.effect?.type === 'countDefense' || skill.effect?.type === 'flowRead';
    
    if (skill.attackMultiplier > 0 && isAttackSkill) {
      skillStats.push(`공격 배율: x${skill.attackMultiplier}`);
    }
    if (skill.attackCount > 1) {
      skillStats.push(`타수 배율: x${skill.attackCount}`);
    }
    if (skill.reach && isAttackSkill) {
      const reachText = skill.reach === 'single' ? '무기 범위' : (REACH_MAP[skill.reach] || skill.reach);
      skillStats.push(`범위: ${reachText}`);
    }
    // 카운트 방어 스킬은 방어율 배수 표시
    if (isCountDefense && skill.effect?.value) {
      skillStats.push(`방어율: x${skill.effect.value}`);
      skillStats.push(`대기 시간: ${skill.effect.duration}턴`);
      if (skill.effect.counterAttack) {
        skillStats.push(`반격 배율: x${skill.effect.counterMultiplier || skill.attackMultiplier}`);
      }
    } else if (skill.defenseBonus > 0) {
      skillStats.push(`방어 보너스: +${skill.defenseBonus}%`);
    }
    if (skill.durabilityCost > 0) {
      skillStats.push(`내구 소모: ${skill.durabilityCost}`);
    }
    
    skillStats.forEach(stat => {
      const text = this.scene.add.text(-width/2 + 30, yPos, stat, {
        font: '20px monospace',
        color: COLORS_STR.text.secondary,
      });
      container.add(text);
      yPos += 28;
    });
    
    // 무기 적용 시 실제 데미지 계산
    if (isAttackSkill && sword) {
      yPos += 12;
      const line2 = this.scene.add.rectangle(0, yPos, width - 40, 2, borderColor, 0.3);
      container.add(line2);
      yPos += 18;
      
      // 버프 정보 가져오기
      const buffInfo = this.getBuffInfo();
      
      const titleText = buffInfo.hasBuffs ? '◆ 실제 데미지 (무기+버프)' : '◆ 실제 데미지 (현재 무기)';
      const calcTitle = this.scene.add.text(-width/2 + 20, yPos, titleText, {
        font: 'bold 22px monospace',
        color: buffInfo.hasBuffs ? BUFF_COLOR : HIGHLIGHT_COLOR,
      });
      container.add(calcTitle);
      yPos += 34;
      
      const baseDamage = Math.floor(sword.attack * skill.attackMultiplier);
      const totalHits = sword.attackCount * skill.attackCount;
      const totalDamage = Math.floor(baseDamage * totalHits);
      
      const calcStats = [
        `기본: ${sword.attack} x ${skill.attackMultiplier} = ${baseDamage}`,
        `타수: ${sword.attackCount} x ${skill.attackCount} = ${totalHits}회`,
        `총 데미지: ${totalDamage}`,
      ];
      
      calcStats.forEach(stat => {
        const text = this.scene.add.text(-width/2 + 30, yPos, stat, {
          font: '20px monospace',
          color: HIGHLIGHT_COLOR,
        });
        container.add(text);
        yPos += 28;
      });
      
      // 버프 적용 데미지 (버프가 있을 때만)
      if (buffInfo.hasBuffs) {
        const buffedBase = Math.floor((sword.attack + buffInfo.attackBonus) * skill.attackMultiplier * buffInfo.focusMultiplier);
        const buffedTotal = Math.floor(buffedBase * totalHits);
        
        let buffDesc = '';
        if (buffInfo.attackBonus > 0) buffDesc += `+${buffInfo.attackBonus}공`;
        if (buffInfo.focusMultiplier > 1.0) buffDesc += ` x${buffInfo.focusMultiplier}집중`;
        
        yPos += 4;
        const buffedText = this.scene.add.text(-width/2 + 30, yPos,
          `✨버프 적용: ${buffedTotal} (${buffDesc.trim()})`, {
          font: 'bold 20px monospace',
          color: BUFF_COLOR,
        });
        container.add(buffedText);
        yPos += 28;
      }
    }
    
    // 신속 표시
    if (isSwift) {
      const swiftText = this.scene.add.text(0, height/2 - 35, '⚡ 신속 (대기 소모 없음)', {
        font: 'bold 20px monospace',
        color: COLORS_STR.card.swift,
      }).setOrigin(0.5);
      container.add(swiftText);
    }
  }
  
  // ========== 유틸리티 ==========
  
  /**
   * **볼드** 및 *이탤릭* 텍스트를 파싱하여 렌더링
   * @returns 다음 yPos
   */
  private addEffectTextWithBold(
    container: Phaser.GameObjects.Container,
    x: number,
    y: number,
    text: string,
    wrapWidth: number
  ): number {
    // **bold** 와 *italic* 패턴을 찾아서 분리
    // **text** 먼저 처리 (더 긴 패턴), 그 다음 *text*
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    
    // 한 줄에 모든 텍스트를 이어서 표시
    let fullText = '';
    const segments: { text: string; isBold: boolean; isItalic: boolean }[] = [];
    
    parts.forEach(part => {
      if (!part) return;
      
      const isBold = part.startsWith('**') && part.endsWith('**');
      const isItalic = !isBold && part.startsWith('*') && part.endsWith('*');
      let displayText = part;
      
      if (isBold) {
        displayText = part.slice(2, -2);
      } else if (isItalic) {
        displayText = part.slice(1, -1);
      }
      
      segments.push({ text: displayText, isBold, isItalic });
      fullText += displayText;
    });
    
    // 이모지 + 전체 텍스트를 한 줄로 표시
    const textObj = this.scene.add.text(x, y, `💫 ${fullText}`, {
      font: '20px monospace',
      color: '#FFD700',
      wordWrap: { width: wrapWidth },
    });
    container.add(textObj);
    
    // 볼드/이탤릭 부분만 별도 렌더링 (오버레이)
    let offsetX = x + 36; // 💫 이모지 너비
    segments.forEach(seg => {
      if (seg.isBold || seg.isItalic) {
        // 해당 텍스트의 앞부분 너비 계산
        const beforeText = this.scene.add.text(0, 0, segments.slice(0, segments.indexOf(seg)).map(s => s.text).join(''), {
          font: '20px monospace',
        });
        const beforeWidth = beforeText.width;
        beforeText.destroy();
        
        const styledText = this.scene.add.text(offsetX + beforeWidth, y, seg.text, {
          font: seg.isBold ? 'bold 20px monospace' : 'italic 20px monospace',
          color: seg.isBold ? '#FF6B6B' : '#9B9B9B',
        });
        container.add(styledText);
      }
    });
    
    return y + textObj.height + 4;
  }
  
  private getBorderColor(card: Card, canAfford: boolean): number {
    if (!canAfford) return COLORS.border.dark;
    
    if (card.type === 'sword') {
      return COLORS.card.sword;
    }
    
    const skill = card.data as SkillCard;
    return skill.isSwift ? COLORS.card.swift : COLORS.card.skill;
  }
}

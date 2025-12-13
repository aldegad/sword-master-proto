import type { GameScene } from '../scenes/GameScene';
import type { Enemy, SkillCard, EnemyAction } from '../types';
import { COLORS } from '../constants/colors';

/**
 * 전투 시스템 - 공격, 방어, 데미지 계산 담당
 */
export class CombatSystem {
  private scene: GameScene;
  
  constructor(scene: GameScene) {
    this.scene = scene;
  }
  
  // ========== 플레이어 공격 ==========
  
  executeAttack(skill: SkillCard, targetEnemy?: Enemy) {
    const sword = this.scene.playerState.currentSword;
    if (!sword) return;
    
    // 타수 계산: 무기 타수 × 스킬 타수배율
    const totalHits = sword.attackCount * skill.attackCount;
    
    // 범위 결정: 스킬이 'single'이면 무기 범위, 'swordDouble'이면 무기 범위 2배, 아니면 스킬 범위
    const reach = this.resolveReach(skill.reach, sword.reach);
    
    // 강타 (카운트 공격) - 바로 공격하지 않고 countEffects에 추가
    // 내구도는 발동 시 소모 (중간에 무기 교체 가능)
    if (skill.effect?.type === 'chargeAttack') {
      const duration = skill.effect.duration || 1;
      
      this.scene.playerState.countEffects.push({
        id: 'chargeAttack_' + Date.now(),
        type: 'chargeAttack',
        name: skill.name,
        emoji: skill.emoji,
        remainingDelays: duration,
        isNew: true,
        data: {
          attackMultiplier: skill.attackMultiplier,
          skillAttackCount: skill.attackCount,  // 스킬 타수배율만 저장 (발동 시 현재 무기로 계산)
          reach: skill.reach,                    // 스킬 범위 (발동 시 현재 무기로 결정)
          targetId: targetEnemy?.id,
        },
      });
      
      this.scene.animationHelper.showMessage(`${skill.emoji} ${skill.name} 준비! (${duration}대기)`, COLORS.message.warning);
      // 내구도는 발동 시 소모
      return;  // 바로 공격하지 않음
    }
    
    // 버프 적용
    let attackBonus = 0;
    let multiplierBonus = 0;
    this.scene.playerState.buffs.forEach(buff => {
      if (buff.type === 'attack') {
        if (buff.id === 'focus') {
          multiplierBonus += buff.value;
        } else {
          attackBonus += buff.value;
        }
      }
    });
    
    const baseDamage = (sword.attack + attackBonus) * (skill.attackMultiplier + multiplierBonus);
    
    // 타겟 선정
    let targets: Enemy[];
    
    if (targetEnemy) {
      if (reach === 'single') {
        targets = [targetEnemy];
      } else {
        targets = this.getTargetsByReachFromEnemy(reach, targetEnemy);
      }
    } else {
      targets = this.getTargetsByReach(reach);
    }
    
    // 연격 시 공격모션 2번 재생 (스킬 타수배율이 2 이상이면)
    if (skill.attackCount >= 2) {
      this.scene.animationHelper.playerAttack();
      this.scene.time.delayedCall(200, () => {
        this.scene.animationHelper.playerAttack();
      });
    } else {
      this.scene.animationHelper.playerAttack();
    }
    
    // 내구도 소모: 타수만큼 (부족하면 가능한 만큼만)
    const actualHits = this.consumeDurabilityAndGetHits(totalHits);
    
    // 내구도 부족으로 공격 불가
    if (actualHits <= 0) {
      this.scene.animationHelper.showMessage('무기가 부서졌다!', COLORS.message.error);
      return;
    }
    
    // 데미지 계산 및 즉시 적용 (적이 죽으면 행동 못하도록)
    targets.forEach(enemy => {
      let damage = baseDamage;
      
      // 관통 효과
      if (skill.effect?.type === 'pierce') {
        damage = baseDamage - (enemy.defense * (1 - skill.effect.value));
      } else {
        damage = Math.max(1, baseDamage - enemy.defense);
      }
      
      // 총 데미지 = 타격당 데미지 × 실제 타수
      const totalDamage = damage * actualHits;
      
      // 흡혈 효과
      if (skill.effect?.type === 'lifesteal') {
        const heal = Math.floor(totalDamage * skill.effect.value);
        this.scene.playerState.hp = Math.min(this.scene.playerState.maxHp, this.scene.playerState.hp + heal);
        this.scene.animationHelper.showDamageNumber(this.scene.PLAYER_X, this.scene.GROUND_Y - 100, heal, COLORS.message.success);
      }
      
      // 데미지 즉시 적용 (적 HP 감소 및 사망 처리)
      this.damageEnemy(enemy, totalDamage);
      
      // 시각적 효과: 타수만큼 데미지 숫자 표시 (비동기) - 천천히 따닥 느낌
      for (let i = 1; i < actualHits; i++) {
        this.scene.time.delayedCall(i * 250, () => {
          if (enemy.hp > 0) {
            const sprite = this.scene.enemySprites.get(enemy.id);
            if (sprite) {
              this.scene.animationHelper.showDamageNumber(sprite.x, sprite.y - 50, Math.floor(damage), COLORS.effect.damage);
            }
          }
        });
      }
      
      // 출혈 효과
      if (skill.effect?.type === 'bleed') {
        enemy.bleed = {
          damage: skill.effect.value,
          duration: skill.effect.duration || 3,
        };
      }
      
      // 스턴 효과
      if (skill.effect?.type === 'stun') {
        enemy.isStunned = skill.effect.duration || 1;
      }
    });
    
    // 집중 버프 소모
    this.scene.playerState.buffs = this.scene.playerState.buffs.filter(b => b.id !== 'focus');
  }
  
  /**
   * 내구도 소모 및 실제 타격 가능 횟수 반환
   * 내구도가 부족하면 가능한 만큼만 타격하고 무기 파괴
   */
  private consumeDurabilityAndGetHits(requestedHits: number): number {
    const sword = this.scene.playerState.currentSword;
    if (!sword) return 0;
    
    // 실제 타격 가능 횟수 = 내구도와 요청 타수 중 작은 값
    const actualHits = Math.min(sword.currentDurability, requestedHits);
    
    if (actualHits <= 0) return 0;
    
    sword.currentDurability -= actualHits;
    this.scene.updatePlayerWeaponDisplay();
    
    if (sword.currentDurability <= 0) {
      this.scene.animationHelper.showMessage(`${sword.name}이(가) 부서졌다!`, COLORS.message.error);
      this.scene.playerState.currentSword = null;
      this.scene.updatePlayerWeaponDisplay();
    }
    
    return actualHits;
  }
  
  executeDefense(skill: SkillCard) {
    const sword = this.scene.playerState.currentSword;
    
    // 패리 효과 (카운트 기반)
    if (skill.effect?.type === 'parry') {
      const defenseMultiplier = skill.effect.value;  // 방어율 배수 (x5)
      const duration = skill.effect.duration || 1;   // 대기 시간
      
      this.scene.playerState.countEffects.push({
        id: 'parry_' + Date.now(),
        type: 'parry',
        name: '패리',
        emoji: '🛡️',
        remainingDelays: duration,
        isNew: true,  // 이번 턴에 추가됨 (첫 감소 시 스킵)
        data: {
          defenseMultiplier: defenseMultiplier,
          attackMultiplier: skill.attackMultiplier,  // 반격 배수
        },
      });
      
      this.scene.animationHelper.showMessage(`🛡️ 패리 준비! (${duration}대기)`, COLORS.message.success);
      return;
    }
    
    // 철벽 효과 (카운트 기반)
    if (skill.effect?.type === 'ironWall') {
      const defenseMultiplier = skill.effect.value;  // 방어율 배수 (x10)
      const duration = skill.effect.duration || 3;   // 대기 시간
      
      this.scene.playerState.countEffects.push({
        id: 'ironWall_' + Date.now(),
        type: 'ironWall',
        name: '철벽',
        emoji: '🏰',
        remainingDelays: duration,
        isNew: true,  // 이번 턴에 추가됨 (첫 감소 시 스킵)
        data: {
          defenseMultiplier: defenseMultiplier,
        },
      });
      
      this.scene.animationHelper.showMessage(`🏰 철벽 준비! (${duration}대기)`, COLORS.message.info);
      return;
    }
    
    // 기타 방어 스킬: 기존 방어율 버프 방식
    if (sword && skill.defenseBonus > 0) {
      const bonusRate = sword.defense * 5;  // 검 방어율 x 5
      this.scene.playerState.buffs.push({
        id: 'defense_' + Date.now(),
        name: `방어율+${bonusRate}%`,
        type: 'defense',
        value: bonusRate,
        duration: 1,
      });
      this.scene.animationHelper.showMessage(`🛡️ 방어율 +${bonusRate}%!`, COLORS.message.success);
    }
  }
  
  executeBuff(skill: SkillCard) {
    if (skill.effect?.type === 'focus') {
      this.scene.playerState.buffs.push({
        id: 'focus',
        name: '집중',
        type: 'attack',
        value: skill.effect.value,
        duration: 1,
      });
    } else if (skill.effect?.type === 'draw') {
      this.scene.cardSystem.drawCards(skill.effect.value);
    } else if (skill.effect?.type === 'sharpen') {
      // 공격력 버프 추가
      this.scene.playerState.buffs.push({
        id: 'sharpen',
        name: '연마',
        type: 'attack',
        value: skill.effect.value,
        duration: skill.effect.duration || 3,
      });
      
      // 덱의 모든 검 내구도 1 회복
      let restoredCount = 0;
      this.scene.playerState.deck.forEach(card => {
        if (card.type === 'sword') {
          const sword = card.data;
          if (sword.currentDurability < sword.durability) {
            sword.currentDurability = Math.min(sword.durability, sword.currentDurability + 1);
            restoredCount++;
          }
        }
      });
      
      if (restoredCount > 0) {
        this.scene.animationHelper.showMessage(`🔧 검 ${restoredCount}자루 내구도 회복!`, COLORS.message.success);
      }
    } else if (skill.effect?.type === 'searchSword') {
      // 덱에서 검 찾기
      const swords = this.scene.playerState.deck.filter(c => c.type === 'sword');
      if (swords.length === 0) {
        this.scene.animationHelper.showMessage('덱에 검이 없다!', COLORS.message.error);
        return;
      }
      // 랜덤하게 최대 3개 선택
      this.scene.cardSystem.shuffleArray(swords);
      const selectableSwords = swords.slice(0, Math.min(skill.effect.value, swords.length));
      this.scene.showSkillCardSelection('searchSword', selectableSwords);
    } else if (skill.effect?.type === 'graveRecall') {
      // 무덤에서 카드 찾기
      const graveCards = [...this.scene.playerState.discard];
      if (graveCards.length === 0) {
        this.scene.animationHelper.showMessage('무덤이 비어있다!', COLORS.message.error);
        return;
      }
      // 랜덤하게 최대 3개 선택
      this.scene.cardSystem.shuffleArray(graveCards);
      const selectableCards = graveCards.slice(0, Math.min(skill.effect.value, graveCards.length));
      this.scene.showSkillCardSelection('graveRecall', selectableCards);
    } else if (skill.effect?.type === 'graveEquip') {
      // 무덤에서 검 찾기
      const graveSwords = this.scene.playerState.discard.filter(c => c.type === 'sword');
      if (graveSwords.length === 0) {
        this.scene.animationHelper.showMessage('무덤에 검이 없다!', COLORS.message.error);
        return;
      }
      // 랜덤하게 최대 3개 선택
      this.scene.cardSystem.shuffleArray(graveSwords);
      const selectableSwords = graveSwords.slice(0, Math.min(3, graveSwords.length));
      this.scene.showSkillCardSelection('graveEquip', selectableSwords);
    } else if (skill.effect?.type === 'drawSwords') {
      // 덱에서 검 꺼내기 (상위 N개)
      const count = skill.effect.value || 2;
      let drawn = 0;
      const tempDeck = [...this.scene.playerState.deck];
      
      for (let i = 0; i < tempDeck.length && drawn < count; i++) {
        if (tempDeck[i].type === 'sword') {
          // 덱에서 제거하고 손패로 추가
          const cardIndex = this.scene.playerState.deck.indexOf(tempDeck[i]);
          if (cardIndex !== -1) {
            const [card] = this.scene.playerState.deck.splice(cardIndex, 1);
            this.scene.playerState.hand.push(card);
            drawn++;
          }
        }
      }
      
      if (drawn > 0) {
        this.scene.animationHelper.showMessage(`🎴 검 ${drawn}자루 획득!`, COLORS.message.success);
      } else {
        this.scene.animationHelper.showMessage('덱에 검이 없다!', COLORS.message.error);
      }
      this.scene.events.emit('handUpdated');
    } else if (skill.effect?.type === 'graveDrawTop') {
      // 무덤 상위 N장을 손패로 가져오기
      const count = skill.effect.value || 2;
      const discard = this.scene.playerState.discard;
      
      if (discard.length === 0) {
        this.scene.animationHelper.showMessage('무덤이 비어있다!', COLORS.message.error);
        return;
      }
      
      const drawn = Math.min(count, discard.length);
      for (let i = 0; i < drawn; i++) {
        const card = discard.pop()!;  // 무덤 상위(마지막)부터 가져옴
        this.scene.playerState.hand.push(card);
      }
      
      this.scene.animationHelper.showMessage(`↩️ 카드 ${drawn}장 되찾음!`, COLORS.message.success);
      this.scene.events.emit('handUpdated');
    }
  }
  
  // ========== 적 공격 ==========
  
  executeEnemyAction(enemy: Enemy, action: EnemyAction) {
    if (enemy.hp <= 0) return;
    
    // 스턴 상태면 행동 불가
    if (enemy.isStunned > 0) {
      this.scene.animationHelper.showMessage(`${enemy.name} 기절!`, COLORS.message.warning);
      return;
    }
    
    const sprite = this.scene.enemySprites.get(enemy.id);
    
    switch (action.type) {
      case 'attack':
      case 'special':
        this.handleEnemyAttack(enemy, action, sprite);
        break;
        
      case 'defend':
        enemy.defense += 5;
        this.scene.animationHelper.showMessage(`${enemy.name} 방어 자세!`, COLORS.message.success);
        break;
        
      case 'buff':
        if (action.effect?.type === 'heal') {
          this.scene.gameState.enemies.forEach(e => {
            e.hp = Math.min(e.maxHp, e.hp + action.effect!.value);
            this.scene.enemyManager.updateEnemySprite(e);
          });
          this.scene.animationHelper.showMessage(`${enemy.name} 회복!`, COLORS.message.success);
        }
        break;
        
      case 'charge':
        this.scene.animationHelper.showMessage(`${enemy.name} 힘을 모으는 중...`, COLORS.message.warning);
        break;
    }
    
    // 적 공격 애니메이션
    if (sprite && (action.type === 'attack' || action.type === 'special')) {
      this.scene.tweens.add({
        targets: sprite,
        x: sprite.x - 30,
        duration: 100,
        yoyo: true,
        ease: 'Power2',
      });
    }
    
    this.scene.events.emit('statsUpdated');
    
    // 게임오버 체크
    if (this.scene.playerState.hp <= 0) {
      this.scene.gameOver();
    }
  }
  
  private handleEnemyAttack(enemy: Enemy, action: EnemyAction, _sprite: Phaser.GameObjects.Container | undefined) {
    const sword = this.scene.playerState.currentSword;
    let baseParryRate = sword ? sword.defense : 0;  // 기본 방어율 (10이면 10%)
    
    // 방어 버프 추가 방어율
    this.scene.playerState.buffs.forEach(buff => {
      if (buff.type === 'defense') {
        baseParryRate += buff.value;
      }
    });
    
    // 카운트 효과 체크 (철벽, 패리)
    let activeCountEffect: typeof this.scene.playerState.countEffects[0] | null = null;
    let countEffectParryRate = baseParryRate;
    
    // 철벽 효과 찾기 (최우선)
    const ironWallEffect = this.scene.playerState.countEffects.find(e => e.type === 'ironWall');
    if (ironWallEffect) {
      activeCountEffect = ironWallEffect;
      countEffectParryRate = sword ? sword.defense * (ironWallEffect.data.defenseMultiplier || 10) : 0;
    }
    
    // 패리 효과 찾기 (철벽이 없을 때)
    const parryEffect = this.scene.playerState.countEffects.find(e => e.type === 'parry');
    if (!activeCountEffect && parryEffect) {
      activeCountEffect = parryEffect;
      countEffectParryRate = sword ? sword.defense * (parryEffect.data.defenseMultiplier || 5) : 0;
    }
    
    // 최종 방어율 계산 (카운트 효과가 있으면 해당 효과의 방어율 사용)
    const finalParryRate = activeCountEffect ? countEffectParryRate : baseParryRate;
    const parryRoll = Math.random() * 100;
    const parrySuccess = parryRoll < finalParryRate && sword && sword.currentDurability > 0;
    
    if (parrySuccess) {
      // 방어 성공!
      this.scene.animationHelper.showParryEffect();
      sword!.currentDurability -= 1;
      this.scene.updatePlayerWeaponDisplay();
      
      if (sword!.currentDurability <= 0) {
        this.scene.animationHelper.showMessage(`${sword!.name}이(가) 부서졌다!`, COLORS.message.error);
        this.scene.playerState.currentSword = null;
        this.scene.updatePlayerWeaponDisplay();
      }
      
      // 패리/검얽기 효과별 메시지
      if (activeCountEffect?.type === 'parry') {
        this.scene.animationHelper.showMessage(`⚔️ 검얽기 성공! ${action.name} 흘려냄!`, COLORS.message.success);
        // 검얽기 성공 시 공격모션 재생
        this.scene.playAttakAnimation();
      } else if (activeCountEffect?.type === 'ironWall') {
        this.scene.animationHelper.showMessage(`🏰 철벽! ${action.name} 방어!`, COLORS.message.success);
      } else {
        this.scene.animationHelper.showMessage(`🛡️ 방어 성공! ${action.name} 흘려냄!`, COLORS.message.success);
      }
      
      // 패리 반격 체크 (검얽기 성공 시에만)
      if (activeCountEffect?.type === 'parry' && this.scene.playerState.currentSword) {
        const swordAttack = this.scene.playerState.currentSword.attack;
        const parryMultiplier = activeCountEffect.data.attackMultiplier || 1.0;
        const counterDamage = (swordAttack * parryMultiplier) + (action.damage * 0.5);
        
        this.damageEnemy(enemy, counterDamage);
        this.scene.animationHelper.showMessage(`⚔️ 반격! ${Math.floor(counterDamage)} 데미지!`, COLORS.message.warning);
      }
    } else {
      // 방어 실패 - 풀 데미지
      const damage = action.damage;
      this.scene.playerState.hp -= damage;
      
      this.scene.animationHelper.showDamageNumber(this.scene.PLAYER_X, this.scene.GROUND_Y - 100, damage, COLORS.effect.damageHard);
      this.scene.animationHelper.playerHit();
      this.scene.animationHelper.showMessage(`${enemy.name}의 ${action.name}! -${damage}`, COLORS.message.error);
      
      if (action.effect?.type === 'bleed') {
        this.scene.playerState.hp -= action.effect.value;
      }
    }
    
    // 카운트 효과 소멸 처리
    if (activeCountEffect) {
      if (activeCountEffect.type === 'ironWall') {
        // 철벽: 방어 성공/실패 관계없이 1회 후 소멸
        this.scene.playerState.countEffects = this.scene.playerState.countEffects.filter(
          e => e.id !== activeCountEffect!.id
        );
        this.scene.animationHelper.showMessage('🏰 철벽 효과 소멸!', COLORS.message.muted);
      } else if (activeCountEffect.type === 'parry') {
        // 패리: 발동 후 소멸 (방어 성공 시에만 발동했으므로)
        if (parrySuccess) {
          this.scene.playerState.countEffects = this.scene.playerState.countEffects.filter(
            e => e.id !== activeCountEffect!.id
          );
        }
      }
    }
    
    this.scene.events.emit('statsUpdated');
  }
  
  // ========== 데미지 처리 ==========
  
  damageEnemy(enemy: Enemy, damage: number) {
    const actualDamage = Math.floor(damage);
    enemy.hp -= actualDamage;
    
    const sprite = this.scene.enemySprites.get(enemy.id);
    if (sprite) {
      this.scene.animationHelper.showDamageNumber(sprite.x, sprite.y - 50, actualDamage, COLORS.effect.damage);
      
      // 적이 죽을 경우 더 강렬한 깜빡임 후 사망
      if (enemy.hp <= 0) {
        this.scene.tweens.add({
          targets: sprite,
          alpha: 0.3,
          duration: 80,
          yoyo: true,
          repeat: 4,  // 더 많이 깜빡임
          onComplete: () => {
            this.killEnemy(enemy);
          },
        });
      } else {
        // 생존 시 일반 깜빡임
        this.scene.tweens.add({
          targets: sprite,
          alpha: 0.5,
          duration: 50,
          yoyo: true,
          repeat: 2,
        });
      }
    } else if (enemy.hp <= 0) {
      // 스프라이트 없어도 사망 처리
      this.killEnemy(enemy);
    }
    
    this.scene.enemyManager.updateEnemySprite(enemy);
  }
  
  killEnemy(enemy: Enemy) {
    this.scene.gameState.score += enemy.maxHp * 10;
    this.scene.gameState.enemiesDefeated++;
    
    // 경험치 획득
    const expGain = Math.floor(enemy.maxHp / 2);
    this.gainExp(expGain);
    
    const idx = this.scene.gameState.enemies.indexOf(enemy);
    if (idx > -1) {
      this.scene.gameState.enemies.splice(idx, 1);
    }
    
    this.scene.enemyManager.removeEnemySprite(enemy.id);
    
    // 카드 드롭
    if (Math.random() < 0.3) {
      this.scene.cardSystem.dropCard();
    }
    
    this.scene.events.emit('statsUpdated');
    
    // 적이 없으면 자동 전투 종료
    this.scene.checkCombatEnd();
  }
  
  gainExp(amount: number) {
    this.scene.playerState.exp += amount;
    const expNeeded = this.scene.playerState.level * 50;
    
    if (this.scene.playerState.exp >= expNeeded) {
      this.scene.playerState.exp -= expNeeded;
      this.scene.playerState.level++;
      this.onLevelUp();
    }
  }
  
  private onLevelUp() {
    this.scene.animationHelper.showMessage(`⬆️ 레벨 ${this.scene.playerState.level}!`, COLORS.message.levelUp);
    
    const lightBlade = this.scene.playerState.passives.find(p => p.id === 'lightBlade');
    if (lightBlade && lightBlade.level < lightBlade.maxLevel) {
      lightBlade.level++;
      this.scene.animationHelper.showMessage(`✨ 잔광의 검사 Lv.${lightBlade.level}!`, COLORS.message.warning);
    }
    
    this.scene.playerState.maxHp += 10;
    this.scene.playerState.hp = Math.min(this.scene.playerState.hp + 20, this.scene.playerState.maxHp);
  }
  
  // ========== 유틸리티 ==========
  
  combineReach(swordReach: string, skillReach: string): string {
    const reachOrder = ['single', 'double', 'triple', 'all'];
    const swordIdx = reachOrder.indexOf(swordReach);
    const skillIdx = reachOrder.indexOf(skillReach);
    return reachOrder[Math.max(swordIdx, skillIdx)];
  }
  
  /**
   * 범위 결정: 스킬 범위와 무기 범위를 기반으로 최종 범위 계산
   */
  resolveReach(skillReach: string, swordReach: string): string {
    if (skillReach === 'single') {
      return swordReach;  // 무기 범위 사용
    }
    if (skillReach === 'swordDouble') {
      // 무기 범위의 2배 타겟 수
      const reachToCount: Record<string, number> = { single: 1, double: 2, triple: 3, all: 999 };
      const countToReach: [number, string][] = [[999, 'all'], [6, 'all'], [4, 'all'], [3, 'triple'], [2, 'double'], [1, 'single']];
      const doubled = (reachToCount[swordReach] || 1) * 2;
      for (const [count, reach] of countToReach) {
        if (doubled >= count) return reach;
      }
      return 'single';
    }
    return skillReach;  // 스킬 자체 범위 사용
  }
  
  getTargetsByReach(reach: string): Enemy[] {
    const enemies = this.scene.gameState.enemies;
    if (enemies.length === 0) return [];
    
    // 숫자로 된 타겟 수도 처리 (swordDouble 결과로 4, 6 등이 올 수 있음)
    const targetCount = this.getTargetCountByReach(reach);
    
    if (targetCount >= enemies.length || reach === 'all') {
      return [...enemies];
    }
    return enemies.slice(0, targetCount);
  }
  
  /**
   * 범위 타입을 타겟 수로 변환
   */
  getTargetCountByReach(reach: string): number {
    switch (reach) {
      case 'single': return 1;
      case 'double': return 2;
      case 'triple': return 3;
      case 'all': return 999;
      default: return 1;
    }
  }
  
  getTargetsByReachFromEnemy(reach: string, baseEnemy: Enemy): Enemy[] {
    const enemies = this.scene.gameState.enemies;
    const baseIndex = enemies.indexOf(baseEnemy);
    if (baseIndex === -1) return [baseEnemy];
    
    const targetCount = this.getTargetCountByReach(reach);
    
    if (targetCount >= enemies.length || reach === 'all') {
      return [...enemies];
    }
    
    // 기준 적부터 targetCount만큼
    return enemies.slice(baseIndex, Math.min(enemies.length, baseIndex + targetCount));
  }
  
  reduceAllEnemyDelays(amount: number) {
    this.scene.gameState.enemies.forEach(enemy => {
      if (enemy.actionQueue.length > 0) {
        enemy.actionQueue[0].currentDelay -= amount;
      }
    });
    this.scene.enemyManager.checkEnemyActions();
  }
  
  /**
   * 카운트 효과 감소 - 카드 사용 또는 대기 시 호출
   * isNew 효과는 첫 번째 감소 시 isNew = false로만 변경하고 감소하지 않음
   */
  async reduceCountEffects() {
    const expiredEffects: typeof this.scene.playerState.countEffects = [];
    
    this.scene.playerState.countEffects.forEach(effect => {
      // 이번 턴에 추가된 효과는 첫 감소 시 스킵 (isNew → false)
      if (effect.isNew) {
        effect.isNew = false;
        return;  // 감소하지 않음
      }
      
      effect.remainingDelays -= 1;
      
      if (effect.remainingDelays <= 0) {
        expiredEffects.push(effect);
      }
    });
    
    // 만료된 효과 처리 (순차적으로 await)
    for (const effect of expiredEffects) {
      // 강타 (chargeAttack) - 카운트 만료 시 공격 발동!
      if (effect.type === 'chargeAttack') {
        await this.executeChargeAttack(effect);
      } else {
        // 방어 효과 만료 메시지
        this.scene.animationHelper.showMessage('⏳ 효과 만료!', COLORS.message.muted);
      }
    }
    
    // 만료된 효과 제거
    if (expiredEffects.length > 0) {
      const expiredIds = expiredEffects.map(e => e.id);
      this.scene.playerState.countEffects = this.scene.playerState.countEffects.filter(
        effect => !expiredIds.includes(effect.id)
      );
    }
    
    this.scene.events.emit('statsUpdated');
  }
  
  /**
   * 강타 발동 - 카운트 만료 시 실제 공격 실행
   * (내구도는 이미 스킬 사용 시 소모됨)
   */
  private async executeChargeAttack(effect: typeof this.scene.playerState.countEffects[0]) {
    const sword = this.scene.playerState.currentSword;
    if (!sword) {
      this.scene.animationHelper.showMessage('무기 없음! 강타 실패', COLORS.message.error);
      return;
    }
    
    const attackMultiplier = effect.data.attackMultiplier || 1.0;
    const skillAttackCount = effect.data.skillAttackCount || 1;  // 스킬 타수배율
    const skillReach = effect.data.reach || 'single';            // 스킬 범위
    
    // 현재 무기로 타수/범위 계산
    const totalHits = sword.attackCount * skillAttackCount;
    const reach = this.resolveReach(skillReach, sword.reach);
    
    // 타겟 선정 (내구도 소모 전에 타겟 확인)
    let targets: Enemy[];
    const targetEnemy = effect.data.targetId 
      ? this.scene.gameState.enemies.find(e => e.id === effect.data.targetId)
      : undefined;
    
    if (targetEnemy && this.scene.gameState.enemies.includes(targetEnemy)) {
      if (reach === 'single') {
        targets = [targetEnemy];
      } else {
        targets = this.getTargetsByReachFromEnemy(reach, targetEnemy);
      }
    } else {
      targets = this.getTargetsByReach(reach);
    }
    
    if (targets.length === 0) {
      this.scene.animationHelper.showMessage('타겟 없음!', COLORS.message.muted);
      return;
    }
    
    // 1단계: 화면 중앙에 스킬 설명 툴팁 표시
    const description = `${Math.floor(attackMultiplier * 100)}% 데미지 | ${totalHits}타`;
    await this.scene.animationHelper.showChargeSkillEffect(
      effect.emoji,
      effect.name,
      description
    );
    
    // 2단계: 카운트에서 적에게 날아가는 애니메이션
    const targetSprite = this.scene.enemySprites.get(targets[0].id);
    const targetX = targetSprite ? targetSprite.x : this.scene.cameras.main.width - 180;
    const targetY = targetSprite ? targetSprite.y : this.scene.GROUND_Y - 30;
    
    await this.scene.animationHelper.cardFromCountToEnemy(
      targetX,
      targetY,
      effect.emoji,
      effect.name
    );
    
    // 3단계: 내구도 소모 및 실제 타격 횟수 계산
    const actualHits = this.consumeDurabilityAndGetHits(totalHits);
    
    if (actualHits <= 0) {
      this.scene.animationHelper.showMessage('무기가 부서졌다! 강타 실패', COLORS.message.error);
      return;
    }
    
    // 버프 적용
    let attackBonus = 0;
    let multiplierBonus = 0;
    this.scene.playerState.buffs.forEach(buff => {
      if (buff.type === 'attack') {
        if (buff.id === 'focus') {
          multiplierBonus += buff.value;
        } else {
          attackBonus += buff.value;
        }
      }
    });
    
    const baseDamage = (sword.attack + attackBonus) * (attackMultiplier + multiplierBonus);
    
    this.scene.animationHelper.playerAttack();
    
    // 데미지 계산 및 즉시 적용
    targets.forEach(enemy => {
      const damage = Math.max(1, baseDamage - enemy.defense);
      const totalDamage = damage * actualHits;
      
      // 데미지 즉시 적용
      this.damageEnemy(enemy, totalDamage);
      
      // 시각적 효과: 타수만큼 데미지 숫자 표시 (비동기) - 천천히 따닥 느낌
      for (let i = 1; i < actualHits; i++) {
        this.scene.time.delayedCall(i * 250, () => {
          if (enemy.hp > 0) {
            const sprite = this.scene.enemySprites.get(enemy.id);
            if (sprite) {
              this.scene.animationHelper.showDamageNumber(sprite.x, sprite.y - 50, Math.floor(damage), COLORS.effect.damage);
            }
          }
        });
      }
    });
  }
  
  applyBleedDamage() {
    this.scene.gameState.enemies.forEach(enemy => {
      if (enemy.bleed && enemy.bleed.duration > 0) {
        this.damageEnemy(enemy, enemy.bleed.damage);
        enemy.bleed.duration--;
        if (enemy.bleed.duration <= 0) {
          delete enemy.bleed;
        }
      }
    });
  }
  
  reduceBuff() {
    this.scene.playerState.buffs = this.scene.playerState.buffs.filter(buff => {
      buff.duration--;
      return buff.duration > 0;
    });
  }
}


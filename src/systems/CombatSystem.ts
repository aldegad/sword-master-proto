import type { GameScene } from '../scenes/GameScene';
import type { Enemy, SkillCard, EnemyAction } from '../types';

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
    
    // 강타 (카운트 공격) - 바로 공격하지 않고 countEffects에 추가
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
          attackCount: skill.attackCount,
          reach: skill.reach,
          targetId: targetEnemy?.id,
        },
      });
      
      this.scene.animationHelper.showMessage(`${skill.emoji} ${skill.name} 준비! (${duration}대기)`, 0xffcc00);
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
    const totalHits = sword.attackCount + skill.attackCount;
    
    // 타겟 선정
    let targets: Enemy[];
    const reach = this.combineReach(sword.reach, skill.reach);
    
    if (targetEnemy) {
      if (reach === 'single') {
        targets = [targetEnemy];
      } else {
        targets = this.getTargetsByReachFromEnemy(reach, targetEnemy);
      }
    } else {
      targets = this.getTargetsByReach(reach);
    }
    
    this.scene.animationHelper.playerAttack();
    
    // 데미지 적용
    targets.forEach(enemy => {
      for (let i = 0; i < totalHits; i++) {
        this.scene.time.delayedCall(i * 100, () => {
          let damage = baseDamage;
          
          // 관통 효과
          if (skill.effect?.type === 'pierce') {
            damage = baseDamage - (enemy.defense * (1 - skill.effect.value));
          } else {
            damage = Math.max(1, baseDamage - enemy.defense);
          }
          
          // 흡혈 효과
          if (skill.effect?.type === 'lifesteal') {
            const heal = Math.floor(damage * skill.effect.value);
            this.scene.playerState.hp = Math.min(this.scene.playerState.maxHp, this.scene.playerState.hp + heal);
            this.scene.animationHelper.showDamageNumber(this.scene.PLAYER_X, this.scene.GROUND_Y - 100, heal, 0x4ecca3);
          }
          
          this.damageEnemy(enemy, damage);
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
  
  executeDefense(skill: SkillCard) {
    const sword = this.scene.playerState.currentSword;
    
    // 반격 효과 (counter 스킬)
    if (skill.effect?.type === 'counter') {
      this.scene.playerState.counterReady = true;
      this.scene.playerState.counterMultiplier = skill.effect.value;
      
      // 기존 방어율 버프도 추가
      if (sword && skill.defenseBonus > 0) {
        const bonusRate = sword.defense * 5;
        this.scene.playerState.buffs.push({
          id: 'defense_' + Date.now(),
          name: `방어율+${bonusRate}%`,
          type: 'defense',
          value: bonusRate,
          duration: 1,
        });
        this.scene.animationHelper.showMessage(`🛡️ 반격 준비! 방어율 +${bonusRate}%!`, 0x4ecca3);
      }
      return;
    }
    
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
      
      this.scene.animationHelper.showMessage(`🛡️ 패리 준비! (${duration}대기)`, 0x4ecca3);
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
      
      this.scene.animationHelper.showMessage(`🏰 철벽 준비! (${duration}대기)`, 0x4dabf7);
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
      this.scene.animationHelper.showMessage(`🛡️ 방어율 +${bonusRate}%!`, 0x4ecca3);
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
      this.scene.playerState.buffs.push({
        id: 'sharpen',
        name: '연마',
        type: 'attack',
        value: skill.effect.value,
        duration: skill.effect.duration || 3,
      });
    } else if (skill.effect?.type === 'searchSword') {
      // 덱에서 검 찾기
      const swords = this.scene.playerState.deck.filter(c => c.type === 'sword');
      if (swords.length === 0) {
        this.scene.animationHelper.showMessage('덱에 검이 없다!', 0xe94560);
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
        this.scene.animationHelper.showMessage('무덤이 비어있다!', 0xe94560);
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
        this.scene.animationHelper.showMessage('무덤에 검이 없다!', 0xe94560);
        return;
      }
      // 랜덤하게 최대 3개 선택
      this.scene.cardSystem.shuffleArray(graveSwords);
      const selectableSwords = graveSwords.slice(0, Math.min(3, graveSwords.length));
      this.scene.showSkillCardSelection('graveEquip', selectableSwords);
    }
  }
  
  // ========== 적 공격 ==========
  
  executeEnemyAction(enemy: Enemy, action: EnemyAction) {
    if (enemy.hp <= 0) return;
    
    // 스턴 상태면 행동 불가
    if (enemy.isStunned > 0) {
      this.scene.animationHelper.showMessage(`${enemy.name} 기절!`, 0xffcc00);
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
        this.scene.animationHelper.showMessage(`${enemy.name} 방어 자세!`, 0x4ecca3);
        break;
        
      case 'buff':
        if (action.effect?.type === 'heal') {
          this.scene.gameState.enemies.forEach(e => {
            e.hp = Math.min(e.maxHp, e.hp + action.effect!.value);
            this.scene.enemyManager.updateEnemySprite(e);
          });
          this.scene.animationHelper.showMessage(`${enemy.name} 회복!`, 0x4ecca3);
        }
        break;
        
      case 'charge':
        this.scene.animationHelper.showMessage(`${enemy.name} 힘을 모으는 중...`, 0xffcc00);
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
    
    // 철벽 효과 찾기 (우선)
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
        this.scene.animationHelper.showMessage(`${sword!.name}이(가) 부서졌다!`, 0xe94560);
        this.scene.playerState.currentSword = null;
        this.scene.updatePlayerWeaponDisplay();
      }
      
      this.scene.animationHelper.showMessage(`🛡️ 방어 성공! ${action.name} 흘려냄!`, 0x4ecca3);
      
      // 패리 반격 체크 (방어 성공 시에만)
      if (activeCountEffect?.type === 'parry' && this.scene.playerState.currentSword) {
        const swordAttack = this.scene.playerState.currentSword.attack;
        const parryMultiplier = activeCountEffect.data.attackMultiplier || 1.0;
        const counterDamage = (swordAttack * parryMultiplier) + (action.damage * 0.5);
        
        this.damageEnemy(enemy, counterDamage);
        this.scene.animationHelper.showMessage(`⚔️ 패리 반격! ${Math.floor(counterDamage)} 데미지!`, 0xffcc00);
      }
      
      // 기존 반격 스킬 체크
      if (this.scene.playerState.counterReady && this.scene.playerState.currentSword) {
        const counterDamage = this.scene.playerState.currentSword.attack * this.scene.playerState.counterMultiplier;
        this.damageEnemy(enemy, counterDamage);
        this.scene.animationHelper.showMessage('반격!', 0xffcc00);
      }
    } else {
      // 방어 실패 - 풀 데미지
      const damage = action.damage;
      this.scene.playerState.hp -= damage;
      
      this.scene.animationHelper.showDamageNumber(this.scene.PLAYER_X, this.scene.GROUND_Y - 100, damage, 0xff0000);
      this.scene.animationHelper.playerHit();
      this.scene.animationHelper.showMessage(`${enemy.name}의 ${action.name}! -${damage}`, 0xe94560);
      
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
        this.scene.animationHelper.showMessage('🏰 철벽 효과 소멸!', 0x888888);
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
      this.scene.animationHelper.showDamageNumber(sprite.x, sprite.y - 50, actualDamage, 0xff6b6b);
      
      this.scene.tweens.add({
        targets: sprite,
        alpha: 0.5,
        duration: 50,
        yoyo: true,
        repeat: 2,
      });
    }
    
    this.scene.enemyManager.updateEnemySprite(enemy);
    
    if (enemy.hp <= 0) {
      this.killEnemy(enemy);
    }
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
    this.scene.animationHelper.showMessage(`⬆️ 레벨 ${this.scene.playerState.level}!`, 0xffff00);
    
    const lightBlade = this.scene.playerState.passives.find(p => p.id === 'lightBlade');
    if (lightBlade && lightBlade.level < lightBlade.maxLevel) {
      lightBlade.level++;
      this.scene.animationHelper.showMessage(`✨ 잔광의 검사 Lv.${lightBlade.level}!`, 0xffcc00);
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
  
  getTargetsByReach(reach: string): Enemy[] {
    const enemies = this.scene.gameState.enemies;
    if (enemies.length === 0) return [];
    
    switch (reach) {
      case 'single':
        return [enemies[0]];
      case 'double':
        return enemies.slice(0, 2);
      case 'triple':
        return enemies.slice(0, 3);
      case 'all':
        return [...enemies];
      default:
        return [enemies[0]];
    }
  }
  
  getTargetsByReachFromEnemy(reach: string, baseEnemy: Enemy): Enemy[] {
    const enemies = this.scene.gameState.enemies;
    const baseIndex = enemies.indexOf(baseEnemy);
    if (baseIndex === -1) return [baseEnemy];
    
    switch (reach) {
      case 'single':
        return [baseEnemy];
      case 'double':
        return enemies.slice(Math.max(0, baseIndex), Math.min(enemies.length, baseIndex + 2));
      case 'triple':
        return enemies.slice(Math.max(0, baseIndex - 1), Math.min(enemies.length, baseIndex + 2));
      case 'all':
        return [...enemies];
      default:
        return [baseEnemy];
    }
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
  reduceCountEffects() {
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
    
    // 만료된 효과 처리
    expiredEffects.forEach(effect => {
      // 강타 (chargeAttack) - 카운트 만료 시 공격 발동!
      if (effect.type === 'chargeAttack') {
        this.executeChargeAttack(effect);
      } else {
        // 방어 효과 만료 메시지
        this.scene.animationHelper.showMessage('⏳ 효과 만료!', 0x888888);
      }
    });
    
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
   */
  private executeChargeAttack(effect: typeof this.scene.playerState.countEffects[0]) {
    const sword = this.scene.playerState.currentSword;
    if (!sword) {
      this.scene.animationHelper.showMessage('무기 없음! 강타 실패', 0xe94560);
      return;
    }
    
    const attackMultiplier = effect.data.attackMultiplier || 1.0;
    const attackCount = effect.data.attackCount || 0;
    const reach = effect.data.reach || 'single';
    
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
    const totalHits = sword.attackCount + attackCount;
    
    // 타겟 선정
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
      this.scene.animationHelper.showMessage('타겟 없음!', 0x888888);
      return;
    }
    
    this.scene.animationHelper.showMessage(`${effect.emoji} ${effect.name} 발동!`, 0xffcc00);
    this.scene.animationHelper.playerAttack();
    
    // 데미지 적용
    targets.forEach(enemy => {
      for (let i = 0; i < totalHits; i++) {
        this.scene.time.delayedCall(i * 100, () => {
          const damage = Math.max(1, baseDamage - enemy.defense);
          this.damageEnemy(enemy, damage);
        });
      }
    });
    
    // 내구도 소모
    sword.currentDurability -= 1;
    this.scene.updatePlayerWeaponDisplay();
    
    if (sword.currentDurability <= 0) {
      this.scene.animationHelper.showMessage(`${sword.name}이(가) 부서졌다!`, 0xe94560);
      this.scene.playerState.currentSword = null;
      this.scene.updatePlayerWeaponDisplay();
    }
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


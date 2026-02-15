import type { GameScene } from '../scenes/GameScene';
import type { Enemy, SkillCard, EnemyAction, SwordCard } from '../types';
import { COLORS } from '../constants/colors';
import { hasPassive, getPassiveLevel } from '../data/passives';
import { createEnemy, ENEMIES_TIER1 } from '../data/enemies';
import {
  combineReachByPriority,
  getTargetCountByReach as getTargetCountByReachUtil,
  resolveReachWithSword,
} from '../utils/reach';

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
    let focusMultiplier = 1.0;
    this.scene.playerState.buffs.forEach(buff => {
      if (buff.type === 'attack') {
        if (buff.id === 'focus') {
          focusMultiplier += buff.value;  // 집중: 최종 데미지에 배율 적용 (0.5면 1.5배)
        } else {
          attackBonus += buff.value;
        }
      }
    });
    
    // 크리티컬 체크
    let isCritical = false;
    let criticalMultiplier = 1.0;
    
    if (skill.criticalCondition === 'dagger' && sword.category === 'dagger') {
      isCritical = true;
      criticalMultiplier = skill.criticalMultiplier || 2.0;  // 기본 200%
    }
    
    // 기본 데미지 = (무기공격력 + 버프) * 스킬배율 * 집중배율 * 크리티컬배율
    const baseDamage = (sword.attack + attackBonus) * skill.attackMultiplier * focusMultiplier * criticalMultiplier;
    
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
    
    // 내구도 소모: 타수만큼 (부족하면 가능한 만큼만)
    const actualHits = this.consumeDurabilityAndGetHits(totalHits);
    
    // 내구도 부족으로 공격 불가
    if (actualHits <= 0) {
      this.scene.animationHelper.showMessage('무기가 부서졌다!', COLORS.message.error);
      return;
    }
    
    // 무기 장착 효과: 대기턴 증가 (delayIncreaseOnHit) - 즉시 처리 (대기턴 감소 전에 적용)
    if (sword.delayIncreaseOnHit && sword.delayIncreaseOnHit > 0) {
      targets.forEach(enemy => {
        if (enemy.hp > 0) {
          this.increaseEnemyDelay(enemy, sword.delayIncreaseOnHit!);
        }
      });
    }
    
    // 각 타격을 300ms 간격으로 순차 처리
    const hitInterval = 300;
    
    for (let hitIndex = 0; hitIndex < actualHits; hitIndex++) {
      this.scene.time.delayedCall(hitIndex * hitInterval, () => {
        // 공격 애니메이션 재생
        this.scene.animationHelper.playerAttack();
        
        // 각 타겟에 데미지 적용
        targets.forEach(enemy => {
          // 적이 이미 죽었으면 스킵
          if (enemy.hp <= 0) return;
          
          // armorBreaker 효과: 방어 완전 무시 + 적 방어력 영구 감소
          const isArmorBreaker = skill.effect?.type === 'armorBreaker';
          // isPiercing: 스킬 자체가 방어 무시
          const isPiercing = skill.isPiercing === true;
          
          let damage: number;
          if (isArmorBreaker || isPiercing) {
            // 방어 완전 무시
            damage = baseDamage;
          } else {
            // 방어관통 계산: 무기 관통력 + 스킬 관통력을 적 방어력에서 빼기
            const weaponPierce = sword.pierce || 0;
            const skillPierce = skill.effect?.type === 'pierce' ? skill.effect.value : 0;
            const totalPierce = weaponPierce + skillPierce;
            const effectiveDefense = Math.max(0, enemy.defense - totalPierce);
            damage = Math.max(1, baseDamage - effectiveDefense);
          }
          
          // 흡혈 효과 (타격당 적용)
          if (skill.effect?.type === 'lifesteal') {
            const heal = Math.floor(damage * skill.effect.value);
            this.scene.playerState.hp = Math.min(this.scene.playerState.maxHp, this.scene.playerState.hp + heal);
            this.scene.animationHelper.showDamageNumber(this.scene.PLAYER_X, this.scene.GROUND_Y - 100, heal, COLORS.message.success);
          }
          
          // 데미지 적용 (적 HP 감소 및 사망 처리)
          this.damageEnemy(enemy, damage, isCritical);
          
          // 크리티컬 메시지 (첫 타격에만)
          if (hitIndex === 0 && isCritical) {
            this.scene.animationHelper.showMessage(`⭐ 크리티컬! x${criticalMultiplier}`, COLORS.rarity.unique);
          }
          
          // armorBreaker 효과: 적 방어력 영구 감소 (첫 타격에만, 0 이하로 내려가지 않음)
          if (hitIndex === 0 && isArmorBreaker && skill.effect) {
            const armorReduction = skill.effect.value;
            const oldDefense = enemy.defense;
            enemy.defense = Math.max(0, enemy.defense - armorReduction);
            if (oldDefense > 0) {
              this.scene.animationHelper.showMessage(`🔨 ${enemy.name} 방어력 -${Math.min(armorReduction, oldDefense)}!`, COLORS.message.warning);
            }
          }
          
// 출혈 효과 (첫 타격에만) - 중첩 가능
          if (hitIndex === 0 && skill.effect?.type === 'bleed') {
            enemy.bleeds.push({
              damage: skill.effect.value,
              duration: skill.effect.duration || 3,
            });
            this.scene.animationHelper.showMessage(`🩸 출혈! ${skill.effect.value}뎀/${skill.effect.duration || 3}턴`, COLORS.effect.damage);
            // 디버프 UI 업데이트
            this.scene.enemyManager.updateEnemySprite(enemy);
          }

          // 무기 장착 효과: 출혈 (bleedOnHit) - 중첩 가능
          if (hitIndex === 0 && sword.bleedOnHit) {
            enemy.bleeds.push({
              damage: sword.bleedOnHit.damage,
              duration: sword.bleedOnHit.duration,
            });
            this.scene.animationHelper.showMessage(`🩸 출혈! ${sword.bleedOnHit.damage}뎀/${sword.bleedOnHit.duration}턴`, COLORS.effect.damage);
            // 디버프 UI 업데이트
            this.scene.enemyManager.updateEnemySprite(enemy);
          }
          
          // 무기 장착 효과: 독 (poisonOnHit) - 중첩 가능
          if (hitIndex === 0 && sword.poisonOnHit) {
            enemy.poisons.push({
              damage: sword.poisonOnHit.damage,
              duration: sword.poisonOnHit.duration,
            });
            this.scene.animationHelper.showMessage(`☠️ 독! ${sword.poisonOnHit.damage}뎀/${sword.poisonOnHit.duration}턴`, COLORS.effect.damage);
            // 디버프 UI 업데이트
            this.scene.enemyManager.updateEnemySprite(enemy);
          }
          
          // 무기 장착 효과: 방어구 파괴 (armorBreakOnHit)
          if (sword.armorBreakOnHit && sword.armorBreakOnHit > 0) {
            const oldDefense = enemy.defense;
            const reduceAmount = Math.min(sword.armorBreakOnHit, oldDefense);
            enemy.defense = Math.max(0, enemy.defense - sword.armorBreakOnHit);
            if (reduceAmount > 0) {
              this.scene.animationHelper.showMessage(`🔨 방어력 -${reduceAmount}!`, COLORS.message.warning);
              this.scene.enemyManager.updateEnemySprite(enemy);
            }
          }
          
          // 스턴 효과 (첫 타격에만)
          if (hitIndex === 0 && skill.effect?.type === 'stun') {
            enemy.isStunned = skill.effect.duration || 1;
          }
        });
      });
    }
    
    // 집중 버프 소모
    this.scene.playerState.buffs = this.scene.playerState.buffs.filter(b => b.id !== 'focus');
    
    // 드로우 효과 (공격 후 카드 드로우)
    if (skill.effect?.type === 'draw') {
      const drawCount = skill.effect.value || 1;
      this.scene.time.delayedCall(actualHits * hitInterval + 100, () => {
        this.scene.cardSystem.drawCards(drawCount);
        this.scene.animationHelper.showMessage(`🎴 ${drawCount}장 드로우!`, COLORS.message.info);
      });
    }
  }
  
  /**
   * 내구도 소모 및 실제 타격 가능 횟수 반환
   * 내구도가 부족하면 가능한 만큼만 타격하고 무기 파괴
   * '완벽 시전' 패시브가 있으면 내구도와 상관없이 모든 타수 시전 후 무기 파괴
   */
  private consumeDurabilityAndGetHits(requestedHits: number): number {
    const sword = this.scene.playerState.currentSword;
    if (!sword) return 0;
    
    // '완벽 시전' 패시브 체크
    const hasPerfectCast = hasPassive(this.scene.playerState.passives, 'perfectCast');
    
    let actualHits: number;
    let durabilityToConsume: number;
    
    if (hasPerfectCast) {
      // 완벽 시전: 내구도가 1 이상이면 모든 타수 시전
      if (sword.currentDurability <= 0) return 0;
      actualHits = requestedHits;
      durabilityToConsume = sword.currentDurability;  // 모든 내구도 소모
      this.scene.animationHelper.showMessage('✨ 완벽 시전!', COLORS.rarity.unique);
    } else {
      // 일반: 실제 타격 가능 횟수 = 내구도와 요청 타수 중 작은 값
      actualHits = Math.min(sword.currentDurability, requestedHits);
      durabilityToConsume = actualHits;
    }
    
    if (actualHits <= 0) return 0;
    
    sword.currentDurability -= durabilityToConsume;
    this.scene.updatePlayerWeaponDisplay();
    
    if (sword.currentDurability <= 0) {
      this.scene.animationHelper.showMessage(`${sword.name}이(가) 부서졌다!`, COLORS.message.error);
      this.scene.playerState.currentSword = null;
      this.scene.updatePlayerWeaponDisplay();
      this.scene.events.emit('handUpdated');  // 스킬 사용 가능 여부 갱신
    }
    
    return actualHits;
  }
  
  executeDefense(skill: SkillCard) {
    const sword = this.scene.playerState.currentSword;
    
    // 카운트 방어 스킬 (통합 처리: 검 얽기, 철벽 등)
    if (skill.effect?.type === 'countDefense') {
      const effect = skill.effect;
      const defenseMultiplier = effect.value;        // 방어율 배수
      const duration = effect.duration || 1;          // 대기 시간
      const counterAttack = effect.counterAttack ?? false;  // 반격 여부
      const counterMultiplier = effect.counterMultiplier ?? skill.attackMultiplier;  // 반격 배수
      const consumeOnSuccess = effect.consumeOnSuccess ?? true;  // 방어 성공 시 소멸 여부
      
      this.scene.playerState.countEffects.push({
        id: 'countDefense_' + Date.now(),
        type: 'countDefense',
        name: skill.name,
        emoji: skill.emoji,
        remainingDelays: duration,
        isNew: true,  // 이번 턴에 추가됨 (첫 감소 시 스킵)
        data: {
          defenseMultiplier: defenseMultiplier,
          attackMultiplier: counterMultiplier,
          counterAttack: counterAttack,
          consumeOnSuccess: consumeOnSuccess,
        },
      });
      
      this.scene.animationHelper.showMessage(`${skill.emoji} ${skill.name} 준비! (${duration}대기)`, COLORS.message.success);
      return;
    }
    
    // 흐름을 읽다 스킬 (대기별 스케일링)
    if (skill.effect?.type === 'flowRead') {
      const effect = skill.effect;
      const duration = effect.duration || 5;
      
      this.scene.playerState.countEffects.push({
        id: 'flowRead_' + Date.now(),
        type: 'flowRead',
        name: skill.name,
        emoji: skill.emoji,
        remainingDelays: duration,
        maxDelays: duration,
        isNew: true,
        data: {
          counterAttack: effect.counterAttack ?? true,
          consumeOnSuccess: effect.consumeOnSuccess ?? true,
          defenseScaling: effect.defenseScaling || [1, 2, 4, 6, 8],
          counterScaling: effect.counterScaling || [0.25, 0.5, 1.0, 1.5, 2.0],
        },
      });
      
      this.scene.animationHelper.showMessage(`${skill.emoji} ${skill.name}... 흐름을 읽는 중 (${duration}대기)`, COLORS.message.success);
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
      this.scene.animationHelper.showMessage(`🎯 집중! 다음 공격 +${skill.effect.value * 100}%!`, COLORS.message.success);
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
      const count = skill.effect.value || 3;
      let drawn = 0;
      
      // 덱이 비어있으면 무덤을 셔플하여 리필
      this.scene.cardSystem.refillDeckIfNeeded();
      
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
      
      // 아직 부족하면 다시 리필 시도
      if (drawn < count && this.scene.cardSystem.refillDeckIfNeeded()) {
        const tempDeck2 = [...this.scene.playerState.deck];
        for (let i = 0; i < tempDeck2.length && drawn < count; i++) {
          if (tempDeck2[i].type === 'sword') {
            const cardIndex = this.scene.playerState.deck.indexOf(tempDeck2[i]);
            if (cardIndex !== -1) {
              const [card] = this.scene.playerState.deck.splice(cardIndex, 1);
              this.scene.playerState.hand.push(card);
              drawn++;
            }
          }
        }
      }
      
      if (drawn > 0) {
        this.scene.animationHelper.showMessage(`🎴 검 ${drawn}자루 획득!`, COLORS.message.success);
      } else {
        this.scene.animationHelper.showMessage('덱에 검이 없다!', COLORS.message.error);
      }
      this.scene.events.emit('handUpdated');
    } else if (skill.effect?.type === 'bladeGrab') {
      // 검 잡기: 덱 최상위 검 즉시 장착+발도, 그 다음 검은 손패로
      
      // 덱이 비어있으면 무덤을 셔플하여 리필
      this.scene.cardSystem.refillDeckIfNeeded();
      
      const deck = this.scene.playerState.deck;
      let firstSwordIndex = -1;
      let secondSwordIndex = -1;
      
      // 덱 상위부터 검 2개 찾기
      for (let i = 0; i < deck.length; i++) {
        if (deck[i].type === 'sword') {
          if (firstSwordIndex === -1) {
            firstSwordIndex = i;
          } else if (secondSwordIndex === -1) {
            secondSwordIndex = i;
            break;
          }
        }
      }
      
      if (firstSwordIndex === -1) {
        this.scene.animationHelper.showMessage('덱에 검이 없다!', COLORS.message.error);
        return;
      }
      
      // 첫 번째 검: 즉시 장착 + 발도
      const [firstSword] = deck.splice(firstSwordIndex, 1);
      const swordData = firstSword.data as SwordCard;
      
      // 두 번째 검이 있으면 손패로 (인덱스 조정 필요)
      let secondSwordData: SwordCard | null = null;
      if (secondSwordIndex !== -1) {
        const adjustedIndex = secondSwordIndex > firstSwordIndex ? secondSwordIndex - 1 : secondSwordIndex;
        const [secondSword] = deck.splice(adjustedIndex, 1);
        this.scene.playerState.hand.push(secondSword);
        secondSwordData = secondSword.data as SwordCard;
      }
      
      // UIScene 가져오기
      const uiScene = this.scene.scene.get('UIScene') as import('../scenes/UIScene').UIScene;
      
      // 검 미리보기 UI 표시 후 확인 버튼 누르면 장착
      uiScene.showSwordPreview(swordData, '🔍 잡은 검!', () => {
        // 장착 + 발도
        this.scene.cardSystem.equipSword(swordData);
        
        // 두 번째 검 메시지
        if (secondSwordData) {
          this.scene.time.delayedCall(500, () => {
            this.scene.animationHelper.showMessage(`🎴 ${secondSwordData!.name} 손패로!`, COLORS.message.info);
          });
        }
        
        this.scene.events.emit('handUpdated');
      });
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
    
    // summon 효과는 attack/special 대신 호출 처리
    if (action.effect?.type === 'summon') {
      this.handleSummonAction(enemy, action);
      return;
    }
    
    switch (action.type) {
      case 'attack':
      case 'special':
        this.handleEnemyAttack(enemy, action, sprite);
        break;
        
      case 'defend':
        {
          // defenseIncrease가 있으면 사용, 없으면 기본값 5
          const defenseGain = action.defenseIncrease ?? 5;
          enemy.defense += defenseGain;
          this.scene.animationHelper.showMessage(`${enemy.name} 방어 자세! (+${defenseGain} 방어)`, COLORS.message.success);
        }
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
        
      case 'taunt':
        // 도발 스킬 발동 - 이제 도발 상태 적용
        if (action.effect?.type === 'taunt') {
          enemy.isTaunting = true;
          enemy.tauntDuration = action.effect.duration || 3;
          
          // 도발에도 방어력 증가 (defenseIncrease가 있으면 적용)
          if (action.defenseIncrease && action.defenseIncrease > 0) {
            enemy.defense += action.defenseIncrease;
            this.scene.animationHelper.showMessage(`🛡️ ${enemy.name} 도발! (+${action.defenseIncrease} 방어)`, COLORS.message.warning);
          } else {
            this.scene.animationHelper.showMessage(`🛡️ ${enemy.name} 도발! 나를 노려라!`, COLORS.message.warning);
          }
          
          this.scene.enemyManager.updateEnemySprite(enemy);
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
  
  /**
   * 호출 스킬 처리 - 산적/궁수 등 부하 소환
   */
  private handleSummonAction(enemy: Enemy, action: EnemyAction) {
    const summonCount = action.effect?.value || 1;
    
    this.scene.animationHelper.showMessage(`📢 ${enemy.name}이(가) 부하를 부른다!`, COLORS.message.warning);
    
    // 부하 소환 (산적 또는 궁수 랜덤)
    const minionTypes = ['bandit', 'archer'];  // 산적, 궁수
    
    for (let i = 0; i < summonCount; i++) {
      // 최대 적 수 체크 (4마리까지)
      if (this.scene.gameState.enemies.length >= 4) {
        this.scene.animationHelper.showMessage('더 이상 부를 수 없다!', COLORS.message.info);
        break;
      }
      
      // 랜덤 부하 타입 선택
      const minionType = minionTypes[Math.floor(Math.random() * minionTypes.length)];
      const template = ENEMIES_TIER1[minionType];
      
      if (template) {
        const minion = createEnemy(template, this.scene.gameState.currentWave);
        minion.isSummoned = true;  // 소환된 적 표시 (경험치 없음)
        this.scene.gameState.enemies.push(minion);
        this.scene.enemyManager.createEnemySprite(minion);
        
        this.scene.animationHelper.showMessage(`⚔️ ${minion.name} 등장!`, COLORS.effect.damage);
      }
    }
    
    // 호출 후 쿨다운 설정 (2턴)
    enemy.summonCooldown = 2;
    
    this.scene.events.emit('statsUpdated');
  }
  
  private handleEnemyAttack(enemy: Enemy, action: EnemyAction, _sprite: Phaser.GameObjects.Container | undefined) {
    const hitCount = action.hitCount || 1;
    
    // 다중 타격 처리
    for (let hitIndex = 0; hitIndex < hitCount; hitIndex++) {
      // 플레이어가 죽었으면 중단
      if (this.scene.playerState.hp <= 0) break;
      
      // 다중 타격 표시
      if (hitCount > 1) {
        this.scene.animationHelper.showMessage(`${action.name} ${hitIndex + 1}/${hitCount}타!`, COLORS.message.warning);
      }
      
      this.handleSingleHit(enemy, action, hitIndex === 0);
    }
  }
  
  /**
   * 단일 타격 처리 (다중 타격의 각 타격에서 호출)
   * 카운트 효과가 여러 개 있으면 먼저 장전한 것부터 순서대로 사용
   */
  private handleSingleHit(enemy: Enemy, action: EnemyAction, _isFirstHit: boolean) {
    const sword = this.scene.playerState.currentSword;
    let baseParryRate = sword ? sword.defense : 0;  // 기본 방어율 (10이면 10%)
    
    // 방어 버프 추가 방어율
    this.scene.playerState.buffs.forEach(buff => {
      if (buff.type === 'defense') {
        baseParryRate += buff.value;
      }
    });
    
    // '방어율 증가' 패시브 보너스 (레벨당 1%)
    const defenseBonusLevel = getPassiveLevel(this.scene.playerState.passives, 'defenseBonus');
    if (defenseBonusLevel > 0) {
      baseParryRate += defenseBonusLevel;
    }
    
    // 카운트 효과 체크 (장전된 순서대로 사용 - 배열 앞이 먼저 장전된 것)
    let activeCountEffect: typeof this.scene.playerState.countEffects[0] | null = null;
    let countEffectParryRate = baseParryRate;
    let currentCounterMultiplier = 1.0;  // 반격 배수 (flowRead용)
    
    // 가장 먼저 장전된 카운트 효과 찾기 (flowRead 또는 countDefense)
    const availableEffects = this.scene.playerState.countEffects.filter(
      e => e.type === 'flowRead' || e.type === 'countDefense'
    );
    
    if (availableEffects.length > 0) {
      // 배열의 첫 번째 = 가장 먼저 장전된 효과
      activeCountEffect = availableEffects[0];
      
      if (activeCountEffect.type === 'flowRead') {
        // flowRead 효과 - 대기별 스케일링
      const maxDelays = activeCountEffect.maxDelays || 5;
      const elapsed = maxDelays - activeCountEffect.remainingDelays;  // 0~4
      
      // 대기별 방어 배율 적용
      const defenseScaling = activeCountEffect.data.defenseScaling || [1, 2, 4, 6, 8];
      const defenseIndex = Math.min(elapsed, defenseScaling.length - 1);
      const defenseMultiplier = defenseScaling[defenseIndex];
      countEffectParryRate = sword ? sword.defense * defenseMultiplier : 0;
      
      // 대기별 반격 배율 저장
      const counterScaling = activeCountEffect.data.counterScaling || [0.25, 0.5, 1.0, 1.5, 2.0];
      const counterIndex = Math.min(elapsed, counterScaling.length - 1);
      currentCounterMultiplier = counterScaling[counterIndex];
      
      console.log(`[flowRead] 경과: ${elapsed}대기, 방어x${defenseMultiplier}, 반격x${currentCounterMultiplier}`);
      } else {
        // countDefense 효과
        countEffectParryRate = sword ? sword.defense * (activeCountEffect.data.defenseMultiplier || 5) : 0;
        currentCounterMultiplier = activeCountEffect.data.attackMultiplier || 1.0;
      }
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
        this.scene.events.emit('handUpdated');  // 스킬 사용 가능 여부 갱신
      }
      
      // 효과별 메시지
      if (activeCountEffect) {
        const hasCounter = activeCountEffect.data.counterAttack;
        if (hasCounter) {
          this.scene.animationHelper.showMessage(`${activeCountEffect.emoji} ${activeCountEffect.name} 성공! ${action.name} 흘려냄!`, COLORS.message.success);
          this.scene.playAttakAnimation();
        } else {
          this.scene.animationHelper.showMessage(`${activeCountEffect.emoji} ${activeCountEffect.name}! ${action.name} 방어!`, COLORS.message.success);
        }
      } else {
        this.scene.animationHelper.showMessage(`🛡️ 방어 성공! ${action.name} 흘려냄!`, COLORS.message.success);
      }
      
      // 반격 체크 (counterAttack이 true인 경우)
      const shouldCounter = activeCountEffect?.data.counterAttack;
      if (shouldCounter && this.scene.playerState.currentSword) {
        const swordAttack = this.scene.playerState.currentSword.attack;
        // flowRead는 currentCounterMultiplier 사용, countDefense는 attackMultiplier 사용
        const counterMultiplier = activeCountEffect!.type === 'flowRead' 
          ? currentCounterMultiplier 
          : (activeCountEffect!.data.attackMultiplier || 1.0);
        const counterDamage = (swordAttack * counterMultiplier) + (action.damage * 0.5);
        
        this.damageEnemy(enemy, counterDamage);
        this.scene.animationHelper.showMessage(`⚔️ 반격! x${counterMultiplier} ${Math.floor(counterDamage)} 데미지!`, COLORS.message.warning);
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
        this.scene.animationHelper.showMessage(`🩸 출혈! -${action.effect.value}`, COLORS.effect.damage);
      }
      
      if (action.effect?.type === 'poison') {
        this.scene.playerState.hp -= action.effect.value;
        this.scene.animationHelper.showMessage(`☠️ 독! -${action.effect.value}`, COLORS.effect.damage);
      }
    }
    
    // 카운트 효과 소멸 처리
    if (activeCountEffect) {
      const shouldConsume = activeCountEffect.data.consumeOnSuccess ?? true;
      const countAreaPos = { x: 206, y: 620 };  // 카운트 영역 위치
      
      // consumeOnSuccess가 true면 방어 성공 시 소멸, 아니면 항상 소멸
      if (shouldConsume && parrySuccess) {
        this.scene.playerState.countEffects = this.scene.playerState.countEffects.filter(
          e => e.id !== activeCountEffect!.id
        );
        this.scene.animationHelper.showMessage(`${activeCountEffect.emoji} ${activeCountEffect.name} 효과 소멸!`, COLORS.message.muted);
        // 무덤 애니메이션
        this.scene.events.emit('cardToGrave', countAreaPos.x, countAreaPos.y, activeCountEffect.emoji);
      } else if (!shouldConsume) {
        // consumeOnSuccess가 false면 1회 사용 후 무조건 소멸
        this.scene.playerState.countEffects = this.scene.playerState.countEffects.filter(
          e => e.id !== activeCountEffect!.id
        );
        this.scene.animationHelper.showMessage(`${activeCountEffect.emoji} ${activeCountEffect.name} 효과 소멸!`, COLORS.message.muted);
        // 무덤 애니메이션
        this.scene.events.emit('cardToGrave', countAreaPos.x, countAreaPos.y, activeCountEffect.emoji);
      }
    }
    
    this.scene.events.emit('statsUpdated');
  }
  
  // ========== 데미지 처리 ==========
  
  damageEnemy(enemy: Enemy, damage: number, isCritical: boolean = false) {
    const actualDamage = Math.floor(damage);
    enemy.hp -= actualDamage;
    
    const sprite = this.scene.enemySprites.get(enemy.id);
    if (sprite) {
      this.scene.animationHelper.showDamageNumber(sprite.x, sprite.y - 50, actualDamage, COLORS.effect.damage, isCritical);
      
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
    
    // 경험치 획득 (소환된 적은 경험치 없음)
    if (!enemy.isSummoned) {
    const expGain = Math.floor(enemy.maxHp / 2);
    this.gainExp(expGain);
    }
    
    // 은전 드롭
    const silverDrop = this.calculateSilverDrop(enemy);
    this.scene.playerState.silver += silverDrop;
    this.scene.animationHelper.showMessage(`💰 +${silverDrop} 은전`, COLORS.message.warning);
    
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
  
  /**
   * 은전 드롭량 계산
   */
  private calculateSilverDrop(enemy: Enemy): number {
    // 기본 드롭량 (HP 기반)
    let baseDrop = Math.floor(enemy.maxHp / 5);
    
    // 보스는 추가 드롭
    if (enemy.isBoss) {
      baseDrop *= 3;
    }
    
    // 약간의 랜덤 변동 (±30%)
    const variance = Math.floor(baseDrop * 0.3);
    return Math.max(1, baseDrop + Math.floor(Math.random() * variance * 2) - variance);
  }
  
  gainExp(amount: number) {
    this.scene.playerState.exp += amount;
    const expNeeded = this.scene.getExpNeeded();
    
    if (this.scene.playerState.exp >= expNeeded) {
      this.scene.playerState.exp -= expNeeded;
      this.scene.playerState.level++;
      this.onLevelUp();
      
      // 전투 중이면 레벨업 UI를 전투 종료 시 표시하도록 플래그 설정
      if (this.scene.gameState.phase === 'combat') {
        this.scene.pendingLevelUp = true;
      }
    }
  }
  
  private onLevelUp() {
    this.scene.animationHelper.showMessage(`⬆️ 레벨 ${this.scene.playerState.level}!`, COLORS.message.levelUp);
    
    // 체력 +5, 체력 풀 회복
    this.scene.playerState.maxHp += 5;
    this.scene.playerState.hp = this.scene.playerState.maxHp;
    
    // 마나 +1 (최대 10까지만)
    if (this.scene.playerState.maxMana < 10) {
      this.scene.playerState.maxMana += 1;
    }
    this.scene.playerState.mana = this.scene.playerState.maxMana;
  }
  
  // ========== 유틸리티 ==========
  
  combineReach(swordReach: string, skillReach: string): string {
    return combineReachByPriority(swordReach, skillReach);
  }
  
  /**
   * 범위 결정: 스킬 범위와 무기 범위를 기반으로 최종 범위 계산
   */
  resolveReach(skillReach: string, swordReach: string): string {
    return resolveReachWithSword(skillReach, swordReach);
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
    return getTargetCountByReachUtil(reach);
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
   * 특정 적의 대기턴 증가
   */
  increaseEnemyDelay(enemy: Enemy, amount: number) {
    if (enemy.actionQueue.length > 0) {
      enemy.actionQueue[0].currentDelay += amount;
      this.scene.animationHelper.showMessage(`⏳ ${enemy.name} 대기 +${amount}!`, COLORS.message.info);
    }
    this.scene.enemyManager.updateEnemySprite(enemy);
    this.scene.enemyManager.updateEnemyActionDisplay();
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
      
      // 카운트 효과 종료 시 무덤으로 가는 애니메이션
      const countAreaPos = { x: 206, y: 620 };  // 카운트 영역 위치
      this.scene.events.emit('cardToGrave', countAreaPos.x, countAreaPos.y, effect.emoji);
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
    let focusMultiplier = 1.0;
    this.scene.playerState.buffs.forEach(buff => {
      if (buff.type === 'attack') {
        if (buff.id === 'focus') {
          focusMultiplier += buff.value;  // 집중: 최종 데미지에 배율 적용
        } else {
          attackBonus += buff.value;
        }
      }
    });
    
    const baseDamage = (sword.attack + attackBonus) * attackMultiplier * focusMultiplier;
    
    // 방어관통 계산: 무기 관통력
    const weaponPierce = sword.pierce || 0;
    
    // 각 타격을 300ms 간격으로 순차 처리
    const hitInterval = 300;
    
    for (let hitIndex = 0; hitIndex < actualHits; hitIndex++) {
      this.scene.time.delayedCall(hitIndex * hitInterval, () => {
        // 공격 애니메이션 재생
        this.scene.animationHelper.playerAttack();
        
        // 각 타겟에 데미지 적용
        targets.forEach(enemy => {
          // 적이 이미 죽었으면 스킵
          if (enemy.hp <= 0) return;
          
          const effectiveDefense = Math.max(0, enemy.defense - weaponPierce);
          const damage = Math.max(1, baseDamage - effectiveDefense);
          
          // 데미지 적용 (적 HP 감소 및 사망 처리)
          this.damageEnemy(enemy, damage);
        });
      });
    }
  }
  
  applyBleedDamage() {
    this.scene.gameState.enemies.forEach(enemy => {
      if (enemy.bleeds.length > 0) {
        // 모든 출혈 데미지 적용
        enemy.bleeds.forEach((bleed, index) => {
          this.scene.animationHelper.showMessage(`🩸 ${enemy.name} 출혈${enemy.bleeds.length > 1 ? `(${index + 1})` : ''}! -${bleed.damage}`, COLORS.effect.damage);
          this.damageEnemy(enemy, bleed.damage);
          bleed.duration--;
        });
        
        // 만료된 출혈 제거
        enemy.bleeds = enemy.bleeds.filter(bleed => bleed.duration > 0);
        
        // 디버프 UI 업데이트
        this.scene.enemyManager.updateEnemySprite(enemy);
      }
    });
  }
  
  applyPoisonDamage() {
    this.scene.gameState.enemies.forEach(enemy => {
      if (enemy.poisons.length > 0) {
        // 모든 독 데미지 적용
        enemy.poisons.forEach((poison, index) => {
          this.scene.animationHelper.showMessage(`☠️ ${enemy.name} 독${enemy.poisons.length > 1 ? `(${index + 1})` : ''}! -${poison.damage}`, COLORS.effect.damage);
          this.damageEnemy(enemy, poison.damage);
          poison.duration--;
        });
        
        // 만료된 독 제거
        enemy.poisons = enemy.poisons.filter(poison => poison.duration > 0);
        
        // 디버프 UI 업데이트
        this.scene.enemyManager.updateEnemySprite(enemy);
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

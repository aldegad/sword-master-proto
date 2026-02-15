import type { GameScene } from '../scenes/GameScene';
import type { Card, SwordCard, SkillCard, Enemy } from '../types';
import { GAME_CONSTANTS } from '../constants/gameConfig';
import { getRandomSword, createJangwang } from '../data/swords';
import { getRandomSkill } from '../data/skills';
import { COLORS } from '../constants/colors';

/**
 * 카드 시스템 - 카드 사용, 드로우, 교환 담당
 */
export class CardSystem {
  private scene: GameScene;
  
  constructor(scene: GameScene) {
    this.scene = scene;
  }
  
  // ========== 카드 사용 ==========
  
  useCard(index: number) {
    if (this.scene.gameState.phase !== 'combat') return;
    if (index >= this.scene.playerState.hand.length) return;
    
    const card = this.scene.playerState.hand[index];
    
    // 교환 모드일 경우
    if (this.scene.isExchangeMode) {
      this.exchangeCard(index);
      return;
    }
    
    // 전투 중이고 적이 있으면 타겟 선택 필요
    if (this.scene.gameState.enemies.length > 0) {
      // 무기 카드: 발도 공격을 위해 타겟 선택 필요
      if (card.type === 'sword') {
        this.startTargeting(card, index);
        return;
      }
      
      // 스킬 카드: 공격/특수 스킬은 타겟 선택 필요 (적이 1명이어도)
      if (card.type === 'skill') {
        const skill = card.data as SkillCard;
        if (skill.type === 'attack' || skill.type === 'special') {
          this.startTargeting(card, index);
          return;
        }
      }
    }
    
    // 바로 사용 (방어/버프 스킬 또는 적이 없을 때)
    this.executeCard(index);
  }
  
  executeCard(index: number, targetEnemy?: Enemy) {
    const card = this.scene.playerState.hand[index];
    const manaCost = card.data.manaCost;
    
    // 마나 체크
    if (this.scene.playerState.mana < manaCost) {
      this.scene.animationHelper.showMessage('마나 부족!', COLORS.message.error);
      return;
    }
    
    // 마나 소모
    this.scene.playerState.mana -= manaCost;
    
    // UIScene 참조
    const uiScene = this.scene.scene.get('UIScene') as import('../scenes/UIScene').UIScene;
    
    // 실제 카드 sprite 추출 (애니메이션 전에!)
    const cardSprite = uiScene.cardUI.extractCardForAnimation(index);
    
    // 적 위치 계산 (무기/스킬 공통)
    const enemies = this.scene.gameState.enemies;
    const target = targetEnemy || (enemies.length > 0 ? enemies[0] : null);
    const targetSprite = target ? this.scene.enemySprites.get(target.id) : null;
    const targetX = targetSprite ? targetSprite.x : this.scene.cameras.main.width - 180;
    const targetY = targetSprite ? targetSprite.y : this.scene.GROUND_Y - 30;
    
    // 무기 카드의 경우 맨손 여부 체크 (신속 발도 판단용)
    const wasBarehanded = this.scene.playerState.currentSword === null;
    
    if (card.type === 'sword') {
      // 무기 카드: 실제 카드 sprite로 애니메이션
      if (cardSprite) {
        uiScene.animateCardToPlayer(cardSprite, targetX, targetY);
      }
      this.equipSword(card.data, targetEnemy);
    } else {
      // 스킬 카드: 타입에 따라 다른 애니메이션
      const skill = card.data as SkillCard;
      const isChargeAttack = skill.effect?.type === 'chargeAttack';
      const isCountDefense = skill.effect?.type === 'countDefense' || skill.effect?.type === 'flowRead';
      const isAttackSkill = skill.type === 'attack' || skill.type === 'special';
      
      if (cardSprite && enemies.length > 0) {
        // 강타(chargeAttack) 또는 대기 방어(countDefense, flowRead)는 카운트 영역으로 날아감
        if (isChargeAttack || isCountDefense) {
          uiScene.animateCardToCount(cardSprite);
        } else if (isAttackSkill) {
          // 공격 범위 계산 (무기 범위 + 스킬 범위 합산)
          const sword = this.scene.playerState.currentSword;
          const skillReach = skill.reach;
          
          // 실제 범위 계산 (single은 무기 범위, 아니면 스킬 범위)
          let actualReach = skillReach;
          if (skillReach === 'single' && sword) {
            actualReach = sword.reach;
          } else if (skillReach === 'swordDouble' && sword) {
            // swordDouble: 무기 범위 x2
            const swordTargetCount = this.scene.combatSystem.getTargetCountByReach(sword.reach);
            actualReach = swordTargetCount * 2 >= 4 ? 'all' : 
                         swordTargetCount * 2 === 2 ? 'double' :
                         swordTargetCount * 2 === 3 ? 'triple' : 'double';
          }
          
          // 클릭한 적 기준으로 타겟 리스트 가져오기
          let targetEnemies: Enemy[];
          if (target) {
            targetEnemies = this.scene.combatSystem.getTargetsByReachFromEnemy(actualReach, target);
          } else {
            targetEnemies = this.scene.combatSystem.getTargetsByReach(actualReach);
          }
          
          if (targetEnemies.length > 1) {
            // 여러 적에게 카드가 날아감
            const animTargets: Array<{x: number, y: number}> = [];
            for (const enemy of targetEnemies) {
              const enemySprite = this.scene.enemySprites.get(enemy.id);
              if (enemySprite) {
                animTargets.push({ x: enemySprite.x, y: enemySprite.y });
              }
            }
            uiScene.animateCardToMultipleEnemies(cardSprite, animTargets);
          } else {
            // 단일 적
            uiScene.animateCardToEnemyAndGrave(cardSprite, targetX, targetY);
          }
        } else {
          // 버프/방어 스킬은 바로 무덤으로
          uiScene.animateCardSpriteToGrave(cardSprite);
        }
      } else if (cardSprite) {
        // 적이 없을 때는 바로 무덤으로
        uiScene.animateCardSpriteToGrave(cardSprite);
      }
      
      const success = this.useSkill(card.data, targetEnemy);
      if (!success) {
        this.scene.playerState.mana += manaCost;
        // sprite는 이미 추출되었으므로 destroy
        cardSprite?.destroy();
        return;
      }
    }
    
    // 손패에서 제거
    this.scene.playerState.hand.splice(index, 1);
    
    // 스킬 카드만 무덤으로 (1회용 스킬은 완전히 제거, 납도는 손패로 돌아옴)
    if (card.type === 'skill') {
      const skill = card.data as SkillCard;
      
      if (card.data.isConsumable) {
        this.scene.animationHelper.showMessage(`${card.data.emoji} ${card.data.name} 소멸!`, COLORS.message.discard);
      } else if (skill.effect?.type === 'sheathe') {
        // 납도 스킬은 손패로 돌아옴
        this.scene.playerState.hand.push(card);
        this.scene.animationHelper.showMessage(`${card.data.emoji} 납도 카드 손패로!`, COLORS.message.info);
      } else {
        // 무덤으로
        this.scene.playerState.discard.push(card);
      }
    }
    
    // 신속 여부 체크:
    // - 스킬 카드: isSwift 속성 확인
    // - 무기 카드: 맨손이었으면 신속 발도
    const isSwift = card.type === 'skill' 
      ? card.data.isSwift 
      : wasBarehanded;  // 맨손에서 발도 = 신속
    
    if (!isSwift) {
      // 일반 카드: 적 대기턴 -1 (적 공격 발생 가능)
      this.scene.combatSystem.reduceAllEnemyDelays(1);
      // 일반 카드: 아군 카운트 효과 -1 (강타, 패리 등)
      this.scene.combatSystem.reduceCountEffects();
    } else {
      // 신속: 대기턴 감소 없음, 카운트 효과 감소 없음
      this.scene.animationHelper.showMessage('⚡ 신속!', COLORS.message.info);
    }
    
    // UI 업데이트
    this.scene.events.emit('handUpdated');
    this.scene.events.emit('statsUpdated');
  }
  
  useCardOnTarget(index: number, target: Enemy) {
    this.executeCard(index, target);
  }
  
  // ========== 무기 장착 ==========
  
  equipSword(sword: SwordCard, targetEnemy?: Enemy) {
    // 맨손 여부 체크 (발도 신속 결정용)
    const wasBarehanded = this.scene.playerState.currentSword === null;
    
    // 기존 무기가 있고 내구도가 남아있으면 무덤으로
    if (this.scene.playerState.currentSword && this.scene.playerState.currentSword.currentDurability > 0) {
      this.scene.playerState.discard.push({ 
        type: 'sword', 
        data: { ...this.scene.playerState.currentSword } 
      });
      this.scene.animationHelper.showMessage(`${this.scene.playerState.currentSword.name} → 무덤`, COLORS.message.discard);
    }
    
    // 새 무기 장착
    this.scene.playerState.currentSword = { ...sword };
    this.scene.updatePlayerWeaponDisplay();
    
    this.scene.animationHelper.showMessage(`${sword.name} 장착!`, COLORS.message.success);
    
    // 발도 공격 실행 (타겟 지정 포함)
    // 맨손이었으면 신속 발도!
    if (this.scene.gameState.phase === 'combat' && this.scene.gameState.enemies.length > 0) {
      // 무기 장착 = 공격으로 간주 (이어베기 조건용)
      this.scene.playerState.usedAttackThisTurn = true;
      
      // 크리티컬 조건을 발도 실행 전에 미리 체크! (대기 감소보다 먼저)
      const drawAtk = sword.drawAttack;
      let preCriticalCheck = false;
      let targets: Enemy[];
      if (targetEnemy) {
        targets = this.scene.combatSystem.getTargetsByReachFromEnemy(drawAtk.reach, targetEnemy);
      } else {
        targets = this.scene.combatSystem.getTargetsByReach(drawAtk.reach);
      }
      
      if (drawAtk.criticalCondition === 'enemyDelay1') {
        preCriticalCheck = targets.some(enemy => 
          enemy.actionQueue.length > 0 && enemy.actionQueue[0].currentDelay === 1
        );
      }
      
      // 대기턴 증가 효과를 대기턴 감소 전에 즉시 적용!
      if (sword.delayIncreaseOnHit && sword.delayIncreaseOnHit > 0) {
        targets.forEach(enemy => {
          if (enemy.hp > 0) {
            this.scene.combatSystem.increaseEnemyDelay(enemy, sword.delayIncreaseOnHit!);
          }
        });
      }
      if (drawAtk.delayIncrease && drawAtk.delayIncrease > 0) {
        targets.forEach(enemy => {
          if (enemy.hp > 0) {
            this.scene.combatSystem.increaseEnemyDelay(enemy, drawAtk.delayIncrease!);
          }
        });
      }
      
      this.scene.time.delayedCall(150, () => {
        this.executeDrawAttack(sword, targetEnemy, wasBarehanded, preCriticalCheck);
      });
    }
  }
  
  executeDrawAttack(sword: SwordCard, targetEnemy?: Enemy, wasBarehanded: boolean = false, preCritical: boolean = false) {
    const drawAtk = sword.drawAttack;
    
    if (sword.currentDurability < drawAtk.durabilityCost) {
      return;
    }
    
    this.scene.playerState.currentSword!.currentDurability -= drawAtk.durabilityCost;
    this.scene.updatePlayerWeaponDisplay();
    
    if (this.scene.playerState.currentSword!.currentDurability <= 0) {
      this.scene.animationHelper.showMessage(`${sword.name}이(가) 부서졌다!`, COLORS.message.error);
      this.scene.playerState.currentSword = null;
      this.scene.updatePlayerWeaponDisplay();
      // 무기가 부서지면 손패 UI 갱신 (스킬 사용 가능 여부 업데이트)
      this.scene.events.emit('handUpdated');
    }
    
    // 집중 버프 적용
    let focusMultiplier = 1.0;
    this.scene.playerState.buffs.forEach(buff => {
      if (buff.id === 'focus') {
        focusMultiplier += buff.value;  // 집중: 최종 데미지에 배율 적용 (0.5면 1.5배)
      }
    });
    
    let damage = sword.attack * drawAtk.multiplier * focusMultiplier;
    
    // 타겟이 지정되었으면 해당 타겟 기준으로 범위 공격, 아니면 기본 범위 공격
    let targets: Enemy[];
    if (targetEnemy) {
      targets = this.scene.combatSystem.getTargetsByReachFromEnemy(drawAtk.reach, targetEnemy);
    } else {
      targets = this.scene.combatSystem.getTargetsByReach(drawAtk.reach);
    }
    
    // 크리티컬: 미리 체크한 값 사용 (대기 감소 전에 체크됨)
    const isCritical = preCritical;
    if (isCritical) {
      const critMultiplier = drawAtk.criticalMultiplier || 1.5;  // 기본 150%
      damage *= critMultiplier;
    }
    
    // 크리티컬 시 특별 애니메이션
    if (isCritical) {
      this.executeCriticalAnimation(sword, targets, damage, drawAtk);
      return;  // 애니메이션 내에서 데미지 처리
    }
    
    this.scene.animationHelper.playerAttack();
    
    // 맨손이었으면 신속 발도!
    const isSwiftDraw = wasBarehanded;
    
    // 메시지 표시
    if (isSwiftDraw) {
      this.scene.animationHelper.showMessage(`⚡ ${drawAtk.name}! (신속 발도)`, COLORS.message.info);
    } else {
      this.scene.animationHelper.showMessage(`⚔️ ${drawAtk.name}!`, COLORS.message.warning);
    }
    
    targets.forEach(enemy => {
      // 방어관통 적용: 무기 관통력을 적 방어력에서 빼기
      const weaponPierce = sword.pierce || 0;
      const effectiveDefense = Math.max(0, enemy.defense - weaponPierce);
      
      // 크리티컬이면 방어 무시
      const actualDamage = isCritical || drawAtk.pierce 
        ? damage 
        : Math.max(1, damage - effectiveDefense);
      this.scene.combatSystem.damageEnemy(enemy, actualDamage, isCritical);
      
      // 적 방어력 영구 감소 효과 (armorReduce)
      // gameState에서 실제 적 객체를 찾아서 수정
      if (drawAtk.armorReduce && drawAtk.armorReduce > 0) {
        const actualEnemy = this.scene.gameState.enemies.find(e => e.id === enemy.id);
        if (actualEnemy) {
          const oldDefense = actualEnemy.defense;
          const reduceAmount = Math.min(drawAtk.armorReduce, oldDefense);
          actualEnemy.defense = Math.max(0, actualEnemy.defense - drawAtk.armorReduce);
          if (reduceAmount > 0) {
            this.scene.animationHelper.showMessage(`🔨 ${actualEnemy.name} 방어력 -${reduceAmount}!`, COLORS.message.warning);
            // UI 업데이트
            this.scene.enemyManager.updateEnemySprite(actualEnemy);
          }
        }
      }
      
      // 무기 장착 효과: 출혈 (bleedOnHit) - 중첩 가능
      if (sword.bleedOnHit) {
        const actualEnemy = this.scene.gameState.enemies.find(e => e.id === enemy.id);
        if (actualEnemy) {
          actualEnemy.bleeds.push({
            damage: sword.bleedOnHit.damage,
            duration: sword.bleedOnHit.duration,
          });
          this.scene.animationHelper.showMessage(`🩸 출혈! ${sword.bleedOnHit.damage}뎀/${sword.bleedOnHit.duration}턴`, COLORS.effect.damage);
          // 디버프 UI 업데이트
          this.scene.enemyManager.updateEnemySprite(actualEnemy);
        }
      }
      
      // 무기 장착 효과: 독 (poisonOnHit) - 중첩 가능
      if (sword.poisonOnHit) {
        const actualEnemy = this.scene.gameState.enemies.find(e => e.id === enemy.id);
        if (actualEnemy) {
          actualEnemy.poisons.push({
            damage: sword.poisonOnHit.damage,
            duration: sword.poisonOnHit.duration,
          });
          this.scene.animationHelper.showMessage(`☠️ 독! ${sword.poisonOnHit.damage}뎀/${sword.poisonOnHit.duration}턴`, COLORS.effect.damage);
          // 디버프 UI 업데이트
          this.scene.enemyManager.updateEnemySprite(actualEnemy);
        }
      }
      
      // 무기 장착 효과: 방어구 파괴 (armorBreakOnHit)
      if (sword.armorBreakOnHit && sword.armorBreakOnHit > 0) {
        const actualEnemy = this.scene.gameState.enemies.find(e => e.id === enemy.id);
        if (actualEnemy) {
          const oldDefense = actualEnemy.defense;
          const reduceAmount = Math.min(sword.armorBreakOnHit, oldDefense);
          actualEnemy.defense = Math.max(0, actualEnemy.defense - sword.armorBreakOnHit);
          if (reduceAmount > 0) {
            this.scene.animationHelper.showMessage(`🔨 방어력 -${reduceAmount}!`, COLORS.message.warning);
            this.scene.enemyManager.updateEnemySprite(actualEnemy);
          }
        }
      }
      
      // 대기턴 증가 효과는 equipSword에서 즉시 처리됨 (대기턴 감소 전에 적용되어야 함)
      
      // 적 스킬 취소 - 항상 발동 (본국검)
      if (drawAtk.cancelEnemySkill) {
        const actualEnemy = this.scene.gameState.enemies.find(e => e.id === enemy.id);
        if (actualEnemy && actualEnemy.actionQueue && actualEnemy.actionQueue.length > 0) {
          // 첫 번째 대기 스킬을 큐에서 제거 (취소)
          const cancelledAction = actualEnemy.actionQueue.shift()!;
          this.scene.animationHelper.showMessage(`🚫 ${cancelledAction.name} 취소!`, COLORS.message.warning);
          this.scene.enemyManager.updateEnemyActionDisplay();
        }
      }
    });
    
    // 집중 버프 소모
    this.scene.playerState.buffs = this.scene.playerState.buffs.filter(b => b.id !== 'focus');
    
    // 참고: 적 대기턴/카운트 효과 감소는 executeCard에서 처리됨
    // (발도가 신속이면 executeCard에서 이미 스킵됨)
    
    this.scene.events.emit('statsUpdated');
  }
  
  /**
   * 크리티컬 특별 애니메이션 (와키자시 먼저 찌르기 등)
   */
  private executeCriticalAnimation(
    sword: SwordCard, 
    targets: Enemy[], 
    damage: number,
    drawAtk: SwordCard['drawAttack']
  ) {
    const scene = this.scene;
    const width = scene.cameras.main.width;
    const height = scene.cameras.main.height;
    
    // 1. 화면 어둡게 (오버레이)
    const overlay = scene.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7);
    overlay.setDepth(3000);
    
    // 2. 이모지 클로즈업 (화면 중앙)
    const emoji = scene.add.text(width/2, height/2, sword.emoji, {
      font: '200px Arial',
    }).setOrigin(0.5).setAlpha(0).setDepth(3001);
    
    // 3. 스킬명 표시
    const skillName = scene.add.text(width/2, height/2 + 150, `⚡ ${drawAtk.name}!`, {
      font: 'bold 48px monospace',
      color: '#FF4444',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setAlpha(0).setDepth(3001);
    
    // 애니메이션 시퀀스 (빠르게!)
    scene.tweens.add({
      targets: emoji,
      alpha: 1,
      scale: { from: 0.3, to: 1.2 },
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        // 스킬명 페이드인
        scene.tweens.add({
          targets: skillName,
          alpha: 1,
          duration: 100,
        });
        
        // 잠시 대기 후 타격 (200ms로 단축)
        scene.time.delayedCall(200, () => {
          // 이모지/스킬명 빠르게 사라짐
          scene.tweens.add({
            targets: [emoji, skillName],
            alpha: 0,
            duration: 100,
          });
          
          // 4. 화면 붉게 물들이기
          const redFlash = scene.add.rectangle(width/2, height/2, width, height, 0xFF0000, 0.5);
          redFlash.setDepth(3002);
          
          // 5. 화면 흔들림
          scene.cameras.main.shake(200, 0.02);
          
          // 플레이어 공격 애니메이션
          scene.animationHelper.playerAttack();
          
          // 크리티컬 메시지
          const critMultiplier = drawAtk.criticalMultiplier || 1.5;
          scene.animationHelper.showMessage(`💥 크리티컬! (${critMultiplier * 100}%)`, COLORS.message.error);
          
          // 데미지 적용
          targets.forEach(enemy => {
            const weaponPierce = sword.pierce || 0;
            const effectiveDefense = Math.max(0, enemy.defense - weaponPierce);
            // 크리티컬 시 방어 무시: criticalPierce 또는 기존 pierce
            const isPiercing = drawAtk.criticalPierce || drawAtk.pierce;
            const actualDamage = isPiercing ? damage : Math.max(1, damage - effectiveDefense);
            scene.combatSystem.damageEnemy(enemy, actualDamage, true);
            
            // 크리티컬 출혈 적용
            if (drawAtk.criticalBleed) {
              const actualEnemy = scene.gameState.enemies.find(e => e.id === enemy.id);
              if (actualEnemy) {
                actualEnemy.bleeds.push({
                  damage: drawAtk.criticalBleed.damage,
                  duration: drawAtk.criticalBleed.duration,
                });
                scene.animationHelper.showMessage(`🩸 대출혈! ${drawAtk.criticalBleed.damage}뎀/${drawAtk.criticalBleed.duration}턴`, COLORS.effect.damage);
                scene.enemyManager.updateEnemySprite(actualEnemy);
              }
            }
            
            // 크리티컬 독 적용
            if (drawAtk.criticalPoison) {
              const actualEnemy = scene.gameState.enemies.find(e => e.id === enemy.id);
              if (actualEnemy) {
                actualEnemy.poisons.push({
                  damage: drawAtk.criticalPoison.damage,
                  duration: drawAtk.criticalPoison.duration,
                });
                scene.animationHelper.showMessage(`☠️ 맹독! ${drawAtk.criticalPoison.damage}뎀/${drawAtk.criticalPoison.duration}턴`, COLORS.effect.damage);
                scene.enemyManager.updateEnemySprite(actualEnemy);
              }
            }
            
            // 적 스킬 취소 - 크리티컬 시에만 (요이도로시)
            if (drawAtk.criticalCancelEnemySkill) {
              const actualEnemy = scene.gameState.enemies.find(e => e.id === enemy.id);
              if (actualEnemy && actualEnemy.actionQueue && actualEnemy.actionQueue.length > 0) {
                // 첫 번째 대기 스킬을 큐에서 제거 (취소)
                const cancelledAction = actualEnemy.actionQueue.shift()!;
                scene.animationHelper.showMessage(`🚫 ${cancelledAction.name} 취소!`, COLORS.message.warning);
                scene.enemyManager.updateEnemyActionDisplay();
              }
            }
          });
          
          // 붉은 플래시 페이드아웃
          scene.tweens.add({
            targets: redFlash,
            alpha: 0,
            duration: 300,
            onComplete: () => redFlash.destroy(),
          });
          
          // 오버레이 페이드아웃
          scene.tweens.add({
            targets: overlay,
            alpha: 0,
            duration: 400,
            onComplete: () => {
              overlay.destroy();
              emoji.destroy();
              skillName.destroy();
            },
          });
          
          // 집중 버프 소모
          scene.playerState.buffs = scene.playerState.buffs.filter(b => b.id !== 'focus');
          scene.events.emit('statsUpdated');
        });
      },
    });
  }
  
  // ========== 스킬 사용 ==========
  
  useSkill(skill: SkillCard, targetEnemy?: Enemy): boolean {
    if ((skill.type === 'attack' || skill.type === 'special') && !this.scene.playerState.currentSword) {
      this.scene.animationHelper.showMessage('무기가 필요합니다!', COLORS.message.error);
      return false;
    }
    
    // 이어베기 체크: 이번 턴에 공격/무기를 사용했어야 함
    if (skill.effect?.type === 'followUp' && !this.scene.playerState.usedAttackThisTurn) {
      this.scene.animationHelper.showMessage('먼저 공격 스킬을 사용하세요!', COLORS.message.error);
      return false;
    }
    
    const sword = this.scene.playerState.currentSword;
    
    // 공격/특수 스킬: 내구도 체크
    // 강타(chargeAttack)는 발동 시 체크하므로 여기서는 패스
    // 나머지 스킬은 내구도 1 이상 필요 (부족하면 가능한 만큼만 때림)
    if ((skill.type === 'attack' || skill.type === 'special') && sword) {
      const isChargeAttack = skill.effect?.type === 'chargeAttack';
      if (!isChargeAttack && sword.currentDurability <= 0) {
        this.scene.animationHelper.showMessage('내구도 없음!', COLORS.message.error);
        return false;
      }
      // 내구도 소모는 CombatSystem.executeAttack에서 처리
    }
    
    // 스킬 타입별 처리
    if (skill.type === 'attack' || skill.type === 'special') {
      this.scene.combatSystem.executeAttack(skill, targetEnemy);
      // 공격 스킬 사용 기록 (이어베기 조건용)
      this.scene.playerState.usedAttackThisTurn = true;
    } else if (skill.type === 'defense') {
      this.scene.combatSystem.executeDefense(skill);
    } else if (skill.type === 'buff' || skill.type === 'draw') {
      // buff와 draw 타입 모두 executeBuff에서 처리 (draw effect 포함)
      this.scene.combatSystem.executeBuff(skill);
    }
    
    // 추가 대기턴 감소 효과
    if (skill.effect?.type === 'delayReduce') {
      this.scene.combatSystem.reduceAllEnemyDelays(skill.effect.value);
    }
    
    // 조롱 효과: 적 대기턴 -1 + 카드 드로우
    if (skill.effect?.type === 'taunt') {
      this.scene.combatSystem.reduceAllEnemyDelays(1);
      this.drawCards(skill.effect.value);
      this.scene.animationHelper.showMessage('😤 조롱! 적이 분노한다!', COLORS.effect.damage);
    }
    
    // 검의 춤: 카드 3장 드로우 후 모두 발동
    if (skill.effect?.type === 'bladeDance') {
      this.executeBladeDance(skill.effect.value, targetEnemy);
      return true;  // 별도 메시지 처리
    }
    
    // 납도: 현재 무기의 발도 스킬 재시전
    if (skill.effect?.type === 'sheathe') {
      this.executeSheathe(targetEnemy);
      return true;  // 별도 메시지 처리
    }
    
    // 파검: 사용 후 무기 파괴
    if (skill.effect?.type === 'destroyWeapon') {
      this.scene.time.delayedCall(300, () => {
        if (this.scene.playerState.currentSword) {
          const swordName = this.scene.playerState.currentSword.name;
          this.scene.playerState.currentSword = null;
          this.scene.animationHelper.showMessage(`💥 ${swordName}이(가) 산산조각났다!`, COLORS.message.error);
          this.scene.events.emit('statsUpdated');
          this.scene.events.emit('handUpdated');  // 스킬 사용 가능 여부 갱신
        }
      });
    }
    
    this.scene.animationHelper.showMessage(`${skill.name}!`, COLORS.message.warning);
    return true;
  }
  
  /**
   * 검의 춤 - 카드 N장 드로우 후 모두 즉시 발동
   */
  private executeBladeDance(drawCount: number, targetEnemy?: Enemy) {
    this.scene.animationHelper.showMessage('💃 검의 춤!', COLORS.message.warning);
    
    // 카드 드로우 (손패가 아닌 별도 배열로)
    const drawnCards: Card[] = [];
    
    for (let i = 0; i < drawCount; i++) {
      if (this.scene.playerState.deck.length === 0) {
        if (this.scene.playerState.discard.length === 0) break;
        this.scene.playerState.deck = [...this.scene.playerState.discard];
        this.scene.playerState.discard = [];
        this.shuffleArray(this.scene.playerState.deck);
      }
      
      const card = this.scene.playerState.deck.pop();
      if (card) {
        drawnCards.push(card);
      }
    }
    
    if (drawnCards.length === 0) {
      this.scene.animationHelper.showMessage('덱이 비어있다!', COLORS.message.error);
      return;
    }
    
    // 순차적으로 카드 발동
    this.executeBladeDanceCards(drawnCards, 0, targetEnemy);
  }
  
  /**
   * 검의 춤 - 드로우한 카드들을 순차적으로 발동
   */
  private executeBladeDanceCards(cards: Card[], index: number, targetEnemy?: Enemy) {
    if (index >= cards.length) {
      this.scene.events.emit('handUpdated');
      this.scene.events.emit('statsUpdated');
      return;
    }
    
    const card = cards[index];
    const sword = this.scene.playerState.currentSword;
    
    // UIScene에서 카드 미리보기 표시
    const uiScene = this.scene.scene.get('UIScene') as import('../scenes/UIScene').UIScene;
    
    // 카드를 화면 중앙에 순차적으로 표시
    uiScene.showBladeDanceCard(card, index + 1, cards.length, () => {
      if (card.type === 'sword') {
        // 무기 카드: 장착 (발도 공격 포함)
        this.scene.animationHelper.showMessage(`💃 ${card.data.name} 장착!`, COLORS.message.error);
        this.equipSword(card.data as SwordCard, targetEnemy);
        
        this.scene.time.delayedCall(500, () => {
          this.executeBladeDanceCards(cards, index + 1, targetEnemy);
        });
      } else {
        // 스킬 카드
        const skillCard = card.data as SkillCard;
        
        // 무기가 없거나 내구도가 부족하면 손패로
        if (!sword || sword.currentDurability < skillCard.durabilityCost) {
          this.scene.playerState.hand.push(card);
          this.scene.animationHelper.showMessage(`${skillCard.name} → 손패`, COLORS.message.discard);
          
          this.scene.time.delayedCall(300, () => {
            this.executeBladeDanceCards(cards, index + 1, targetEnemy);
          });
          return;
        }
        
        // 스킬 발동 (마나 소모 없이)
        this.scene.animationHelper.showMessage(`💃 ${skillCard.name}!`, COLORS.message.success);
        
        // 내구도 소모
        if (skillCard.durabilityCost > 0 && this.scene.playerState.currentSword) {
          this.scene.playerState.currentSword.currentDurability -= skillCard.durabilityCost;
          this.scene.updatePlayerWeaponDisplay();
          
          if (this.scene.playerState.currentSword.currentDurability <= 0) {
            this.scene.animationHelper.showMessage(`${this.scene.playerState.currentSword.name}이(가) 부서졌다!`, COLORS.message.error);
            this.scene.playerState.currentSword = null;
            this.scene.updatePlayerWeaponDisplay();
            this.scene.events.emit('handUpdated');  // 스킬 사용 가능 여부 갱신
          }
        }
        
        // 공격/방어/버프 실행
        if (skillCard.type === 'attack' || skillCard.type === 'special') {
          this.scene.combatSystem.executeAttack(skillCard, targetEnemy);
        } else if (skillCard.type === 'defense') {
          this.scene.combatSystem.executeDefense(skillCard);
        }
        // buff는 스킵 (검의 춤에서 버프는 발동하지 않음)
        
        // 무덤으로
        this.scene.playerState.discard.push(card);
        
        this.scene.time.delayedCall(400, () => {
          this.executeBladeDanceCards(cards, index + 1, targetEnemy);
        });
      }
    });
  }
  
  /**
   * 납도 - 무기를 손패로 되돌리고 맨손 상태로 만듦
   * 납도 카드는 무덤 대신 손패로 돌아옴 (useSkill에서 처리)
   */
  private executeSheathe(_targetEnemy?: Enemy) {
    const sword = this.scene.playerState.currentSword;
    
    if (!sword) {
      this.scene.animationHelper.showMessage('장착된 무기가 없다!', COLORS.message.error);
      return;
    }
    
    this.scene.animationHelper.showMessage('⚔️ 납도! 무기를 손으로 되돌린다', COLORS.message.warning);
    
    // 무기를 손패로 되돌림
    this.scene.playerState.hand.push({ type: 'sword', data: { ...sword } });
    
    // 맨손 상태로
    this.scene.playerState.currentSword = null;
    this.scene.updatePlayerWeaponDisplay();
    
    this.scene.events.emit('handUpdated');
  }
  
  // ========== 카드 드로우 ==========
  
drawCards(count: number) {
    const drawnCards: Card[] = [];

    for (let i = 0; i < count; i++) {
      // 손패가 최대일 때 가장 오래된 카드 버림
      if (this.scene.playerState.hand.length >= GAME_CONSTANTS.MAX_HAND_SIZE) {
        const discarded = this.scene.playerState.hand.shift();
        if (discarded) {
          this.scene.playerState.discard.push(discarded);
        }
      }

      // 덱이 비었으면 무덤 셔플
      if (this.scene.playerState.deck.length === 0) {
        if (this.scene.playerState.discard.length === 0) break;
        this.scene.playerState.deck = [...this.scene.playerState.discard];
        this.scene.playerState.discard = [];
        this.shuffleArray(this.scene.playerState.deck);
        this.scene.animationHelper.showMessage('덱 셔플!', COLORS.message.warning);
      }

      const card = this.scene.playerState.deck.pop();
      if (card) {
        drawnCards.push(card);
      }
    }
    
    // 드로우할 카드가 없으면 바로 업데이트
    if (drawnCards.length === 0) {
      this.scene.events.emit('handUpdated');
      return;
    }

    // UIScene에서 애니메이션 + 카드 추가 (콜백 기반, 타이밍 추측 없음!)
    const uiScene = this.scene.scene.get('UIScene') as import('../scenes/UIScene').UIScene;
    uiScene.animateDrawCards(drawnCards, () => {
      // 모든 드로우 완료 후 stats 업데이트
      this.scene.events.emit('statsUpdated');
    });
  }
  
  /**
   * 게임 시작 시 무기 1장을 보장하는 드로우
   * - 무기 1장을 먼저 뽑고 나머지 카드를 랜덤으로 드로우
   */
  drawCardsWithGuaranteedWeapon(count: number) {
    const drawnCards: Card[] = [];
    const deck = this.scene.playerState.deck;
    
    // 1. 덱에서 무기 카드 찾기
    const weaponIndex = deck.findIndex(card => card.type === 'sword');
    
    if (weaponIndex !== -1) {
      // 무기 카드를 덱에서 제거하고 드로우 목록에 추가
      const [weaponCard] = deck.splice(weaponIndex, 1);
      drawnCards.push(weaponCard);
    }
    
    // 2. 나머지 카드 랜덤 드로우
    const remainingCount = count - drawnCards.length;
    for (let i = 0; i < remainingCount; i++) {
      if (deck.length === 0) break;
      
      const card = deck.pop();
      if (card) {
        drawnCards.push(card);
      }
    }
    
    // 드로우할 카드가 없으면 바로 업데이트
    if (drawnCards.length === 0) {
      this.scene.events.emit('handUpdated');
      return;
    }
    
    // UIScene에서 애니메이션 + 카드 추가
    const uiScene = this.scene.scene.get('UIScene') as import('../scenes/UIScene').UIScene;
    uiScene.animateDrawCards(drawnCards, () => {
      this.scene.events.emit('statsUpdated');
    });
  }
  
  // ========== 카드 교환 ==========
  
  toggleExchangeMode() {
    if (this.scene.gameState.phase !== 'combat') return;
    
    this.scene.isExchangeMode = !this.scene.isExchangeMode;
    this.scene.isTargetingMode = false;
    this.scene.pendingCard = null;
    
    if (this.scene.isExchangeMode) {
      this.scene.animationHelper.showMessage('교환할 카드를 선택하세요', COLORS.message.warning);
    }
    
    this.scene.events.emit('modeChanged');
    this.scene.events.emit('handUpdated');
  }
  
  exchangeCard(index: number) {
    if (!this.scene.isExchangeMode) return;
    if (index < 0 || index >= this.scene.playerState.hand.length) return;
    
    // 카드 스프라이트 추출 (무덤 애니메이션용)
    const uiScene = this.scene.scene.get('UIScene') as any;
    const cardSprite = uiScene?.cardUI?.extractCardForAnimation(index);
    
    const card = this.scene.playerState.hand.splice(index, 1)[0];
    
    // 신기루 카드는 무덤으로 가지 않고 사라짐
    const isMirage = card.type === 'sword' && (card.data as SwordCard).isMirage;
    
    if (isMirage) {
      // 신기루 사라지는 애니메이션
      if (cardSprite) {
        this.animateMirageDisappear(cardSprite);
      }
      this.scene.animationHelper.showMessage('✨ 잔광이 사라졌다...', COLORS.text.muted);
    } else {
      // 일반 카드는 무덤으로
    this.scene.playerState.discard.push(card);
      if (cardSprite) {
        uiScene.animateCardSpriteToGrave(cardSprite);
      }
    this.scene.animationHelper.showMessage(`${card.data.name} → 교환!`, COLORS.message.warning);
    }
    
    this.drawCards(1);
    
    this.scene.isExchangeMode = false;
    this.scene.events.emit('exchangeUsed');  // 교환 사용 완료 이벤트
    this.scene.events.emit('modeChanged');
    this.scene.events.emit('handUpdated');
    this.scene.events.emit('statsUpdated');
  }
  
  // ========== 타겟 선택 ==========
  
  startTargeting(card: Card, index: number) {
    if (this.scene.gameState.phase !== 'combat') return;
    if (this.scene.isExchangeMode) return;
    
    if (this.scene.playerState.mana < card.data.manaCost) {
      this.scene.animationHelper.showMessage('마나 부족!', COLORS.effect.damage);
      return;
    }
    
    // 스킬 카드의 경우 방어/버프는 바로 사용
    if (card.type === 'skill') {
      const skill = card.data as SkillCard;
      if (skill.type === 'buff' || skill.type === 'defense') {
        this.executeCard(index);
        return;
      }
    }
    
    // 무기 카드 또는 공격/특수 스킬은 타겟 선택 모드로
    this.scene.isTargetingMode = true;
    this.scene.pendingCard = { card, index };
    
    // 공격 범위 계산
    let reach = 'single';
    const sword = this.scene.playerState.currentSword;
    
    if (card.type === 'sword') {
      // 무기 카드: 발도 범위
      reach = (card.data as SwordCard).drawAttack.reach;
    } else {
      // 스킬 카드: 스킬 범위 (single이면 무기 범위)
      const skill = card.data as SkillCard;
      if (skill.reach === 'single' && sword) {
        reach = sword.reach;
      } else if (skill.reach === 'swordDouble' && sword) {
        const swordTargetCount = this.scene.combatSystem.getTargetCountByReach(sword.reach);
        reach = swordTargetCount * 2 >= 4 ? 'all' : 
               swordTargetCount * 2 === 2 ? 'double' :
               swordTargetCount * 2 === 3 ? 'triple' : 'double';
      } else {
        reach = skill.reach;
      }
    }
    
    const message = card.type === 'sword' ? '발도 공격 대상을 선택하세요' : '공격할 적을 선택하세요';
    this.scene.animationHelper.showMessage(message, COLORS.message.error);
    this.scene.events.emit('modeChanged');
    this.scene.events.emit('targetingStarted', reach);
  }
  
  selectTarget(enemyId: string) {
    if (!this.scene.isTargetingMode || !this.scene.pendingCard) return;
    
    const enemy = this.scene.gameState.enemies.find(e => e.id === enemyId);
    if (!enemy) return;
    
    // 도발 중인 적들 찾기 (여러 명 가능)
    const tauntingEnemies = this.scene.gameState.enemies.filter(
      e => e.isTaunting && (e.tauntDuration ?? 0) > 0
    );
    
    // 도발 중인 적이 있으면, 도발 중인 적들만 타겟 가능
    if (tauntingEnemies.length > 0) {
      const isTargetTaunting = tauntingEnemies.some(e => e.id === enemyId);
      if (!isTargetTaunting) {
      this.scene.animationHelper.showMessage('🛡️ 도발된 적만 공격 가능!', COLORS.message.error);
      return;
      }
    }
    
    // 데미지 미리보기 숨기기
    this.scene.enemyManager.hideDamagePreview();
    
    this.useCardOnTarget(this.scene.pendingCard.index, enemy);
    this.cancelTargeting();
  }
  
  cancelTargeting() {
    this.scene.isTargetingMode = false;
    this.scene.pendingCard = null;
    this.scene.events.emit('modeChanged');
    this.scene.events.emit('targetingCancelled');
  }
  
  // ========== 카드 드롭 ==========
  
  dropCard() {
    if (Math.random() < 0.25) {
      const sword = getRandomSword(this.scene.gameState.currentWave);
      this.scene.playerState.discard.push({ type: 'sword', data: sword });
      this.scene.animationHelper.showMessage(`${sword.displayName} 획득!`, COLORS.message.success);
    } else {
      const skill = getRandomSkill();
      this.scene.playerState.discard.push({ type: 'skill', data: skill });
      this.scene.animationHelper.showMessage(`${skill.name} 획득!`, COLORS.message.success);
    }
  }
  
  // ========== 잔광 (특수 유니크 무기) ==========
  
  /**
   * 턴 시작 시 잔광 출현 확률 체크
   * - 맨손이고 손패가 12장 미만: 33%
   */
  trySpawnJangwang() {
    const hand = this.scene.playerState.hand;
    const currentSword = this.scene.playerState.currentSword;
    
    // 손패가 12장이면 등장 불가
    if (hand.length >= 12) return;
    
    // 맨손일 때만 33% 확률로 등장
    if (currentSword !== null) return;
    
    if (Math.random() < 0.33) {
      const jangwang = createJangwang();
      this.scene.playerState.hand.push({ type: 'sword', data: jangwang });
      this.scene.animationHelper.showMessage('✨ 잔광이 나타났다!', COLORS.message.levelUp);
      this.scene.events.emit('handUpdated');
    }
  }
  
  /**
   * 턴 종료 시 신기루 카드 처리 (사용하지 않으면 사라짐)
   */
  removeMirageCards() {
    const hand = this.scene.playerState.hand;
    const uiScene = this.scene.scene.get('UIScene') as any;
    
    // 신기루 카드 찾기 (역순으로 처리하여 인덱스 문제 방지)
    for (let i = hand.length - 1; i >= 0; i--) {
      const card = hand[i];
      if (card.type === 'sword' && (card.data as SwordCard).isMirage) {
        // 카드 스프라이트 추출
        const cardSprite = uiScene?.cardUI?.extractCardForAnimation(i);
        
        // 손패에서 제거 (무덤으로 가지 않음 - 완전히 사라짐)
        hand.splice(i, 1);
        
        // 사라지는 애니메이션
        if (cardSprite) {
          this.animateMirageDisappear(cardSprite);
        }
        
        this.scene.animationHelper.showMessage('✨ 잔광이 사라졌다...', COLORS.text.muted);
      }
    }
    
    this.scene.events.emit('handUpdated');
  }
  
  /**
   * 신기루 카드 사라지는 애니메이션 (위로 올라가며 반투명해짐)
   */
  private animateMirageDisappear(cardSprite: Phaser.GameObjects.Container) {
    cardSprite.setDepth(3000);
    
    this.scene.tweens.add({
      targets: cardSprite,
      y: cardSprite.y - 150,
      alpha: 0,
      scale: 0.8,
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        cardSprite.destroy();
      },
    });
  }
  
  // ========== 유틸리티 ==========
  
  shuffleArray<T>(array: T[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  
  /**
   * 덱이 비어있으면 무덤을 셔플하여 덱으로 리필
   * @returns 덱에 카드가 있으면 true, 둘 다 비어있으면 false
   */
  refillDeckIfNeeded(): boolean {
    if (this.scene.playerState.deck.length === 0) {
      if (this.scene.playerState.discard.length === 0) return false;
      this.scene.playerState.deck = [...this.scene.playerState.discard];
      this.scene.playerState.discard = [];
      this.shuffleArray(this.scene.playerState.deck);
      this.scene.animationHelper.showMessage('덱 셔플!', COLORS.message.warning);
    }
    return true;
  }
}

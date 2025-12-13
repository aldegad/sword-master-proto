import type { GameScene } from '../scenes/GameScene';
import type { Card, SwordCard, SkillCard, Enemy } from '../types';
import { GAME_CONSTANTS } from '../types';
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
    
    // 카드 시작 위치 (손패 영역 중앙)
    const cardStartX = this.scene.cameras.main.width / 2;
    const cardStartY = this.scene.cameras.main.height - 90;
    
    // 적 위치 계산 (무기/스킬 공통)
    const enemies = this.scene.gameState.enemies;
    const target = targetEnemy || (enemies.length > 0 ? enemies[0] : null);
    const targetSprite = target ? this.scene.enemySprites.get(target.id) : null;
    const targetX = targetSprite ? targetSprite.x : this.scene.cameras.main.width - 180;
    const targetY = targetSprite ? targetSprite.y : this.scene.GROUND_Y - 30;
    
    if (card.type === 'sword') {
      // 무기 카드: 적에게 날아가서 때리고 플레이어에게 돌아옴 (발도!)
      this.scene.animationHelper.cardToPlayer(
        cardStartX,
        cardStartY,
        targetX,
        targetY,
        card.data.emoji,
        card.data.name
      );
      this.equipSword(card.data, targetEnemy);
    } else {
      // 스킬 카드: 적에게 날아가는 애니메이션
      const skill = card.data as SkillCard;
      const isChargeAttack = skill.effect?.type === 'chargeAttack';
      
      if (enemies.length > 0) {
        // 강타(chargeAttack)는 카운트 영역으로 날아감
        if (isChargeAttack) {
          this.scene.animationHelper.cardToCount(
            cardStartX,
            cardStartY,
            card.data.emoji,
            card.data.name
          );
        } else if (card.data.type === 'attack' || card.data.type === 'special' || card.data.type === 'defense') {
          // 다른 공격/스페셜/방어 스킬은 적에게 날아감
          this.scene.animationHelper.cardToEnemy(
            cardStartX,
            cardStartY,
            targetX,
            targetY,
            card.data.emoji,
            card.data.name
          );
        }
      }
      
      const success = this.useSkill(card.data, targetEnemy);
      if (!success) {
        this.scene.playerState.mana += manaCost;
        return;
      }
    }
    
    // 손패에서 제거
    this.scene.playerState.hand.splice(index, 1);
    
    // 스킬 카드만 무덤으로
    if (card.type === 'skill') {
      this.scene.playerState.discard.push(card);
    }
    
    // 신속 여부 체크:
    // - 스킬 카드: isSwift 속성 확인
    // - 무기 카드: 발도 스킬의 isSwift 속성 확인
    const isSwift = card.type === 'skill' 
      ? card.data.isSwift 
      : card.data.drawAttack?.isSwift;
    
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
    // 기존 무기가 있고 내구도가 남아있으면 무덤으로
    if (this.scene.playerState.currentSword && this.scene.playerState.currentSword.currentDurability > 0) {
      this.scene.playerState.discard.push({ 
        type: 'sword', 
        data: { ...this.scene.playerState.currentSword } 
      });
      this.scene.animationHelper.showMessage(`${this.scene.playerState.currentSword.name} → 무덤`, COLORS.message.discard);
    }
    
    // 무기 장착 시 attak 애니메이션 재생 (스케일 애니메이션 제거)
    this.scene.playAttakAnimation();
    
    // 새 무기 장착
    this.scene.playerState.currentSword = { ...sword };
    this.scene.updatePlayerWeaponDisplay();
    
    this.scene.animationHelper.showMessage(`${sword.name} 장착!`, COLORS.message.success);
    
    // 발도 공격 실행 (타겟 지정 포함)
    if (this.scene.gameState.phase === 'combat' && this.scene.gameState.enemies.length > 0) {
      // 무기 장착 = 공격으로 간주 (이어베기 조건용)
      this.scene.playerState.usedAttackThisTurn = true;
      
      this.scene.time.delayedCall(150, () => {
        this.executeDrawAttack(sword, targetEnemy);
      });
    }
  }
  
  executeDrawAttack(sword: SwordCard, targetEnemy?: Enemy) {
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
    }
    
    let damage = sword.attack * drawAtk.multiplier;
    
    // 타겟이 지정되었으면 해당 타겟 기준으로 범위 공격, 아니면 기본 범위 공격
    let targets: Enemy[];
    if (targetEnemy) {
      targets = this.scene.combatSystem.getTargetsByReachFromEnemy(drawAtk.reach, targetEnemy);
    } else {
      targets = this.scene.combatSystem.getTargetsByReach(drawAtk.reach);
    }
    
    // 크리티컬 조건 체크
    let isCritical = false;
    if (drawAtk.criticalCondition === 'enemyDelay1') {
      // 적 중 대기가 1인 적이 있는지 확인
      const hasDelay1Enemy = targets.some(enemy => 
        enemy.actionQueue.length > 0 && enemy.actionQueue[0].currentDelay === 1
      );
      if (hasDelay1Enemy) {
        isCritical = true;
        damage *= 2.0;  // 크리티컬 200%
      }
    }
    
    this.scene.animationHelper.playerAttack();
    
    // 메시지 표시
    if (drawAtk.isSwift) {
      this.scene.animationHelper.showMessage(`⚡ ${drawAtk.name}!`, COLORS.message.info);
    } else {
      this.scene.animationHelper.showMessage(`⚔️ ${drawAtk.name}!`, COLORS.message.warning);
    }
    
    if (isCritical) {
      this.scene.animationHelper.showMessage('💥 크리티컬!', COLORS.message.error);
    }
    
    targets.forEach(enemy => {
      // 크리티컬이면 방어 무시
      const actualDamage = isCritical || drawAtk.pierce 
        ? damage 
        : Math.max(1, damage - enemy.defense);
      this.scene.combatSystem.damageEnemy(enemy, actualDamage);
    });
    
    // 참고: 적 대기턴/카운트 효과 감소는 executeCard에서 처리됨
    // (발도가 신속이면 executeCard에서 이미 스킵됨)
    
    this.scene.events.emit('statsUpdated');
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
    } else if (skill.type === 'buff') {
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
  }
  
  /**
   * 납도 - 현재 무기의 발도 스킬 재시전
   */
  private executeSheathe(targetEnemy?: Enemy) {
    const sword = this.scene.playerState.currentSword;
    
    if (!sword) {
      this.scene.animationHelper.showMessage('장착된 무기가 없다!', COLORS.message.error);
      return;
    }
    
    this.scene.animationHelper.showMessage('⚔️ 납도!', COLORS.message.warning);
    
    // 발도 공격 실행
    this.scene.time.delayedCall(200, () => {
      this.executeDrawAttack(sword, targetEnemy);
    });
  }
  
  // ========== 카드 드로우 ==========
  
  drawCards(count: number) {
    // 카드 뽑기는 애니메이션 없음 (attak은 공격/장착용)
    for (let i = 0; i < count; i++) {
      if (this.scene.playerState.hand.length >= GAME_CONSTANTS.MAX_HAND_SIZE) {
        const discarded = this.scene.playerState.hand.shift();
        if (discarded) {
          this.scene.playerState.discard.push(discarded);
        }
      }
      
      if (this.scene.playerState.deck.length === 0) {
        if (this.scene.playerState.discard.length === 0) break;
        this.scene.playerState.deck = [...this.scene.playerState.discard];
        this.scene.playerState.discard = [];
        this.shuffleArray(this.scene.playerState.deck);
        this.scene.animationHelper.showMessage('덱 셔플!', COLORS.message.warning);
      }
      
      const card = this.scene.playerState.deck.pop();
      if (card) {
        this.scene.playerState.hand.push(card);
      }
    }
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
    
    const card = this.scene.playerState.hand.splice(index, 1)[0];
    this.scene.playerState.discard.push(card);
    
    this.drawCards(1);
    
    this.scene.animationHelper.showMessage(`${card.data.name} → 교환!`, COLORS.message.warning);
    
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
    
    const message = card.type === 'sword' ? '발도 공격 대상을 선택하세요' : '공격할 적을 선택하세요';
    this.scene.animationHelper.showMessage(message, COLORS.message.error);
    this.scene.events.emit('modeChanged');
    this.scene.events.emit('targetingStarted');
  }
  
  selectTarget(enemyId: string) {
    if (!this.scene.isTargetingMode || !this.scene.pendingCard) return;
    
    const enemy = this.scene.gameState.enemies.find(e => e.id === enemyId);
    if (!enemy) return;
    
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
  
  // ========== 유니크 무기 ==========
  
  tryAddUniqueWeapon() {
    const lightBladePassive = this.scene.playerState.passives.find(p => p.id === 'lightBlade');
    if (!lightBladePassive || lightBladePassive.level === 0) return;
    
    const chance = lightBladePassive.effect.value * lightBladePassive.level;
    if (Math.random() < chance) {
      const jangwang = createJangwang();
      this.scene.playerState.hand.push({ type: 'sword', data: jangwang });
      this.scene.animationHelper.showMessage('✨ 잔광이 나타났다!', COLORS.message.levelUp);
    }
  }
  
  // ========== 유틸리티 ==========
  
  shuffleArray<T>(array: T[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}


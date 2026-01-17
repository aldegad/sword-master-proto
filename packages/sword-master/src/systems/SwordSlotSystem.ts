import type { GameScene } from '../scenes/GameScene';
import type { SwordCard, Enemy } from '../types';
import { MAX_SWORD_SLOTS, getEquippedSword, getEquipCost } from '../types';
import { createSwordCard } from '../data/swords';
import { getStarterSwords } from '../data/skills';
import { COLORS } from '../constants/colors';

/**
 * 검 슬롯 시스템
 * - 검 보유 및 장착 관리 (덱/손패와 분리)
 * - 최대 7자루 보유
 * - 장착 변경 시 마나 소모 + 발도 공격
 */
export class SwordSlotSystem {
  private scene: GameScene;

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  /**
   * 시작 검 지급 (katana, wakizashi, pagapdo)
   */
  initializeStarterSwords(): void {
    const starterSwordIds = getStarterSwords();
    const swords: SwordCard[] = [];

    for (const swordId of starterSwordIds) {
      const sword = createSwordCard(swordId);
      if (sword) {
        swords.push(sword);
      }
    }

    this.scene.playerState.swordInventory = swords;
    this.scene.playerState.equippedSwordIndex = 0; // 첫 번째 검(katana) 자동 장착

    // 무기 표시 업데이트
    this.scene.updatePlayerWeaponDisplay();
  }

  /**
   * 현재 장착된 검 가져오기
   */
  getEquippedSword(): SwordCard | null {
    return getEquippedSword(this.scene.playerState);
  }

  /**
   * 검 장착 변경 (마나 소모 + 발도 공격)
   * @param index 장착할 검의 인덱스
   * @param targetEnemy 발도 공격 대상 (선택)
   * @returns 장착 성공 여부
   */
  equipSword(index: number, targetEnemy?: Enemy): boolean {
    const state = this.scene.playerState;

    // 인덱스 유효성 체크
    if (index < 0 || index >= state.swordInventory.length) {
      return false;
    }

    // 이미 장착 중인 검
    if (index === state.equippedSwordIndex) {
      this.scene.animationHelper.showMessage('이미 장착 중!', COLORS.message.info);
      return false;
    }

    const targetSword = state.swordInventory[index];
    const cost = getEquipCost(targetSword);

    // 마나 체크
    if (state.mana < cost) {
      this.scene.animationHelper.showMessage(`마나 부족! (필요: ${cost})`, COLORS.message.error);
      return false;
    }

    // 마나 소모
    state.mana -= cost;

    // 이전 장착 검 (발도 신속 판단용)
    const wasBarehanded = state.equippedSwordIndex < 0;

    // 장착 변경
    state.equippedSwordIndex = index;

    // 무기 표시 업데이트
    this.scene.updatePlayerWeaponDisplay();

    // 장착 메시지
    const costMsg = cost > 0 ? ` (◈${cost})` : '';
    this.scene.animationHelper.showMessage(`${targetSword.name} 장착!${costMsg}`, COLORS.message.success);

    // 발도 공격 실행 (전투 중일 때만)
    if (this.scene.gameState.phase === 'combat' && this.scene.gameState.enemies.length > 0) {
      // 공격 사용으로 간주 (이어베기 조건용)
      state.usedAttackThisTurn = true;

      // 크리티컬 조건 사전 체크 (대기 감소보다 먼저)
      const drawAtk = targetSword.drawAttack;
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

      // 대기턴 증가 효과 적용
      if (targetSword.delayIncreaseOnHit && targetSword.delayIncreaseOnHit > 0) {
        targets.forEach(enemy => {
          if (enemy.hp > 0) {
            this.scene.combatSystem.increaseEnemyDelay(enemy, targetSword.delayIncreaseOnHit!);
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

      // 발도 공격 (약간의 딜레이 후)
      this.scene.time.delayedCall(150, () => {
        this.executeDrawAttack(targetSword, targetEnemy, wasBarehanded, preCriticalCheck);
      });
    }

    // 이벤트 발생
    this.scene.events.emit('swordEquipped', { index, sword: targetSword });
    this.scene.events.emit('statsUpdated');

    return true;
  }

  /**
   * 발도 공격 실행 (CardSystem의 executeDrawAttack과 동일한 로직)
   */
  private executeDrawAttack(sword: SwordCard, targetEnemy?: Enemy, wasBarehanded: boolean = false, preCritical: boolean = false): void {
    const drawAtk = sword.drawAttack;

    // 내구도 체크
    if (sword.currentDurability < drawAtk.durabilityCost) {
      return;
    }

    // 내구도 소모
    sword.currentDurability -= drawAtk.durabilityCost;
    this.scene.updatePlayerWeaponDisplay();

    // 무기 파괴 체크
    if (sword.currentDurability <= 0) {
      this.scene.animationHelper.showMessage(`${sword.name}이(가) 부서졌다!`, COLORS.message.error);
      // 파괴된 검은 인벤토리에서 제거
      this.removeSword(this.scene.playerState.equippedSwordIndex);
      this.scene.events.emit('handUpdated');
      return;
    }

    // 집중 버프 적용
    let focusMultiplier = 1.0;
    this.scene.playerState.buffs.forEach(buff => {
      if (buff.id === 'focus') {
        focusMultiplier += buff.value;
      }
    });

    let damage = sword.attack * drawAtk.multiplier * focusMultiplier;

    // 타겟 계산
    let targets: Enemy[];
    if (targetEnemy) {
      targets = this.scene.combatSystem.getTargetsByReachFromEnemy(drawAtk.reach, targetEnemy);
    } else {
      targets = this.scene.combatSystem.getTargetsByReach(drawAtk.reach);
    }

    // 크리티컬 체크
    let isCritical = preCritical;
    if (isCritical && drawAtk.criticalMultiplier) {
      damage *= drawAtk.criticalMultiplier;
      this.scene.animationHelper.showMessage('⚡ 크리티컬!', COLORS.message.warning);
    }

    // 관통 여부
    const isPiercing = drawAtk.pierce || (isCritical && drawAtk.criticalPierce);

    // 플레이어 공격 애니메이션
    this.scene.animationHelper.playerAttack();

    // 적에게 데미지 적용
    for (const enemy of targets) {
      let finalDamage = damage;

      // 방어력 계산 (관통 시 무시)
      if (!isPiercing) {
        finalDamage = Math.max(0, finalDamage - enemy.defense);
      }

      // 데미지 적용
      this.scene.combatSystem.damageEnemy(enemy, finalDamage, isCritical);

      // 방어력 감소 효과
      if (drawAtk.armorReduce && drawAtk.armorReduce > 0) {
        const actualEnemy = this.scene.gameState.enemies.find(e => e.id === enemy.id);
        if (actualEnemy) {
          actualEnemy.defense = Math.max(0, actualEnemy.defense - drawAtk.armorReduce);
          this.scene.enemyManager.updateEnemySprite(actualEnemy);
        }
      }

      // 출혈 효과
      const bleed = sword.bleedOnHit || (isCritical && drawAtk.criticalBleed ? drawAtk.criticalBleed : null);
      if (bleed) {
        const actualEnemy = this.scene.gameState.enemies.find(e => e.id === enemy.id);
        if (actualEnemy) {
          actualEnemy.bleeds.push({ damage: bleed.damage, duration: bleed.duration });
          this.scene.animationHelper.showMessage(`🩸 출혈! ${bleed.damage}뎀/${bleed.duration}턴`, COLORS.effect.damage);
          this.scene.enemyManager.updateEnemySprite(actualEnemy);
        }
      }

      // 독 효과
      const poison = sword.poisonOnHit || (isCritical && drawAtk.criticalPoison ? drawAtk.criticalPoison : null);
      if (poison) {
        const actualEnemy = this.scene.gameState.enemies.find(e => e.id === enemy.id);
        if (actualEnemy) {
          actualEnemy.poisons.push({ damage: poison.damage, duration: poison.duration });
          this.scene.animationHelper.showMessage(`☠️ 독! ${poison.damage}뎀/${poison.duration}턴`, COLORS.effect.damage);
          this.scene.enemyManager.updateEnemySprite(actualEnemy);
        }
      }

      // 스킬 취소 효과
      if (drawAtk.cancelEnemySkill || (isCritical && drawAtk.criticalCancelEnemySkill)) {
        const actualEnemy = this.scene.gameState.enemies.find(e => e.id === enemy.id);
        if (actualEnemy && actualEnemy.actionQueue && actualEnemy.actionQueue.length > 0) {
          const cancelledAction = actualEnemy.actionQueue.shift()!;
          this.scene.animationHelper.showMessage(`🚫 ${cancelledAction.name} 취소!`, COLORS.message.warning);
          this.scene.enemyManager.updateEnemyActionDisplay();
        }
      }
    }

    // 신속 발도 여부 (맨손이었거나 단검의 신속 발도)
    const isSwift = wasBarehanded || drawAtk.isSwift;

    if (!isSwift) {
      // 일반 발도: 적 대기턴 -1
      this.scene.combatSystem.reduceAllEnemyDelays(1);
      // 카운트 효과 -1
      this.scene.combatSystem.reduceCountEffects();
    } else {
      this.scene.animationHelper.showMessage('⚡ 신속 발도!', COLORS.message.info);
    }

    // 집중 버프 소모
    const focusBuffIndex = this.scene.playerState.buffs.findIndex(b => b.id === 'focus');
    if (focusBuffIndex >= 0) {
      this.scene.playerState.buffs.splice(focusBuffIndex, 1);
    }

    this.scene.events.emit('statsUpdated');
  }

  /**
   * 새 검 획득
   * @param sword 획득할 검
   */
  acquireSword(sword: SwordCard): void {
    const state = this.scene.playerState;

    if (state.swordInventory.length < MAX_SWORD_SLOTS) {
      // 슬롯에 여유가 있음
      state.swordInventory.push(sword);
      this.scene.animationHelper.showMessage(`${sword.name} 획득!`, COLORS.message.success);
      this.scene.events.emit('swordAcquired', sword);
    } else {
      // 7자루 이상 - 교체 UI 표시
      this.scene.events.emit('showSwordReplaceUI', sword);
    }

    this.scene.events.emit('statsUpdated');
  }

  /**
   * 검 교체 (7자루 상태에서 새 검 획득 시)
   * @param replaceIndex 버릴 검의 인덱스
   * @param newSword 새로 획득할 검
   */
  replaceSword(replaceIndex: number, newSword: SwordCard): void {
    const state = this.scene.playerState;

    if (replaceIndex < 0 || replaceIndex >= state.swordInventory.length) {
      return;
    }

    const discardedSword = state.swordInventory[replaceIndex];
    state.swordInventory[replaceIndex] = newSword;

    // 버린 검이 장착 중이었으면 새 검이 자동 장착됨

    this.scene.animationHelper.showMessage(
      `${discardedSword.name} → ${newSword.name}`,
      COLORS.message.warning
    );

    this.scene.events.emit('swordReplaced', { discarded: discardedSword, acquired: newSword });
    this.scene.events.emit('statsUpdated');
  }

  /**
   * 검 제거 (파괴됨)
   * @param index 제거할 검의 인덱스
   */
  removeSword(index: number): void {
    const state = this.scene.playerState;

    if (index < 0 || index >= state.swordInventory.length) {
      return;
    }

    state.swordInventory.splice(index, 1);

    // 장착 인덱스 조정
    if (state.equippedSwordIndex === index) {
      // 장착 중인 검이 파괴됨 - 맨손 또는 다음 검 장착
      if (state.swordInventory.length > 0) {
        state.equippedSwordIndex = Math.min(index, state.swordInventory.length - 1);
      } else {
        state.equippedSwordIndex = -1;
      }
    } else if (state.equippedSwordIndex > index) {
      // 앞쪽 검이 제거되면 인덱스 조정
      state.equippedSwordIndex--;
    }

    this.scene.updatePlayerWeaponDisplay();
    this.scene.events.emit('statsUpdated');
  }

  /**
   * 검 내구도 회복 (연마 스킬 등)
   * @param amount 회복량
   */
  restoreAllDurability(amount: number): void {
    for (const sword of this.scene.playerState.swordInventory) {
      sword.currentDurability = Math.min(
        sword.currentDurability + amount,
        sword.durability
      );
    }
    this.scene.updatePlayerWeaponDisplay();
  }
}

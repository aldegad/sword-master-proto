import type { GameScene } from '../scenes/GameScene';
import type { DrawAttack, Enemy, SwordCard } from '../types';
import { COLORS } from '../constants/colors';

type TickStatusType = 'bleed' | 'poison';
type TickDamageMode = 'total' | 'perStack';

interface TickStatusOptions {
  damageMode?: TickDamageMode;
}

interface ArmorReductionOptions {
  includeEnemyName?: boolean;
}

interface WeaponOnHitOptions {
  armorBreakMessageWithEnemyName?: boolean;
}

function resolveEnemy(scene: GameScene, enemy: Enemy): Enemy {
  return scene.gameState.enemies.find((e) => e.id === enemy.id) ?? enemy;
}

function applyBleed(
  scene: GameScene,
  enemy: Enemy,
  damage: number,
  duration: number,
  label: string = '출혈',
) {
  const target = resolveEnemy(scene, enemy);
  target.bleeds.push({ damage, duration });
  scene.animationHelper.showMessage(`🩸 ${label}! ${damage}뎀/${duration}턴`, COLORS.effect.damage);
  scene.enemyManager.updateEnemySprite(target);
}

function applyPoison(
  scene: GameScene,
  enemy: Enemy,
  damage: number,
  duration: number,
  label: string = '독',
) {
  const target = resolveEnemy(scene, enemy);
  target.poisons.push({ damage, duration });
  scene.animationHelper.showMessage(`☠️ ${label}! ${damage}뎀/${duration}턴`, COLORS.effect.damage);
  scene.enemyManager.updateEnemySprite(target);
}

export function applyArmorReduction(
  scene: GameScene,
  enemy: Enemy,
  amount: number,
  options: ArmorReductionOptions = {},
): number {
  const { includeEnemyName = true } = options;
  if (amount <= 0) return 0;

  const target = resolveEnemy(scene, enemy);
  const oldDefense = target.defense;
  const reduced = Math.min(amount, oldDefense);
  target.defense = Math.max(0, target.defense - amount);

  if (reduced > 0) {
    const targetLabel = includeEnemyName ? `${target.name} ` : '';
    scene.animationHelper.showMessage(`🔨 ${targetLabel}방어력 -${reduced}!`, COLORS.message.warning);
    scene.enemyManager.updateEnemySprite(target);
  }

  return reduced;
}

export function cancelEnemyNextAction(scene: GameScene, enemy: Enemy): boolean {
  const target = resolveEnemy(scene, enemy);
  if (!target.actionQueue || target.actionQueue.length === 0) return false;

  const cancelledAction = target.actionQueue.shift()!;
  scene.animationHelper.showMessage(`🚫 ${cancelledAction.name} 취소!`, COLORS.message.warning);
  scene.enemyManager.updateEnemyActionDisplay();
  return true;
}

export function applySwordOnHitEffects(
  scene: GameScene,
  enemy: Enemy,
  sword: SwordCard,
  options: WeaponOnHitOptions = {},
) {
  const { armorBreakMessageWithEnemyName = false } = options;

  if (sword.bleedOnHit) {
    applyBleed(scene, enemy, sword.bleedOnHit.damage, sword.bleedOnHit.duration);
  }

  if (sword.poisonOnHit) {
    applyPoison(scene, enemy, sword.poisonOnHit.damage, sword.poisonOnHit.duration);
  }

  if (sword.armorBreakOnHit && sword.armorBreakOnHit > 0) {
    applyArmorReduction(scene, enemy, sword.armorBreakOnHit, {
      includeEnemyName: armorBreakMessageWithEnemyName,
    });
  }
}

export function applyDrawAttackEffects(
  scene: GameScene,
  enemy: Enemy,
  drawAtk: DrawAttack,
) {
  if (drawAtk.armorReduce && drawAtk.armorReduce > 0) {
    applyArmorReduction(scene, enemy, drawAtk.armorReduce, { includeEnemyName: true });
  }

  if (drawAtk.cancelEnemySkill) {
    cancelEnemyNextAction(scene, enemy);
  }
}

export function applyCriticalDrawAttackEffects(
  scene: GameScene,
  enemy: Enemy,
  drawAtk: DrawAttack,
) {
  if (drawAtk.criticalBleed) {
    applyBleed(scene, enemy, drawAtk.criticalBleed.damage, drawAtk.criticalBleed.duration, '대출혈');
  }

  if (drawAtk.criticalPoison) {
    applyPoison(scene, enemy, drawAtk.criticalPoison.damage, drawAtk.criticalPoison.duration, '맹독');
  }

  if (drawAtk.criticalCancelEnemySkill) {
    cancelEnemyNextAction(scene, enemy);
  }
}

export function applyEnemyStatusTick(
  scene: GameScene,
  enemy: Enemy,
  status: TickStatusType,
  options: TickStatusOptions = {},
): number {
  const { damageMode = 'total' } = options;
  const target = resolveEnemy(scene, enemy);
  const stacks = status === 'bleed' ? target.bleeds : target.poisons;
  if (!stacks || stacks.length === 0) return 0;

  const icon = status === 'bleed' ? '🩸' : '☠️';
  const label = status === 'bleed' ? '출혈' : '독';
  let totalDamage = 0;

  stacks.forEach((stack, index) => {
    scene.animationHelper.showMessage(
      `${icon} ${target.name} ${label}${stacks.length > 1 ? `(${index + 1})` : ''}! -${stack.damage}`,
      COLORS.effect.damage,
    );
    totalDamage += stack.damage;
    stack.duration -= 1;

    if (damageMode === 'perStack') {
      scene.combatSystem.damageEnemy(target, stack.damage);
    }
  });

  if (damageMode === 'total' && totalDamage > 0) {
    scene.combatSystem.damageEnemy(target, totalDamage);
  }

  if (status === 'bleed') {
    target.bleeds = target.bleeds.filter((stack) => stack.duration > 0);
  } else {
    target.poisons = target.poisons.filter((stack) => stack.duration > 0);
  }

  scene.enemyManager.updateEnemySprite(target);
  return totalDamage;
}

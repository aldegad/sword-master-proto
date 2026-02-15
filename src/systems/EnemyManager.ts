import type { GameScene } from '../scenes/GameScene';
import type { Enemy, EnemyAction } from '../types';
import { createWaveEnemies } from '../data/enemies';
import { COLORS, COLORS_STR } from '../constants/colors';

// 적 행동 큐 아이템 타입
interface ActionQueueItem {
  enemy: Enemy;
  action: EnemyAction;
}

/**
 * 적 관리자 - 적 생성, 행동, 스프라이트 관리
 */
export class EnemyManager {
  private scene: GameScene;
  
  constructor(scene: GameScene) {
    this.scene = scene;
  }
  
  // ========== 적 생성 ==========
  
spawnWaveEnemies() {
    const enemies = createWaveEnemies(this.scene.gameState.currentWave);
    this.scene.gameState.enemies = enemies;

    // 보스 등장 시 WARNING 이펙트
    if (enemies.length === 1 && enemies[0].isBoss) {
      this.showBossWarning(() => {
        this.createEnemySprite(enemies[0]);
        this.playBossEntrance(enemies[0]);
        // 보스 스프라이트 생성 후 액션 큐 초기화 및 표시 업데이트
        this.resetEnemyActionQueue(enemies[0], true);
        this.updateEnemyActionDisplay();
      });
    } else {
      enemies.forEach(enemy => this.createEnemySprite(enemy));
    }
  }
  
  /**
   * 보스 WARNING 이펙트
   */
  private showBossWarning(onComplete: () => void) {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    // 화면 플래시
    const flash = this.scene.add.rectangle(width/2, height/2, width, height, 0xff0000, 0);
    flash.setDepth(3000);
    
    // WARNING 텍스트
    const warningContainer = this.scene.add.container(width/2, height/2);
    warningContainer.setDepth(3001);
    
    const warningBg = this.scene.add.rectangle(0, 0, 800, 200, 0x000000, 0.8);
    warningBg.setStrokeStyle(6, 0xff0000);
    
    const warningText = this.scene.add.text(0, -30, '⚠️ WARNING ⚠️', {
      font: 'bold 72px monospace',
      color: '#ff0000',
    }).setOrigin(0.5);
    
    const bossText = this.scene.add.text(0, 50, 'BOSS APPROACHING', {
      font: 'bold 36px monospace',
      color: '#ffff00',
    }).setOrigin(0.5);
    
    warningContainer.add([warningBg, warningText, bossText]);
    warningContainer.setAlpha(0);
    
    // 플래시 애니메이션
    this.scene.tweens.add({
      targets: flash,
      alpha: { from: 0, to: 0.5 },
      duration: 200,
      yoyo: true,
      repeat: 2,
    });
    
    // WARNING 표시 애니메이션
    this.scene.tweens.add({
      targets: warningContainer,
      alpha: { from: 0, to: 1 },
      duration: 300,
      onComplete: () => {
        // 깜빡임
        this.scene.tweens.add({
          targets: warningContainer,
          alpha: { from: 1, to: 0.5 },
          duration: 150,
          yoyo: true,
          repeat: 4,
          onComplete: () => {
            // 사라지기
            this.scene.tweens.add({
              targets: [warningContainer, flash],
              alpha: 0,
              duration: 500,
              onComplete: () => {
                warningContainer.destroy();
                flash.destroy();
                onComplete();
              }
            });
          }
        });
      }
    });
  }
  
  /**
   * 보스 등장 연출 (쿵!)
   */
  private playBossEntrance(enemy: Enemy) {
    const container = this.scene.enemySprites.get(enemy.id);
    if (!container) return;
    
    // 화면 위에서 내려오기
    const originalY = container.y;
    container.y = -200;
    container.setScale(1.5);
    
    // 쿵! 하고 내려오기
    this.scene.tweens.add({
      targets: container,
      y: originalY,
      scale: 1.2,  // 보스는 약간 크게
      duration: 600,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        // 화면 흔들기
        this.scene.cameras.main.shake(300, 0.02);
        this.scene.animationHelper.showMessage(`💀 ${enemy.name} 등장!`, 0xff0000);
      }
    });
  }
  
  createEnemySprite(enemy: Enemy) {
    // 적 인덱스에 따라 간격을 두고 배치 (1920x1080 스케일)
    const enemies = this.scene.gameState.enemies;
    const enemyIndex = enemies.indexOf(enemy);
    const spacing = 225; // 적 간격 (스케일)
    const baseX = this.scene.cameras.main.width - 340;
    const x = baseX - (enemyIndex * spacing) + (Math.random() * 35 - 18); // 약간의 랜덤 오프셋
    const y = this.scene.GROUND_Y - 130;  // 더 위로 올림
    
    const container = this.scene.add.container(x, y);
    
    // 적 이모지 (스케일)
    const emoji = this.scene.add.text(0, -38, enemy.emoji, {
      font: '90px Arial',
    }).setOrigin(0.5);
    
    // 적 이름 (스케일)
    const nameText = this.scene.add.text(0, 47, enemy.name, {
      font: 'bold 26px monospace',
      color: COLORS_STR.secondary.dark,
    }).setOrigin(0.5);
    
    // HP 바 (스케일)
    const hpBarBg = this.scene.add.rectangle(0, 84, 112, 15, COLORS.background.medium);
    hpBarBg.setStrokeStyle(2, COLORS.border.medium);
    const hpBar = this.scene.add.rectangle(-56, 84, 112, 15, COLORS.secondary.dark);
    hpBar.setOrigin(0, 0.5);
    (container as any).hpBar = hpBar;
    
    // 데미지 미리보기 바 (진한 빨간색, HP바 뒤에 배치)
    const damagePreviewBar = this.scene.add.rectangle(-56, 84, 112, 15, 0x8b0000);
    damagePreviewBar.setOrigin(0, 0.5);
    damagePreviewBar.setVisible(false);
    damagePreviewBar.setAlpha(0.8);
    (container as any).damagePreviewBar = damagePreviewBar;
    
    // HP 텍스트 (스케일)
    const hpText = this.scene.add.text(0, 109, `${enemy.hp}/${enemy.maxHp}`, {
      font: '22px monospace',
      color: '#ffffff',
    }).setOrigin(0.5);
    (container as any).hpText = hpText;
    (container as any).originalHpText = `${enemy.hp}/${enemy.maxHp}`;  // 원래 텍스트 저장
    
    // 방어력 표시 (버프 형태, 스케일)
    const defenseContainer = this.scene.add.container(-66, 38);
    const defenseBg = this.scene.add.rectangle(0, 0, 68, 38, COLORS.background.dark, 0.85);
    defenseBg.setStrokeStyle(2, COLORS.secondary.light);
    const defenseText = this.scene.add.text(0, 0, `🛡️${enemy.defense}`, {
      font: 'bold 20px monospace',
      color: COLORS_STR.secondary.light,
    }).setOrigin(0.5);
    defenseContainer.add([defenseBg, defenseText]);
    (container as any).defenseText = defenseText;
    (container as any).defenseContainer = defenseContainer;
    (container as any).baseDefense = enemy.defense;  // 기본 방어력 저장
    
    // 방어력이 0이면 숨김
    defenseContainer.setVisible(enemy.defense > 0);
    
    // 디버프 컨테이너 (방어력 옆에 가로로 배치)
    const debuffContainer = this.scene.add.container(10, 38);
    (container as any).debuffContainer = debuffContainer;
    
    container.add([emoji, nameText, hpBarBg, damagePreviewBar, hpBar, hpText, defenseContainer, debuffContainer]);
    
    // 타겟 강조 효과 (숨김 상태, 스케일)
    const targetHighlight = this.scene.add.rectangle(0, -19, 169, 206, COLORS.secondary.dark, 0);
    targetHighlight.setStrokeStyle(5, COLORS.primary.dark);
    targetHighlight.setVisible(false);
    (container as any).targetHighlight = targetHighlight;
    container.add(targetHighlight);
    
    // 인터랙션 (타겟 선택용, 스케일)
    const hitArea = this.scene.add.rectangle(0, 0, 169, 225, COLORS.background.black, 0);
    hitArea.setInteractive({ useHandCursor: false, cursor: 'pointer' });
    
    // 호버 효과 - 타겟팅 모드는 TargetIndicatorUI에서 처리
    // EnemyManager의 hitArea는 비타겟팅 상황에서의 기본 인터랙션용
    hitArea.on('pointerover', () => {
      // 타겟팅 모드가 아닐 때만 기본 호버 효과
      if (!this.scene.isTargetingMode) {
        targetHighlight.setVisible(true);
        targetHighlight.setFillStyle(COLORS.secondary.dark, 0.2);
      }
    });
    
    hitArea.on('pointerout', () => {
      if (!this.scene.isTargetingMode) {
        targetHighlight.setVisible(false);
      }
    });
    container.add(hitArea);
    
    // 디버프 컨테이너를 hitArea 위로 올림 (인터랙션이 가려지지 않도록)
    container.bringToTop(debuffContainer);
    
    this.scene.enemySprites.set(enemy.id, container);
    
    // 등장 애니메이션
    container.setAlpha(0);
    container.x = this.scene.cameras.main.width + 50;
    
    this.scene.tweens.add({
      targets: container,
      alpha: 1,
      x: x,
      duration: 500,
      ease: 'Power2',
    });
  }
  
  updateEnemySprite(enemy: Enemy) {
    const container = this.scene.enemySprites.get(enemy.id);
    if (!container) return;
    
    const hpBar = (container as any).hpBar as Phaser.GameObjects.Rectangle;
    const hpText = (container as any).hpText as Phaser.GameObjects.Text;
    const defenseText = (container as any).defenseText as Phaser.GameObjects.Text;
    const defenseContainer = (container as any).defenseContainer as Phaser.GameObjects.Container;
    const baseDefense = (container as any).baseDefense as number;
    
    if (hpBar) {
      const hpRatio = Math.max(0, enemy.hp / enemy.maxHp);
      hpBar.setScale(hpRatio, 1);
    }
    
    if (hpText) {
      hpText.setText(`${Math.max(0, enemy.hp)}/${enemy.maxHp}`);
    }
    
    // 방어력 업데이트
    if (defenseText && defenseContainer) {
      defenseText.setText(`🛡️${enemy.defense}`);
      defenseContainer.setVisible(enemy.defense > 0);
      
      // 기본 방어력보다 높으면 강조 (버프 상태)
      if (enemy.defense > baseDefense) {
        defenseText.setColor(COLORS_STR.primary.light);
        // 펄스 효과
        this.scene.tweens.add({
          targets: defenseContainer,
          scale: 1.2,
          duration: 150,
          yoyo: true,
          ease: 'Power2',
        });
      } else {
        defenseText.setColor(COLORS_STR.secondary.light);
      }
    }
    
    // 디버프 표시 업데이트
    this.updateDebuffDisplay(enemy, container);
  }
  
  /**
   * 적 디버프 UI 업데이트
   */
  private updateDebuffDisplay(enemy: Enemy, container: Phaser.GameObjects.Container) {
    const debuffContainer = (container as any).debuffContainer as Phaser.GameObjects.Container;
    if (!debuffContainer) return;
    
    // 기존 디버프 아이콘 제거
    debuffContainer.removeAll(true);
    
    let xOffset = 0;
    const spacing = 58;  // 디버프 아이콘 간격
    
    // 출혈 디버프 (중첩 표시)
    enemy.bleeds.forEach((bleed, index) => {
      if (bleed.duration > 0) {
        const bleedIcon = this.createDebuffIcon(
          xOffset, 0,
          '🩸',
          `${bleed.duration}`,
          COLORS.secondary.dark,
          `출혈${enemy.bleeds.length > 1 ? ` #${index + 1}` : ''}: 턴마다 ${bleed.damage} 피해\n${bleed.duration}턴 남음`
        );
        debuffContainer.add(bleedIcon);
        xOffset += spacing;
      }
    });
    
    // 독 디버프 (중첩 표시)
    enemy.poisons.forEach((poison, index) => {
      if (poison.duration > 0) {
        const poisonIcon = this.createDebuffIcon(
          xOffset, 0,
          '☠️',
          `${poison.duration}`,
          0x4B0082,  // 보라색 (독 색상)
          `독${enemy.poisons.length > 1 ? ` #${index + 1}` : ''}: 턴마다 ${poison.damage} 피해\n${poison.duration}턴 남음`
        );
        debuffContainer.add(poisonIcon);
        xOffset += spacing;
      }
    });
    
    // 스턴 디버프
    if (enemy.isStunned > 0) {
      const stunIcon = this.createDebuffIcon(
        xOffset, 0,
        '💫',
        `${enemy.isStunned}`,
        COLORS.primary.dark,
        `기절: 행동 불가\n${enemy.isStunned}턴 남음`
      );
      debuffContainer.add(stunIcon);
      xOffset += spacing;
    }
    
    // 도발 버프 (적 관점에서는 버프)
    if (enemy.isTaunting && (enemy.tauntDuration ?? 0) > 0) {
      const tauntIcon = this.createDebuffIcon(
        xOffset, 0,
        '🛡️',
        `${enemy.tauntDuration}`,
        COLORS.secondary.main,
        `도발: 이 적만 타겟 가능\n${enemy.tauntDuration}턴 남음`
      );
      debuffContainer.add(tauntIcon);
      xOffset += spacing;
    }
    
    // 디버프 컨테이너를 hitArea 위로 올림
    container.bringToTop(debuffContainer);
  }
  
  /**
   * 디버프 아이콘 생성 (툴팁 포함)
   */
  private createDebuffIcon(
    x: number,
    y: number,
    emoji: string,
    countText: string,
    bgColor: number,
    tooltipText: string
  ): Phaser.GameObjects.Container {
    const iconContainer = this.scene.add.container(x, y);
    
    // 배경
    const bg = this.scene.add.rectangle(0, 0, 52, 38, COLORS.background.dark, 0.9);
    bg.setStrokeStyle(2, bgColor);
    
    // 이모지
    const icon = this.scene.add.text(-12, 0, emoji, {
      font: '20px Arial',
    }).setOrigin(0.5);
    
    // 카운트
    const count = this.scene.add.text(14, 0, countText, {
      font: 'bold 18px monospace',
      color: COLORS_STR.text.primary,
    }).setOrigin(0.5);
    
    iconContainer.add([bg, icon, count]);
    
    // 인터랙션 (툴팁용)
    bg.setInteractive({ useHandCursor: true });
    
    bg.on('pointerover', () => {
      bg.setFillStyle(COLORS.background.medium, 0.95);
      iconContainer.setScale(1.15);
      this.showDebuffTooltip(iconContainer.x, iconContainer.y - 50, tooltipText);
    });
    
    bg.on('pointerout', () => {
      bg.setFillStyle(COLORS.background.dark, 0.9);
      iconContainer.setScale(1);
      this.hideDebuffTooltip();
    });
    
    return iconContainer;
  }
  
  removeEnemySprite(enemyId: string) {
    const sprite = this.scene.enemySprites.get(enemyId);
    if (sprite) {
      this.scene.tweens.add({
        targets: sprite,
        alpha: 0,
        y: sprite.y - 30,
        duration: 300,
        onComplete: () => {
          sprite.destroy();
          this.scene.enemySprites.delete(enemyId);
        },
      });
    }
  }
  
  // ========== 적 행동 ==========
  
  initializeEnemyActions(isFirstTurn: boolean = false) {
    this.scene.gameState.enemies.forEach(enemy => {
      this.resetEnemyActionQueue(enemy, isFirstTurn);
    });
    // 적 행동 표시 업데이트
    this.updateEnemyActionDisplay();
  }
  
  resetEnemyActionQueue(enemy: Enemy, isFirstTurn: boolean = false) {
    // 호출 쿨다운 감소 (첫 턴이 아닐 때)
    if (!isFirstTurn && enemy.summonCooldown !== undefined && enemy.summonCooldown > 0) {
      enemy.summonCooldown--;
    }
    
    // 호출 스킬 체크
    const summonAction = enemy.actions.find(a => a.effect?.type === 'summon');
    
    // 호출 쿨다운이 0이고 호출 스킬이 있으면 호출만 실행 (다른 공격 안함)
    if (summonAction && (enemy.summonCooldown === undefined || enemy.summonCooldown <= 0)) {
      enemy.actionQueue = [{
        ...summonAction,
        currentDelay: summonAction.delay,
      }];
      enemy.currentActionIndex = 0;
      return;
    }
    
    // 도발 스킬과 일반 스킬 분리 (summon 스킬 제외)
    const tauntAction = enemy.actions.find(a => a.type === 'taunt');
    const nonTauntActions = enemy.actions.filter(a => 
      a.type !== 'taunt' && a.effect?.type !== 'summon'
    );
    
    // 일반 스킬을 랜덤하게 섞기
    const shuffledActions = [...nonTauntActions].sort(() => Math.random() - 0.5);
    
    // 턴당 스킬 수 결정
    let actionCount: number;
    if (enemy.actionsPerTurn) {
      const { min, max } = enemy.actionsPerTurn;
      actionCount = Math.floor(Math.random() * (max - min + 1)) + min;
    } else {
      // 기본값: 전체 스킬 사용
      actionCount = shuffledActions.length;
    }
    
    // 도발 스킬이 있는 적은 첫 턴에 도발 스킬을 무조건 첫 번째로 사용
    // (유저에게 선제공격/대응 기회 제공 - 1대기 후 도발 발동)
    let selectedActions: typeof enemy.actions;
    if (isFirstTurn && tauntAction) {
      // 도발 스킬을 맨 앞에 배치
      selectedActions = [tauntAction, ...shuffledActions.slice(0, actionCount - 1)];
    } else {
      selectedActions = shuffledActions.slice(0, actionCount);
    }
    
    // 선택된 수만큼 스킬을 큐에 추가
    enemy.actionQueue = selectedActions.map(action => ({
      ...action,
      currentDelay: action.delay,
    }));
    enemy.currentActionIndex = 0;
  }
  
  /**
   * 대기가 0 이하인 적 행동들을 수집 (발동 준비된 것만)
   * 새로운 스킬은 추가하지 않음 - 이번 턴에 정해진 스킬만 사용
   */
  private collectReadyActions(): ActionQueueItem[] {
    const readyActions: ActionQueueItem[] = [];
    
    this.scene.gameState.enemies.forEach(enemy => {
      // 죽은 적은 스킵
      if (enemy.hp <= 0) return;
      
      while (enemy.actionQueue.length > 0 && enemy.actionQueue[0].currentDelay <= 0) {
        const action = enemy.actionQueue.shift()!;
        readyActions.push({ enemy, action });
        // 새로운 스킬 추가하지 않음 - 다음 턴에 initializeEnemyActions()에서 새로 설정
      }
    });
    
    return readyActions;
  }
  
  /**
   * 적 행동을 순차적으로 실행 (스킬 이름 표시 → 공격 → 다음 스킬...)
   */
  checkEnemyActions() {
    const readyActions = this.collectReadyActions();
    
    if (readyActions.length === 0) {
      this.updateEnemyActionDisplay();
      return;
    }
    
    // 순차적으로 실행
    this.executeActionsSequentially(readyActions, 0);
  }
  
  /**
   * 행동을 순차적으로 실행 (재귀)
   */
  private executeActionsSequentially(
    actions: ActionQueueItem[],
    index: number
  ) {
    if (index >= actions.length) {
      this.updateEnemyActionDisplay();
      return;
    }
    
    const { enemy, action } = actions[index];
    
    // 적이 죽었으면 스킵
    if (enemy.hp <= 0) {
      this.executeActionsSequentially(actions, index + 1);
      return;
    }
    
    // 적 스프라이트 위치 가져오기
    const sprite = this.scene.enemySprites.get(enemy.id);
    const enemyX = sprite ? sprite.x : this.scene.cameras.main.width - 180;
    const enemyY = sprite ? sprite.y : this.scene.GROUND_Y - 30;
    
    // 즉시 액션 큐 디스플레이 업데이트 (어떤 스킬이 발동되는지 시각적으로 표시)
    this.updateEnemyActionDisplay();
    
    // 약간 딜레이 후 실행 (플레이어 공격 애니메이션이 먼저 완료되도록)
    this.scene.time.delayedCall(100, () => {
      // HP 체크 (플레이어 공격 애니메이션 중 죽었을 수 있음)
      if (enemy.hp <= 0) {
        this.executeActionsSequentially(actions, index + 1);
        return;
      }
      
      // ★ 적 스킬 발동 직전: 출혈/독 데미지 적용
      const bleedDied = this.applyBleedDamageToEnemy(enemy);
      const poisonDied = !bleedDied && this.applyPoisonDamageToEnemy(enemy);
      
      // 출혈/독으로 죽었으면 다음 행동으로
      if (bleedDied || poisonDied) {
        this.scene.time.delayedCall(300, () => {
          this.executeActionsSequentially(actions, index + 1);
        });
        return;
      }
      
      // 스킬 사용 메시지 (화면 중앙에 표시)
      const actionTypeEmoji = action.type === 'attack' ? '⚔️' : 
                              action.type === 'defend' ? '🛡️' : 
                              action.type === 'taunt' ? '😤' : 
                              action.type === 'special' ? '✨' : '💫';
      this.scene.animationHelper.showMessage(
        `${enemy.emoji} ${enemy.name}의 ${actionTypeEmoji}${action.name}!`,
        COLORS.message.warning
      );
      
      // 스킬 사용 애니메이션 (머리 위에서 슉~ 사라짐)
      this.scene.animationHelper.showEnemySkillUsed(enemyX, enemyY, action.name, enemy.emoji);
      
      // 공격/특수 행동일 때만 스킬 이름 표시
      if (action.type === 'attack' || action.type === 'special') {
        this.scene.animationHelper.showEnemySkillName(
          enemy.name,
          action.name,
          enemy.emoji
        ).then(() => {
          // 스킬 이름 표시 후 실제 공격 실행 (다시 HP 체크)
          if (enemy.hp > 0) {
            this.scene.combatSystem.executeEnemyAction(enemy, action);
          }
          
          // 다음 행동으로 (약간의 딜레이 후)
          this.scene.time.delayedCall(400, () => {
            this.executeActionsSequentially(actions, index + 1);
          });
        });
      } else {
        // 버프/방어 등은 바로 실행
        if (enemy.hp > 0) {
          this.scene.combatSystem.executeEnemyAction(enemy, action);
        }
        this.scene.time.delayedCall(300, () => {
          this.executeActionsSequentially(actions, index + 1);
        });
      }
    });
  }
  
  /**
   * 턴 종료 시 대기 중인 **모든** 적 행동들을 순차적으로 실행
   * 이번 턴에 발동하지 않은 모든 스킬을 강제 발동
   */
  executeRemainingEnemyActions(): Promise<void> {
    return new Promise((resolve) => {
      const remainingActions: ActionQueueItem[] = [];
      
      // 모든 대기 중인 행동 수집 (전부!)
      this.scene.gameState.enemies.forEach(enemy => {
        // 큐에 남아있는 모든 스킬을 수집
        while (enemy.actionQueue.length > 0) {
          const action = enemy.actionQueue.shift()!;
          remainingActions.push({ enemy, action });
        }
        // 새로운 스킬 추가하지 않음 - 다음 턴에 initializeEnemyActions()에서 새로 설정
      });
      
      if (remainingActions.length === 0) {
        this.updateEnemyActionDisplay();
        resolve();
        return;
      }
      
      // 순차적으로 실행
      this.executeActionsSequentiallyWithCallback(remainingActions, 0, () => {
        this.updateEnemyActionDisplay();
        resolve();
      });
    });
  }
  
  /**
   * 행동을 순차적으로 실행 (콜백 버전)
   */
  private executeActionsSequentiallyWithCallback(
    actions: ActionQueueItem[],
    index: number,
    onComplete: () => void
  ) {
    if (index >= actions.length) {
      onComplete();
      return;
    }
    
    const { enemy, action } = actions[index];
    
    // 적이 죽었으면 스킵
    if (enemy.hp <= 0) {
      this.executeActionsSequentiallyWithCallback(actions, index + 1, onComplete);
      return;
    }
    
    // 적 스프라이트 위치 가져오기
    const sprite = this.scene.enemySprites.get(enemy.id);
    const enemyX = sprite ? sprite.x : this.scene.cameras.main.width - 180;
    const enemyY = sprite ? sprite.y : this.scene.GROUND_Y - 30;
    
    // 약간 딜레이 후 실행 (플레이어 공격 애니메이션이 먼저 완료되도록)
    this.scene.time.delayedCall(100, () => {
      // HP 체크 (플레이어 공격 애니메이션 중 죽었을 수 있음)
      if (enemy.hp <= 0) {
        this.executeActionsSequentiallyWithCallback(actions, index + 1, onComplete);
        return;
      }
      
      // 스킬 사용 애니메이션 (머리 위에서 슉~ 사라짐)
      this.scene.animationHelper.showEnemySkillUsed(enemyX, enemyY, action.name, enemy.emoji);
      
      // 공격/특수 행동일 때만 스킬 이름 표시
      if (action.type === 'attack' || action.type === 'special') {
        this.scene.animationHelper.showEnemySkillName(
          enemy.name,
          action.name,
          enemy.emoji
        ).then(() => {
          // 스킬 이름 표시 후 실제 공격 실행 (다시 HP 체크)
          if (enemy.hp > 0) {
            this.scene.combatSystem.executeEnemyAction(enemy, action);
          }
          
          // 다음 행동으로 (약간의 딜레이 후)
          this.scene.time.delayedCall(400, () => {
            this.executeActionsSequentiallyWithCallback(actions, index + 1, onComplete);
          });
        });
      } else {
        // 버프/방어 등은 바로 실행
        if (enemy.hp > 0) {
          this.scene.combatSystem.executeEnemyAction(enemy, action);
        }
        this.scene.time.delayedCall(300, () => {
          this.executeActionsSequentiallyWithCallback(actions, index + 1, onComplete);
        });
      }
    });
  }
  
  updateEnemyActionDisplay() {
    // 기존 툴팁 제거
    this.hideActionTooltip();
    
    this.scene.gameState.enemies.forEach(enemy => {
      const container = this.scene.enemySprites.get(enemy.id);
      if (!container) return;
      
      // 기존 행동 표시 제거
      const existingActions = container.getAll().filter((c: any) => c.name === 'actionText');
      existingActions.forEach((a: any) => a.destroy());
      
      // 새 행동 표시 (스케일 적용)
      const baseYOffset = -131;
      enemy.actionQueue.slice(0, 3).forEach((action, idx) => {
        const currentYOffset = baseYOffset - (idx * 38);
        const actionText = this.scene.add.text(0, currentYOffset, 
          `${enemy.emoji} ${action.name} (${action.currentDelay})`, {
          font: 'bold 20px monospace',
          color: idx === 0 ? COLORS_STR.primary.dark : COLORS_STR.text.muted,
          backgroundColor: COLORS_STR.background.dark,
          padding: { x: 8, y: 4 },
        }).setOrigin(0.5);
        actionText.name = 'actionText';
        
        // 인터랙션 추가 (툴팁용)
        actionText.setInteractive({ useHandCursor: true });
        
        // 클로저를 위한 값 캡처
        const capturedEnemy = enemy;
        const capturedAction = action;
        const capturedContainer = container;
        const capturedYOffset = currentYOffset;
        
        actionText.on('pointerover', () => {
          // 텍스트 강조
          actionText.setStyle({ backgroundColor: COLORS_STR.background.medium });
          actionText.setScale(1.1);
          
          // 툴팁 표시 (컨테이너의 월드 좌표 계산)
          const worldX = capturedContainer.x;
          const worldY = capturedContainer.y + capturedYOffset - 75;
          this.showActionTooltip(capturedEnemy, capturedAction, worldX, worldY);
        });
        
        actionText.on('pointerout', () => {
          actionText.setStyle({ backgroundColor: COLORS_STR.background.dark });
          actionText.setScale(1);
          this.hideActionTooltip();
        });
        
        container.add(actionText);
      });
    });
  }
  
  // ========== 툴팁 ==========
  
  private actionTooltip: Phaser.GameObjects.Container | null = null;
  
  private showActionTooltip(enemy: Enemy, action: EnemyAction, x: number, y: number) {
    this.hideActionTooltip();
    
    const tooltip = this.scene.add.container(x, y);
    tooltip.setDepth(3000);
    
    // 데미지 정보
    let damageText = '';
    if (action.type === 'attack' || action.type === 'special') {
      damageText = `⚔️ 데미지: ${action.damage}`;
    } else if (action.type === 'defend') {
      const defGain = action.defenseIncrease ?? 5;
      damageText = `🛡️ 방어 자세 (+${defGain} 방어)`;
    } else if (action.type === 'taunt') {
      const defGain = action.defenseIncrease;
      damageText = defGain ? `🛡️ 도발 (+${defGain} 방어)` : '🛡️ 도발';
    } else if (action.type === 'buff') {
      damageText = '✨ 버프/회복';
    } else if (action.type === 'charge') {
      damageText = '💪 힘 충전 중';
    }
    
    // 효과 정보
    let effectText = '';
    if (action.effect) {
      switch (action.effect.type) {
        case 'bleed':
          effectText = `🩸 출혈: ${action.effect.value} x ${action.effect.duration || 3}턴`;
          break;
        case 'stun':
          effectText = `💫 기절: ${action.effect.duration || 1}턴`;
          break;
        case 'debuff':
          effectText = `⬇️ 약화 효과`;
          break;
        case 'heal':
          effectText = `💚 회복: ${action.effect.value}`;
          break;
      }
    }
    
    // 배경 (스케일)
    const lines = [
      `${enemy.emoji} ${enemy.name}`,
      `📌 ${action.name}`,
      damageText,
      action.description,
    ];
    if (effectText) lines.push(effectText);
    
    const tooltipHeight = 38 + lines.length * 34;
    const tooltipWidth = 338;
    
    const bg = this.scene.add.rectangle(0, 0, tooltipWidth, tooltipHeight, COLORS.background.dark, 0.95);
    bg.setStrokeStyle(3, COLORS.border.medium);
    bg.setOrigin(0.5, 1);
    tooltip.add(bg);
    
    // 텍스트들 (스케일)
    let textY = -tooltipHeight + 26;
    lines.forEach((line, idx) => {
      if (!line) return;
      const color = idx === 0 ? COLORS_STR.secondary.dark : idx === 1 ? COLORS_STR.primary.dark : COLORS_STR.text.primary;
      const text = this.scene.add.text(0, textY, line, {
        font: idx < 2 ? 'bold 22px monospace' : '20px monospace',
        color: color,
        wordWrap: { width: tooltipWidth - 30 },
      }).setOrigin(0.5, 0);
      tooltip.add(text);
      textY += 34;
    });
    
    this.actionTooltip = tooltip;
  }
  
  private hideActionTooltip() {
    if (this.actionTooltip) {
      this.actionTooltip.destroy();
      this.actionTooltip = null;
    }
  }
  
  // ========== 디버프 툴팁 ==========
  
  private debuffTooltip: Phaser.GameObjects.Container | null = null;
  
  private showDebuffTooltip(_localX: number, _localY: number, text: string) {
    this.hideDebuffTooltip();
    
    // 디버프 아이콘 위치에서 화면 전역 좌표 계산
    // (디버프 컨테이너는 적 컨테이너 안에 있음)
    // 일단 마우스 위치 기준으로 표시
    const pointer = this.scene.input.activePointer;
    const x = pointer.worldX;
    const y = pointer.worldY - 60;
    
    const tooltip = this.scene.add.container(x, y);
    tooltip.setDepth(3100);
    
    // 배경
    const lines = text.split('\n');
    const tooltipHeight = 26 + lines.length * 28;
    const tooltipWidth = 200;
    
    const bg = this.scene.add.rectangle(0, 0, tooltipWidth, tooltipHeight, COLORS.background.dark, 0.95);
    bg.setStrokeStyle(2, COLORS.secondary.dark);
    bg.setOrigin(0.5, 1);
    tooltip.add(bg);
    
    // 텍스트
    let textY = -tooltipHeight + 18;
    lines.forEach((line, idx) => {
      const lineText = this.scene.add.text(0, textY, line, {
        font: idx === 0 ? 'bold 18px monospace' : '16px monospace',
        color: idx === 0 ? COLORS_STR.secondary.dark : COLORS_STR.text.primary,
      }).setOrigin(0.5, 0);
      tooltip.add(lineText);
      textY += 28;
    });
    
    this.debuffTooltip = tooltip;
  }
  
  private hideDebuffTooltip() {
    if (this.debuffTooltip) {
      this.debuffTooltip.destroy();
      this.debuffTooltip = null;
    }
  }
  
  // ========== 출혈/독 데미지 (적 스킬 발동 직전) ==========
  
  /**
   * 개별 적에게 출혈 데미지 적용 (스킬 발동 직전)
   * @returns 적이 죽었는지 여부
   */
  private applyBleedDamageToEnemy(enemy: Enemy): boolean {
    if (!enemy.bleeds || enemy.bleeds.length === 0) return false;
    
    let totalBleedDamage = 0;
    
    // 모든 출혈 데미지 적용
    enemy.bleeds.forEach((bleed, index) => {
      this.scene.animationHelper.showMessage(
        `🩸 ${enemy.name} 출혈${enemy.bleeds.length > 1 ? `(${index + 1})` : ''}! -${bleed.damage}`, 
        COLORS.effect.damage
      );
      totalBleedDamage += bleed.damage;
      bleed.duration--;
    });
    
    // 만료된 출혈 제거
    enemy.bleeds = enemy.bleeds.filter(b => b.duration > 0);
    
    // 데미지 적용
    if (totalBleedDamage > 0) {
      this.scene.combatSystem.damageEnemy(enemy, totalBleedDamage);
    }
    
    // UI 업데이트
    this.updateEnemySprite(enemy);
    
    return enemy.hp <= 0;
  }
  
  /**
   * 개별 적에게 독 데미지 적용 (스킬 발동 직전)
   * @returns 적이 죽었는지 여부
   */
  private applyPoisonDamageToEnemy(enemy: Enemy): boolean {
    if (!enemy.poisons || enemy.poisons.length === 0) return false;
    
    let totalPoisonDamage = 0;
    
    // 모든 독 데미지 적용
    enemy.poisons.forEach((poison, index) => {
      this.scene.animationHelper.showMessage(
        `☠️ ${enemy.name} 독${enemy.poisons.length > 1 ? `(${index + 1})` : ''}! -${poison.damage}`, 
        COLORS.effect.damage
      );
      totalPoisonDamage += poison.damage;
      poison.duration--;
    });
    
    // 만료된 독 제거
    enemy.poisons = enemy.poisons.filter(p => p.duration > 0);
    
    // 데미지 적용
    if (totalPoisonDamage > 0) {
      this.scene.combatSystem.damageEnemy(enemy, totalPoisonDamage);
    }
    
    // UI 업데이트
    this.updateEnemySprite(enemy);
    
    return enemy.hp <= 0;
  }
  
  // ========== 데미지 미리보기 ==========
  
  private damagePreviewTween: Phaser.Tweens.Tween | null = null;
  private previewedEnemyIds: string[] = [];
  
  /**
   * 스킬 범위 결정 (swordDouble 처리 포함)
   */
  private resolveReachForPreview(skillReach: string, swordReach: string): string {
    if (skillReach === 'weapon') {
      return swordReach;
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
    return skillReach;
  }
  
  /**
   * 호버한 적과 범위 공격 대상에 데미지 미리보기 표시
   */
  showDamagePreview(hoveredEnemy: Enemy) {
    const pending = this.scene.pendingCard;
    if (!pending) return;
    
    const card = pending.card;
    const sword = this.scene.playerState.currentSword;
    
    // 범위 결정
    let reach = 'single';
    let baseDamage = 0;
    let attackCount = 1;
    let isPiercing = false;
    let pierce = 0;
    let isCritical = false;
    let criticalMultiplier = 1.0;
    
    if (card.type === 'sword') {
      // 발도 공격
      const swordCard = card.data as any;
      reach = swordCard.drawAttack?.reach || 'single';
      baseDamage = swordCard.attack * (swordCard.drawAttack?.multiplier || 1);
      attackCount = 1;  // 발도는 1타
      isPiercing = swordCard.drawAttack?.pierce || false;
      pierce = swordCard.pierce || 0;
      
      // 발도 크리티컬 조건 체크
      if (swordCard.drawAttack?.criticalCondition === 'enemyDelay1') {
        // 적 대기가 1인지 확인
        if (hoveredEnemy.actionQueue.length > 0 && hoveredEnemy.actionQueue[0].currentDelay === 1) {
          isCritical = true;
          criticalMultiplier = swordCard.drawAttack?.criticalMultiplier || 1.5;
          isPiercing = swordCard.drawAttack?.criticalPierce || isPiercing;
        }
      }
    } else {
      // 스킬 카드
      const skillCard = card.data as any;
      if (skillCard.type !== 'attack' && skillCard.type !== 'special') return;  // 공격 스킬만
      
      // 범위 결정 (swordDouble 처리 포함)
      reach = this.resolveReachForPreview(skillCard.reach, sword?.reach || 'single');
      baseDamage = sword ? sword.attack * (skillCard.attackMultiplier || 1) : 0;
      attackCount = skillCard.attackCount || 1;
      isPiercing = skillCard.isPiercing || false;
      pierce = sword?.pierce || 0;
      
      // 스킬 크리티컬 조건 체크 (단검일 때)
      if (skillCard.criticalCondition === 'dagger' && sword?.category === 'dagger') {
        isCritical = true;
        criticalMultiplier = skillCard.criticalMultiplier || 2.0;
        isPiercing = true;
      }
    }
    
    // 타겟 계산 (호버한 적 기준 범위)
    const enemies = this.scene.gameState.enemies;
    const baseIndex = enemies.indexOf(hoveredEnemy);
    let targetCount = 1;
    
    switch (reach) {
      case 'single': targetCount = 1; break;
      case 'double': targetCount = 2; break;
      case 'triple': targetCount = 3; break;
      case 'all': targetCount = enemies.length; break;
      default: targetCount = parseInt(reach) || 1;
    }
    
    const targets = reach === 'all' 
      ? enemies 
      : enemies.slice(baseIndex, Math.min(enemies.length, baseIndex + targetCount));
    
    // 각 타겟에 미리보기 표시
    this.previewedEnemyIds = targets.map(e => e.id);
    
    targets.forEach(enemy => {
      // 데미지 계산
      let damage: number;
      if (isPiercing) {
        damage = baseDamage;
      } else {
        const effectiveDefense = Math.max(0, enemy.defense - pierce);
        damage = Math.max(1, baseDamage - effectiveDefense);
      }
      
      // 크리티컬 배율 적용
      if (isCritical) {
        damage *= criticalMultiplier;
      }
      
      // 타수 적용
      const totalDamage = Math.floor(damage * attackCount);
      const predictedHp = Math.max(0, enemy.hp - totalDamage);
      
      this.showEnemyDamagePreview(enemy, totalDamage, predictedHp, isCritical);
    });
    
    // 깜빡임 애니메이션 시작
    this.startPreviewBlink();
  }
  
  /**
   * 개별 적의 데미지 미리보기 표시
   */
  private showEnemyDamagePreview(enemy: Enemy, _damage: number, predictedHp: number, isCritical: boolean) {
    const container = this.scene.enemySprites.get(enemy.id);
    if (!container) return;
    
    const damagePreviewBar = (container as any).damagePreviewBar as Phaser.GameObjects.Rectangle;
    const hpBar = (container as any).hpBar as Phaser.GameObjects.Rectangle;
    const hpText = (container as any).hpText as Phaser.GameObjects.Text;
    
    if (!damagePreviewBar || !hpBar || !hpText) return;
    
    // 미리보기 바 표시 (현재 HP 비율로)
    const currentHpRatio = enemy.hp / enemy.maxHp;
    const predictedHpRatio = predictedHp / enemy.maxHp;
    
    // 현재 HP까지 보여주고, 예상 데미지 부분은 진한 빨간색
    damagePreviewBar.setVisible(true);
    damagePreviewBar.setScale(currentHpRatio, 1);
    
    // HP 바는 예상 HP로 줄여서 표시
    hpBar.setScale(predictedHpRatio, 1);
    
    // 기존 HP 텍스트 숨기기
    hpText.setVisible(false);
    
    // 미리보기 텍스트 생성 (예상 체력: 빨간색, /전체체력: 흰색)
    const criticalText = isCritical ? '⭐' : '';
    
    // 기존 미리보기 텍스트가 있으면 제거
    const existingPreview = (container as any).previewHpText;
    if (existingPreview) existingPreview.destroy();
    const existingMaxHp = (container as any).previewMaxHpText;
    if (existingMaxHp) existingMaxHp.destroy();
    
    // 예상 체력 텍스트 (빨간색)
    const predictedText = this.scene.add.text(0, 109, `${criticalText}${predictedHp}`, {
      font: '22px monospace',
      color: '#ff4444',
    }).setOrigin(1, 0.5);  // 오른쪽 정렬
    
    // /전체체력 텍스트 (흰색)
    const maxHpText = this.scene.add.text(0, 109, `/${enemy.maxHp}`, {
      font: '22px monospace',
      color: '#ffffff',
    }).setOrigin(0, 0.5);  // 왼쪽 정렬
    
    container.add([predictedText, maxHpText]);
    (container as any).previewHpText = predictedText;
    (container as any).previewMaxHpText = maxHpText;
  }
  
  /**
   * 깜빡임 애니메이션 시작
   */
  private startPreviewBlink() {
    // 기존 트윈 정지
    if (this.damagePreviewTween) {
      this.damagePreviewTween.stop();
    }
    
    // 모든 미리보기 바에 깜빡임 적용
    this.previewedEnemyIds.forEach(enemyId => {
      const container = this.scene.enemySprites.get(enemyId);
      if (!container) return;
      
      const damagePreviewBar = (container as any).damagePreviewBar as Phaser.GameObjects.Rectangle;
      if (damagePreviewBar) {
        this.damagePreviewTween = this.scene.tweens.add({
          targets: damagePreviewBar,
          alpha: { from: 0.9, to: 0.4 },
          duration: 400,
          yoyo: true,
          repeat: -1,
        });
      }
    });
  }
  
  /**
   * 데미지 미리보기 숨기기
   */
  hideDamagePreview() {
    // 트윈 정지
    if (this.damagePreviewTween) {
      this.damagePreviewTween.stop();
      this.damagePreviewTween = null;
    }
    
    // 모든 미리보기된 적의 UI 복원
    this.previewedEnemyIds.forEach(enemyId => {
      const enemy = this.scene.gameState.enemies.find(e => e.id === enemyId);
      const container = this.scene.enemySprites.get(enemyId);
      if (!container || !enemy) return;
      
      const damagePreviewBar = (container as any).damagePreviewBar as Phaser.GameObjects.Rectangle;
      const hpBar = (container as any).hpBar as Phaser.GameObjects.Rectangle;
      const hpText = (container as any).hpText as Phaser.GameObjects.Text;
      
      if (damagePreviewBar) {
        damagePreviewBar.setVisible(false);
        damagePreviewBar.setAlpha(0.8);
      }
      
      if (hpBar) {
        const hpRatio = Math.max(0, enemy.hp / enemy.maxHp);
        hpBar.setScale(hpRatio, 1);
      }
      
      // 원래 HP 텍스트 복원
      if (hpText) {
        hpText.setVisible(true);
        hpText.setText(`${Math.max(0, enemy.hp)}/${enemy.maxHp}`);
        hpText.setColor('#ffffff');
      }
      
      // 미리보기 텍스트 제거
      const previewHpText = (container as any).previewHpText;
      if (previewHpText) {
        previewHpText.destroy();
        (container as any).previewHpText = null;
      }
      const previewMaxHpText = (container as any).previewMaxHpText;
      if (previewMaxHpText) {
        previewMaxHpText.destroy();
        (container as any).previewMaxHpText = null;
      }
    });
    
    this.previewedEnemyIds = [];
  }
}


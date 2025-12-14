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
    
    // HP 텍스트 (스케일)
    const hpText = this.scene.add.text(0, 109, `${enemy.hp}/${enemy.maxHp}`, {
      font: '22px monospace',
      color: '#ffffff',
    }).setOrigin(0.5);
    (container as any).hpText = hpText;
    
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
    
    container.add([emoji, nameText, hpBarBg, hpBar, hpText, defenseContainer, debuffContainer]);
    
    // 타겟 강조 효과 (숨김 상태, 스케일)
    const targetHighlight = this.scene.add.rectangle(0, -19, 169, 206, COLORS.secondary.dark, 0);
    targetHighlight.setStrokeStyle(5, COLORS.primary.dark);
    targetHighlight.setVisible(false);
    (container as any).targetHighlight = targetHighlight;
    container.add(targetHighlight);
    
    // 인터랙션 (타겟 선택용, 스케일)
    const hitArea = this.scene.add.rectangle(0, 0, 169, 225, COLORS.background.black, 0);
    hitArea.setInteractive({ useHandCursor: false, cursor: 'pointer' });
    
    // 호버 효과 - 타겟팅 모드일 때만 강조
    hitArea.on('pointerover', () => {
      if (this.scene.isTargetingMode) {
        targetHighlight.setVisible(true);
        targetHighlight.setFillStyle(COLORS.secondary.dark, 0.3);
        container.setScale(1.1);
        // 커서를 포인터로 변경
        this.scene.input.setDefaultCursor('pointer');
      }
    });
    
    hitArea.on('pointerout', () => {
      targetHighlight.setVisible(false);
      container.setScale(1);
      this.scene.input.setDefaultCursor('default');
    });
    
    hitArea.on('pointerdown', () => {
      if (this.scene.isTargetingMode) {
        this.scene.cardSystem.selectTarget(enemy.id);
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
    // 도발 스킬과 일반 스킬 분리
    const tauntAction = enemy.actions.find(a => a.type === 'taunt');
    const nonTauntActions = enemy.actions.filter(a => a.type !== 'taunt');
    
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
    
    // 도발 중인 적은 첫 턴에 도발 스킬을 무조건 첫 번째로 사용
    let selectedActions: typeof enemy.actions;
    if (isFirstTurn && enemy.isTaunting && tauntAction) {
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
    
    // 스킬 사용 애니메이션 (머리 위에서 슉~ 사라짐)
    this.scene.animationHelper.showEnemySkillUsed(enemyX, enemyY, action.name, enemy.emoji);
    
    // 공격/특수 행동일 때만 스킬 이름 표시
    if (action.type === 'attack' || action.type === 'special') {
      this.scene.animationHelper.showEnemySkillName(
        enemy.name,
        action.name,
        enemy.emoji
      ).then(() => {
        // 스킬 이름 표시 후 실제 공격 실행
        this.scene.combatSystem.executeEnemyAction(enemy, action);
        
        // 다음 행동으로 (약간의 딜레이 후)
        this.scene.time.delayedCall(400, () => {
          this.executeActionsSequentially(actions, index + 1);
        });
      });
    } else {
      // 버프/방어 등은 바로 실행
      this.scene.combatSystem.executeEnemyAction(enemy, action);
      this.scene.time.delayedCall(300, () => {
        this.executeActionsSequentially(actions, index + 1);
      });
    }
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
    
    // 스킬 사용 애니메이션 (머리 위에서 슉~ 사라짐)
    this.scene.animationHelper.showEnemySkillUsed(enemyX, enemyY, action.name, enemy.emoji);
    
    // 공격/특수 행동일 때만 스킬 이름 표시
    if (action.type === 'attack' || action.type === 'special') {
      this.scene.animationHelper.showEnemySkillName(
        enemy.name,
        action.name,
        enemy.emoji
      ).then(() => {
        // 스킬 이름 표시 후 실제 공격 실행
        this.scene.combatSystem.executeEnemyAction(enemy, action);
        
        // 다음 행동으로 (약간의 딜레이 후)
        this.scene.time.delayedCall(400, () => {
          this.executeActionsSequentiallyWithCallback(actions, index + 1, onComplete);
        });
      });
    } else {
      // 버프/방어 등은 바로 실행
      this.scene.combatSystem.executeEnemyAction(enemy, action);
      this.scene.time.delayedCall(300, () => {
        this.executeActionsSequentiallyWithCallback(actions, index + 1, onComplete);
      });
    }
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
      damageText = '🛡️ 방어 자세';
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
}


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
    
    enemies.forEach(enemy => this.createEnemySprite(enemy));
  }
  
  createEnemySprite(enemy: Enemy) {
    // 적 인덱스에 따라 간격을 두고 배치 (120px 간격)
    const enemies = this.scene.gameState.enemies;
    const enemyIndex = enemies.indexOf(enemy);
    const spacing = 120; // 적 간격
    const baseX = this.scene.cameras.main.width - 180;
    const x = baseX - (enemyIndex * spacing) + (Math.random() * 20 - 10); // 약간의 랜덤 오프셋
    const y = this.scene.GROUND_Y - 30;
    
    const container = this.scene.add.container(x, y);
    
    // 적 이모지
    const emoji = this.scene.add.text(0, -20, enemy.emoji, {
      font: '48px Arial',
    }).setOrigin(0.5);
    
    // 적 이름
    const nameText = this.scene.add.text(0, 25, enemy.name, {
      font: 'bold 14px monospace',
      color: COLORS_STR.secondary.dark,
    }).setOrigin(0.5);
    
    // HP 바
    const hpBarBg = this.scene.add.rectangle(0, 45, 60, 8, COLORS.background.medium);
    hpBarBg.setStrokeStyle(1, COLORS.border.medium);
    const hpBar = this.scene.add.rectangle(-30, 45, 60, 8, COLORS.secondary.dark);
    hpBar.setOrigin(0, 0.5);
    (container as any).hpBar = hpBar;
    
    // HP 텍스트
    const hpText = this.scene.add.text(0, 58, `${enemy.hp}/${enemy.maxHp}`, {
      font: '12px monospace',
      color: '#ffffff',
    }).setOrigin(0.5);
    (container as any).hpText = hpText;
    
    // 방어력 표시 (버프 형태)
    const defenseContainer = this.scene.add.container(-35, 20);
    const defenseBg = this.scene.add.rectangle(0, 0, 36, 20, COLORS.background.dark, 0.85);
    defenseBg.setStrokeStyle(1, COLORS.secondary.light);
    const defenseText = this.scene.add.text(0, 0, `🛡️${enemy.defense}`, {
      font: 'bold 11px monospace',
      color: COLORS_STR.secondary.light,
    }).setOrigin(0.5);
    defenseContainer.add([defenseBg, defenseText]);
    (container as any).defenseText = defenseText;
    (container as any).defenseContainer = defenseContainer;
    (container as any).baseDefense = enemy.defense;  // 기본 방어력 저장
    
    // 방어력이 0이면 숨김
    defenseContainer.setVisible(enemy.defense > 0);
    
    container.add([emoji, nameText, hpBarBg, hpBar, hpText, defenseContainer]);
    
    // 타겟 강조 효과 (숨김 상태)
    const targetHighlight = this.scene.add.rectangle(0, -10, 90, 110, COLORS.secondary.dark, 0);
    targetHighlight.setStrokeStyle(3, COLORS.primary.dark);
    targetHighlight.setVisible(false);
    (container as any).targetHighlight = targetHighlight;
    container.add(targetHighlight);
    
    // 인터랙션 (타겟 선택용)
    const hitArea = this.scene.add.rectangle(0, 0, 90, 120, COLORS.background.black, 0);
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
  
  initializeEnemyActions() {
    this.scene.gameState.enemies.forEach(enemy => {
      this.resetEnemyActionQueue(enemy);
    });
    // 적 행동 표시 업데이트
    this.updateEnemyActionDisplay();
  }
  
  resetEnemyActionQueue(enemy: Enemy) {
    enemy.actionQueue = enemy.actions.map(action => ({
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
      
      // 새 행동 표시
      const baseYOffset = -70;
      enemy.actionQueue.slice(0, 3).forEach((action, idx) => {
        const currentYOffset = baseYOffset - (idx * 20);
        const actionText = this.scene.add.text(0, currentYOffset, 
          `${enemy.emoji} ${action.name} (${action.currentDelay})`, {
          font: 'bold 11px monospace',
          color: idx === 0 ? COLORS_STR.primary.dark : COLORS_STR.text.muted,
          backgroundColor: COLORS_STR.background.dark,
          padding: { x: 4, y: 2 },
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
          const worldY = capturedContainer.y + capturedYOffset - 40;
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
    
    // 배경
    const lines = [
      `${enemy.emoji} ${enemy.name}`,
      `📌 ${action.name}`,
      damageText,
      action.description,
    ];
    if (effectText) lines.push(effectText);
    
    const tooltipHeight = 20 + lines.length * 18;
    const tooltipWidth = 180;
    
    const bg = this.scene.add.rectangle(0, 0, tooltipWidth, tooltipHeight, COLORS.background.dark, 0.95);
    bg.setStrokeStyle(2, COLORS.border.medium);
    bg.setOrigin(0.5, 1);
    tooltip.add(bg);
    
    // 텍스트들
    let textY = -tooltipHeight + 14;
    lines.forEach((line, idx) => {
      if (!line) return;
      const color = idx === 0 ? COLORS_STR.secondary.dark : idx === 1 ? COLORS_STR.primary.dark : COLORS_STR.text.primary;
      const text = this.scene.add.text(0, textY, line, {
        font: idx < 2 ? 'bold 12px monospace' : '11px monospace',
        color: color,
        wordWrap: { width: tooltipWidth - 16 },
      }).setOrigin(0.5, 0);
      tooltip.add(text);
      textY += 18;
    });
    
    this.actionTooltip = tooltip;
  }
  
  private hideActionTooltip() {
    if (this.actionTooltip) {
      this.actionTooltip.destroy();
      this.actionTooltip = null;
    }
  }
}


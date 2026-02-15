import * as Phaser from 'phaser';
import type { UIScene } from '../scenes/UIScene';
import { COLORS, COLORS_STR } from '../constants/colors';

/**
 * 타겟 인디케이터 UI - 적 타겟 선택 표시
 * - 마우스 호버한 적 기준으로 공격 범위 내 적들을 하이라이트
 * - 도발 중인 적이 있으면 해당 적만 타겟팅 가능 (범위 공격은 예외)
 */
export class TargetIndicatorUI {
  private scene: UIScene;
  private targetIndicators: Map<string, Phaser.GameObjects.Container> = new Map();
  private dimOverlays: Map<string, Phaser.GameObjects.Rectangle> = new Map();
  private highlightBorders: Map<string, Phaser.GameObjects.Rectangle> = new Map();
  private tauntIndicators: Map<string, Phaser.GameObjects.Text> = new Map();
  private currentReach: string = 'single';
  
  constructor(scene: UIScene) {
    this.scene = scene;
  }
  
  /**
   * 타겟팅 모드 시작
   * @param reach 공격 범위 (single, double, triple, all)
   */
  show(reach: string = 'single') {
    this.hide();
    this.currentReach = reach;
    
    const enemies = this.scene.gameScene.gameState.enemies;
    const enemySprites = this.scene.gameScene.enemySprites;
    
    // 도발 중인 적들 찾기 (여러 명 가능)
    const tauntingEnemies = enemies.filter(e => e.isTaunting && (e.tauntDuration ?? 0) > 0);
    
    enemies.forEach(enemy => {
      const sprite = enemySprites.get(enemy.id);
      if (!sprite) return;
      
      // 도발 중인 적이 있으면, 도발 중인 적들만 타겟팅 가능 (범위 공격 예외 처리는 highlightTargets에서)
      const canTarget = tauntingEnemies.length === 0 || tauntingEnemies.some(e => e.id === enemy.id);
      
      // 적 위에 약간 어둡게 오버레이
      const dimOverlay = this.scene.add.rectangle(
        sprite.x, 
        sprite.y - 30, 
        200, 
        250, 
        0x000000, 
        canTarget ? 0.3 : 0.6  // 타겟팅 불가한 적은 더 어둡게
      );
      dimOverlay.setDepth(1999);
      this.dimOverlays.set(enemy.id, dimOverlay);
      
      // 하이라이트 테두리 (기본 숨김)
      const highlightBorder = this.scene.add.rectangle(
        sprite.x,
        sprite.y - 30,
        210,
        260,
        0x000000,
        0
      );
      highlightBorder.setStrokeStyle(6, COLORS.secondary.main);
      highlightBorder.setDepth(2001);
      highlightBorder.setVisible(false);
      this.highlightBorders.set(enemy.id, highlightBorder);
      
      // 도발 표시
      if (enemy.isTaunting && (enemy.tauntDuration ?? 0) > 0) {
        const tauntText = this.scene.add.text(
          sprite.x, 
          sprite.y - 180, 
          `🛡️ 도발! (${enemy.tauntDuration}턴)`, 
          {
            font: 'bold 18px monospace',
            color: COLORS_STR.secondary.main,
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 },
          }
        ).setOrigin(0.5);
        tauntText.setDepth(2002);
        this.tauntIndicators.set(enemy.id, tauntText);
      }
      
      // 인터랙션 영역
      const container = this.scene.add.container(sprite.x, sprite.y - 30);
      container.setDepth(2000);
      
      // 타겟 화살표 (타겟팅 가능할 때만 표시)
      const arrow = this.scene.add.text(0, -100, canTarget ? '👆' : '🚫', {
        font: '40px Arial',
      }).setOrigin(0.5);
      arrow.setAlpha(canTarget ? 0.6 : 0.3);
      
      // 클릭 영역 (투명)
      const hitArea = this.scene.add.rectangle(0, 0, 200, 250, 0x000000, 0);
      if (canTarget) {
        hitArea.setInteractive({ useHandCursor: true });
      }
      
      container.add([arrow, hitArea]);
      
      // 호버 시 타겟 하이라이트
      if (canTarget) {
        hitArea.on('pointerover', () => {
          this.highlightTargets(enemy.id);
          arrow.setAlpha(1);
          arrow.setScale(1.2);
          
          // 데미지 미리보기 표시
          this.scene.gameScene.enemyManager.showDamagePreview(enemy);
        });
        
        hitArea.on('pointerout', () => {
          this.clearHighlights();
          arrow.setAlpha(0.6);
          arrow.setScale(1);
          
          // 데미지 미리보기 숨기기
          this.scene.gameScene.enemyManager.hideDamagePreview();
        });
        
        hitArea.on('pointerdown', () => {
          this.scene.gameScene.selectTarget(enemy.id);
        });
        
        // 화살표 애니메이션
        this.scene.tweens.add({
          targets: arrow,
          y: -110,
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
      
      this.targetIndicators.set(enemy.id, container);
    });
  }
  
  /**
   * 특정 적 기준으로 타겟 범위 내 적들 하이라이트
   */
  private highlightTargets(baseEnemyId: string) {
    const enemies = this.scene.gameScene.gameState.enemies;
    const baseEnemy = enemies.find(e => e.id === baseEnemyId);
    if (!baseEnemy) return;
    
    // 해당 적 기준으로 공격 범위 내 적들 구하기
    const targets = this.scene.gameScene.combatSystem.getTargetsByReachFromEnemy(
      this.currentReach, 
      baseEnemy
    );
    
    const targetIds = new Set(targets.map(t => t.id));
    
    // 모든 적 처리
    enemies.forEach(enemy => {
      const dimOverlay = this.dimOverlays.get(enemy.id);
      const highlightBorder = this.highlightBorders.get(enemy.id);
      
      if (targetIds.has(enemy.id)) {
        // 타겟: 밝게 + 주황 테두리
        if (dimOverlay) dimOverlay.setAlpha(0);
        if (highlightBorder) {
          highlightBorder.setVisible(true);
          highlightBorder.setStrokeStyle(6, COLORS.secondary.main);
        }
      } else {
        // 비타겟: 더 어둡게
        if (dimOverlay) dimOverlay.setAlpha(0.5);
        if (highlightBorder) highlightBorder.setVisible(false);
      }
    });
  }
  
  /**
   * 하이라이트 초기화
   */
  private clearHighlights() {
    this.dimOverlays.forEach(overlay => overlay.setAlpha(0.3));
    this.highlightBorders.forEach(border => border.setVisible(false));
  }
  
  hide() {
    this.targetIndicators.forEach(indicator => indicator.destroy());
    this.targetIndicators.clear();
    this.dimOverlays.forEach(overlay => overlay.destroy());
    this.dimOverlays.clear();
    this.highlightBorders.forEach(border => border.destroy());
    this.highlightBorders.clear();
    this.tauntIndicators.forEach(indicator => indicator.destroy());
    this.tauntIndicators.clear();
  }
  
  updatePositions() {
    const enemies = this.scene.gameScene.gameState.enemies;
    const enemySprites = this.scene.gameScene.enemySprites;
    
    enemies.forEach(enemy => {
      const sprite = enemySprites.get(enemy.id);
      if (!sprite) return;
      
      const indicator = this.targetIndicators.get(enemy.id);
      const dimOverlay = this.dimOverlays.get(enemy.id);
      const highlightBorder = this.highlightBorders.get(enemy.id);
      
      if (indicator) indicator.setPosition(sprite.x, sprite.y - 30);
      if (dimOverlay) dimOverlay.setPosition(sprite.x, sprite.y - 30);
      if (highlightBorder) highlightBorder.setPosition(sprite.x, sprite.y - 30);
    });
  }
}

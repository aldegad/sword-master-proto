import Phaser from 'phaser';
import type { UIScene } from '../scenes/UIScene';
import { COLORS, COLORS_STR } from '../constants/colors';

/**
 * 타겟 인디케이터 UI - 적 타겟 선택 표시
 */
export class TargetIndicatorUI {
  private scene: UIScene;
  private targetIndicators: Phaser.GameObjects.Container[] = [];
  
  constructor(scene: UIScene) {
    this.scene = scene;
  }
  
  show() {
    this.hide();
    
    const enemies = this.scene.gameScene.gameState.enemies;
    const enemySprites = this.scene.gameScene.enemySprites;
    
    enemies.forEach(enemy => {
      const sprite = enemySprites.get(enemy.id);
      if (!sprite) return;
      
      const container = this.scene.add.container(sprite.x, sprite.y - 80);
      
      // 타겟 화살표
      const arrow = this.scene.add.text(0, 0, '👆', {
        font: '32px Arial',
      }).setOrigin(0.5);
      
      // 선택 버튼
      const selectBg = this.scene.add.rectangle(0, 35, 80, 30, COLORS.secondary.dark, 0.9);
      selectBg.setStrokeStyle(2, COLORS.primary.light);
      
      const selectText = this.scene.add.text(0, 35, '공격', {
        font: 'bold 14px monospace',
        color: COLORS_STR.primary.light,
      }).setOrigin(0.5);
      
      container.add([arrow, selectBg, selectText]);
      
      // 인터랙션
      selectBg.setInteractive({ useHandCursor: true });
      selectBg.on('pointerover', () => {
        selectBg.setFillStyle(COLORS.secondary.main);
        container.setScale(1.1);
      });
      selectBg.on('pointerout', () => {
        selectBg.setFillStyle(COLORS.secondary.dark);
        container.setScale(1);
      });
      selectBg.on('pointerdown', () => {
        this.scene.gameScene.selectTarget(enemy.id);
      });
      
      // 애니메이션
      this.scene.tweens.add({
        targets: arrow,
        y: -10,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      
      this.targetIndicators.push(container);
    });
  }
  
  hide() {
    this.targetIndicators.forEach(indicator => indicator.destroy());
    this.targetIndicators = [];
  }
  
  updatePositions() {
    const enemies = this.scene.gameScene.gameState.enemies;
    const enemySprites = this.scene.gameScene.enemySprites;
    
    this.targetIndicators.forEach((indicator, index) => {
      if (index < enemies.length) {
        const enemy = enemies[index];
        const sprite = enemySprites.get(enemy.id);
        if (sprite) {
          indicator.setPosition(sprite.x, sprite.y - 80);
        }
      }
    });
  }
}

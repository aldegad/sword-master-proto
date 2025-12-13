import type { GameScene } from '../scenes/GameScene';
import { COLORS } from '../constants/colors';

/**
 * 애니메이션 헬퍼 - 모든 애니메이션 효과 담당
 */
export class AnimationHelper {
  private scene: GameScene;
  
  constructor(scene: GameScene) {
    this.scene = scene;
  }
  
  // ========== 플레이어 애니메이션 ==========
  
  playerAttack() {
    this.scene.tweens.add({
      targets: this.scene.playerSprite,
      x: this.scene.PLAYER_X + 40,
      duration: 100,
      yoyo: true,
      ease: 'Power2',
    });
  }
  
  playerHit() {
    this.scene.tweens.add({
      targets: this.scene.playerSprite,
      x: this.scene.PLAYER_X - 15,
      duration: 50,
      yoyo: true,
      repeat: 2,
    });
    
    this.scene.cameras.main.shake(100, 0.01);
  }
  
  // ========== 데미지 숫자 ==========
  
  showDamageNumber(x: number, y: number, damage: number, color: number) {
    const prefix = color === COLORS.message.success ? '+' : '-';
    const text = this.scene.add.text(x, y, `${prefix}${Math.floor(damage)}`, {
      font: 'bold 20px monospace',
      color: `#${color.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);
    
    this.scene.tweens.add({
      targets: text,
      y: y - 50,
      alpha: 0,
      duration: 800,
      onComplete: () => text.destroy(),
    });
  }
  
  // ========== 메시지 ==========
  
  showMessage(msg: string, color: number) {
    const text = this.scene.add.text(
      this.scene.cameras.main.width / 2,
      150,
      msg,
      {
        font: 'bold 24px monospace',
        color: `#${color.toString(16).padStart(6, '0')}`,
      }
    ).setOrigin(0.5);
    
    this.scene.tweens.add({
      targets: text,
      y: 100,
      alpha: 0,
      duration: 1200,
      onComplete: () => text.destroy(),
    });
  }
  
  // ========== 방어 이펙트 ==========
  
  /**
   * 적 스킬 이름을 화면 중앙에 크게 표시
   * @returns Promise - 표시 완료 후 resolve
   */
  showEnemySkillName(enemyName: string, skillName: string, skillEmoji: string): Promise<void> {
    return new Promise((resolve) => {
      const centerX = this.scene.cameras.main.width / 2;
      const centerY = this.scene.cameras.main.height / 2 - 50;
      
      // 배경 어둡게
      const overlay = this.scene.add.rectangle(
        centerX,
        centerY,
        400,
        100,
        COLORS.background.black,
        0.7
      ).setOrigin(0.5);
      overlay.setDepth(3000);  // 모든 경고 메시지보다 위에 표시
      
      // 테두리
      overlay.setStrokeStyle(3, COLORS.message.error);
      
      // 적 이름 + 스킬 이름
      const text = this.scene.add.text(
        centerX,
        centerY,
        `${skillEmoji} ${enemyName}의 ${skillName}!`,
        {
          font: 'bold 28px monospace',
          color: '#c44536',
        }
      ).setOrigin(0.5);
      text.setDepth(3001);  // 모든 경고 메시지보다 위에 표시
      
      // 등장 애니메이션
      overlay.setScale(0.5);
      overlay.setAlpha(0);
      text.setScale(0.5);
      text.setAlpha(0);
      
      this.scene.tweens.add({
        targets: [overlay, text],
        scale: 1,
        alpha: 1,
        duration: 200,
        ease: 'Back.easeOut',
        onComplete: () => {
          // 잠시 유지 후 사라짐
          this.scene.time.delayedCall(600, () => {
            this.scene.tweens.add({
              targets: [overlay, text],
              alpha: 0,
              y: centerY - 30,
              duration: 300,
              onComplete: () => {
                overlay.destroy();
                text.destroy();
                resolve();
              },
            });
          });
        },
      });
    });
  }
  
  /**
   * 적 스킬 사용 시 대기 표시에서 스킬이 사라지는 애니메이션
   */
  showEnemySkillUsed(enemyX: number, enemyY: number, skillName: string, emoji: string) {
    // 적 머리 위에서 스킬 이름이 슉~ 하고 날아감
    const skillText = this.scene.add.text(enemyX, enemyY - 80, `${emoji} ${skillName}`, {
      font: 'bold 16px monospace',
      color: '#d4af37',
      backgroundColor: '#1a1512',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5);
    skillText.setDepth(500);
    
    // 위로 올라가며 사라짐
    this.scene.tweens.add({
      targets: skillText,
      y: enemyY - 150,
      alpha: 0,
      scale: 1.3,
      duration: 600,
      ease: 'Power2',
      onComplete: () => skillText.destroy(),
    });
  }
  
  /**
   * 무기 카드 장착 애니메이션 - 적에게 날아가서 때리고 플레이어에게 돌아옴 (발도!)
   */
  cardToPlayer(startX: number, startY: number, targetX: number, targetY: number, emoji: string, name: string): Promise<void> {
    return new Promise((resolve) => {
      const playerX = this.scene.PLAYER_X;
      const playerY = this.scene.GROUND_Y - 60;
      
      // 카드 모양 컨테이너
      const card = this.scene.add.container(startX, startY);
      card.setDepth(2000);
      
      const bg = this.scene.add.rectangle(0, 0, 80, 100, COLORS.background.medium, 0.95);
      bg.setStrokeStyle(3, COLORS.message.error);
      
      const emojiText = this.scene.add.text(0, -15, emoji, {
        font: '32px Arial',
      }).setOrigin(0.5);
      
      const nameText = this.scene.add.text(0, 25, name.slice(0, 4), {
        font: 'bold 12px monospace',
        color: '#c44536',
      }).setOrigin(0.5);
      
      card.add([bg, emojiText, nameText]);
      
      // 1단계: 적에게 날아감 (발도 공격!)
      this.scene.tweens.add({
        targets: card,
        x: targetX,
        y: targetY - 30,
        scale: 0.6,
        rotation: Math.PI,
        duration: 250,
        ease: 'Power3',
        onComplete: () => {
          // 임팩트 효과
          const impact = this.scene.add.text(targetX, targetY - 30, '⚔️💥', {
            font: '48px Arial',
          }).setOrigin(0.5);
          impact.setDepth(2001);
          
          this.scene.tweens.add({
            targets: impact,
            scale: 1.5,
            alpha: 0,
            duration: 300,
            onComplete: () => impact.destroy(),
          });
          
          // 2단계: 플레이어에게 돌아옴 (장착)
          this.scene.tweens.add({
            targets: card,
            x: playerX,
            y: playerY,
            scale: 0.4,
            rotation: Math.PI * 2,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
              // 장착 효과
              const flash = this.scene.add.text(playerX, playerY, '✨', {
                font: '40px Arial',
              }).setOrigin(0.5);
              flash.setDepth(2001);
              
              this.scene.tweens.add({
                targets: flash,
                scale: 2,
                alpha: 0,
                duration: 400,
                onComplete: () => flash.destroy(),
              });
              
              card.destroy();
              resolve();
            },
          });
        },
      });
    });
  }
  
  /**
   * 스킬 카드 사용 애니메이션 - 카드가 적에게 날아감
   */
  cardToEnemy(startX: number, startY: number, targetX: number, targetY: number, emoji: string, name: string): Promise<void> {
    return new Promise((resolve) => {
      // 카드 모양 컨테이너
      const card = this.scene.add.container(startX, startY);
      card.setDepth(2000);
      
      const bg = this.scene.add.rectangle(0, 0, 80, 100, COLORS.background.dark, 0.95);
      bg.setStrokeStyle(3, COLORS.message.success);
      
      const emojiText = this.scene.add.text(0, -15, emoji, {
        font: '32px Arial',
      }).setOrigin(0.5);
      
      const nameText = this.scene.add.text(0, 25, name.slice(0, 4), {
        font: 'bold 12px monospace',
        color: '#4a7c59',
      }).setOrigin(0.5);
      
      card.add([bg, emojiText, nameText]);
      
      // 적에게 날아가는 애니메이션
      this.scene.tweens.add({
        targets: card,
        x: targetX,
        y: targetY - 30,
        scale: 0.3,
        duration: 300,
        ease: 'Power3',
        onComplete: () => {
          // 임팩트 효과
          const impact = this.scene.add.text(targetX, targetY - 30, '💥', {
            font: '48px Arial',
          }).setOrigin(0.5);
          impact.setDepth(2001);
          
          this.scene.tweens.add({
            targets: impact,
            scale: 1.5,
            alpha: 0,
            duration: 300,
            onComplete: () => impact.destroy(),
          });
          
          card.destroy();
          resolve();
        },
      });
    });
  }
  
  showParryEffect() {
    // 화면 전체 금색 플래시
    const flash = this.scene.add.rectangle(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      COLORS.primary.dark,
      0.4
    );
    
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy(),
    });
    
    // 방패 이모지 이펙트
    const shield = this.scene.add.text(
      this.scene.PLAYER_X + 50,
      this.scene.GROUND_Y - 80,
      '🛡️',
      { font: '48px Arial' }
    ).setOrigin(0.5);
    
    this.scene.tweens.add({
      targets: shield,
      scale: 1.5,
      alpha: 0,
      y: this.scene.GROUND_Y - 130,
      duration: 500,
      ease: 'Power2',
      onComplete: () => shield.destroy(),
    });
    
    // 검이 빛나는 효과
    const sparkle = this.scene.add.text(
      this.scene.PLAYER_X,
      this.scene.GROUND_Y - 60,
      '✨',
      { font: '32px Arial' }
    ).setOrigin(0.5);
    
    this.scene.tweens.add({
      targets: sparkle,
      rotation: Math.PI * 2,
      scale: 0,
      duration: 400,
      onComplete: () => sparkle.destroy(),
    });
  }
  
  // ========== 카운트 효과 애니메이션 ==========
  
  /**
   * 카운트 영역 위치 (CountEffectUI와 동일)
   */
  private getCountAreaPosition() {
    return { x: 110, y: 320 };  // 카운트 UI 영역 중앙
  }
  
  /**
   * 스킬 카드가 카운트 영역으로 날아가는 애니메이션 (강타 등)
   */
  cardToCount(startX: number, startY: number, emoji: string, name: string): Promise<void> {
    return new Promise((resolve) => {
      const countPos = this.getCountAreaPosition();
      
      // 카드 모양 컨테이너
      const card = this.scene.add.container(startX, startY);
      card.setDepth(2000);
      
      const bg = this.scene.add.rectangle(0, 0, 80, 100, COLORS.background.dark, 0.95);
      bg.setStrokeStyle(3, COLORS.primary.dark);  // 강타는 금색
      
      const emojiText = this.scene.add.text(0, -15, emoji, {
        font: '32px Arial',
      }).setOrigin(0.5);
      
      const nameText = this.scene.add.text(0, 25, name.slice(0, 4), {
        font: 'bold 12px monospace',
        color: '#d4af37',
      }).setOrigin(0.5);
      
      card.add([bg, emojiText, nameText]);
      
      // 카운트 영역으로 날아가는 애니메이션
      this.scene.tweens.add({
        targets: card,
        x: countPos.x,
        y: countPos.y,
        scale: 0.5,
        rotation: Math.PI * 0.5,
        duration: 400,
        ease: 'Power2',
        onComplete: () => {
          // 카운트 등록 효과
          const chargeText = this.scene.add.text(countPos.x, countPos.y, '⏳', {
            font: '32px Arial',
          }).setOrigin(0.5);
          chargeText.setDepth(2001);
          
          this.scene.tweens.add({
            targets: chargeText,
            scale: 1.5,
            alpha: 0,
            y: countPos.y - 30,
            duration: 400,
            onComplete: () => chargeText.destroy(),
          });
          
          card.destroy();
          resolve();
        },
      });
    });
  }
  
  /**
   * 강타 발동 시 화면 중앙에 스킬 정보 표시
   */
  showChargeSkillEffect(emoji: string, name: string, description: string): Promise<void> {
    return new Promise((resolve) => {
      const centerX = this.scene.cameras.main.width / 2;
      const centerY = this.scene.cameras.main.height / 2 - 50;
      
      // 배경
      const overlay = this.scene.add.rectangle(
        centerX,
        centerY,
        350,
        120,
        COLORS.background.black,
        0.85
      ).setOrigin(0.5);
      overlay.setDepth(1000);
      overlay.setStrokeStyle(4, COLORS.primary.dark);
      
      // 이모지와 스킬명
      const titleText = this.scene.add.text(
        centerX,
        centerY - 25,
        `${emoji} ${name} 발동!`,
        {
          font: 'bold 32px monospace',
          color: '#d4af37',
        }
      ).setOrigin(0.5);
      titleText.setDepth(1001);
      
      // 설명
      const descText = this.scene.add.text(
        centerX,
        centerY + 20,
        description,
        {
          font: '16px monospace',
          color: '#e8dcc4',
          align: 'center',
        }
      ).setOrigin(0.5);
      descText.setDepth(1001);
      
      // 등장 애니메이션
      overlay.setScale(0.3);
      overlay.setAlpha(0);
      titleText.setScale(0.3);
      titleText.setAlpha(0);
      descText.setScale(0.3);
      descText.setAlpha(0);
      
      this.scene.tweens.add({
        targets: [overlay, titleText, descText],
        scale: 1,
        alpha: 1,
        duration: 200,
        ease: 'Back.easeOut',
        onComplete: () => {
          // 잠시 유지 후 사라짐
          this.scene.time.delayedCall(800, () => {
            this.scene.tweens.add({
              targets: [overlay, titleText, descText],
              alpha: 0,
              y: centerY - 30,
              duration: 300,
              onComplete: () => {
                overlay.destroy();
                titleText.destroy();
                descText.destroy();
                resolve();
              },
            });
          });
        },
      });
    });
  }
  
  /**
   * 카운트 영역에서 적에게 날아가는 애니메이션 (강타 발동)
   */
  cardFromCountToEnemy(targetX: number, targetY: number, emoji: string, name: string): Promise<void> {
    return new Promise((resolve) => {
      const countPos = this.getCountAreaPosition();
      
      // 카드 모양 컨테이너
      const card = this.scene.add.container(countPos.x, countPos.y);
      card.setDepth(2000);
      card.setScale(0.5);
      
      const bg = this.scene.add.rectangle(0, 0, 80, 100, COLORS.background.dark, 0.95);
      bg.setStrokeStyle(3, COLORS.primary.dark);
      
      const emojiText = this.scene.add.text(0, -15, emoji, {
        font: '32px Arial',
      }).setOrigin(0.5);
      
      const nameText = this.scene.add.text(0, 25, name.slice(0, 4), {
        font: 'bold 12px monospace',
        color: '#d4af37',
      }).setOrigin(0.5);
      
      card.add([bg, emojiText, nameText]);
      
      // 적에게 돌진하는 애니메이션 (더 빠르고 강렬하게)
      this.scene.tweens.add({
        targets: card,
        x: targetX,
        y: targetY - 30,
        scale: 0.8,
        rotation: Math.PI * 2,
        duration: 250,
        ease: 'Power4',
        onComplete: () => {
          // 강력한 임팩트 효과
          const impact = this.scene.add.text(targetX, targetY - 30, '💥💥💥', {
            font: '56px Arial',
          }).setOrigin(0.5);
          impact.setDepth(2001);
          
          this.scene.tweens.add({
            targets: impact,
            scale: 2,
            alpha: 0,
            duration: 400,
            onComplete: () => impact.destroy(),
          });
          
          // 화면 흔들림
          this.scene.cameras.main.shake(150, 0.02);
          
          card.destroy();
          resolve();
        },
      });
    });
  }
}


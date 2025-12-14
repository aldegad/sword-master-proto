import type { GameScene } from '../scenes/GameScene';
import { COLORS } from '../constants/colors';
import { CARD_LAYOUT } from '../ui/CardUI';

/**
 * 애니메이션 헬퍼 - 모든 애니메이션 효과 담당
 */
export class AnimationHelper {
  private scene: GameScene;
  
  constructor(scene: GameScene) {
    this.scene = scene;
  }
  
  // ========== 카드 드로우/무덤 애니메이션 ==========
  
  /**
   * 덱에서 카드 드로우 애니메이션
   */
  cardDraw(emoji: string, cardIndex: number): Promise<void> {
    return new Promise((resolve) => {
      const deckX = 100;  // 덱 위치 (좌측)
      const deckY = this.scene.cameras.main.height - 150;
      
      // 손패 영역 중앙 계산 (카드 인덱스에 따라 위치 분산)
      const handY = this.scene.cameras.main.height - 120;
      const handCenterX = this.scene.cameras.main.width / 2;
      const spread = 80;  // 카드 간 간격
      const handX = handCenterX + (cardIndex - 2) * spread;  // 중앙 기준 분산
      
      // 카드 생성 - 덱에서 시작
      const card = this.scene.add.container(deckX, deckY);
      card.setDepth(2000 + cardIndex);
      
      const bg = this.scene.add.rectangle(0, 0, 100, 140, COLORS.background.dark, 0.95);
      bg.setStrokeStyle(4, COLORS.primary.dark);
      
      const emojiText = this.scene.add.text(0, 0, emoji, {
        font: '45px Arial',
      }).setOrigin(0.5);
      
      card.add([bg, emojiText]);
      card.setScale(0.5);  // 시작 크기
      card.setAlpha(1);    // 바로 보이게
      
      // 덱에서 손패로 날아가는 애니메이션 (호를 그리며)
      this.scene.tweens.add({
        targets: card,
        x: handX,
        y: handY - 50,  // 위로 올라갔다가
        scale: 1.0,
        duration: 250,
        ease: 'Quad.easeOut',
        onComplete: () => {
          // 손패로 내려오면서 사라짐
          this.scene.tweens.add({
            targets: card,
            y: handY + 20,
            alpha: 0,
            scale: 0.7,
            duration: 200,
            ease: 'Quad.easeIn',
            onComplete: () => {
              card.destroy();
              resolve();
            },
          });
        },
      });
    });
  }
  
  /**
   * 카드가 무덤으로 가는 애니메이션
   */
  cardToGrave(startX: number, startY: number, emoji: string): Promise<void> {
    return new Promise((resolve) => {
      const graveX = 56;  // 무덤 위치 (좌측 하단)
      const graveY = this.scene.cameras.main.height - 34;
      
      // 카드 생성
      const card = this.scene.add.container(startX, startY);
      card.setDepth(1500);
      
      const bg = this.scene.add.rectangle(0, 0, 100, 125, COLORS.background.dark, 0.9);
      bg.setStrokeStyle(2, COLORS.text.muted);
      
      const emojiText = this.scene.add.text(0, 0, emoji, {
        font: '32px Arial',
      }).setOrigin(0.5);
      
      card.add([bg, emojiText]);
      card.setScale(0.6);
      
      // 무덤으로 날아가며 회전하며 사라지는 애니메이션
      this.scene.tweens.add({
        targets: card,
        x: graveX,
        y: graveY,
        scale: 0.2,
        rotation: Math.PI * 0.5,
        alpha: 0.3,
        duration: 400,
        ease: 'Power2',
        onComplete: () => {
          card.destroy();
          resolve();
        },
      });
    });
  }
  
  // ========== 플레이어 애니메이션 ==========
  
  playerAttack() {
    // 공격 시 attak 애니메이션만 재생 (흔들림 제거)
    this.scene.playAttakAnimation();
  }
  
  playerHit() {
    // 피격 시 damaged 애니메이션 재생 + 카메라 흔들림
    this.scene.playDamagedAnimation();
    this.scene.cameras.main.shake(150, 0.015);
  }
  
  // ========== 데미지 숫자 ==========
  
  showDamageNumber(x: number, y: number, damage: number, color: number, isCritical: boolean = false) {
    const prefix = color === COLORS.message.success ? '+' : '-';
    const fontSize = isCritical ? 60 : 40;  // 크리티컬: 60px, 일반: 40px (기존 20px의 2배)
    const displayText = isCritical ? `${prefix}${Math.floor(damage)}!` : `${prefix}${Math.floor(damage)}`;
    
    const text = this.scene.add.text(x, y, displayText, {
      font: `bold ${fontSize}px monospace`,
      color: `#${color.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);
    
    // 크리티컬일 때 스케일 펀치 효과
    if (isCritical) {
      text.setScale(1.5);
      this.scene.tweens.add({
        targets: text,
        scale: 1,
        duration: 200,
        ease: 'Back.easeOut',
      });
    }
    
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
   * UIScene에서 처리하여 noWeaponWarning보다 위에 표시
   * @returns Promise - 표시 완료 후 resolve
   */
  showEnemySkillName(enemyName: string, skillName: string, skillEmoji: string): Promise<void> {
    // UIScene에서 처리 (같은 씬 내에서 depth가 작동하도록)
    const uiScene = this.scene.scene.get('UIScene') as import('../scenes/UIScene').UIScene;
    if (uiScene && uiScene.showEnemySkillName) {
      return uiScene.showEnemySkillName(enemyName, skillName, skillEmoji);
    }
    
    // fallback: UIScene이 없으면 기존 방식으로 처리
    return new Promise((resolve) => {
      const centerX = this.scene.cameras.main.width / 2;
      const centerY = this.scene.cameras.main.height / 2 - 50;
      
      const overlay = this.scene.add.rectangle(
        centerX, centerY, 400, 100,
        COLORS.background.black, 0.7
      ).setOrigin(0.5);
      overlay.setDepth(3000);
      overlay.setStrokeStyle(3, COLORS.message.error);
      
      const text = this.scene.add.text(
        centerX, centerY,
        `${skillEmoji} ${enemyName}의 ${skillName}!`,
        { font: 'bold 28px monospace', color: '#c44536' }
      ).setOrigin(0.5);
      text.setDepth(3001);
      
      overlay.setScale(0.5).setAlpha(0);
      text.setScale(0.5).setAlpha(0);
      
      this.scene.tweens.add({
        targets: [overlay, text],
        scale: 1, alpha: 1,
        duration: 200,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.scene.time.delayedCall(600, () => {
            this.scene.tweens.add({
              targets: [overlay, text],
              alpha: 0, y: centerY - 30,
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
      const playerY = this.scene.GROUND_Y - 112;
      
      // 카드 모양 컨테이너 (스케일 적용)
      const card = this.scene.add.container(startX, startY);
      card.setDepth(2000);
      
      const bg = this.scene.add.rectangle(0, 0, 150, 188, COLORS.background.medium, 0.95);
      bg.setStrokeStyle(5, COLORS.message.error);
      
      const emojiText = this.scene.add.text(0, -28, emoji, {
        font: '60px Arial',
      }).setOrigin(0.5);
      
      const nameText = this.scene.add.text(0, 47, name.slice(0, 4), {
        font: 'bold 22px monospace',
        color: '#c44536',
      }).setOrigin(0.5);
      
      card.add([bg, emojiText, nameText]);
      
      // 1단계: 적에게 날아감 (발도 공격!)
      this.scene.tweens.add({
        targets: card,
        x: targetX,
        y: targetY - 56,
        scale: 0.6,
        rotation: Math.PI,
        duration: 120,  // 더 빠르게!
        ease: 'Power3',
        onComplete: () => {
          // 임팩트 효과 (스케일)
          const impact = this.scene.add.text(targetX, targetY - 56, '⚔️💥', {
            font: '90px Arial',
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
              // 장착 효과 (스케일)
              const flash = this.scene.add.text(playerX, playerY, '✨', {
                font: '75px Arial',
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
   * 스킬 카드 사용 애니메이션 - 카드가 적에게 날아가고 무덤으로 (2단계)
   */
  cardToEnemyAndGrave(startX: number, startY: number, targetX: number, targetY: number, emoji: string, name: string): Promise<void> {
    return new Promise((resolve) => {
      const height = this.scene.cameras.main.height;
      // 무덤 위치 (좌측 하단 - GRAVE 표시 위치)
      const graveX = 80;
      const graveY = height - 60;
      
      // 카드 모양 컨테이너 - CARD_LAYOUT 상수 사용
      const card = this.scene.add.container(startX, startY);
      card.setDepth(5000);  // 손패 UI보다 앞에
      
      const bg = this.scene.add.rectangle(0, 0, CARD_LAYOUT.CARD_WIDTH - 7, CARD_LAYOUT.CARD_HEIGHT, COLORS.background.dark, 0.95);
      bg.setStrokeStyle(5, COLORS.message.success);
      
      const emojiText = this.scene.add.text(0, -30, emoji, {
        font: '51px Arial',
      }).setOrigin(0.5);
      
      const nameText = this.scene.add.text(0, 60, name.slice(0, 4), {
        font: 'bold 20px monospace',
        color: '#4a7c59',
      }).setOrigin(0.5);
      
      card.add([bg, emojiText, nameText]);
      
      // 1단계: 적에게 날아가는 애니메이션
      this.scene.tweens.add({
        targets: card,
        x: targetX,
        y: targetY - 56,
        scale: 0.5,
        rotation: Math.PI * 0.3,
        duration: 300,
        ease: 'Power3',
        onComplete: () => {
          // 임팩트 효과
          const impact = this.scene.add.text(targetX, targetY - 56, '💥', {
            font: '90px Arial',
          }).setOrigin(0.5);
          impact.setDepth(5001);
          
          this.scene.tweens.add({
            targets: impact,
            scale: 1.5,
            alpha: 0,
            duration: 300,
            onComplete: () => impact.destroy(),
          });
          
          // 2단계: 무덤으로 튕겨나감 (느리게)
          this.scene.tweens.add({
            targets: card,
            x: graveX,
            y: graveY,
            scale: 0.2,
            alpha: 0.4,
            rotation: -0.5,
            duration: 500,  // 느리게
            ease: 'Quad.easeInOut',
            onComplete: () => {
              card.destroy();
              resolve();
            },
          });
        },
      });
    });
  }
  
  /**
   * 스킬 카드 사용 애니메이션 - 카드가 적에게만 날아감 (대기 스킬용)
   */
  cardToEnemy(startX: number, startY: number, targetX: number, targetY: number, emoji: string, name: string): Promise<void> {
    return new Promise((resolve) => {
      // 카드 모양 컨테이너 (스케일)
      const card = this.scene.add.container(startX, startY);
      card.setDepth(2000);
      
      const bg = this.scene.add.rectangle(0, 0, 150, 188, COLORS.background.dark, 0.95);
      bg.setStrokeStyle(5, COLORS.message.success);
      
      const emojiText = this.scene.add.text(0, -28, emoji, {
        font: '60px Arial',
      }).setOrigin(0.5);
      
      const nameText = this.scene.add.text(0, 47, name.slice(0, 4), {
        font: 'bold 22px monospace',
        color: '#4a7c59',
      }).setOrigin(0.5);
      
      card.add([bg, emojiText, nameText]);
      
      // 적에게 날아가는 애니메이션
      this.scene.tweens.add({
        targets: card,
        x: targetX,
        y: targetY - 56,
        scale: 0.3,
        duration: 300,
        ease: 'Power3',
        onComplete: () => {
          // 임팩트 효과 (스케일)
          const impact = this.scene.add.text(targetX, targetY - 56, '💥', {
            font: '90px Arial',
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
    // 화면 전체 금색 플래시 (더 강하게)
    const flash = this.scene.add.rectangle(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      COLORS.primary.dark,
      0.5
    );
    flash.setDepth(3000);
    
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy(),
    });
    
    // 방패 이모티콘 띠잉 효과 (크게 + 튀어나오는 느낌)
    const centerX = this.scene.cameras.main.width / 2;
    const centerY = this.scene.cameras.main.height / 2 - 50;
    
    const shield = this.scene.add.text(
      centerX,
      centerY,
      '🛡️',
      { font: '150px Arial' }
    ).setOrigin(0.5);
    shield.setDepth(3001);
    shield.setScale(0.3);
    shield.setAlpha(0);
    
    // 띠잉! 하고 튀어나오는 애니메이션
    this.scene.tweens.add({
      targets: shield,
      scale: { from: 0.3, to: 1.5 },
      alpha: { from: 0, to: 1 },
      duration: 150,
      ease: 'Back.easeOut',
      onComplete: () => {
        // 잠시 유지 후 사라짐
        this.scene.tweens.add({
          targets: shield,
          scale: 2,
          alpha: 0,
          duration: 400,
          ease: 'Power2',
          onComplete: () => shield.destroy(),
        });
      },
    });
    
    // 충격파 이펙트 (원형으로 퍼지는 링)
    const ring = this.scene.add.graphics();
    ring.setDepth(3000);
    ring.lineStyle(8, COLORS.primary.dark, 1);
    ring.strokeCircle(centerX, centerY, 50);
    
    this.scene.tweens.add({
      targets: ring,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => ring.destroy(),
    });
    
    // 빛나는 파티클들
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      const sparkle = this.scene.add.text(
        centerX,
        centerY,
        '✨',
        { font: '40px Arial' }
      ).setOrigin(0.5);
      sparkle.setDepth(3002);
      
      this.scene.tweens.add({
        targets: sparkle,
        x: centerX + Math.cos(angle) * 150,
        y: centerY + Math.sin(angle) * 150,
        alpha: 0,
        scale: 0.5,
        duration: 500,
        ease: 'Power2',
        onComplete: () => sparkle.destroy(),
      });
    }
  }
  
  // ========== 카운트 효과 애니메이션 ==========
  
  /**
   * 카운트 영역 위치 (CountEffectUI와 동일, 스케일)
   */
  private getCountAreaPosition() {
    return { x: 206, y: 620 };  // 카운트 UI 영역 중앙 (아래로 내림)
  }
  
  /**
   * 스킬 카드가 카운트 영역으로 날아가는 애니메이션 (강타 등)
   */
  cardToCount(startX: number, startY: number, emoji: string, name: string): Promise<void> {
    return new Promise((resolve) => {
      const countPos = this.getCountAreaPosition();
      
      // 카드 모양 컨테이너 (스케일)
      const card = this.scene.add.container(startX, startY);
      card.setDepth(2000);
      
      const bg = this.scene.add.rectangle(0, 0, 150, 188, COLORS.background.dark, 0.95);
      bg.setStrokeStyle(5, COLORS.primary.dark);  // 강타는 금색
      
      const emojiText = this.scene.add.text(0, -28, emoji, {
        font: '60px Arial',
      }).setOrigin(0.5);
      
      const nameText = this.scene.add.text(0, 47, name.slice(0, 4), {
        font: 'bold 22px monospace',
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
          // 카운트 등록 효과 (스케일)
          const chargeText = this.scene.add.text(countPos.x, countPos.y, '⏳', {
            font: '60px Arial',
          }).setOrigin(0.5);
          chargeText.setDepth(2001);
          
          this.scene.tweens.add({
            targets: chargeText,
            scale: 1.5,
            alpha: 0,
            y: countPos.y - 56,
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
   * 카운트 영역에서 적에게 날아가는 애니메이션 (강타 발동, 스케일)
   */
  cardFromCountToEnemy(targetX: number, targetY: number, emoji: string, name: string): Promise<void> {
    return new Promise((resolve) => {
      const countPos = this.getCountAreaPosition();
      
      // 카드 모양 컨테이너 (스케일)
      const card = this.scene.add.container(countPos.x, countPos.y);
      card.setDepth(2000);
      card.setScale(0.5);
      
      const bg = this.scene.add.rectangle(0, 0, 150, 188, COLORS.background.dark, 0.95);
      bg.setStrokeStyle(5, COLORS.primary.dark);
      
      const emojiText = this.scene.add.text(0, -28, emoji, {
        font: '60px Arial',
      }).setOrigin(0.5);
      
      const nameText = this.scene.add.text(0, 47, name.slice(0, 4), {
        font: 'bold 22px monospace',
        color: '#d4af37',
      }).setOrigin(0.5);
      
      card.add([bg, emojiText, nameText]);
      
      // 적에게 돌진하는 애니메이션 (더 빠르고 강렬하게)
      this.scene.tweens.add({
        targets: card,
        x: targetX,
        y: targetY - 56,
        scale: 0.8,
        rotation: Math.PI * 2,
        duration: 250,
        ease: 'Power4',
        onComplete: () => {
          // 강력한 임팩트 효과 (스케일)
          const impact = this.scene.add.text(targetX, targetY - 56, '💥💥💥', {
            font: '105px Arial',
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


import Phaser from 'phaser';
import type { GameScene } from './GameScene';
import {
  TopUI,
  SwordInfoUI,
  CardUI,
  TooltipUI,
  ActionButtonsUI,
  TargetIndicatorUI,
  RewardSelectionUI,
  SkillSelectUI,
  CountEffectUI,
} from '../ui';
import { COLORS } from '../constants/colors';

/**
 * UI 씬 - 모든 UI 헬퍼를 조합하여 관리
 */
export class UIScene extends Phaser.Scene {
  gameScene!: GameScene;
  
  // UI 헬퍼들
  topUI!: TopUI;
  swordInfoUI!: SwordInfoUI;
  cardUI!: CardUI;
  tooltipUI!: TooltipUI;
  actionButtonsUI!: ActionButtonsUI;
  targetIndicatorUI!: TargetIndicatorUI;
  rewardSelectionUI!: RewardSelectionUI;
  skillSelectUI!: SkillSelectUI;
  countEffectUI!: CountEffectUI;
  
  // 무기 없음 경고 UI
  noWeaponWarning!: Phaser.GameObjects.Container;
  
  constructor() {
    super({ key: 'UIScene' });
  }

  init(data: { gameScene: GameScene }) {
    this.gameScene = data.gameScene;
  }

  create() {
    // UI 헬퍼 초기화 (순서 중요 - tooltipUI가 cardUI보다 먼저 필요)
    this.topUI = new TopUI(this);
    this.swordInfoUI = new SwordInfoUI(this);
    this.tooltipUI = new TooltipUI(this);
    this.cardUI = new CardUI(this);
    this.actionButtonsUI = new ActionButtonsUI(this);
    this.targetIndicatorUI = new TargetIndicatorUI(this);
    this.rewardSelectionUI = new RewardSelectionUI(this);
    this.skillSelectUI = new SkillSelectUI(this);
    this.countEffectUI = new CountEffectUI(this);
    
    // 무기 없음 경고 UI 생성
    this.createNoWeaponWarning();
    
    // 이벤트 리스너 설정
    this.setupEventListeners();
    
    // 초기 업데이트
    this.cardUI.updateCardDisplay();
    this.updateAllStats();
  }
  
  private createNoWeaponWarning() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2 - 60;
    
    this.noWeaponWarning = this.add.container(centerX, centerY);
    
    // 배경 박스 - 사이버펑크 스타일 (크기 키움)
    const bg = this.add.rectangle(0, 0, 420, 100, 0x0a0a15, 0.95);
    bg.setStrokeStyle(2, 0xff2a6d);
    
    // 경고 아이콘과 텍스트 (폰트 키움)
    const warningIcon = this.add.text(0, -18, '⚠ NO WEAPON ⚠', {
      font: 'bold 26px monospace',
      color: '#ff2a6d',
    }).setOrigin(0.5);
    
    const warningText = this.add.text(0, 20, '무기 카드를 사용하여 장착하세요', {
      font: '18px monospace',
      color: '#05d9e8',
    }).setOrigin(0.5);
    
    this.noWeaponWarning.add([bg, warningIcon, warningText]);
    this.noWeaponWarning.setVisible(false);
    this.noWeaponWarning.setDepth(5);  // 가장 낮은 depth - 다른 중앙 표시들 아래에
    
    // 깜빡이는 애니메이션
    this.tweens.add({
      targets: this.noWeaponWarning,
      alpha: { from: 1, to: 0.6 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
  
  private updateNoWeaponWarning() {
    const hasWeapon = this.gameScene.playerState.currentSword !== null;
    const inCombat = this.gameScene.gameState.phase === 'combat';
    
    // 전투 중이고 무기가 없을 때만 표시
    this.noWeaponWarning.setVisible(!hasWeapon && inCombat);
  }
  
  private setupEventListeners() {
    this.gameScene.events.on('handUpdated', this.onHandUpdated, this);
    this.gameScene.events.on('statsUpdated', this.updateAllStats, this);
    this.gameScene.events.on('turnEnded', this.onTurnEnded, this);
    this.gameScene.events.on('combatStarted', this.onCombatStarted, this);
    this.gameScene.events.on('modeChanged', this.onModeChanged, this);
    this.gameScene.events.on('targetingStarted', () => this.targetIndicatorUI.show(), this);
    this.gameScene.events.on('targetingCancelled', () => this.targetIndicatorUI.hide(), this);
    this.gameScene.events.on('showRewardSelection', () => this.rewardSelectionUI.show(), this);
    this.gameScene.events.on('rewardSelected', () => this.rewardSelectionUI.hide(), this);
    this.gameScene.events.on('showSkillCardSelection', () => this.skillSelectUI.show(), this);
    this.gameScene.events.on('skillCardSelected', () => this.skillSelectUI.hide(), this);
    this.gameScene.events.on('exchangeUsed', () => this.actionButtonsUI.onExchangeUsed(), this);
    
    // 씬 종료 시 이벤트 리스너 정리 (재시작 시 중복 방지)
    this.events.once('shutdown', () => {
      this.gameScene.events.off('handUpdated', this.onHandUpdated, this);
      this.gameScene.events.off('statsUpdated', this.updateAllStats, this);
      this.gameScene.events.off('turnEnded', this.onTurnEnded, this);
      this.gameScene.events.off('combatStarted', this.onCombatStarted, this);
      this.gameScene.events.off('modeChanged', this.onModeChanged, this);
      this.gameScene.events.off('targetingStarted');
      this.gameScene.events.off('targetingCancelled');
      this.gameScene.events.off('showRewardSelection');
      this.gameScene.events.off('rewardSelected');
      this.gameScene.events.off('showSkillCardSelection');
      this.gameScene.events.off('skillCardSelected');
      this.gameScene.events.off('exchangeUsed');
    });
  }
  
  private onHandUpdated() {
    this.cardUI.updateCardDisplay();
    this.swordInfoUI.update();
  }
  
  private onModeChanged() {
    this.cardUI.updateCardDisplay();
    this.actionButtonsUI.updateExchangeButton();
  }
  
  updateAllStats() {
    this.topUI.updateStats();
    this.swordInfoUI.update();
    this.countEffectUI.update();
    this.updateNoWeaponWarning();
  }
  
  private onTurnEnded() {
    // 대기 버튼 리셋
    this.actionButtonsUI.resetWaitButton();
    
    // 턴 표시 애니메이션
    const turnText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 50,
      `턴 ${this.gameScene.gameState.turn}`,
      {
        font: 'bold 40px monospace',
        color: '#ffcc00',
      }
    ).setOrigin(0.5).setAlpha(0);
    turnText.setDepth(100);  // noWeaponWarning(5)보다 위에 표시
    
    this.tweens.add({
      targets: turnText,
      alpha: 1,
      scale: 1.2,
      duration: 300,
      yoyo: true,
      onComplete: () => turnText.destroy(),
    });
  }
  
  private onCombatStarted() {
    // 대기 버튼 리셋
    this.actionButtonsUI.resetWaitButton();
    
    const text = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      '⚔️ BATTLE! ⚔️',
      {
        font: 'bold 44px monospace',
        color: '#e94560',
      }
    ).setOrigin(0.5).setAlpha(0);
    text.setDepth(100);  // noWeaponWarning(5)보다 위에 표시
    
    this.tweens.add({
      targets: text,
      alpha: 1,
      scale: 1.3,
      duration: 400,
      yoyo: true,
      hold: 200,
      onComplete: () => text.destroy(),
    });
  }

  update() {
    // 타겟 선택 모드일 때 인디케이터 위치 업데이트
    if (this.gameScene.isTargetingMode) {
      this.targetIndicatorUI.updatePositions();
    }
  }
  
  /**
   * 적 스킬 이름을 화면 중앙에 크게 표시 (UIScene에서 처리하여 noWeaponWarning보다 위에 표시)
   */
  showEnemySkillName(enemyName: string, skillName: string, skillEmoji: string): Promise<void> {
    return new Promise((resolve) => {
      const centerX = this.cameras.main.width / 2;
      const centerY = this.cameras.main.height / 2 - 50;
      
      // 배경 어둡게
      const overlay = this.add.rectangle(
        centerX,
        centerY,
        400,
        100,
        COLORS.background.black,
        0.7
      ).setOrigin(0.5);
      overlay.setDepth(3000);  // noWeaponWarning(50)보다 위에 표시
      
      // 테두리
      overlay.setStrokeStyle(3, COLORS.message.error);
      
      // 적 이름 + 스킬 이름
      const text = this.add.text(
        centerX,
        centerY,
        `${skillEmoji} ${enemyName}의 ${skillName}!`,
        {
          font: 'bold 28px monospace',
          color: '#c44536',
        }
      ).setOrigin(0.5);
      text.setDepth(3001);
      
      // 등장 애니메이션
      overlay.setScale(0.5);
      overlay.setAlpha(0);
      text.setScale(0.5);
      text.setAlpha(0);
      
      this.tweens.add({
        targets: [overlay, text],
        scale: 1,
        alpha: 1,
        duration: 200,
        ease: 'Back.easeOut',
        onComplete: () => {
          // 잠시 유지 후 사라짐
          this.time.delayedCall(600, () => {
            this.tweens.add({
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
}

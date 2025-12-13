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
    
    // 이벤트 리스너 설정
    this.setupEventListeners();
    
    // 초기 업데이트
    this.cardUI.updateCardDisplay();
    this.updateAllStats();
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
}

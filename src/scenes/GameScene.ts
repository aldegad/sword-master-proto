import * as Phaser from 'phaser';
import type { PlayerState, GameState, Card, PassiveTemplate } from '../types';
import { GAME_CONSTANTS } from '../types';
import { createSwordCard, getRandomSword, getRandomUniqueSword } from '../data/swords';
import { isBossWave, getCurrentTier, ENEMIES_TIER1, ENEMIES_TIER2, createEnemy } from '../data/enemies';
import { getRandomEvent, getRandomOutcome, type GameEvent, type EventChoice, type EventOutcome } from '../data/events';
import { createSkillCard, getStarterDeck, getRandomSkill } from '../data/skills';
import { addOrUpgradePassive, getRandomPassivesWithoutDuplicates } from '../data/passives';
import { CombatSystem, CardSystem, EnemyManager, AnimationHelper } from '../systems';
import { COLORS, COLORS_STR } from '../constants/colors';
import { USE_SPRITES, SPRITE_SCALE } from '../constants/sprites';

type SkillSelectType = 'searchSword' | 'graveRecall' | 'graveEquip';

interface SavedGameSnapshot {
  version: number;
  savedAt: string;
  playerState: PlayerState;
  gameState: GameState;
  runtime: {
    isMoving: boolean;
    moveDistance: number;
    rewardCards: Card[];
    levelUpSkillCards: Card[];
    levelUpPassives: PassiveTemplate[];
    bossRewardCards: Card[];
    skillSelectCards: Card[];
    skillSelectType: SkillSelectType | null;
    pendingSkillCard: Card | null;
    pendingEventReward: EventOutcome | null;
    pendingEvent: boolean;
    pendingLevelUp: boolean;
    isEventSkillSelection: boolean;
  };
}

/**
 * 메인 게임 씬
 * - 게임 초기화, 업데이트, 상태 관리
 * - 세부 로직은 각 시스템에 위임
 */
export class GameScene extends Phaser.Scene {
  // 게임 상태
  playerState!: PlayerState;
  gameState!: GameState;
  
  // 시스템
  combatSystem!: CombatSystem;
  cardSystem!: CardSystem;
  enemyManager!: EnemyManager;
  animationHelper!: AnimationHelper;
  
  // 게임 오브젝트
  playerSprite!: Phaser.GameObjects.Container;
  enemySprites: Map<string, Phaser.GameObjects.Container> = new Map();
  backgroundTiles: Phaser.GameObjects.Graphics[] = [];
  
  // 상수 (1920x1080 해상도 기준)
  readonly PLAYER_X = 280;
  readonly GROUND_Y = 780;  // 1080 기준
  readonly SCROLL_SPEED = 3;
  
  // 이동 관련
  isMoving: boolean = false;
  moveDistance: number = 0;
  
  // 모드
  isExchangeMode: boolean = false;
  isTargetingMode: boolean = false;
  pendingCard: { card: Card; index: number } | null = null;
  
// 보상 카드 선택
  rewardCards: Card[] = [];
  
  // 레벨업 스킬 선택
  levelUpSkillCards: Card[] = [];
  
  // 레벨업 패시브 선택
  levelUpPassive: PassiveTemplate | null = null;
  levelUpPassives: PassiveTemplate[] = [];

  // 스킬 효과로 인한 카드 선택
  skillSelectCards: Card[] = [];
  skillSelectType: SkillSelectType | null = null;
  pendingSkillCard: Card | null = null;  // 취소 시 복구할 카드
  
  // 이벤트 전투 후 보상
  pendingEventReward: EventOutcome | null = null;
  
  // 이동 중 이벤트 발생 플래그
  pendingEvent: boolean = false;
  
  // 전투 중 레벨업 발생 플래그
  pendingLevelUp: boolean = false;
  
  // 이벤트 스킬 선택 여부 (레벨업 vs 이벤트 구분용)
  isEventSkillSelection: boolean = false;

  // 자동 저장
  private readonly SAVE_STORAGE_KEY = 'sword-master-save-v1';
  private readonly SAVE_VERSION = 1;
  private readonly SAVE_INTERVAL_MS = 400;
  private lastSaveAt = 0;
  private lastSavedPayload = '';
  private beforeUnloadHandler?: () => void;
  private restoredFromSave = false;
  private suppressAutoSave = false;
  
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // restartFromBeginning()에서 임시로 끈 자동저장을 새 세션에서는 다시 활성화
    this.suppressAutoSave = false;

    // 시스템 초기화
    this.animationHelper = new AnimationHelper(this);
    this.combatSystem = new CombatSystem(this);
    this.cardSystem = new CardSystem(this);
    this.enemyManager = new EnemyManager(this);
    
    this.restoredFromSave = this.initializeGame();
    this.createBackground();
    this.createPlayer();
    this.setupInput();
    this.setupAutoSave();
    
    // UI 씬 시작
    this.scene.launch('UIScene', { gameScene: this });
    
    // 스탯 업데이트 이벤트 리스너 (플레이어 스탯 + 버프 표시 업데이트)
    this.events.on('statsUpdated', this.updatePlayerStatsDisplay, this);
    this.events.on('statsUpdated', this.updatePlayerBuffDisplay, this);
    
    // 씬 종료 시 정리 (재시작 시 이벤트 리스너 중복 방지)
    this.events.once('shutdown', () => {
      this.events.off('statsUpdated', this.updatePlayerStatsDisplay, this);
      this.events.off('statsUpdated', this.updatePlayerBuffDisplay, this);
      this.enemySprites.clear();
      if (this.beforeUnloadHandler) {
        window.removeEventListener('beforeunload', this.beforeUnloadHandler);
        this.beforeUnloadHandler = undefined;
      }
    });
    
    this.cameras.main.fadeIn(500, 0, 0, 0);
    
    if (this.restoredFromSave) {
      this.restoreLoadedSession();
    } else {
      // 첫 이동 시작
      this.startMoving();
    }

    this.persistGameSnapshot(true);
  }

  // ========== 초기화 ==========

  initializeGame(): boolean {
    if (this.tryRestoreGameSnapshot()) {
      return true;
    }

    const starterSword = createSwordCard('armingsword')!;
    
    const { swords, skills } = getStarterDeck();
    const deck: Card[] = [];
    
    swords.forEach(swordId => {
      const sword = createSwordCard(swordId);
      if (sword) deck.push({ type: 'sword', data: sword });
    });
    
    skills.forEach(skillId => {
      const skill = createSkillCard(skillId);
      if (skill) deck.push({ type: 'skill', data: skill });
    });
    
    this.cardSystem.shuffleArray(deck);
    
    this.playerState = {
      hp: 50,
      maxHp: 50,
      mana: GAME_CONSTANTS.INITIAL_MANA,
      maxMana: GAME_CONSTANTS.INITIAL_MANA,
      defense: 0,
      currentSword: starterSword,
      hand: [],
      deck: deck,
      discard: [],
      buffs: [],
      countEffects: [],  // 카운트 효과 (패리, 철벽, 반격 등)
      position: 0,
      usedAttackThisTurn: false,   // 이번 턴에 공격/무기 스킬 사용 여부
      passives: [],  // 패시브는 레벨업 시 획득
      exp: 0,
      level: 1,
      silver: 0,  // 은전
    };
    
    this.gameState = {
      phase: 'running',
      turn: 1,
      score: 0,
      distance: 0,
      enemies: [],
      currentWave: 0,
      enemiesDefeated: 0,
      eventsThisTier: 0,       // 이번 티어에서 발생한 이벤트 수
      lastEventWave: 0,        // 마지막 이벤트 발생 웨이브
    };
    return false;
  }

  private setupAutoSave() {
    this.beforeUnloadHandler = () => {
      this.persistGameSnapshot(true);
    };
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private isValidPhase(value: unknown): value is GameState['phase'] {
    return value === 'running'
      || value === 'combat'
      || value === 'victory'
      || value === 'paused'
      || value === 'gameOver'
      || value === 'event';
  }

  private parseSavedSnapshot(raw: string): SavedGameSnapshot | null {
    try {
      const parsed = JSON.parse(raw) as Partial<SavedGameSnapshot>;
      if (!this.isObject(parsed)) return null;
      if (parsed.version !== this.SAVE_VERSION) return null;
      if (!this.isObject(parsed.playerState) || !this.isObject(parsed.gameState) || !this.isObject(parsed.runtime)) {
        return null;
      }

      const player = parsed.playerState as PlayerState;
      const game = parsed.gameState as GameState;
      const runtime = parsed.runtime as SavedGameSnapshot['runtime'];

      if (!Array.isArray(player.hand) || !Array.isArray(player.deck) || !Array.isArray(player.discard)) return null;
      if (!Array.isArray(player.buffs) || !Array.isArray(player.countEffects) || !Array.isArray(player.passives)) return null;
      if (!Array.isArray(game.enemies) || !this.isValidPhase(game.phase)) return null;
      if (!Array.isArray(runtime.rewardCards) || !Array.isArray(runtime.levelUpSkillCards)) return null;
      if (!Array.isArray(runtime.levelUpPassives) || !Array.isArray(runtime.bossRewardCards)) return null;
      if (!Array.isArray(runtime.skillSelectCards)) return null;

      return parsed as SavedGameSnapshot;
    } catch {
      return null;
    }
  }

  private tryRestoreGameSnapshot(): boolean {
    try {
      const raw = window.localStorage.getItem(this.SAVE_STORAGE_KEY);
      if (!raw) return false;

      const snapshot = this.parseSavedSnapshot(raw);
      if (!snapshot) {
        window.localStorage.removeItem(this.SAVE_STORAGE_KEY);
        return false;
      }

      this.playerState = snapshot.playerState;
      this.gameState = snapshot.gameState;

      this.isMoving = snapshot.runtime.isMoving;
      this.moveDistance = snapshot.runtime.moveDistance;
      this.rewardCards = snapshot.runtime.rewardCards;
      this.levelUpSkillCards = snapshot.runtime.levelUpSkillCards;
      this.levelUpPassives = snapshot.runtime.levelUpPassives;
      this.bossRewardCards = snapshot.runtime.bossRewardCards;
      this.skillSelectCards = snapshot.runtime.skillSelectCards;
      this.skillSelectType = snapshot.runtime.skillSelectType;
      this.pendingSkillCard = snapshot.runtime.pendingSkillCard;
      this.pendingEventReward = snapshot.runtime.pendingEventReward;
      this.pendingEvent = snapshot.runtime.pendingEvent;
      this.pendingLevelUp = snapshot.runtime.pendingLevelUp;
      this.isEventSkillSelection = snapshot.runtime.isEventSkillSelection;

      // 입력 상태는 복원하지 않음
      this.isExchangeMode = false;
      this.isTargetingMode = false;
      this.pendingCard = null;

      this.lastSavedPayload = raw;
      return true;
    } catch {
      return false;
    }
  }

  private restoreLoadedSession() {
    // 비정상 상태 보호: phase가 combat인데 적이 비어있으면 이동으로 복구
    if (this.gameState.phase === 'combat' && this.gameState.enemies.length === 0) {
      this.gameState.phase = 'running';
      this.isMoving = true;
    }

    if (this.gameState.phase === 'combat') {
      this.isMoving = false;
      this.gameState.enemies.forEach((enemy) => {
        this.enemyManager.createEnemySprite(enemy);
      });
      this.time.delayedCall(520, () => {
        this.gameState.enemies.forEach((enemy) => {
          this.enemyManager.updateEnemySprite(enemy);
        });
        this.enemyManager.updateEnemyActionDisplay();
      });
    } else if (this.gameState.phase === 'running') {
      this.isMoving = true;
    } else if (this.gameState.phase === 'gameOver') {
      this.isMoving = false;
      this.time.delayedCall(200, () => this.gameOver());
    } else {
      this.isMoving = false;
    }

    this.events.emit('statsUpdated');
    this.events.emit('handUpdated');

    // 모달성 선택 UI 복원
    this.time.delayedCall(80, () => {
      if (this.levelUpSkillCards.length > 0) {
        this.events.emit('showLevelUpSkillSelection');
        return;
      }
      if (this.levelUpPassives.length > 0) {
        this.events.emit('showLevelUpPassiveSelection');
        return;
      }
      if (this.bossRewardCards.length > 0) {
        this.events.emit('showBossRewardSelection');
        return;
      }
      if (this.skillSelectCards.length > 0 && this.skillSelectType) {
        this.events.emit('showSkillCardSelection');
        return;
      }
      if (this.rewardCards.length > 0) {
        this.events.emit('showRewardSelection');
        return;
      }

      // 이벤트/승리/일시정지 상태는 저장 시점 컨텍스트가 끊기므로 안전하게 이동으로 복귀
      if (this.gameState.phase === 'event' || this.gameState.phase === 'victory' || this.gameState.phase === 'paused') {
        this.startMoving();
      }
    });

    this.animationHelper.showMessage('자동 저장 데이터를 불러왔습니다.', COLORS.success.dark);
  }

  private buildSnapshot(): SavedGameSnapshot {
    return {
      version: this.SAVE_VERSION,
      savedAt: new Date().toISOString(),
      playerState: this.playerState,
      gameState: this.gameState,
      runtime: {
        isMoving: this.isMoving,
        moveDistance: this.moveDistance,
        rewardCards: this.rewardCards,
        levelUpSkillCards: this.levelUpSkillCards,
        levelUpPassives: this.levelUpPassives,
        bossRewardCards: this.bossRewardCards,
        skillSelectCards: this.skillSelectCards,
        skillSelectType: this.skillSelectType,
        pendingSkillCard: this.pendingSkillCard,
        pendingEventReward: this.pendingEventReward,
        pendingEvent: this.pendingEvent,
        pendingLevelUp: this.pendingLevelUp,
        isEventSkillSelection: this.isEventSkillSelection,
      },
    };
  }

  private persistGameSnapshot(force: boolean = false) {
    if (this.suppressAutoSave) return;

    const now = this.time.now;
    if (!force && now - this.lastSaveAt < this.SAVE_INTERVAL_MS) return;

    try {
      const payload = JSON.stringify(this.buildSnapshot());
      if (!force && payload === this.lastSavedPayload) {
        this.lastSaveAt = now;
        return;
      }
      window.localStorage.setItem(this.SAVE_STORAGE_KEY, payload);
      this.lastSavedPayload = payload;
      this.lastSaveAt = now;
    } catch {
      // localStorage 사용 불가 시 저장 스킵
    }
  }

  private clearSavedGameSnapshot() {
    try {
      window.localStorage.removeItem(this.SAVE_STORAGE_KEY);
      this.lastSavedPayload = '';
    } catch {
      // localStorage 사용 불가 시 무시
    }
  }

  // ========== 배경 & 플레이어 ==========

  createBackground() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // 배경 이미지
    const bg = this.add.image(width / 2, height / 2, 'background');
    bg.setDisplaySize(width, height);
    
    // 배경 파티클 (꽃잎/먼지)
    for (let i = 0; i < 15; i++) {
      const dot = this.add.graphics();
      const isGold = Math.random() > 0.5;
      dot.fillStyle(isGold ? COLORS.primary.dark : COLORS.secondary.dark, 0.3);
      dot.fillCircle(Math.random() * width, this.GROUND_Y + 30 + Math.random() * 80, 2);
      (dot as any).scrollX = Math.random() * width;
      (dot as any).speed = 0.5 + Math.random();
      this.backgroundTiles.push(dot);
    }
  }

  // 플레이어 스프라이트 (애니메이션용)
  playerAnim?: Phaser.GameObjects.Sprite;
  currentAnim: string = 'idle';
  isAnimating: boolean = false;  // 전환 애니메이션 중인지

  // 플레이어 스탯 표시용
  playerStatsText?: Phaser.GameObjects.Text;
  
  // 플레이어 버프/디버프 컨테이너
  playerBuffContainer?: Phaser.GameObjects.Container;
  
  createPlayer() {
    // 플레이어만 조금 더 아래로 (GROUND_Y + 50)
    this.playerSprite = this.add.container(this.PLAYER_X, this.GROUND_Y + 50);
    
    if (USE_SPRITES && this.textures.exists('player-idle')) {
      // 스프라이트 기반 플레이어
      this.playerAnim = this.add.sprite(0, 0, 'player-idle');
      this.playerAnim.setScale(SPRITE_SCALE);
      this.playerAnim.setOrigin(0.5, 1);  // 하단 중앙 기준 (발이 땅에 닿도록)
      this.playerAnim.play('idle');
      this.playerSprite.add(this.playerAnim);
    } else {
      // 기존 이모지/텍스트 기반 플레이어 (스케일 적용)
      const body = this.add.rectangle(0, 0, 75, 112, COLORS.background.medium, 0.9);
      body.setStrokeStyle(3, COLORS.border.medium);
      
      const emoji = this.add.text(0, -20, '🧑‍🦱', { font: '60px Arial' }).setOrigin(0.5);
      
      this.playerSprite.add([body, emoji]);
    }
    
    // 플레이어 위에 공격력/방어율 표시 (스케일 적용)
    this.playerStatsText = this.add.text(0, -220, '', {
      font: 'bold 20px monospace',
      color: COLORS_STR.text.primary,
      align: 'center',
      backgroundColor: '#0a0a15cc',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5);
    this.playerSprite.add(this.playerStatsText);
    
    // 플레이어 버프/디버프 컨테이너 (스탯 위에 가로 배열)
    this.playerBuffContainer = this.add.container(0, -260);
    this.playerSprite.add(this.playerBuffContainer);
    
    this.updatePlayerWeaponDisplay();
    this.updatePlayerStatsDisplay();
    this.updatePlayerBuffDisplay();
  }
  
  updatePlayerStatsDisplay() {
    if (!this.playerStatsText) return;
    
    const sword = this.playerState.currentSword;
    if (!sword) {
      this.playerStatsText.setText('');
      this.playerStatsText.setVisible(false);  // 무기 없으면 숨김
      return;
    }
    
    this.playerStatsText.setVisible(true);  // 무기 있으면 표시
    
    // 버프로 인한 공격력 보너스 계산
    let attackBonus = 0;
    for (const buff of this.playerState.buffs) {
      if (buff.type === 'attack') {
        attackBonus += buff.value;
      }
    }
    
    const totalAttack = sword.attack + attackBonus;
    
    // 방어율 계산 (버프)
    let defenseBonus = 0;
    for (const buff of this.playerState.buffs) {
      if (buff.type === 'defense') {
        defenseBonus += buff.value;
      }
    }
    
    // 카운트 효과 방어 배수 체크 (countDefense 통합)
    let countDefenseMultiplier = 1;
    const countDefenseEffect = this.playerState.countEffects.find(e => e.type === 'countDefense');
    
    if (countDefenseEffect) {
      countDefenseMultiplier = countDefenseEffect.data.defenseMultiplier || 5;
    }
    
    // 카운트 효과가 있으면 방어율 배수 적용해서 표시
    const baseDefense = sword.defense + defenseBonus;
    const displayDefense = countDefenseMultiplier > 1 
      ? baseDefense * countDefenseMultiplier 
      : baseDefense;
    
    // 텍스트 표시
    this.playerStatsText.setText(`⚔️${totalAttack}  🛡️${displayDefense}%`);
    
    // 버프나 카운트 효과가 있으면 전체 색상 변경
    if (attackBonus > 0 || defenseBonus > 0 || countDefenseMultiplier > 1) {
      this.playerStatsText.setColor('#05d9e8');
    } else {
      this.playerStatsText.setColor('#ffffff');
    }
  }

  /**
   * 플레이어 애니메이션 재생
   * 
   * 애니메이션 흐름:
   * - idle: 기본 대기 상태 (서있기)
   * - work: 작업/공격 상태 (idle → idle-to-work → work → work-to-idle → idle)
   * 
   * @param animKey 애니메이션 키 (idle, work)
   * @param onComplete 애니메이션 완료 콜백
   */
  playPlayerAnimation(animKey: string, onComplete?: () => void) {
    if (!USE_SPRITES || !this.playerAnim) {
      // 스프라이트 없을 때는 콜백만 실행
      if (onComplete) onComplete();
      return;
    }
    
    // 이미 같은 상태면 스킵
    if (this.currentAnim === animKey && animKey === 'idle') {
      if (onComplete) onComplete();
      return;
    }
    
    // 전환 애니메이션 중이면 큐에 넣기 (간단히 무시)
    if (this.isAnimating) {
      if (onComplete) this.time.delayedCall(500, onComplete);
      return;
    }
    
    // work 애니메이션 요청
    if (animKey === 'work') {
      this.playWorkAnimation(onComplete);
    } 
    // idle 상태로 돌아가기
    else if (animKey === 'idle') {
      this.playIdleAnimation(onComplete);
    }
  }
  
  /**
   * Work 애니메이션 시퀀스: idle-to-work → work → work-to-idle → idle
   */
  private playWorkAnimation(onComplete?: () => void) {
    this.isAnimating = true;
    this.currentAnim = 'work';
    
    // 1단계: idle-to-work 전환
    const textureIdleWork = 'player-idle-work';
    if (this.textures.exists(textureIdleWork) && this.anims.exists('idle-to-work')) {
      this.playerAnim!.setTexture(textureIdleWork);
      this.playerAnim!.play('idle-to-work');
      
      this.playerAnim!.once('animationcomplete', () => {
        // 2단계: work 애니메이션
        const textureWork = 'player-work';
        if (this.textures.exists(textureWork) && this.anims.exists('work')) {
          this.playerAnim!.setTexture(textureWork);
          this.playerAnim!.play('work');
          
          this.playerAnim!.once('animationcomplete', () => {
            // 3단계: work-to-idle 전환
            if (this.textures.exists(textureIdleWork) && this.anims.exists('work-to-idle')) {
              this.playerAnim!.setTexture(textureIdleWork);
              this.playerAnim!.play('work-to-idle');
              
              this.playerAnim!.once('animationcomplete', () => {
                // 4단계: idle로 복귀
                this.playIdleAnimation();
                this.isAnimating = false;
                if (onComplete) onComplete();
              });
            } else {
              this.playIdleAnimation();
              this.isAnimating = false;
              if (onComplete) onComplete();
            }
          });
        } else {
          // work 애니메이션 없으면 바로 idle로
          this.playIdleAnimation();
          this.isAnimating = false;
          if (onComplete) onComplete();
        }
      });
    } else {
      // 전환 애니메이션 없으면 바로 idle
      this.playIdleAnimation();
      this.isAnimating = false;
      if (onComplete) onComplete();
    }
  }
  
  /**
   * Idle 애니메이션으로 전환
   */
  private playIdleAnimation(onComplete?: () => void) {
    this.currentAnim = 'idle';
    
    const textureIdle = 'player-idle';
    if (this.textures.exists(textureIdle) && this.anims.exists('idle')) {
      this.playerAnim!.setTexture(textureIdle);
      this.playerAnim!.play('idle');
    }
    
    if (onComplete) onComplete();
  }
  
  /**
   * Attak(공격) 애니메이션 재생
   * 재생 후 자동으로 idle로 복귀
   * 연속 공격 시 이전 애니메이션을 중단하고 새로 시작
   */
  playAttakAnimation(onComplete?: () => void) {
    if (!USE_SPRITES || !this.playerAnim) {
      if (onComplete) onComplete();
      return;
    }
    
    // 이전 애니메이션 중단하고 새로 시작 (연속 공격 지원)
    try {
      if (this.playerAnim.anims) {
        this.playerAnim.stop();
      }
      this.playerAnim.off('animationcomplete');
    } catch {
      // 애니메이션 정리 실패 시 무시
    }
    
    this.isAnimating = true;
    this.currentAnim = 'attak';
    
    const textureAttak = 'player-attak';
    if (this.textures.exists(textureAttak) && this.anims.exists('attak')) {
      this.playerAnim.setTexture(textureAttak);
      this.playerAnim.play('attak');
      
      this.playerAnim.once('animationcomplete', () => {
        this.playIdleAnimation();
        this.isAnimating = false;
        if (onComplete) onComplete();
      });
    } else {
      this.isAnimating = false;
      if (onComplete) onComplete();
    }
  }
  
  /**
   * 피격(Damaged) 애니메이션 재생
   * 재생 후 자동으로 idle로 복귀
   */
  playDamagedAnimation(onComplete?: () => void) {
    if (!USE_SPRITES || !this.playerAnim) {
      if (onComplete) onComplete();
      return;
    }
    
    // 피격 애니메이션은 현재 진행 중인 애니메이션을 중단하고 재생
    this.isAnimating = true;
    this.currentAnim = 'damaged';
    
    const textureDamaged = 'player-damaged';
    if (this.textures.exists(textureDamaged) && this.anims.exists('damaged')) {
      this.playerAnim.setTexture(textureDamaged);
      this.playerAnim.play('damaged');
      
      this.playerAnim.once('animationcomplete', () => {
        this.playIdleAnimation();
        this.isAnimating = false;
        if (onComplete) onComplete();
      });
    } else {
      this.isAnimating = false;
      if (onComplete) onComplete();
    }
  }

  updatePlayerWeaponDisplay() {
    // 무기 아이콘은 상단 UI에 표시되므로 플레이어 옆에는 표시하지 않음
    this.updatePlayerStatsDisplay();
    this.updatePlayerBuffDisplay();
    this.events.emit('statsUpdated');
  }
  
  /**
   * 플레이어 버프/디버프를 가로로 표시 (적과 동일한 형태)
   */
  updatePlayerBuffDisplay() {
    if (!this.playerBuffContainer) return;
    
    // 기존 내용 제거
    this.playerBuffContainer.removeAll(true);
    
    const buffs = this.playerState.buffs;
    const countEffects = this.playerState.countEffects;
    
    if (buffs.length === 0 && countEffects.length === 0) return;
    
    const iconSize = 52;
    const spacing = 8;
    const totalItems = buffs.length + countEffects.length;
    const totalWidth = totalItems * iconSize + (totalItems - 1) * spacing;
    let xOffset = -totalWidth / 2 + iconSize / 2;
    
    // 버프 표시
    buffs.forEach(buff => {
      const icon = this.createBuffIcon(xOffset, buff);
      this.playerBuffContainer!.add(icon);
      xOffset += iconSize + spacing;
    });
    
    // 카운트 효과 표시 (패리, 철벽 등)
    countEffects.forEach(effect => {
      const icon = this.createCountEffectIcon(xOffset, effect);
      this.playerBuffContainer!.add(icon);
      xOffset += iconSize + spacing;
    });
  }
  
  private createBuffIcon(x: number, buff: import('../types').Buff): Phaser.GameObjects.Container {
    const container = this.add.container(x, 0);
    
    // 배경
    const bg = this.add.rectangle(0, 0, 48, 36, COLORS.background.dark, 0.9);
    bg.setStrokeStyle(2, COLORS.primary.dark);
    
    // 아이콘 (버프 ID에 따라 다른 아이콘)
    let emoji = '✨';
    if (buff.id === 'focus') emoji = '🎯';
    else if (buff.id === 'sharpen') emoji = '🔪';
    else if (buff.type === 'attack') emoji = '⚔️';
    else if (buff.type === 'defense') emoji = '🛡️';
    
    const icon = this.add.text(-10, 0, emoji, { font: '16px Arial' }).setOrigin(0.5);
    
    // 남은 턴
    const duration = this.add.text(12, 0, `${buff.duration}`, {
      font: 'bold 14px monospace',
      color: COLORS_STR.primary.light,
    }).setOrigin(0.5);
    
    container.add([bg, icon, duration]);
    
    // 툴팁 추가
    bg.setInteractive({ useHandCursor: true });
    
    // 툴팁 설명 생성
    let description = buff.name;
    if (buff.id === 'focus') {
      description = `🎯 ${buff.name}: 다음 공격 +${buff.value * 100}%`;
    } else if (buff.id === 'sharpen') {
      description = `🔪 ${buff.name}: 공격력 +${buff.value}`;
    } else if (buff.type === 'attack') {
      description = `⚔️ ${buff.name}: 공격력 +${buff.value}`;
    } else if (buff.type === 'defense') {
      description = `🛡️ ${buff.name}: 방어력 +${buff.value}%`;
    }
    
    const tooltip = this.add.text(0, -40, description, {
      font: 'bold 14px monospace',
      color: COLORS_STR.text.primary,
      backgroundColor: '#1a1a2eee',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setVisible(false);
    container.add(tooltip);
    
    bg.on('pointerover', () => {
      tooltip.setVisible(true);
      bg.setStrokeStyle(3, COLORS.primary.light);
    });
    bg.on('pointerout', () => {
      tooltip.setVisible(false);
      bg.setStrokeStyle(2, COLORS.primary.dark);
    });
    
    return container;
  }
  
  private createCountEffectIcon(x: number, effect: import('../types').CountEffect): Phaser.GameObjects.Container {
    const container = this.add.container(x, 0);
    
    // 배경
    const bg = this.add.rectangle(0, 0, 48, 36, COLORS.background.dark, 0.9);
    bg.setStrokeStyle(2, COLORS.secondary.dark);
    
    // 아이콘
    const icon = this.add.text(-10, 0, effect.emoji, { font: '16px Arial' }).setOrigin(0.5);
    
    // 남은 대기
    const delays = this.add.text(12, 0, `${effect.remainingDelays}`, {
      font: 'bold 14px monospace',
      color: COLORS_STR.secondary.light,
    }).setOrigin(0.5);
    
    container.add([bg, icon, delays]);
    
    // 툴팁 추가
    bg.setInteractive({ useHandCursor: true });
    
    // 효과 설명 생성
    let description = `${effect.emoji} ${effect.name}`;
    if (effect.data.defenseMultiplier) {
      description += ` (방어 x${effect.data.defenseMultiplier})`;
    }
    if (effect.data.counterAttack) {
      description += ` +반격`;
    }
    description += ` [${effect.remainingDelays}회]`;
    
    const tooltip = this.add.text(0, -40, description, {
      font: 'bold 14px monospace',
      color: COLORS_STR.text.primary,
      backgroundColor: '#1a1a2eee',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setVisible(false);
    container.add(tooltip);
    
    bg.on('pointerover', () => {
      tooltip.setVisible(true);
      bg.setStrokeStyle(3, COLORS.secondary.light);
    });
    bg.on('pointerout', () => {
      tooltip.setVisible(false);
      bg.setStrokeStyle(2, COLORS.secondary.dark);
    });
    
    return container;
  }

  // ========== 입력 ==========

  setupInput() {
    for (let i = 1; i <= 9; i++) {
      this.input.keyboard!.on(`keydown-${i}`, () => {
        if (this.gameState.phase === 'combat') {
          this.cardSystem.useCard(i - 1);
        }
      });
    }
    
    this.input.keyboard!.on('keydown-ZERO', () => {
      if (this.gameState.phase === 'combat') {
        this.cardSystem.useCard(9);
      }
    });
    
    this.input.keyboard!.on('keydown-SPACE', () => {
      if (this.gameState.phase === 'combat') {
        // UIScene의 ActionButtonsUI를 통해 턴 종료 (연속 입력 방지)
        const uiScene = this.scene.get('UIScene') as import('./UIScene').UIScene;
        uiScene?.actionButtonsUI?.tryEndTurn();
      }
    });
  }

  // ========== 이동 & 전투 페이즈 ==========
  
  startMoving() {
    if (this.gameState.phase === 'gameOver') return;
    
    this.isMoving = true;
    this.gameState.phase = 'running';
    this.moveDistance = 0;
    
    this.animationHelper.showMessage('이동중...', COLORS.success.dark);
  }

  encounterEnemies() {
    this.isMoving = false;
    this.gameState.currentWave++;
    
    // 티어 변경 시 이벤트 카운터 리셋
    const currentTier = getCurrentTier(this.gameState.currentWave);
    const prevTier = getCurrentTier(this.gameState.currentWave - 1);
    if (currentTier !== prevTier && this.gameState.currentWave > 1) {
      this.gameState.eventsThisTier = 0;
    }
    
    // 무조건 전투 시작 (이벤트는 전투 후에 발생)
    this.gameState.phase = 'combat';
    this.enemyManager.spawnWaveEnemies();
    this.startCombat();
  }
  
  /**
   * 이벤트 발생 여부 확인 (전투 후에 호출됨)
   * - 1파 이후부터 발생 가능
   * - 티어당 2번 발생: 2-4 사이 1번, 6-9 사이 1번
   * - 보스 웨이브(5, 10) 이후에는 발생하지 않음
   */
  private shouldTriggerEvent(): boolean {
    const wave = this.gameState.currentWave;
    
    // 1파는 이벤트 없음 (첫 전투)
    if (wave <= 1) return false;
    
    // 보스 웨이브 제외
    if (isBossWave(wave)) return false;
    
    // 이미 2번 발생했으면 X
    if (this.gameState.eventsThisTier >= 2) return false;
    
    // 티어 내 웨이브 번호 (1~10)
    const waveInTier = ((wave - 1) % 10) + 1;
    
    // 첫 번째 이벤트: 2~4 사이에서 발생 (1파 전투 끝난 후부터)
    if (this.gameState.eventsThisTier === 0) {
      if (waveInTier >= 2 && waveInTier <= 4) {
        // 4웨이브에서 아직 안 터졌으면 무조건 발생
        if (waveInTier === 4) return true;
        // 그 외에는 40% 확률
        return Math.random() < 0.4;
      }
      return false;
    }
    
    // 두 번째 이벤트: 6~9 사이에서 발생
    if (this.gameState.eventsThisTier === 1) {
      if (waveInTier >= 6 && waveInTier <= 9) {
        // 9웨이브에서 아직 안 터졌으면 무조건 발생
        if (waveInTier === 9) return true;
        // 그 외에는 40% 확률
        return Math.random() < 0.4;
      }
      return false;
    }
    
    return false;
  }
  
  /**
   * 랜덤 이벤트 발생
   */
  private triggerRandomEvent() {
    this.gameState.phase = 'event';
    this.gameState.eventsThisTier++;
    this.gameState.lastEventWave = this.gameState.currentWave;
    
    const tier = getCurrentTier(this.gameState.currentWave);
    const event = getRandomEvent(tier, this.gameState.currentWave);
    
    this.animationHelper.showMessage('❗ 이벤트 발생!', COLORS.primary.dark);
    
    // UIScene의 EventUI 표시
    const uiScene = this.scene.get('UIScene') as import('./UIScene').UIScene;
    
    this.time.delayedCall(500, () => {
      uiScene.eventUI.show(event, (choice: EventChoice) => {
        this.handleEventChoice(event, choice);
      });
    });
  }
  
  /**
   * 이벤트 선택지 처리
   */
  private handleEventChoice(_event: GameEvent, choice: EventChoice) {
    const outcome = getRandomOutcome(choice.outcomes);
    
    const uiScene = this.scene.get('UIScene') as import('./UIScene').UIScene;
    
    uiScene.eventUI.showOutcome(outcome, () => {
      this.applyEventOutcome(outcome);
    });
  }
  
  /**
   * 이벤트 결과 적용
   */
  private applyEventOutcome(outcome: EventOutcome) {
    const uiScene = this.scene.get('UIScene') as import('./UIScene').UIScene;
    
    switch (outcome.type) {
      case 'reward':
        // 은전 획득
        this.playerState.silver += outcome.value || 0;
        this.animationHelper.showMessage(`💰 +${outcome.value} 은전!`, COLORS.primary.dark);
        this.time.delayedCall(1000, () => {
          this.startMoving();
        });
        break;
        
      case 'damage':
        // 데미지
        this.playerState.hp -= outcome.value || 0;
        this.animationHelper.showMessage(`💥 -${outcome.value} HP!`, COLORS.secondary.dark);
        if (this.playerState.hp <= 0) {
          this.gameOver();
          return;
        }
        this.time.delayedCall(1000, () => {
          this.startMoving();
        });
        break;
        
      case 'heal':
        // 회복
        const healAmount = Math.min(outcome.value || 0, this.playerState.maxHp - this.playerState.hp);
        this.playerState.hp += healAmount;
        this.animationHelper.showMessage(`💚 +${healAmount} HP!`, COLORS.success.dark);
        this.time.delayedCall(1000, () => {
          this.startMoving();
        });
        break;
        
      case 'combat':
        // 이벤트 전투
        this.time.delayedCall(500, () => {
          this.startEventCombat(outcome.enemyType || 'bandit');
        });
        break;
        
      case 'combat_then_reward':
        // 전투 후 무조건 보상
        this.pendingEventReward = outcome;
        this.time.delayedCall(500, () => {
          this.startEventCombat(outcome.enemyType || 'bandit');
        });
        break;
        
      case 'combat_then_choose':
        // 전투 후 보상 선택
        this.pendingEventReward = outcome;
        this.time.delayedCall(500, () => {
          this.startEventCombat(outcome.enemyType || 'bandit');
        });
        break;
        
      case 'shop':
        // 상점 열기
        this.time.delayedCall(500, () => {
          uiScene.shopUI.show(this.gameState.currentWave, () => {
            this.startMoving();
          });
        });
        break;
        
      case 'skill_select':
        // 스킬 선택 (비급 발견)
        this.showEventSkillSelection();
        break;
        
      case 'skill_select_paid':
        // 유료 스킬 선택 (사당 참배)
        const cost = outcome.silverCost || 50;
        if (this.playerState.silver >= cost) {
          this.playerState.silver -= cost;
          this.animationHelper.showMessage(`💰 -${cost} 은전`, COLORS.text.muted);
          this.showEventSkillSelection();
        } else {
          this.animationHelper.showMessage('은전이 부족합니다!', COLORS.message.error);
          this.time.delayedCall(1000, () => {
            this.startMoving();
          });
        }
        break;
        
      case 'nothing':
      default:
        // 아무 일 없음
        this.time.delayedCall(1000, () => {
          this.startMoving();
        });
        break;
    }
    
    this.events.emit('statsUpdated');
  }
  
  /**
   * 이벤트 스킬 선택 (비급 발견)
   */
  private showEventSkillSelection() {
    // 이벤트 스킬 선택임을 표시 (무기 보상 없음)
    this.isEventSkillSelection = true;
    
    // 랜덤 스킬 3개 생성
    this.levelUpSkillCards = [];
    for (let i = 0; i < 3; i++) {
      const skill = getRandomSkill();
      this.levelUpSkillCards.push({ type: 'skill', data: skill });
    }
    
    this.animationHelper.showMessage('📜 비급의 오의를 선택하세요!', COLORS.primary.dark);
    this.events.emit('showLevelUpSkillSelection');
  }
  
  /**
   * 이벤트 전투 후 보상 선택 UI 표시
   */
  showEventCombatRewardChoice() {
    if (!this.pendingEventReward) return;
    
    const outcome = this.pendingEventReward;
    const uiScene = this.scene.get('UIScene') as import('./UIScene').UIScene;
    
    if (outcome.type === 'combat_then_reward') {
      // 무조건 은전 보상
      const silver = outcome.value || 50;
      this.playerState.silver += silver;
      this.animationHelper.showMessage(`💰 +${silver} 은전! (결투 승리 보상)`, COLORS.primary.dark);
      this.pendingEventReward = null;
      this.time.delayedCall(1000, () => {
        this.startMoving();
      });
    } else if (outcome.type === 'combat_then_choose' && outcome.rewardOptions) {
      // 보상 선택
      uiScene.eventUI.showRewardChoice(
        outcome.rewardOptions.heal || 0,
        outcome.rewardOptions.silver || 0,
        (choice: 'heal' | 'silver') => {
          if (choice === 'heal') {
            const heal = outcome.rewardOptions!.heal || 0;
            const healAmount = Math.min(heal, this.playerState.maxHp - this.playerState.hp);
            this.playerState.hp += healAmount;
            this.animationHelper.showMessage(`💚 +${healAmount} HP! (무사의 치료)`, COLORS.success.dark);
          } else {
            const silver = outcome.rewardOptions!.silver || 0;
            this.playerState.silver += silver;
            this.animationHelper.showMessage(`💰 +${silver} 은전! (무사의 보답)`, COLORS.primary.dark);
          }
          this.pendingEventReward = null;
          this.events.emit('statsUpdated');
          this.time.delayedCall(1000, () => {
            this.startMoving();
          });
        }
      );
    }
  }
  
  /**
   * 이벤트 전투 시작 (특정 적과 싸움)
   */
  private startEventCombat(enemyType: string) {
    this.gameState.phase = 'combat';
    
    // 티어에 맞는 적 템플릿 찾기
    const tier = getCurrentTier(this.gameState.currentWave);
    const pool = tier === 1 ? ENEMIES_TIER1 : ENEMIES_TIER2;
    const template = pool[enemyType];
    
    if (template) {
      const enemy = createEnemy(template, 700);
      this.gameState.enemies = [enemy];
      this.enemyManager.createEnemySprite(enemy);
    } else {
      // 못 찾으면 일반 적 소환
      this.enemyManager.spawnWaveEnemies();
    }
    
    this.startCombat();
  }

  startCombat() {
    this.playerState.mana = this.playerState.maxMana;
    this.playerState.defense = 0;
    this.playerState.usedAttackThisTurn = false;  // 이어베기 조건 초기화
    
    // 첫 턴에 잔광 출현 확률 체크
    this.cardSystem.trySpawnJangwang();
    
    // 레벨별 드로우 수: 레벨 1-2는 2장, 레벨 3+는 3장
    const drawCount = this.getDrawCount();
    
    // 첫 전투: 5장 드로우 (무기 1장 보장), 이후 전투: 레벨별 드로우
    if (this.gameState.currentWave === 1) {
      this.cardSystem.drawCardsWithGuaranteedWeapon(GAME_CONSTANTS.INITIAL_DRAW);
    } else {
      this.cardSystem.drawCards(drawCount);
    }
    
    // 첫 턴이므로 isFirstTurn = true (도발 적은 도발을 첫 스킬로 사용)
    this.enemyManager.initializeEnemyActions(true);
    
    this.animationHelper.showMessage(`제 ${this.gameState.currentWave} 파 - 전투 시작!`, COLORS.secondary.dark);
    
    this.events.emit('combatStarted');
    this.events.emit('statsUpdated');
    this.events.emit('handUpdated');
  }

  // ========== 턴 종료 ==========

  async endTurn() {
    if (this.gameState.phase !== 'combat') return;
    
    // 0. 신기루 카드 처리 (사용하지 않으면 사라짐)
    this.cardSystem.removeMirageCards();
    
    // 1. 플레이어 카운트 효과 감소 및 발동 (강타 등) - 적 행동보다 먼저!
    await this.combatSystem.reduceCountEffects();
    
    // 강타로 적이 모두 죽었을 수 있으므로 체크
    if (this.checkCombatEnd()) return;
    
    // 2. 출혈/독 데미지는 이제 각 적 스킬 발동 직전에 적용됨 (EnemyManager.executeActionsSequentially)
    
    // 3. 적 행동이 순차적으로 끝날 때까지 대기
    await this.enemyManager.executeRemainingEnemyActions();
    
    // 이번 턴 공격 여부 리셋 (다음 턴을 위해)
    this.playerState.usedAttackThisTurn = false;
    
    this.combatSystem.reduceBuff();
    
    this.gameState.enemies.forEach(enemy => {
      if (enemy.isStunned > 0) enemy.isStunned--;
      // 도발 지속시간 감소
      if (enemy.isTaunting && (enemy.tauntDuration ?? 0) > 0) {
        enemy.tauntDuration!--;
        if (enemy.tauntDuration === 0) {
          enemy.isTaunting = false;
        }
      }
    });
    
    if (this.checkCombatEnd()) return;
    
    this.gameState.turn++;
    
this.playerState.mana = this.playerState.maxMana;
    
    // 새 턴 시작 시 잔광 출현 확률 체크
    this.cardSystem.trySpawnJangwang();
    
    this.cardSystem.drawCards(this.getDrawCount());

    this.enemyManager.initializeEnemyActions();
    
    this.events.emit('turnEnded');
    this.events.emit('statsUpdated');
    this.events.emit('handUpdated');
  }

  checkCombatEnd(): boolean {
    if (this.gameState.enemies.length === 0 && this.gameState.phase === 'combat') {
      this.gameState.phase = 'victory';
      this.animationHelper.showMessage('승리!', COLORS.success.dark);

      // 버프/카운트 효과 초기화 (덱/손패/무덤은 그대로 유지)
      this.playerState.buffs = [];
      this.playerState.countEffects = [];
      
      this.events.emit('handUpdated');

      // 이벤트 전투 보상이 있으면 우선 처리
      if (this.pendingEventReward) {
        this.time.delayedCall(1000, () => {
          this.showEventCombatRewardChoice();
        });
        return true;
      }

      // 보스 처치 여부 확인
      const wasBossFight = isBossWave(this.gameState.currentWave);
      
      // 일반 전투 후 이벤트 체크 → 이동 중에 발생하도록 플래그 설정
      if (!wasBossFight && this.shouldTriggerEvent()) {
        this.pendingEvent = true;  // 다음 이동 중 이벤트 발생
      }
      
      if (wasBossFight) {
        // 보스 처치: 특별 보상 (스킬 2개 + 유니크 무기 1개 중 선택) - 이게 스테이지 보상
        this.animationHelper.showMessage(`💀 보스 처치! 특별 보상!`, COLORS.primary.dark);
        this.time.delayedCall(1500, () => {
          // 레벨업이 대기 중이면 레벨업 먼저 처리
          if (this.pendingLevelUp) {
            this.pendingLevelUp = false;
            this.showLevelUpSkillSelection();
          } else {
          this.showBossRewardSelection();
          }
        });
      } else if (this.pendingLevelUp) {
        // 레벨업이 대기 중이면 레벨업 먼저 처리 (전투 중 적 처치로 레벨업)
        this.pendingLevelUp = false;
        this.animationHelper.showMessage(`🎉 레벨 업! LV.${this.playerState.level}`, COLORS.primary.dark);
        
        // 레벨업 스킬 선택 → 패시브 선택 → 무기 보상 순서로
        this.time.delayedCall(1000, () => {
          this.showLevelUpSkillSelection();
        });
      } else {
        // 보상 카드 3장 생성 (무기만)
        this.generateRewardCards();
        
        // 1초 후 보상 선택 UI 표시
        this.time.delayedCall(1000, () => {
          this.events.emit('showRewardSelection');
        });
      }
      
      return true;
    }
    return false;
  }
  
  /**
   * 레벨업에 필요한 경험치
   */
  getExpNeeded(): number {
    return 50 + (this.playerState.level - 1) * 25;
  }
  
  /**
   * 레벨업 스킬 선택 UI (스킬 3개)
   */
  showLevelUpSkillSelection() {
    // 랜덤 스킬 3개 생성
    this.levelUpSkillCards = [];
    for (let i = 0; i < 3; i++) {
      const skill = getRandomSkill();
      this.levelUpSkillCards.push({ type: 'skill', data: skill });
    }
    
    // 패시브는 스킬 선택 후에 표시
    this.levelUpPassive = null;
    
    this.events.emit('showLevelUpSkillSelection');
  }
  
  /**
   * 레벨업 패시브 선택 UI (스킬 선택 후)
   */
  showLevelUpPassiveSelection() {
    // 중복 없이 랜덤 패시브 3개 생성 (이미 최대 레벨인 것 제외)
    this.levelUpPassives = getRandomPassivesWithoutDuplicates(3, this.playerState.passives);
    
    this.events.emit('showLevelUpPassiveSelection');
  }
  
  /**
   * 레벨업 스킬 선택
   */
  selectLevelUpSkill(index: number) {
    if (index < 0 || index >= this.levelUpSkillCards.length) return;
    
    const selectedCard = this.levelUpSkillCards[index];
    this.playerState.deck.push(selectedCard);
    this.cardSystem.shuffleArray(this.playerState.deck);
    
    this.animationHelper.showMessage(`${selectedCard.data.name} 스킬 획득!`, COLORS.success.dark);
    
    this.levelUpSkillCards = [];
    this.events.emit('levelUpSkillSelected');
    
    // 이벤트 스킬 선택이면 무기 보상 없이 이동 (패시브 선택 없음)
    if (this.isEventSkillSelection) {
      this.isEventSkillSelection = false;
      this.time.delayedCall(500, () => {
        this.startMoving();
      });
      return;
    }
    
    // 스킬 선택 후 패시브 선택 화면으로
    this.time.delayedCall(500, () => {
      this.showLevelUpPassiveSelection();
    });
  }
  
  /**
   * 레벨업 패시브 선택 (인덱스 기반)
   */
  selectLevelUpPassive(index: number) {
    if (index < 0 || index >= this.levelUpPassives.length) return;
    
    const selectedPassive = this.levelUpPassives[index];
    
    // 패시브 추가/레벨업
    this.playerState.passives = addOrUpgradePassive(
      this.playerState.passives, 
      selectedPassive.id
    );
    
    this.animationHelper.showMessage(`🔮 ${selectedPassive.name} 획득!`, COLORS.rarity.unique);
    
    this.levelUpPassives = [];
    this.events.emit('levelUpPassiveSelected');
    
    // 패시브 선택 후 무기 보상
    this.generateRewardCards();
    this.time.delayedCall(500, () => {
      this.events.emit('showRewardSelection');
    });
  }
  
  skipLevelUpSkill() {
    this.levelUpSkillCards = [];
    this.events.emit('levelUpSkillSelected');
    
    // 이벤트 스킬 선택이면 무기 보상 없이 이동 (패시브 선택 없음)
    if (this.isEventSkillSelection) {
      this.isEventSkillSelection = false;
      this.time.delayedCall(500, () => {
        this.startMoving();
      });
      return;
    }
    
    // 스킬 스킵해도 패시브 선택으로
    this.time.delayedCall(500, () => {
      this.showLevelUpPassiveSelection();
    });
  }
  
  skipLevelUpPassive() {
    this.levelUpPassives = [];
    this.events.emit('levelUpPassiveSelected');
    
    // 무기 보상
    this.generateRewardCards();
    this.time.delayedCall(500, () => {
      this.events.emit('showRewardSelection');
    });
  }
  
  // ========== 보스 보상 ==========
  
  bossRewardCards: Card[] = [];
  
  /**
   * 보스 처치 보상 UI (스킬 2개 + 유니크 무기 1개)
   */
  showBossRewardSelection() {
    this.bossRewardCards = [];
    
    // 랜덤 스킬 2개
    for (let i = 0; i < 2; i++) {
      const skill = getRandomSkill();
      this.bossRewardCards.push({ type: 'skill', data: skill });
    }
    
    // 유니크 무기 1개
    const uniqueSword = getRandomUniqueSword();
    this.bossRewardCards.push({ type: 'sword', data: uniqueSword });
    
    this.events.emit('showBossRewardSelection');
  }
  
  selectBossReward(index: number) {
    if (index < 0 || index >= this.bossRewardCards.length) return;
    
    const selectedCard = this.bossRewardCards[index];
    this.playerState.deck.push(selectedCard);
    this.cardSystem.shuffleArray(this.playerState.deck);
    
    const isUnique = selectedCard.type === 'sword';
    this.animationHelper.showMessage(
      `${isUnique ? '⭐' : '📜'} ${selectedCard.data.name} 획득!`, 
      isUnique ? COLORS.rarity.unique : COLORS.success.dark
    );
    
    this.bossRewardCards = [];
    this.events.emit('bossRewardSelected');
    
    // 레벨업 체크
    const expNeeded = this.getExpNeeded();
    if (this.playerState.exp >= expNeeded) {
      this.playerState.exp -= expNeeded;
      this.playerState.level++;
      this.animationHelper.showMessage(`🎉 레벨 업! LV.${this.playerState.level}`, COLORS.primary.dark);
      
      this.time.delayedCall(1000, () => {
        this.showLevelUpSkillSelection();
      });
    } else {
      // 보스 보상이 스테이지 보상이므로 추가 보상 없이 이동
      this.time.delayedCall(500, () => {
        this.startMoving();
      });
    }
  }
  
  skipBossReward() {
    this.bossRewardCards = [];
    this.events.emit('bossRewardSelected');
    this.startMoving();
  }
  
generateRewardCards() {
    this.rewardCards = [];

    // 무기만 3개 생성
    for (let i = 0; i < 3; i++) {
      const sword = getRandomSword(this.gameState.currentWave);
      this.rewardCards.push({ type: 'sword', data: sword });
    }
  }
  
selectRewardCard(index: number) {
    if (index < 0 || index >= this.rewardCards.length) return;

    const selectedCard = this.rewardCards[index];
    this.playerState.deck.push(selectedCard);  // 덱에 추가
    this.cardSystem.shuffleArray(this.playerState.deck);  // 덱 셔플

    this.animationHelper.showMessage(`${selectedCard.data.name} 덱에 추가!`, COLORS.success.dark);

    this.rewardCards = [];
    this.events.emit('rewardSelected');

    // 다음 웨이브로 이동
    this.time.delayedCall(500, () => {
      this.startMoving();
    });
  }
  
  skipReward() {
    // 건너뛰기 시 은전 20 획득
    this.playerState.silver += 20;
    this.animationHelper.showMessage('💰 +20 은전!', COLORS.message.warning);
    
    this.rewardCards = [];
    this.events.emit('rewardSelected');
    this.events.emit('statsUpdated');
    this.startMoving();
  }
  
  /**
   * 드로우 수 반환
   * 기본 2장 + 패시브 드로우 증가
   */
  getDrawCount(): number {
    let drawCount = 2;
    
    // 패시브 스킬에서 드로우 증가 체크
    const drawPassive = this.playerState.passives.find(p => p.id === 'drawIncrease');
    if (drawPassive) {
      drawCount += drawPassive.level;
    }
    
    return drawCount;
  }
  
  /**
   * 대기 가능 횟수 반환
   * 기본 1회 + 패시브 스킬 보너스
   */
  getMaxWaitCount(): number {
    let waitCount = 1;
    
    // 패시브 스킬에서 대기 증가 체크
    const waitPassive = this.playerState.passives.find(p => p.id === 'waitIncrease');
    if (waitPassive) {
      waitCount += waitPassive.level;
    }
    
    return waitCount;
  }
  
  // ========== 스킬 효과 카드 선택 ==========
  
  showSkillCardSelection(type: 'searchSword' | 'graveRecall' | 'graveEquip', cards: Card[]) {
    this.skillSelectType = type;
    this.skillSelectCards = cards;
    // 방금 사용한 스킬 카드 저장 (무덤의 마지막 카드)
    if (this.playerState.discard.length > 0) {
      this.pendingSkillCard = this.playerState.discard[this.playerState.discard.length - 1];
    }
    this.events.emit('showSkillCardSelection');
  }
  
  selectSkillCard(index: number) {
    if (index < 0 || index >= this.skillSelectCards.length) return;
    
    const selectedCard = this.skillSelectCards[index];
    
    switch (this.skillSelectType) {
      case 'searchSword':
        // 덱에서 즉시 장착 + 발도 스킬 발동
        const deckIdx = this.playerState.deck.findIndex(c => c === selectedCard);
        if (deckIdx !== -1 && selectedCard.type === 'sword') {
          this.playerState.deck.splice(deckIdx, 1);
          this.cardSystem.equipSword(selectedCard.data);  // 장착 + 발도 공격
          this.animationHelper.showMessage(`🔍 ${selectedCard.data.name} 소환!`, COLORS.primary.dark);
        }
        break;
        
      case 'graveRecall':
        // 무덤에서 손패로
        const graveIdx = this.playerState.discard.findIndex(c => c === selectedCard);
        if (graveIdx !== -1) {
          this.playerState.discard.splice(graveIdx, 1);
          this.playerState.hand.push(selectedCard);
          this.animationHelper.showMessage(`${selectedCard.data.name}이(가) 돌아왔다!`, COLORS.success.dark);
        }
        break;
        
      case 'graveEquip':
        // 무덤에서 즉시 장착
        const equipIdx = this.playerState.discard.findIndex(c => c === selectedCard);
        if (equipIdx !== -1 && selectedCard.type === 'sword') {
          this.playerState.discard.splice(equipIdx, 1);
          this.cardSystem.equipSword(selectedCard.data);
        }
        break;
    }
    
    this.skillSelectCards = [];
    this.skillSelectType = null;
    this.pendingSkillCard = null;  // 선택 완료 시 초기화
    this.events.emit('skillCardSelected');
    this.events.emit('handUpdated');
    this.events.emit('statsUpdated');
  }
  
  cancelSkillCardSelection() {
    // 취소 시 사용한 스킬 카드를 손패로 복구
    if (this.pendingSkillCard) {
      const discardIdx = this.playerState.discard.indexOf(this.pendingSkillCard);
      if (discardIdx !== -1) {
        this.playerState.discard.splice(discardIdx, 1);
        this.playerState.hand.push(this.pendingSkillCard);
        // 마나도 복구
        const skill = this.pendingSkillCard.data as any;
        if (skill.manaCost) {
          this.playerState.mana = Math.min(this.playerState.maxMana, this.playerState.mana + skill.manaCost);
        }
        this.animationHelper.showMessage('취소됨', COLORS.message.muted);
      }
      this.pendingSkillCard = null;
    }
    this.skillSelectCards = [];
    this.skillSelectType = null;
    this.events.emit('skillCardSelected');
    this.events.emit('handUpdated');
    this.events.emit('statsUpdated');
  }
  
  // 전투 종료 시 덱 리셋 (현재는 아무것도 하지 않음 - 덱/손패/무덤 유지)
  resetDeck() {
    // 덱, 손패, 무덤 모두 그대로 유지
    
    // 턴 리셋
    this.gameState.turn = 1;
    
    this.events.emit('handUpdated');
    this.events.emit('statsUpdated');
  }

  // ========== 공개 메서드 (시스템에서 호출) ==========
  
  // 교환 모드 토글
  toggleExchangeMode() {
    this.cardSystem.toggleExchangeMode();
  }
  
  // 카드 교환
  exchangeCard(index: number) {
    this.cardSystem.exchangeCard(index);
  }
  
  // 타겟 선택
  selectTarget(enemyId: string) {
    this.cardSystem.selectTarget(enemyId);
  }
  
  // 타겟 선택 취소
  cancelTargeting() {
    this.cardSystem.cancelTargeting();
  }
  
  // 카드 사용 (UI에서 호출)
  useCard(index: number) {
    this.cardSystem.useCard(index);
  }
  
  // 적 대기턴 감소
  reduceAllEnemyDelays(amount: number) {
    this.combatSystem.reduceAllEnemyDelays(amount);
  }
  
  // 메시지 표시 (외부 호출용)
  showMessage(msg: string, color: number) {
    this.animationHelper.showMessage(msg, color);
  }

  restartFromBeginning() {
    this.suppressAutoSave = true;
    this.clearSavedGameSnapshot();
    this.scene.stop('UIScene');
    this.time.delayedCall(100, () => {
      this.scene.restart();
    });
  }

  returnToMainMenu() {
    this.persistGameSnapshot(true);
    this.scene.stop('UIScene');
    window.location.assign('/');
  }

  // ========== 게임 오버 ==========

  gameOver() {
    this.gameState.phase = 'gameOver';
    
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const overlay = this.add.rectangle(width/2, height/2, width, height, COLORS.background.overlay, 0.9);
    overlay.setDepth(5000);
    
    const title = this.add.text(width/2, height/2 - 60, '💀 패배 💀', {
      font: 'bold 48px monospace',
      color: COLORS_STR.secondary.dark,
    }).setOrigin(0.5);
    title.setDepth(5001);
    
    const waveText = this.add.text(width/2, height/2 + 10, `도달 파: ${this.gameState.currentWave}`, {
      font: 'bold 24px monospace',
      color: COLORS_STR.text.primary,
    }).setOrigin(0.5);
    waveText.setDepth(5001);
    
    const killText = this.add.text(width/2, height/2 + 50, `처치한 적: ${this.gameState.enemiesDefeated}`, {
      font: '20px monospace',
      color: COLORS_STR.text.muted,
    }).setOrigin(0.5);
    killText.setDepth(5001);
    
    const scoreText = this.add.text(width/2, height/2 + 90, `점수: ${this.gameState.score}`, {
      font: 'bold 28px monospace',
      color: COLORS_STR.primary.dark,
    }).setOrigin(0.5);
    scoreText.setDepth(5001);
    
    const restartBtn = this.add.text(width/2, height/2 + 150, '[ 다시 시작 ]', {
      font: 'bold 24px monospace',
      color: COLORS_STR.success.dark,
    }).setOrigin(0.5);
    restartBtn.setDepth(5002);
    
    // 오버레이에 인터랙션 설정 (다른 클릭 차단)
    overlay.setInteractive();
    
    restartBtn.setInteractive({ useHandCursor: true });
    restartBtn.on('pointerover', () => restartBtn.setColor(COLORS_STR.primary.light));
    restartBtn.on('pointerout', () => restartBtn.setColor(COLORS_STR.success.dark));
    restartBtn.on('pointerdown', () => {
      // 버튼 중복 클릭 방지
      restartBtn.disableInteractive();
      this.restartFromBeginning();
    });
  }

  // ========== 업데이트 루프 ==========

  update() {
    if (this.isMoving) {
      this.moveDistance += this.SCROLL_SPEED;
      this.gameState.distance += this.SCROLL_SPEED;
      
      // 배경 스크롤
      this.backgroundTiles.forEach(tile => {
        (tile as any).scrollX -= (tile as any).speed;
        if ((tile as any).scrollX < -10) {
          (tile as any).scrollX = this.cameras.main.width + 10;
        }
        tile.setPosition((tile as any).scrollX, 0);
      });
      
      // 플레이어 이동 애니메이션 (work-loop 사용)
      if (USE_SPRITES && this.playerAnim && this.currentAnim !== 'work-loop') {
        this.playWorkLoopAnimation();
      } else if (!USE_SPRITES) {
        // 기존 방식: y 좌표 흔들림 (플레이어는 GROUND_Y + 50 기준)
        this.playerSprite.y = this.GROUND_Y + 50 + Math.sin(this.time.now / 100) * 5;
      }
      
      // 이동 중 이벤트 발생 체크 (일정 거리 이동 후)
      if (this.pendingEvent && this.moveDistance >= 100) {
        this.pendingEvent = false;
        this.isMoving = false;
        this.triggerRandomEvent();
        this.persistGameSnapshot();
        return;
      }
      
      // 일정 거리마다 적 조우
      if (this.moveDistance >= 200 + Math.random() * 100) {
        this.encounterEnemies();
      }
    } else {
      // 전투/대기 중에는 idle 애니메이션으로 전환
      if (USE_SPRITES && this.playerAnim && (this.currentAnim === 'work-loop' || this.currentAnim === 'work')) {
        this.playStopAnimation();
      }
    }
    this.persistGameSnapshot();
  }
  
  /**
   * 이동 시작: idle → idle-to-work → work-loop
   */
  playWorkLoopAnimation() {
    if (!USE_SPRITES || !this.playerAnim) return;
    
    // 이미 전환 중이거나 work-loop면 스킵
    if (this.isAnimating || this.currentAnim === 'work-loop') return;
    
    // idle-to-work 전환 애니메이션 재생
    const textureIdleWork = 'player-idle-work';
    if (this.textures.exists(textureIdleWork) && this.anims.exists('idle-to-work')) {
      this.isAnimating = true;
      this.currentAnim = 'idle-to-work';
      
      this.playerAnim.setTexture(textureIdleWork);
      this.playerAnim.play('idle-to-work');
      
      this.playerAnim.once('animationcomplete', () => {
        this.isAnimating = false;
        
        // 아직 이동 중이면 work-loop 시작
        if (this.isMoving) {
          this.currentAnim = 'work-loop';
          const textureWork = 'player-work';
          if (this.textures.exists(textureWork) && this.anims.exists('work-loop')) {
            this.playerAnim!.setTexture(textureWork);
            this.playerAnim!.play('work-loop');
          }
        } else {
          // 이동이 멈췄으면 idle로
          this.playStopAnimation();
        }
      });
    } else {
      // 전환 애니메이션 없으면 바로 work-loop
      this.currentAnim = 'work-loop';
      const textureWork = 'player-work';
      if (this.textures.exists(textureWork) && this.anims.exists('work-loop')) {
        this.playerAnim.setTexture(textureWork);
        this.playerAnim.play('work-loop');
      }
    }
  }
  
  /**
   * 이동 중지: work-loop → work-to-idle (역재생) → idle
   */
  playStopAnimation() {
    if (!USE_SPRITES || !this.playerAnim) return;
    
    // 이미 전환 중이거나 idle이면 스킵
    if (this.isAnimating || this.currentAnim === 'idle') return;
    
    // work-to-idle 전환 애니메이션 재생 (idle-work 역재생)
    const textureIdleWork = 'player-idle-work';
    if (this.textures.exists(textureIdleWork) && this.anims.exists('work-to-idle')) {
      this.isAnimating = true;
      this.currentAnim = 'work-to-idle';
      
      this.playerAnim.setTexture(textureIdleWork);
      this.playerAnim.play('work-to-idle');
      
      this.playerAnim.once('animationcomplete', () => {
        this.isAnimating = false;
        
        // 다시 이동 시작했으면 work-loop로
        if (this.isMoving) {
          this.playWorkLoopAnimation();
        } else {
          // idle 애니메이션 시작
          this.currentAnim = 'idle';
          const textureIdle = 'player-idle';
          if (this.textures.exists(textureIdle) && this.anims.exists('idle')) {
            this.playerAnim!.setTexture(textureIdle);
            this.playerAnim!.play('idle');
          }
        }
      });
    } else {
      // 전환 애니메이션 없으면 바로 idle
      this.currentAnim = 'idle';
      const textureIdle = 'player-idle';
      if (this.textures.exists(textureIdle) && this.anims.exists('idle')) {
        this.playerAnim.setTexture(textureIdle);
        this.playerAnim.play('idle');
      }
    }
  }
}

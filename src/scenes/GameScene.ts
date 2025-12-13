import Phaser from 'phaser';
import type { PlayerState, GameState, Card } from '../types';
import { GAME_CONSTANTS } from '../types';
import { createSwordCard, getRandomSword } from '../data/swords';
import { createSkillCard, getStarterDeck, getRandomSkill } from '../data/skills';
import { CombatSystem, CardSystem, EnemyManager, AnimationHelper } from '../systems';

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
  
  // 상수
  readonly PLAYER_X = 150;
  readonly GROUND_Y = 400;
  readonly SCROLL_SPEED = 2;
  
  // 이동 관련
  isMoving: boolean = false;
  moveDistance: number = 0;
  
  // 모드
  isExchangeMode: boolean = false;
  isTargetingMode: boolean = false;
  pendingCard: { card: Card; index: number } | null = null;
  
  // 보상 카드 선택
  rewardCards: Card[] = [];
  
  // 스킬 효과로 인한 카드 선택
  skillSelectCards: Card[] = [];
  skillSelectType: 'searchSword' | 'graveRecall' | 'graveEquip' | null = null;
  
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // 시스템 초기화
    this.animationHelper = new AnimationHelper(this);
    this.combatSystem = new CombatSystem(this);
    this.cardSystem = new CardSystem(this);
    this.enemyManager = new EnemyManager(this);
    
    this.initializeGame();
    this.createBackground();
    this.createPlayer();
    this.setupInput();
    
    // UI 씬 시작
    this.scene.launch('UIScene', { gameScene: this });
    
    this.cameras.main.fadeIn(500, 0, 0, 0);
    
    // 첫 이동 시작
    this.startMoving();
  }

  // ========== 초기화 ==========

  initializeGame() {
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
      hp: 100,
      maxHp: 100,
      mana: GAME_CONSTANTS.INITIAL_MANA,
      maxMana: GAME_CONSTANTS.INITIAL_MANA,
      defense: 0,
      currentSword: starterSword,
      hand: [],
      deck: deck,
      discard: [],
      buffs: [],
      countEffects: [],  // 카운트 효과 (패리, 철벽 등)
      position: 0,
      counterReady: false,
      counterMultiplier: 0,
      passives: [
        {
          id: 'lightBlade',
          name: '잔광의 검사',
          description: '전투 시작 시 확률로 "잔광" 획득',
          level: 0,
          maxLevel: 5,
          effect: { type: 'uniqueWeaponChance', value: 0.05 },
        },
      ],
      exp: 0,
      level: 1,
    };
    
    this.gameState = {
      phase: 'running',
      turn: 1,
      score: 0,
      distance: 0,
      enemies: [],
      currentWave: 0,
      enemiesDefeated: 0,
    };
  }

  // ========== 배경 & 플레이어 ==========

  createBackground() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    sky.fillRect(0, 0, width, this.GROUND_Y);
    
    const ground = this.add.graphics();
    ground.fillStyle(0x2d3436);
    ground.fillRect(0, this.GROUND_Y, width, height - this.GROUND_Y);
    ground.lineStyle(3, 0xe94560);
    ground.lineBetween(0, this.GROUND_Y, width, this.GROUND_Y);
    
    for (let i = 0; i < 15; i++) {
      const dot = this.add.graphics();
      dot.fillStyle(0x636e72);
      dot.fillCircle(Math.random() * width, this.GROUND_Y + 30 + Math.random() * 80, 2);
      (dot as any).scrollX = Math.random() * width;
      (dot as any).speed = 0.5 + Math.random();
      this.backgroundTiles.push(dot);
    }
  }

  createPlayer() {
    this.playerSprite = this.add.container(this.PLAYER_X, this.GROUND_Y - 30);
    
    const body = this.add.rectangle(0, 0, 40, 60, 0x4ecca3);
    body.setStrokeStyle(3, 0x2d3436);
    
    const emoji = this.add.text(0, -10, '🧑‍🦱', { font: '32px Arial' }).setOrigin(0.5);
    const label = this.add.text(0, 35, 'Player', {
      font: 'bold 14px monospace',
      color: '#4ecca3',
    }).setOrigin(0.5);
    
    this.playerSprite.add([body, emoji, label]);
    
    this.updatePlayerWeaponDisplay();
  }

  updatePlayerWeaponDisplay() {
    const existingWeapon = this.playerSprite.getByName('weaponEmoji');
    if (existingWeapon) existingWeapon.destroy();
    
    if (this.playerState.currentSword) {
      const weaponEmoji = this.add.text(25, -5, this.playerState.currentSword.emoji, {
        font: '24px Arial',
      }).setOrigin(0.5);
      weaponEmoji.setName('weaponEmoji');
      this.playerSprite.add(weaponEmoji);
    }
    
    this.events.emit('statsUpdated');
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
        this.endTurn();
      }
    });
  }

  // ========== 이동 & 전투 페이즈 ==========
  
  startMoving() {
    if (this.gameState.phase === 'gameOver') return;
    
    this.isMoving = true;
    this.gameState.phase = 'running';
    this.moveDistance = 0;
    
    this.animationHelper.showMessage('이동중...', 0x4ecca3);
  }

  encounterEnemies() {
    this.isMoving = false;
    this.gameState.phase = 'combat';
    this.gameState.currentWave++;
    
    this.enemyManager.spawnWaveEnemies();
    this.startCombat();
  }

  startCombat() {
    this.playerState.mana = this.playerState.maxMana;
    this.playerState.defense = 0;
    
    this.cardSystem.tryAddUniqueWeapon();
    
    if (this.gameState.turn === 1 || this.playerState.hand.length === 0) {
      this.cardSystem.drawCards(GAME_CONSTANTS.INITIAL_DRAW);
    }
    
    this.enemyManager.initializeEnemyActions();
    
    this.animationHelper.showMessage(`웨이브 ${this.gameState.currentWave} - 전투 시작!`, 0xe94560);
    
    this.events.emit('combatStarted');
    this.events.emit('statsUpdated');
    this.events.emit('handUpdated');
  }

  // ========== 턴 종료 ==========

  async endTurn() {
    if (this.gameState.phase !== 'combat') return;
    
    // 적 행동이 순차적으로 끝날 때까지 대기
    await this.enemyManager.executeRemainingEnemyActions();
    
    this.playerState.counterReady = false;
    
    this.combatSystem.applyBleedDamage();
    this.combatSystem.reduceBuff();
    
    this.gameState.enemies.forEach(enemy => {
      if (enemy.isStunned > 0) enemy.isStunned--;
    });
    
    if (this.checkCombatEnd()) return;
    
    this.gameState.turn++;
    
    this.playerState.mana = this.playerState.maxMana;
    this.cardSystem.drawCards(GAME_CONSTANTS.DRAW_PER_TURN);
    
    this.enemyManager.initializeEnemyActions();
    
    this.events.emit('turnEnded');
    this.events.emit('statsUpdated');
    this.events.emit('handUpdated');
  }

  checkCombatEnd(): boolean {
    if (this.gameState.enemies.length === 0 && this.gameState.phase === 'combat') {
      this.gameState.phase = 'victory';
      this.animationHelper.showMessage('승리!', 0x4ecca3);
      
      // 모든 카드를 덱으로 돌리고 셔플
      this.resetDeck();
      
      // 보상 카드 3장 생성
      this.generateRewardCards();
      
      // 1초 후 보상 선택 UI 표시
      this.time.delayedCall(1000, () => {
        this.events.emit('showRewardSelection');
      });
      
      return true;
    }
    return false;
  }
  
  generateRewardCards() {
    this.rewardCards = [];
    
    for (let i = 0; i < 3; i++) {
      // 33% 확률로 무기, 67% 확률로 스킬
      if (Math.random() < 0.33) {
        const sword = getRandomSword(this.gameState.currentWave);
        this.rewardCards.push({ type: 'sword', data: sword });
      } else {
        const skill = getRandomSkill();
        this.rewardCards.push({ type: 'skill', data: skill });
      }
    }
  }
  
  selectRewardCard(index: number) {
    if (index < 0 || index >= this.rewardCards.length) return;
    
    const selectedCard = this.rewardCards[index];
    this.playerState.deck.push(selectedCard);
    this.cardSystem.shuffleArray(this.playerState.deck);
    
    this.animationHelper.showMessage(`${selectedCard.data.name} 획득!`, 0x4ecca3);
    
    this.rewardCards = [];
    this.events.emit('rewardSelected');
    
    // 다음 웨이브로 이동
    this.time.delayedCall(500, () => {
      this.startMoving();
    });
  }
  
  skipReward() {
    this.rewardCards = [];
    this.events.emit('rewardSelected');
    this.startMoving();
  }
  
  // ========== 스킬 효과 카드 선택 ==========
  
  showSkillCardSelection(type: 'searchSword' | 'graveRecall' | 'graveEquip', cards: Card[]) {
    this.skillSelectType = type;
    this.skillSelectCards = cards;
    this.events.emit('showSkillCardSelection');
  }
  
  selectSkillCard(index: number) {
    if (index < 0 || index >= this.skillSelectCards.length) return;
    
    const selectedCard = this.skillSelectCards[index];
    
    switch (this.skillSelectType) {
      case 'searchSword':
        // 덱에서 손패로
        const deckIdx = this.playerState.deck.findIndex(c => c === selectedCard);
        if (deckIdx !== -1) {
          this.playerState.deck.splice(deckIdx, 1);
          this.playerState.hand.push(selectedCard);
          this.animationHelper.showMessage(`${selectedCard.data.name}을(를) 손에 넣었다!`, 0x4ecca3);
        }
        break;
        
      case 'graveRecall':
        // 무덤에서 손패로
        const graveIdx = this.playerState.discard.findIndex(c => c === selectedCard);
        if (graveIdx !== -1) {
          this.playerState.discard.splice(graveIdx, 1);
          this.playerState.hand.push(selectedCard);
          this.animationHelper.showMessage(`${selectedCard.data.name}이(가) 돌아왔다!`, 0x4ecca3);
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
    this.events.emit('skillCardSelected');
    this.events.emit('handUpdated');
    this.events.emit('statsUpdated');
  }
  
  cancelSkillCardSelection() {
    this.skillSelectCards = [];
    this.skillSelectType = null;
    this.events.emit('skillCardSelected');
  }
  
  // 전투 종료 시 덱 리셋
  resetDeck() {
    // 손패 + 무덤 → 덱으로
    this.playerState.deck.push(...this.playerState.hand);
    this.playerState.deck.push(...this.playerState.discard);
    this.playerState.hand = [];
    this.playerState.discard = [];
    
    // 덱 셔플
    this.cardSystem.shuffleArray(this.playerState.deck);
    
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

  // ========== 게임 오버 ==========

  gameOver() {
    this.gameState.phase = 'gameOver';
    
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.8);
    
    this.add.text(width/2, height/2 - 60, '💀 GAME OVER 💀', {
      font: 'bold 48px monospace',
      color: '#e94560',
    }).setOrigin(0.5);
    
    this.add.text(width/2, height/2 + 10, `웨이브: ${this.gameState.currentWave}`, {
      font: 'bold 24px monospace',
      color: '#ffffff',
    }).setOrigin(0.5);
    
    this.add.text(width/2, height/2 + 50, `처치한 적: ${this.gameState.enemiesDefeated}`, {
      font: '20px monospace',
      color: '#aaaaaa',
    }).setOrigin(0.5);
    
    this.add.text(width/2, height/2 + 90, `점수: ${this.gameState.score}`, {
      font: 'bold 28px monospace',
      color: '#ffcc00',
    }).setOrigin(0.5);
    
    const restartBtn = this.add.text(width/2, height/2 + 150, '[ 다시 시작 ]', {
      font: 'bold 24px monospace',
      color: '#4ecca3',
    }).setOrigin(0.5);
    
    restartBtn.setInteractive({ useHandCursor: true });
    restartBtn.on('pointerover', () => restartBtn.setColor('#ffffff'));
    restartBtn.on('pointerout', () => restartBtn.setColor('#4ecca3'));
    restartBtn.on('pointerdown', () => {
      this.scene.stop('UIScene');
      this.scene.restart();
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
      
      // 플레이어 달리기 애니메이션
      this.playerSprite.y = this.GROUND_Y - 30 + Math.sin(this.time.now / 100) * 3;
      
      // 일정 거리마다 적 조우
      if (this.moveDistance >= 200 + Math.random() * 100) {
        this.encounterEnemies();
      }
    }
  }
}

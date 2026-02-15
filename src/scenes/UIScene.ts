import * as Phaser from 'phaser';
import type { GameScene } from './GameScene';
import type { SwordCard } from '../types';
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
  CardRenderer,
  CARD_SIZE,
  LevelUpSkillUI,
  BossRewardUI,
  EventUI,
  ShopUI,
  DeckViewerUI,
  calculateCardPosition,
  CARD_LAYOUT,
} from '../ui';
import { COLORS, COLORS_STR } from '../constants/colors';
import { UI_LAYOUT } from '../constants/uiLayout';

export type UIAnchorKey =
  | 'topLeft'
  | 'topCenter'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomCenter'
  | 'bottomRight';

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
  levelUpSkillUI!: LevelUpSkillUI;
  bossRewardUI!: BossRewardUI;
  eventUI!: EventUI;
  shopUI!: ShopUI;
  deckViewerUI!: DeckViewerUI;
  
  // 무기 없음 경고 UI
  noWeaponWarning!: Phaser.GameObjects.Container;
  
  // 검 미리보기 UI
  private swordPreviewContainer!: Phaser.GameObjects.Container;
  private cardRenderer!: CardRenderer;

  // 캔버스 설정 UI
  private settingsRoot?: Phaser.GameObjects.Container;
  private settingsMenu?: Phaser.GameObjects.Container;
  private settingsMenuTween?: Phaser.Tweens.Tween;
  private settingsMenuBaseY = 0;
  private fullscreenLabel?: Phaser.GameObjects.Text;
  private localeLabel?: Phaser.GameObjects.Text;
  private rulebookLabel?: Phaser.GameObjects.Text;
  private restartLabel?: Phaser.GameObjects.Text;
  private mainMenuLabel?: Phaser.GameObjects.Text;
  private locale: 'ko' | 'en' = 'ko';
  private readonly LOCALE_KEY = 'sword-master-locale';
  private readonly LOCALE_EVENT = 'sword-master-locale-change';
  private readonly OPEN_RULEBOOK_EVENT = 'sword-master-open-rulebook';
  private fullscreenListener?: () => void;
  private localeListener?: () => void;
  private uiAnchors?: Record<UIAnchorKey, Phaser.GameObjects.Container>;
  private topLeftHudStack?: Phaser.GameObjects.Container;
  private topRightHudStack?: Phaser.GameObjects.Container;
  private debugOverlayRoot?: Phaser.GameObjects.Container;
  private debugOverlayGraphics?: Phaser.GameObjects.Graphics;
  private debugOverlayLabels: Phaser.GameObjects.Text[] = [];
  private debugToggleKey?: Phaser.Input.Keyboard.Key;
  private debugOverlayVisible = false;
  
  constructor() {
    super({ key: 'UIScene' });
  }

  init(data: { gameScene: GameScene }) {
    this.gameScene = data.gameScene;
  }

  private createUIAnchors() {
    const makeAnchor = () =>
      this.add.container(0, 0).setDepth(UI_LAYOUT.anchors.depth).setScrollFactor(0);

    this.uiAnchors = {
      topLeft: makeAnchor(),
      topCenter: makeAnchor(),
      topRight: makeAnchor(),
      bottomLeft: makeAnchor(),
      bottomCenter: makeAnchor(),
      bottomRight: makeAnchor(),
    };

    this.layoutUIAnchors(this.cameras.main.width, this.cameras.main.height);
  }

  private layoutUIAnchors(width: number, height: number) {
    if (!this.uiAnchors) return;

    const anchors = UI_LAYOUT.anchors;
    this.uiAnchors.topLeft.setPosition(anchors.marginX, anchors.marginTop);
    this.uiAnchors.topCenter.setPosition(width / 2, anchors.marginTop);
    this.uiAnchors.topRight.setPosition(width - anchors.marginX, anchors.marginTop);
    this.uiAnchors.bottomLeft.setPosition(anchors.marginX, height - anchors.marginBottom);
    this.uiAnchors.bottomCenter.setPosition(width / 2, height - anchors.marginBottom);
    this.uiAnchors.bottomRight.setPosition(width - anchors.marginX, height - anchors.marginBottom);
  }

  getUIAnchor(anchor: UIAnchorKey): Phaser.GameObjects.Container {
    if (!this.uiAnchors) {
      throw new Error('UI anchors are not initialized');
    }
    return this.uiAnchors[anchor];
  }

  getUIAnchorWorldPosition(anchor: UIAnchorKey): { x: number; y: number } {
    const anchorContainer = this.getUIAnchor(anchor);
    return { x: anchorContainer.x, y: anchorContainer.y };
  }

  private createTopLeftHudStack() {
    const topLeft = this.getUIAnchor('topLeft');
    const leftLayout = UI_LAYOUT.hud.topLeft;
    this.topLeftHudStack = this.add
      .container(leftLayout.rootX, leftLayout.rootY)
      .setDepth(UI_LAYOUT.anchors.depth);
    topLeft.add(this.topLeftHudStack);
  }

  getTopLeftHudStack(): Phaser.GameObjects.Container {
    if (this.topLeftHudStack) return this.topLeftHudStack;
    return this.getUIAnchor('topLeft');
  }

  getTopLeftHudWorldPosition(): { x: number; y: number } {
    const anchorPos = this.getUIAnchorWorldPosition('topLeft');
    const stack = this.getTopLeftHudStack();
    return { x: anchorPos.x + stack.x, y: anchorPos.y + stack.y };
  }

  private createTopRightHudStack() {
    const topRight = this.getUIAnchor('topRight');
    const rightLayout = UI_LAYOUT.hud.topRight;
    this.topRightHudStack = this.add
      .container(rightLayout.rootX, rightLayout.rootY)
      .setDepth(UI_LAYOUT.settings.root.depth);
    topRight.add(this.topRightHudStack);
  }

  getTopRightHudStack(): Phaser.GameObjects.Container {
    if (this.topRightHudStack) return this.topRightHudStack;
    return this.getUIAnchor('topRight');
  }

  private onResize(gameSize: Phaser.Structs.Size) {
    this.layoutUIAnchors(gameSize.width, gameSize.height);
    if (this.noWeaponWarning) {
      this.noWeaponWarning.setPosition(gameSize.width / 2, gameSize.height / 2 - 60);
    }
    if (this.debugOverlayVisible) {
      this.redrawDebugOverlay();
    }
  }

  create() {
    this.createUIAnchors();
    this.createTopLeftHudStack();
    this.createTopRightHudStack();
    this.scale.on('resize', this.onResize, this);

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
    this.levelUpSkillUI = new LevelUpSkillUI(this);
    this.bossRewardUI = new BossRewardUI(this);
    this.eventUI = new EventUI(this);
    this.shopUI = new ShopUI(this);
    this.deckViewerUI = new DeckViewerUI(this);
    
    // 무기 없음 경고 UI 생성
    this.createNoWeaponWarning();
    
    // 검 미리보기 UI 생성
    this.cardRenderer = new CardRenderer(this);
    this.createSwordPreviewUI();
    this.createCanvasSettingsUI();
    this.createDebugOverlay();
    
    // 이벤트 리스너 설정
    this.setupEventListeners();
    
    // 초기 업데이트
    this.cardUI.updateCardDisplay();
    this.updateAllStats();
  }

  private createDebugOverlay() {
    this.debugOverlayRoot = this.add.container(0, 0);
    this.debugOverlayRoot.setScrollFactor(0);
    this.debugOverlayRoot.setDepth(9500);
    this.debugOverlayRoot.setVisible(false);

    this.debugOverlayGraphics = this.add.graphics();
    this.debugOverlayRoot.add(this.debugOverlayGraphics);

    if (this.input.keyboard) {
      this.debugToggleKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F2);
      this.debugToggleKey.on('down', this.toggleDebugOverlay, this);
    }
  }

  private toggleDebugOverlay() {
    this.debugOverlayVisible = !this.debugOverlayVisible;
    this.debugOverlayRoot?.setVisible(this.debugOverlayVisible);
    if (this.debugOverlayVisible) {
      this.redrawDebugOverlay();
    }
  }

  private addDebugLabel(x: number, y: number, text: string, color: string = '#86f6ff') {
    if (!this.debugOverlayRoot) return;
    const label = this.add.text(x, y, text, {
      font: '13px monospace',
      color,
      backgroundColor: '#000000aa',
      padding: { x: 4, y: 2 },
    }).setOrigin(0, 0.5);
    this.debugOverlayLabels.push(label);
    this.debugOverlayRoot.add(label);
  }

  private clearDebugLabels() {
    this.debugOverlayLabels.forEach((label) => label.destroy());
    this.debugOverlayLabels = [];
  }

  private drawAnchorRect(
    anchor: UIAnchorKey,
    leftOffset: number,
    topOffset: number,
    width: number,
    height: number,
    color: number,
    label: string
  ) {
    if (!this.debugOverlayGraphics) return;
    const anchorPos = this.getUIAnchorWorldPosition(anchor);
    const x = anchorPos.x + leftOffset;
    const y = anchorPos.y + topOffset;

    this.debugOverlayGraphics.fillStyle(color, 0.07);
    this.debugOverlayGraphics.fillRect(x, y, width, height);
    this.debugOverlayGraphics.lineStyle(2, color, 0.95);
    this.debugOverlayGraphics.strokeRect(x, y, width, height);

    this.addDebugLabel(x + 4, y - 8, label, '#ffd47a');
  }

  private drawAnchorRectCentered(
    anchor: UIAnchorKey,
    centerOffsetX: number,
    centerOffsetY: number,
    width: number,
    height: number,
    color: number,
    label: string
  ) {
    this.drawAnchorRect(
      anchor,
      centerOffsetX - width / 2,
      centerOffsetY - height / 2,
      width,
      height,
      color,
      label
    );
  }

  private redrawDebugOverlay() {
    if (!this.debugOverlayGraphics) return;
    const graphics = this.debugOverlayGraphics;

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const gridStep = 120;

    graphics.clear();
    this.clearDebugLabels();

    // 1) 120px 그리드
    graphics.lineStyle(1, 0x2a4f7e, 0.35);
    for (let x = 0; x <= width; x += gridStep) {
      graphics.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += gridStep) {
      graphics.lineBetween(0, y, width, y);
    }
    this.addDebugLabel(12, 14, 'F2 UI DEBUG OVERLAY', '#8dff8a');
    this.addDebugLabel(12, 34, `Grid ${gridStep}px`, '#7ab9ff');

    // 2) 앵커 세이프 영역
    const safe = UI_LAYOUT.anchors;
    const safeWidth = width - safe.marginX * 2;
    const safeHeight = height - safe.marginTop - safe.marginBottom;
    graphics.lineStyle(2, 0x7de8ff, 0.8);
    graphics.strokeRect(safe.marginX, safe.marginTop, safeWidth, safeHeight);
    this.addDebugLabel(safe.marginX + 6, safe.marginTop - 8, 'Anchor Safe Area', '#86f6ff');

    // 3) 앵커 마커
    const anchors: UIAnchorKey[] = ['topLeft', 'topCenter', 'topRight', 'bottomLeft', 'bottomCenter', 'bottomRight'];
    anchors.forEach((anchor) => {
      const pos = this.getUIAnchorWorldPosition(anchor);
      graphics.lineStyle(2, 0xff4d8b, 0.95);
      graphics.lineBetween(pos.x - 10, pos.y, pos.x + 10, pos.y);
      graphics.lineBetween(pos.x, pos.y - 10, pos.x, pos.y + 10);
      graphics.strokeCircle(pos.x, pos.y, 6);
      this.addDebugLabel(pos.x + 10, pos.y - 12, `${anchor} (${Math.round(pos.x)}, ${Math.round(pos.y)})`, '#ff8db6');
    });

    // 4) 주요 UI 박스 가이드
    const hp = UI_LAYOUT.topBar.hp;
    const topLeftHud = UI_LAYOUT.hud.topLeft;
    this.drawAnchorRect(
      'topLeft',
      topLeftHud.rootX + hp.panelX,
      topLeftHud.rootY + hp.panelY,
      hp.panelWidth,
      hp.panelHeight,
      0x7ef6ff,
      'topLeft / hud > hp.panel'
    );

    const sword = UI_LAYOUT.swordInfo;
    this.drawAnchorRect(
      'topLeft',
      topLeftHud.rootX + sword.panelX,
      topLeftHud.rootY + sword.panelY,
      sword.panelWidth,
      sword.panelHeight,
      0x5df2a0,
      'topLeft / hud > swordInfo.panel'
    );

    const center = UI_LAYOUT.topBar.center;
    this.drawAnchorRect(
      'topCenter',
      center.waveX - 200,
      center.waveY,
      400,
      96,
      0xe2a2ff,
      'topCenter / wave+phase'
    );

    const right = UI_LAYOUT.hud.topRight;
    const settings = UI_LAYOUT.settings;
    const settingsTop = right.rootY + right.itemY.settings - settings.gear.hitSize / 2;
    const settingsBottom = right.rootY + right.itemY.settings + settings.gear.hitSize / 2;
    const rightColumnTop = right.rootY + right.itemY.turn;
    const rightColumnBottom = right.rootY + right.itemY.silver + right.fontSize + 6;
    const rightGroupTop = Math.min(settingsTop, rightColumnTop);
    const rightGroupHeight = Math.max(settingsBottom, rightColumnBottom) - rightGroupTop;
    this.drawAnchorRect(
      'topRight',
      right.rootX + right.flowX - 300,
      rightGroupTop,
      300,
      rightGroupHeight,
      0xffce73,
      'topRight / hud flow'
    );

    this.drawAnchorRectCentered(
      'topRight',
      right.rootX + right.flowX + settings.gear.hitX,
      right.rootY + right.itemY.settings,
      settings.gear.hitSize,
      settings.gear.hitSize,
      0x75c9ff,
      'topRight / hud > settings.gear.hit'
    );
    this.drawAnchorRectCentered(
      'topRight',
      right.rootX + right.flowX + settings.menu.x + settings.menu.bgX,
      right.rootY + right.itemY.settings + settings.menu.y + settings.menu.bgY,
      settings.menu.bgWidth,
      settings.menu.bgHeight,
      0x75c9ff,
      'topRight / hud > settings.menu.bg'
    );

    const cardArea = UI_LAYOUT.cardArea;
    this.drawAnchorRectCentered(
      'bottomCenter',
      cardArea.background.x,
      cardArea.background.y,
      cardArea.background.width,
      cardArea.background.height,
      0x7affb1,
      'bottomCenter / cardArea.background'
    );

    const actions = UI_LAYOUT.actionButtons;
    const actionLeft = actions.startX - actions.buttonWidth / 2;
    const actionTop = actions.y - actions.buttonHeight / 2;
    const actionWidth = actions.buttonWidth * 3 + actions.spacing * 2;
    const actionHeight = actions.buttonHeight;
    this.drawAnchorRect(
      'bottomLeft',
      actionLeft,
      actionTop,
      actionWidth,
      actionHeight,
      0xff9f63,
      'bottomLeft / actionButtons row'
    );
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

  private syncLocaleFromStorage() {
    const saved = window.localStorage.getItem(this.LOCALE_KEY);
    this.locale = saved === 'en' ? 'en' : 'ko';
  }

  private refreshCanvasSettingLabels() {
    const isFullscreen = Boolean(document.fullscreenElement);

    if (this.fullscreenLabel) {
      this.fullscreenLabel.setText(
        this.locale === 'en'
          ? (isFullscreen ? 'Exit Fullscreen' : 'Fullscreen')
          : (isFullscreen ? '전체화면 나가기' : '전체화면')
      );
    }

    if (this.localeLabel) {
      this.localeLabel.setText(this.locale === 'en' ? '한국어' : 'English');
    }

    if (this.rulebookLabel) {
      this.rulebookLabel.setText(this.locale === 'en' ? 'Open Rulebook Popup' : '룰북 팝업 열기');
    }

    if (this.restartLabel) {
      this.restartLabel.setText(this.locale === 'en' ? 'Restart Game' : '처음부터 다시 시작');
    }

    if (this.mainMenuLabel) {
      this.mainMenuLabel.setText(this.locale === 'en' ? 'Main Menu' : '메인 메뉴로');
    }
  }

  private openSettingsMenu() {
    if (!this.settingsMenu) return;
    const anim = UI_LAYOUT.settings.menu.animation;

    this.settingsMenuTween?.stop();
    this.settingsMenu.setVisible(true);
    this.settingsMenu.setAlpha(0);
    this.settingsMenu.setY(this.settingsMenuBaseY - anim.dropY);

    this.settingsMenuTween = this.tweens.add({
      targets: this.settingsMenu,
      alpha: 1,
      y: this.settingsMenuBaseY,
      duration: anim.durationInMs,
      ease: 'Sine.out',
      onComplete: () => {
        this.settingsMenuTween = undefined;
      },
    });
  }

  private closeSettingsMenu() {
    if (!this.settingsMenu) return;
    if (!this.settingsMenu.visible && this.settingsMenu.alpha <= 0) return;
    const anim = UI_LAYOUT.settings.menu.animation;

    this.settingsMenuTween?.stop();
    this.settingsMenuTween = this.tweens.add({
      targets: this.settingsMenu,
      alpha: 0,
      y: this.settingsMenuBaseY - Math.round(anim.dropY * 0.45),
      duration: anim.durationOutMs,
      ease: 'Sine.in',
      onComplete: () => {
        if (!this.settingsMenu) return;
        this.settingsMenu.setVisible(false);
        this.settingsMenu.setY(this.settingsMenuBaseY);
        this.settingsMenuTween = undefined;
      },
    });
  }

  private toggleSettingsMenu() {
    if (!this.settingsMenu) return;
    if (this.settingsMenu.visible && this.settingsMenu.alpha > 0.01) {
      this.closeSettingsMenu();
      return;
    }
    this.openSettingsMenu();
  }

  private createCanvasSettingsUI() {
    this.syncLocaleFromStorage();
    const settings = UI_LAYOUT.settings;
    const rightHud = UI_LAYOUT.hud.topRight;

    const topRightStack = this.getTopRightHudStack();
    this.settingsRoot = this.add
      .container(rightHud.flowX, rightHud.itemY.settings)
      .setDepth(settings.root.depth);
    topRightStack.add(this.settingsRoot);

    // gear 아이콘 (배경 없이 아이콘만)
    const gearIcon = this.textures.exists('icon-gear')
      ? this.add
          .image(settings.gear.x, 0, 'icon-gear')
          .setDisplaySize(settings.gear.iconSize, settings.gear.iconSize)
      : this.add
          .text(settings.gear.x, 0, '⚙', { font: `${settings.gear.fallbackFontSize}px monospace`, color: '#E7EEF9' })
          .setOrigin(0.5);

    const gearHit = this.add.rectangle(settings.gear.hitX, 0, settings.gear.hitSize, settings.gear.hitSize, 0x000000, 0);
    gearHit.setInteractive({ useHandCursor: true });
    gearHit.on('pointerover', () => { gearIcon.setAlpha(settings.gear.hoverAlpha); });
    gearHit.on('pointerout', () => { gearIcon.setAlpha(1); });

    this.settingsRoot.add([gearHit, gearIcon]);

    // 드롭다운 메뉴 (gear 아래로 펼침)
    this.settingsMenuBaseY = settings.menu.y;
    this.settingsMenu = this.add
      .container(settings.menu.x, this.settingsMenuBaseY)
      .setVisible(false)
      .setAlpha(0);
    const menuBg = this.add.rectangle(
      settings.menu.bgX,
      settings.menu.bgY,
      settings.menu.bgWidth,
      settings.menu.bgHeight,
      COLORS.background.dark,
      0.96
    );
    menuBg.setStrokeStyle(2, COLORS.border.medium);
    this.settingsMenu.add(menuBg);
    this.settingsRoot.add(this.settingsMenu);

    const makeItem = (
      y: number,
      iconKey: string,
      initialLabel: string,
      onClick: () => void
    ): Phaser.GameObjects.Text => {
      const item = this.add.container(settings.menu.itemX, y);
      const bg = this.add.rectangle(
        0,
        0,
        settings.menu.itemBgWidth,
        settings.menu.itemBgHeight,
        COLORS.background.medium,
        0.94
      );
      bg.setStrokeStyle(1, COLORS.border.light);
      bg.setInteractive({ useHandCursor: true });

      const icon = this.textures.exists(iconKey)
        ? this.add
            .image(settings.menu.itemIconX, 0, iconKey)
            .setDisplaySize(settings.menu.itemIconSize, settings.menu.itemIconSize)
        : this.add
            .text(settings.menu.itemIconX, 0, '•', { font: '14px monospace', color: '#f4f7fb' })
            .setOrigin(0.5);

      const text = this.add.text(settings.menu.itemLabelX, 0, initialLabel, {
        font: `${settings.menu.itemLabelFontSize}px monospace`,
        color: COLORS_STR.text.primary,
      }).setOrigin(0, 0.5);

      bg.on('pointerover', () => { bg.setStrokeStyle(1, COLORS.primary.dark); });
      bg.on('pointerout', () => { bg.setStrokeStyle(1, COLORS.border.light); });
      bg.on('pointerdown', () => { onClick(); });

      item.add([bg, icon, text]);
      this.settingsMenu?.add(item);
      return text;
    };

    this.fullscreenLabel = makeItem(settings.menu.itemY.fullscreen, 'icon-fullscreen', '', () => {
      if (document.fullscreenElement) {
        void document.exitFullscreen();
      } else {
        void document.documentElement.requestFullscreen().catch(() => undefined);
      }
      this.closeSettingsMenu();
    });

    this.localeLabel = makeItem(settings.menu.itemY.locale, 'icon-language', '', () => {
      const next = this.locale === 'ko' ? 'en' : 'ko';
      this.locale = next;
      window.localStorage.setItem(this.LOCALE_KEY, next);
      document.documentElement.lang = next;
      window.dispatchEvent(new CustomEvent(this.LOCALE_EVENT, { detail: next }));
      this.refreshCanvasSettingLabels();
      this.closeSettingsMenu();
    });

    this.rulebookLabel = makeItem(settings.menu.itemY.rulebook, 'icon-book', '', () => {
      window.dispatchEvent(new CustomEvent(this.OPEN_RULEBOOK_EVENT));
      this.closeSettingsMenu();
    });

    this.restartLabel = makeItem(settings.menu.itemY.restart, 'icon-restart', '', () => {
      this.closeSettingsMenu();
      this.gameScene.restartFromBeginning();
    });

    this.mainMenuLabel = makeItem(settings.menu.itemY.mainMenu, 'icon-home', '', () => {
      this.closeSettingsMenu();
      this.gameScene.returnToMainMenu();
    });

    gearHit.on('pointerdown', () => {
      this.toggleSettingsMenu();
    });

    this.refreshCanvasSettingLabels();

    this.fullscreenListener = () => this.refreshCanvasSettingLabels();
    document.addEventListener('fullscreenchange', this.fullscreenListener);

    this.localeListener = () => {
      this.syncLocaleFromStorage();
      this.refreshCanvasSettingLabels();
    };
    window.addEventListener(this.LOCALE_EVENT, this.localeListener as EventListener);
    window.addEventListener('storage', this.localeListener);
  }
  
  private createSwordPreviewUI() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    this.swordPreviewContainer = this.add.container(0, 0);
    this.swordPreviewContainer.setVisible(false);
    this.swordPreviewContainer.setDepth(2000);
    
    // 배경 오버레이
    const overlay = this.add.rectangle(width/2, height/2, width, height, COLORS.background.overlay, 0.85);
    this.swordPreviewContainer.add(overlay);
  }
  
  /**
   * 검 미리보기 UI 표시 (검잡기 등에서 사용)
   */
  showSwordPreview(sword: SwordCard, title: string, onConfirm: () => void) {
    this.swordPreviewContainer.removeAll(true);
    
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // 배경 오버레이
    const overlay = this.add.rectangle(width/2, height/2, width, height, COLORS.background.overlay, 0.85);
    this.swordPreviewContainer.add(overlay);
    
    // 제목
    const titleText = this.add.text(width/2, 120, title, {
      font: 'bold 48px monospace',
      color: COLORS_STR.primary.dark,
    }).setOrigin(0.5);
    this.swordPreviewContainer.add(titleText);
    
    // 상세 카드 표시
    const detailCard = this.cardRenderer.createDetailCard({ type: 'sword', data: sword }, null);
    detailCard.setPosition(width/2, height/2 - 30);
    this.swordPreviewContainer.add(detailCard);
    
    // 확인 버튼
    const cardHeight = CARD_SIZE.DETAIL.height;
    const confirmBtn = this.add.container(width/2, height/2 + cardHeight/2 + 60);
    const btnBg = this.add.rectangle(0, 0, 200, 70, COLORS.success.main, 0.9);
    btnBg.setStrokeStyle(4, COLORS.primary.light);
    const btnText = this.add.text(0, 0, '확인', {
      font: 'bold 32px monospace',
      color: COLORS_STR.primary.light,
    }).setOrigin(0.5);
    confirmBtn.add([btnBg, btnText]);
    this.swordPreviewContainer.add(confirmBtn);
    
    // 버튼 인터랙션
    btnBg.setInteractive({ useHandCursor: true });
    btnBg.on('pointerover', () => {
      btnBg.setStrokeStyle(6, COLORS.primary.light);
      confirmBtn.setScale(1.05);
    });
    btnBg.on('pointerout', () => {
      btnBg.setStrokeStyle(4, COLORS.primary.light);
      confirmBtn.setScale(1);
    });
    btnBg.on('pointerdown', () => {
      this.hideSwordPreview();
      onConfirm();
    });
    
    this.swordPreviewContainer.setVisible(true);
  }
  
  hideSwordPreview() {
    this.swordPreviewContainer.setVisible(false);
  }
  
  /**
   * 검의 춤 - 카드를 화면 중앙에 순차적으로 표시
   */
  showBladeDanceCard(card: import('../types').Card, currentIndex: number, totalCount: number, onComplete: () => void) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // 카드 컨테이너
    const container = this.add.container(width / 2, -300);
    container.setDepth(3000);
    
    // 배경 딤
    const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.5);
    dim.setPosition(0, height / 2 + 300);  // container 기준 상대 위치
    container.add(dim);
    
    // 카운터 표시
    const counterText = this.add.text(0, -CARD_SIZE.DETAIL.height / 2 - 50, `💃 ${currentIndex} / ${totalCount}`, {
      font: 'bold 36px monospace',
      color: '#FFD700',
    }).setOrigin(0.5);
    container.add(counterText);
    
    // 상세 카드 생성
    const detailCard = this.cardRenderer.createDetailCard(card, this.gameScene.playerState.currentSword);
    container.add(detailCard);
    
    // 카드 타입에 따른 라벨
    const isSword = card.type === 'sword';
    const labelText = isSword ? '⚔️ 장착!' : '📜 발동!';
    const label = this.add.text(0, CARD_SIZE.DETAIL.height / 2 + 40, labelText, {
      font: 'bold 32px monospace',
      color: isSword ? '#FF6B6B' : '#5DADE2',
    }).setOrigin(0.5);
    container.add(label);
    
    // 위에서 내려오는 애니메이션
    this.tweens.add({
      targets: container,
      y: height / 2,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        // 잠시 대기 후 사라짐
        this.time.delayedCall(800, () => {
          this.tweens.add({
            targets: container,
            y: height + 300,
            alpha: 0,
            duration: 250,
            ease: 'Power2',
            onComplete: () => {
              container.destroy();
              onComplete();
            }
          });
        });
      }
    });
  }
  
private setupEventListeners() {
    this.gameScene.events.on('handUpdated', this.onHandUpdated, this);
    this.gameScene.events.on('statsUpdated', this.updateAllStats, this);
    this.gameScene.events.on('turnEnded', this.onTurnEnded, this);
    this.gameScene.events.on('combatStarted', this.onCombatStarted, this);
    this.gameScene.events.on('modeChanged', this.onModeChanged, this);
    this.gameScene.events.on('targetingStarted', (reach: string) => this.targetIndicatorUI.show(reach), this);
    this.gameScene.events.on('targetingCancelled', () => this.targetIndicatorUI.hide(), this);
    this.gameScene.events.on('showRewardSelection', () => this.rewardSelectionUI.show(), this);
    this.gameScene.events.on('rewardSelected', () => this.rewardSelectionUI.hide(), this);
    this.gameScene.events.on('showSkillCardSelection', () => this.skillSelectUI.show(), this);
    this.gameScene.events.on('skillCardSelected', () => this.skillSelectUI.hide(), this);
    this.gameScene.events.on('showLevelUpSkillSelection', () => this.levelUpSkillUI.showSkills(), this);
    this.gameScene.events.on('levelUpSkillSelected', () => this.levelUpSkillUI.hide(), this);
    this.gameScene.events.on('showLevelUpPassiveSelection', () => this.levelUpSkillUI.showPassives(), this);
    this.gameScene.events.on('levelUpPassiveSelected', () => this.levelUpSkillUI.hide(), this);
    this.gameScene.events.on('showBossRewardSelection', () => this.bossRewardUI.show(), this);
    this.gameScene.events.on('bossRewardSelected', () => this.bossRewardUI.hide(), this);
    this.gameScene.events.on('exchangeUsed', () => this.actionButtonsUI.onExchangeUsed(), this);
    
    // 카드 애니메이션 이벤트 (cardToGrave만 - 카운트 효과 종료 시 사용)
    this.gameScene.events.on('cardToGrave', this.animateCardToGrave, this);

    // 씬 종료 시 이벤트 리스너 정리 (재시작 시 중복 방지)
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.onResize, this);

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
      this.gameScene.events.off('showLevelUpSkillSelection');
      this.gameScene.events.off('levelUpSkillSelected');
      this.gameScene.events.off('showLevelUpPassiveSelection');
      this.gameScene.events.off('levelUpPassiveSelected');
      this.gameScene.events.off('showBossRewardSelection');
      this.gameScene.events.off('bossRewardSelected');
      this.gameScene.events.off('exchangeUsed');
      this.gameScene.events.off('cardToGrave');

      if (this.fullscreenListener) {
        document.removeEventListener('fullscreenchange', this.fullscreenListener);
        this.fullscreenListener = undefined;
      }
      if (this.localeListener) {
        window.removeEventListener(this.LOCALE_EVENT, this.localeListener as EventListener);
        window.removeEventListener('storage', this.localeListener);
        this.localeListener = undefined;
      }

      this.settingsMenuTween?.stop();
      this.settingsMenuTween = undefined;

      if (this.debugToggleKey) {
        this.debugToggleKey.off('down', this.toggleDebugOverlay, this);
        this.debugToggleKey.destroy();
        this.debugToggleKey = undefined;
      }

      this.clearDebugLabels();
      this.debugOverlayGraphics?.destroy();
      this.debugOverlayGraphics = undefined;
      this.debugOverlayRoot?.destroy();
      this.debugOverlayRoot = undefined;
      this.debugOverlayVisible = false;
    });
  }
  
  private onHandUpdated() {
    // 카드 상태 변경 시 툴팁 강제 숨김 (버그 방지)
    this.tooltipUI.hide();
    this.cardUI.updateCardDisplay();
    this.swordInfoUI.update();
  }
  
  private onModeChanged() {
    // 모드 변경 시 툴팁 강제 숨김
    this.tooltipUI.hide();
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
    // 턴 종료 시 툴팁 강제 숨김
    this.tooltipUI.hide();
    
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
    // 전투 시작 시 툴팁 강제 숨김
    this.tooltipUI.hide();
    
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
  
  // ========== 카드 애니메이션 (실제 카드 sprite 사용) ==========
  
  /**
   * 무기 카드 장착 애니메이션 - 적에게 날아가서 때리고 플레이어에게 돌아옴
   */
  animateCardToPlayer(cardSprite: Phaser.GameObjects.Container, targetX: number, targetY: number) {
    const playerX = this.gameScene.PLAYER_X;
    const playerY = this.gameScene.GROUND_Y - 112;
    
    // 1단계: 적에게 날아감 (발도 공격!)
    this.tweens.add({
      targets: cardSprite,
      x: targetX,
      y: targetY - 56,
      scale: 0.6,
      rotation: Math.PI,
      duration: 250,
      ease: 'Power3',
      onComplete: () => {
        // 임팩트 효과
        const impact = this.add.text(targetX, targetY - 56, '⚔️💥', {
          font: '90px Arial',
        }).setOrigin(0.5);
        impact.setDepth(5001);
        
        this.tweens.add({
          targets: impact,
          scale: 1.5,
          alpha: 0,
          duration: 300,
          onComplete: () => impact.destroy(),
        });
        
        // 2단계: 플레이어에게 돌아옴 (장착)
        this.tweens.add({
          targets: cardSprite,
          x: playerX,
          y: playerY,
          scale: 0.4,
          rotation: Math.PI * 2,
          duration: 300,
          ease: 'Power2',
          onComplete: () => {
            // 장착 효과
            const flash = this.add.text(playerX, playerY, '✨', {
              font: '75px Arial',
            }).setOrigin(0.5);
            flash.setDepth(5001);
            
            this.tweens.add({
              targets: flash,
              scale: 2,
              alpha: 0,
              duration: 400,
              onComplete: () => flash.destroy(),
            });
            
            cardSprite.destroy();
          },
        });
      },
    });
  }
  
  /**
   * 카드가 카운트 영역으로 날아가는 애니메이션 (강타, 검 얽기 등)
   */
  animateCardToCount(cardSprite: Phaser.GameObjects.Container) {
    // 카운트 영역 위치 (CountEffectUI와 동기화)
    const { x: countX, y: countY } = this.countEffectUI.getPrimaryAnchorPosition();
    
    this.tweens.add({
      targets: cardSprite,
      x: countX,
      y: countY,
      scale: 0.6,
      rotation: 0.1,
      duration: 350,
      ease: 'Quad.easeOut',
      onComplete: () => {
        // 대기 효과
        const waitText = this.add.text(countX, countY - 80, '⏳ 대기', {
          font: 'bold 24px monospace',
          color: '#ffd700',
        }).setOrigin(0.5);
        waitText.setDepth(5001);
        
        this.tweens.add({
          targets: waitText,
          y: countY - 120,
          alpha: 0,
          duration: 600,
          onComplete: () => waitText.destroy(),
        });
        
        cardSprite.destroy();
      },
    });
  }
  
  /**
   * 카드 드로우 애니메이션 + 완료 시 카드 추가 (콜백 기반)
   * @param card 추가할 카드 데이터
   * @param targetIndex 이 카드가 들어갈 손패 인덱스
   * @param finalHandSize 최종 손패 크기 (레이아웃 계산용)
   * @param onComplete 애니메이션 완료 콜백
   */
  animateDrawCard(
    card: import('../types').Card,
    targetIndex: number,
    finalHandSize: number,
    onComplete: () => void
  ) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const { x: deckX, y: deckY } = this.cardUI.getDeckWorldPosition();
    
    // 정확한 목표 위치 계산
    const targetPos = calculateCardPosition(finalHandSize, targetIndex, width, height);
    
    // 애니메이션용 카드 생성
    const animCard = this.add.container(deckX, deckY);
    animCard.setDepth(5000 + targetIndex);
    
    const bg = this.add.rectangle(0, 0, CARD_LAYOUT.CARD_WIDTH - 7, CARD_LAYOUT.CARD_HEIGHT, COLORS.background.dark, 0.95);
    bg.setStrokeStyle(4, COLORS.primary.dark);
    
    const emojiText = this.add.text(0, -30, card.data.emoji, {
      font: '51px Arial',
    }).setOrigin(0.5);
    
    animCard.add([bg, emojiText]);
    animCard.setScale(0.25);
    
    // 덱에서 손패로 날아가는 애니메이션
    this.tweens.add({
      targets: animCard,
      x: targetPos.x,
      y: targetPos.y,
      scale: 1.0,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => {
        // 애니메이션 카드 제거
        animCard.destroy();
        
        // 실제 카드 추가 (애니메이션 완료 후!)
        this.gameScene.playerState.hand.push(card);
        this.cardUI.consumeReservedSlot();
        this.gameScene.events.emit('handUpdated');
        
        // 완료 콜백
        onComplete();
      },
    });
  }
  
  /**
   * 여러 카드 순차 드로우 (애니메이션 체인)
   */
  animateDrawCards(cards: import('../types').Card[], onAllComplete?: () => void) {
    if (cards.length === 0) {
      onAllComplete?.();
      return;
    }
    
    const currentHandSize = this.gameScene.playerState.hand.length;
    const finalHandSize = currentHandSize + cards.length;
    
    // 예약 슬롯 확보 (기존 카드들 미리 이동)
    this.cardUI.reserveSlots(cards.length);
    
    // 순차적으로 애니메이션 실행
    let completedCount = 0;
    const animationDelay = 200;  // 각 카드 시작 간격
    
    cards.forEach((card, index) => {
      const targetIndex = currentHandSize + index;
      
      // 약간의 딜레이 후 애니메이션 시작
      this.time.delayedCall(index * animationDelay, () => {
        this.animateDrawCard(card, targetIndex, finalHandSize, () => {
          completedCount++;
          if (completedCount === cards.length) {
            onAllComplete?.();
          }
        });
      });
    });
  }
  
  /**
   * 실제 카드 sprite를 적에게 보내고 무덤으로 (2단계 애니메이션)
   * 공격/스페셜 스킬용
   */
animateCardToEnemyAndGrave(cardSprite: Phaser.GameObjects.Container, targetX: number, targetY: number) {
    const { x: graveX, y: graveY } = this.cardUI.getGraveWorldPosition();

    // 1단계: 적에게 빠르게 날아감 (팍!)
    this.tweens.add({
      targets: cardSprite,
      x: targetX,
      y: targetY - 56,
      scale: 0.5,
      rotation: 0.5,
      duration: 80,  // 더 빠르게!
      ease: 'Power4',
      onComplete: () => {
        // 임팩트 효과
        const impact = this.add.text(targetX, targetY - 56, '💥', {
          font: '90px Arial',
        }).setOrigin(0.5);
        impact.setDepth(5001);

        this.tweens.add({
          targets: impact,
          scale: 1.5,
          alpha: 0,
          duration: 250,
          onComplete: () => impact.destroy(),
        });

        // 2단계: 무덤으로 튕겨나감 (반투명하게)
        cardSprite.setAlpha(0.5);  // 반투명으로 시작
        this.tweens.add({
          targets: cardSprite,
          x: graveX,
          y: graveY,
          scale: 0.2,
          alpha: 0.2,
          rotation: -0.5,
          duration: 500,
          ease: 'Quad.easeInOut',
          onComplete: () => {
            cardSprite.destroy();
          },
        });
      },
    });
  }
  
  /**
   * 여러 적에게 카드가 날아가는 애니메이션
   * 원본 카드 + 복제된 카드들이 각 적에게 날아감
   */
  animateCardToMultipleEnemies(
    cardSprite: Phaser.GameObjects.Container, 
    targets: Array<{x: number, y: number}>
  ) {
    const { x: graveX, y: graveY } = this.cardUI.getGraveWorldPosition();
    
    // 첫 번째 타겟에는 원본 카드가 날아감
    if (targets.length > 0) {
      this.animateCardToEnemyAndGrave(cardSprite, targets[0].x, targets[0].y);
    }
    
    // 나머지 타겟에는 복제된 카드가 날아감
    for (let i = 1; i < targets.length; i++) {
      const target = targets[i];
      
      // 원본 카드의 시각적 복사본 생성
      const clone = this.createCardClone(cardSprite);
      clone.setPosition(cardSprite.x, cardSprite.y);
      clone.setDepth(5000 + i);
      clone.setAlpha(0.8);
      
      // 살짝 딜레이를 두고 날아감 (연속 히트 느낌)
      this.time.delayedCall(i * 30, () => {
        this.tweens.add({
          targets: clone,
          x: target.x,
          y: target.y - 56,
          scale: 0.5,
          rotation: 0.5 + (i * 0.2),
          duration: 80,
          ease: 'Power4',
          onComplete: () => {
            // 임팩트 효과
            const impact = this.add.text(target.x, target.y - 56, '💥', {
              font: '90px Arial',
            }).setOrigin(0.5);
            impact.setDepth(5001);
            
            this.tweens.add({
              targets: impact,
              scale: 1.5,
              alpha: 0,
              duration: 250,
              onComplete: () => impact.destroy(),
            });
            
            // 무덤으로
            clone.setAlpha(0.4);
            this.tweens.add({
              targets: clone,
              x: graveX,
              y: graveY,
              scale: 0.2,
              alpha: 0,
              rotation: -0.5,
              duration: 400,
              ease: 'Quad.easeInOut',
              onComplete: () => clone.destroy(),
            });
          },
        });
      });
    }
  }
  
  /**
   * 카드 스프라이트의 간단한 시각적 복사본 생성
   */
  private createCardClone(original: Phaser.GameObjects.Container): Phaser.GameObjects.Container {
    const clone = this.add.container(original.x, original.y);
    
    // 원본의 첫 번째 자식 (배경 사각형)을 복제
    const bg = this.add.rectangle(0, 0, 165, 253, 0x1a1a2e, 0.9);
    bg.setStrokeStyle(3, 0x4A90D9);
    clone.add(bg);
    
    // 카드 효과 이모지 (⚔️)
    const effect = this.add.text(0, 0, '⚔️', { font: '60px Arial' }).setOrigin(0.5);
    clone.add(effect);
    
    return clone;
  }
  
  /**
   * 실제 카드 sprite를 무덤으로 (버프/방어 스킬용)
   */
animateCardSpriteToGrave(cardSprite: Phaser.GameObjects.Container) {
    const { x: graveX, y: graveY } = this.cardUI.getGraveWorldPosition();

    // 반투명으로 시작
    cardSprite.setAlpha(0.5);
    
    // 무덤으로 날아가는 애니메이션
    this.tweens.add({
      targets: cardSprite,
      x: graveX,
      y: graveY,
      scale: 0.2,
      alpha: 0.2,
      rotation: -0.3,
      duration: 500,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        cardSprite.destroy();
      },
    });
  }
  
  /**
   * 카드가 무덤으로 가는 애니메이션 (좌표 기반 - 카운트 효과 종료 시 사용)
   */
animateCardToGrave(startX: number, startY: number, emoji: string) {
    const { x: graveX, y: graveY } = this.cardUI.getGraveWorldPosition();

    // 카드 생성 (반투명으로)
    const card = this.add.container(startX, startY);
    card.setDepth(5000);
    card.setAlpha(0.5);  // 반투명

    const bg = this.add.rectangle(0, 0, CARD_LAYOUT.CARD_WIDTH - 7, CARD_LAYOUT.CARD_HEIGHT, COLORS.background.medium, 0.9);
    bg.setStrokeStyle(3, COLORS.text.muted);

    const emojiText = this.add.text(0, -30, emoji, {
      font: '51px Arial',
    }).setOrigin(0.5);

    card.add([bg, emojiText]);
    card.setScale(0.6);  // 카운트 영역 크기로 시작

    // 무덤으로 날아가는 애니메이션
    this.tweens.add({
      targets: card,
      x: graveX,
      y: graveY,
      scale: 0.2,
      alpha: 0.2,
      rotation: -0.3,
      duration: 500,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        card.destroy();
      },
    });
  }
}

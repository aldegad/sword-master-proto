import * as Phaser from 'phaser';
import type { UIScene } from '../scenes/UIScene';
import type { Card, SwordCard, SkillCard } from '../types';
import { COLORS, COLORS_STR } from '../constants/colors';
import { UI_LAYOUT } from '../constants/uiLayout';
import { i18n, t } from '../i18n';

// 카드 레이아웃 상수
export const CARD_LAYOUT = {
  CARD_WIDTH: 172,
  CARD_HEIGHT: 253,
  MAX_SPACING: 8,
  MAX_TOTAL_WIDTH: 1700,
  CONTAINER_Y_OFFSET: 145,  // height - this = container Y
};

/**
 * 카드 위치 계산 유틸리티
 * @param handSize 손패 카드 수
 * @param cardIndex 카드 인덱스
 * @param screenWidth 화면 너비
 * @param screenHeight 화면 높이
 * @returns { x, y } 카드의 절대 화면 좌표
 */
export function calculateCardPosition(
  handSize: number,
  cardIndex: number,
  screenWidth: number,
  screenHeight: number
): { x: number; y: number } {
  const { CARD_WIDTH, MAX_SPACING, MAX_TOTAL_WIDTH, CONTAINER_Y_OFFSET } = CARD_LAYOUT;
  
  // 간격 계산
  let spacing = MAX_SPACING;
  let totalWidth = handSize * (CARD_WIDTH + spacing) - spacing;
  
  if (totalWidth > MAX_TOTAL_WIDTH && handSize > 1) {
    spacing = (MAX_TOTAL_WIDTH - CARD_WIDTH) / (handSize - 1) - CARD_WIDTH;
    totalWidth = MAX_TOTAL_WIDTH;
  }
  
  // 컨테이너 기준 상대 좌표
  const startX = -totalWidth / 2 + CARD_WIDTH / 2;
  const relativeX = startX + cardIndex * (CARD_WIDTH + spacing);
  
  // 절대 좌표 변환 (컨테이너 위치 + 상대 좌표)
  const containerX = screenWidth / 2;
  const containerY = screenHeight - CONTAINER_Y_OFFSET;
  
  return {
    x: containerX + relativeX,
    y: containerY,
  };
}

/**
 * 카드 UI - 손패 표시 및 카드 렌더링
 */
export class CardUI {
  private scene: UIScene;
  private bottomCenterAnchor!: Phaser.GameObjects.Container;
  private bottomLeftAnchor!: Phaser.GameObjects.Container;
  private bottomRightAnchor!: Phaser.GameObjects.Container;
  
  private cardContainer!: Phaser.GameObjects.Container;
  private cardSprites: Phaser.GameObjects.Container[] = [];
  private graveButton!: Phaser.GameObjects.Container;
  private graveCountText!: Phaser.GameObjects.Text;
  private deckButton!: Phaser.GameObjects.Container;
  private deckCountText!: Phaser.GameObjects.Text;
  
  // 드로우 애니메이션용 예약 슬롯 (미리 공간 확보)
  private pendingCardCount: number = 0;
  
  constructor(scene: UIScene) {
    this.scene = scene;
    this.create();
  }
  
  /**
   * 드로우할 카드 수만큼 빈 슬롯 예약
   * - 레이아웃 계산 시 이 수만큼 추가 공간 확보
   * - 애니메이션이 정확한 위치로 날아갈 수 있게 함
   */
  reserveSlots(count: number) {
    this.pendingCardCount = count;
    this.updateCardDisplay();
  }
  
  /**
   * 예약 슬롯 하나 소비 (카드가 실제로 추가될 때)
   */
  consumeReservedSlot() {
    if (this.pendingCardCount > 0) {
      this.pendingCardCount--;
    }
  }
  
  /**
   * 예약 슬롯 초기화
   */
  clearReservedSlots() {
    this.pendingCardCount = 0;
  }
  
  private create() {
    const cardArea = UI_LAYOUT.cardArea;
    const graveLayout = cardArea.graveButton;
    const deckLayout = cardArea.deckButton;

    this.bottomCenterAnchor = this.scene.getUIAnchor('bottomCenter');
    this.bottomLeftAnchor = this.scene.getUIAnchor('bottomLeft');
    this.bottomRightAnchor = this.scene.getUIAnchor('bottomRight');
    
    // 카드 영역 배경 (bottom-center anchor 기준)
    const cardAreaBg = this.scene.add.rectangle(
      cardArea.background.x,
      cardArea.background.y,
      cardArea.background.width,
      cardArea.background.height,
      COLORS.background.dark,
      0.95
    );
    cardAreaBg.setStrokeStyle(3, COLORS.border.medium);
    this.bottomCenterAnchor.add(cardAreaBg);
    
    // 손패 라벨 (스케일)
    const handLabel = this.scene.add.text(
      cardArea.handLabel.x,
      cardArea.handLabel.y,
      t('ui.cards.handMax', { max: 12 }),
      {
        font: `bold ${cardArea.handLabel.fontSize}px monospace`,
        color: COLORS_STR.primary.main,
      }
    ).setOrigin(0.5);
    this.bottomCenterAnchor.add(handLabel);
    
    // 카드 컨테이너
    this.cardContainer = this.scene.add.container(
      cardArea.handContainer.x,
      cardArea.handContainer.y
    );
    this.bottomCenterAnchor.add(this.cardContainer);
    
    // 무덤 버튼 (손패 좌측 하단)
    this.graveButton = this.scene.add.container(graveLayout.x, graveLayout.y);
    this.bottomLeftAnchor.add(this.graveButton);
    
    const graveBg = this.scene.add.rectangle(0, 0, graveLayout.width, graveLayout.height, COLORS.background.dark, 0.9);
    graveBg.setStrokeStyle(2, COLORS.secondary.dark);
    
    const graveIcon = this.scene.add.text(graveLayout.iconX, 0, '🪦', {
      font: `${graveLayout.iconFontSize}px Arial`,
    }).setOrigin(0.5);
    
    this.graveCountText = this.scene.add.text(graveLayout.textX, 0, 'GRAVE: 0', {
      font: `bold ${graveLayout.textFontSize}px monospace`,
      color: COLORS_STR.text.muted,
    }).setOrigin(0.5);
    
    this.graveButton.add([graveBg, graveIcon, this.graveCountText]);
    
    // 무덤 버튼 클릭 이벤트
    graveBg.setInteractive({ useHandCursor: true });
    graveBg.on('pointerover', () => {
      graveBg.setStrokeStyle(3, COLORS.secondary.light);
      this.graveButton.setScale(1.05);
    });
    graveBg.on('pointerout', () => {
      graveBg.setStrokeStyle(2, COLORS.secondary.dark);
      this.graveButton.setScale(1);
    });
    graveBg.on('pointerdown', () => {
      this.scene.deckViewerUI.show('grave');  // 무덤만 표시
    });
    
    // 덱 버튼 (손패 우측 하단)
    this.deckButton = this.scene.add.container(deckLayout.x, deckLayout.y);
    this.bottomRightAnchor.add(this.deckButton);
    
    const deckBg = this.scene.add.rectangle(0, 0, deckLayout.width, deckLayout.height, COLORS.background.dark, 0.9);
    deckBg.setStrokeStyle(2, COLORS.primary.dark);
    
    const deckIcon = this.scene.add.text(deckLayout.iconX, 0, '📚', {
      font: `${deckLayout.iconFontSize}px Arial`,
    }).setOrigin(0.5);
    
    this.deckCountText = this.scene.add.text(deckLayout.textX, 0, 'DECK: 0', {
      font: `bold ${deckLayout.textFontSize}px monospace`,
      color: COLORS_STR.primary.main,
    }).setOrigin(0.5);
    
    this.deckButton.add([deckBg, deckIcon, this.deckCountText]);
    
    // 덱 버튼 클릭 이벤트
    deckBg.setInteractive({ useHandCursor: true });
    deckBg.on('pointerover', () => {
      deckBg.setStrokeStyle(3, COLORS.primary.light);
      this.deckButton.setScale(1.05);
    });
    deckBg.on('pointerout', () => {
      deckBg.setStrokeStyle(2, COLORS.primary.dark);
      this.deckButton.setScale(1);
    });
    deckBg.on('pointerdown', () => {
      this.scene.deckViewerUI.show();
    });
  }
  
  /**
   * 카드 컨테이너의 절대 좌표 반환
   */
  getContainerPosition(): { x: number; y: number } {
    const anchorPos = this.scene.getUIAnchorWorldPosition('bottomCenter');
    return {
      x: anchorPos.x + this.cardContainer.x,
      y: anchorPos.y + this.cardContainer.y,
    };
  }

  getGraveWorldPosition(): { x: number; y: number } {
    const anchorPos = this.scene.getUIAnchorWorldPosition('bottomLeft');
    return {
      x: anchorPos.x + this.graveButton.x,
      y: anchorPos.y + this.graveButton.y,
    };
  }

  getDeckWorldPosition(): { x: number; y: number } {
    const anchorPos = this.scene.getUIAnchorWorldPosition('bottomRight');
    return {
      x: anchorPos.x + this.deckButton.x,
      y: anchorPos.y + this.deckButton.y,
    };
  }
  
  /**
   * 특정 인덱스의 카드 sprite를 애니메이션용으로 추출
   * - cardSprites 배열에서 제거
   * - cardContainer에서 제거
   * - 절대 좌표로 변환
   * @returns 추출된 카드 container (또는 null)
   */
  extractCardForAnimation(index: number): Phaser.GameObjects.Container | null {
    if (index < 0 || index >= this.cardSprites.length) {
      return null;
    }
    
    const cardSprite = this.cardSprites[index];
    
    // 절대 좌표 계산 (컨테이너 좌표 + 카드의 상대 좌표)
    const cardContainerPos = this.getContainerPosition();
    const absoluteX = cardContainerPos.x + cardSprite.x;
    const absoluteY = cardContainerPos.y + cardSprite.y;
    
    // cardContainer에서 제거 (destroy하지 않음)
    this.cardContainer.remove(cardSprite, false);
    
    // cardSprites 배열에서 제거
    this.cardSprites.splice(index, 1);
    
    // 절대 좌표로 설정
    cardSprite.setPosition(absoluteX, absoluteY);
    
    // depth를 높여서 다른 UI 위에 표시
    cardSprite.setDepth(5000);
    
    return cardSprite;
  }
  
  updateCardDisplay() {
    const hand = this.scene.gameScene.playerState.hand;
    const cardWidth = 172;  // 스케일
    const maxSpacing = 8;  // 기본 간격
    const maxTotalWidth = 1700;  // 최대 표시 너비
    
    // 레이아웃 계산 시 예약 슬롯 포함 (미리 공간 확보)
    const totalCardCount = hand.length + this.pendingCardCount;
    
    // 카드가 많을 때 겹치게 정렬
    let spacing = maxSpacing;
    let totalWidth = totalCardCount * (cardWidth + spacing) - spacing;
    
    if (totalWidth > maxTotalWidth && totalCardCount > 1) {
      // 카드가 많으면 간격을 줄여서 겹치게
      spacing = (maxTotalWidth - cardWidth) / (totalCardCount - 1) - cardWidth;
      totalWidth = maxTotalWidth;
    }
    
    // 총 카드 수가 0일 때 처리
    if (totalCardCount <= 0) {
      this.cardSprites.forEach(sprite => sprite.destroy());
      this.cardSprites = [];
      const player = this.scene.gameScene.playerState;
      this.graveCountText.setText(`GRAVE: ${player.discard.length}`);
      // 카드가 없으면 툴팁도 숨김
      this.scene.tooltipUI.hide();
      return;
    }
    
    const startX = -totalWidth / 2 + cardWidth / 2;
    
    // 이전 카드 위치 저장
    const prevPositions = this.cardSprites.map(sprite => sprite.x);
    const prevCount = this.cardSprites.length;
    
    // 기존 카드 제거 전 툴팁 숨김 (pointerout 이벤트가 발생하지 않으므로)
    this.scene.tooltipUI.hide();
    
    // 기존 카드 제거
    this.cardSprites.forEach(sprite => sprite.destroy());
    this.cardSprites = [];
    
    hand.forEach((card, index) => {
      const targetX = startX + index * (cardWidth + spacing);
      
      // 새 카드인지 기존 카드인지 판단
      const isNewCard = index >= prevCount;
      const startX_anim = isNewCard 
        ? targetX  // 새 카드는 바로 목표 위치에 (드로우 애니메이션이 날아오므로)
        : (prevPositions[index] ?? targetX);  // 기존 카드는 이전 위치에서
      
      const cardSprite = this.createCardSprite(card, startX_anim, 0, index);
      cardSprite.setDepth(index);
      this.cardContainer.add(cardSprite);
      this.cardSprites.push(cardSprite);
      
      // 위치가 다르면 tween으로 이동 (기존 카드들이 옆으로 밀리는 효과)
      if (startX_anim !== targetX) {
        this.scene.tweens.add({
          targets: cardSprite,
          x: targetX,
          duration: 200,
          ease: 'Quad.easeOut',
        });
      }
    });
    
    // 무덤 표시 업데이트
    const player = this.scene.gameScene.playerState;
    this.graveCountText.setText(`GRAVE: ${player.discard.length}`);
    
    // 덱 카운트 업데이트
    this.deckCountText.setText(`DECK: ${player.deck.length}`);
  }
  
  private createCardSprite(card: Card, x: number, y: number, index: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    const isSword = card.type === 'sword';
    const isSwiftSkill = !isSword && (card.data as SkillCard).isSwift === true;
    const data = card.data;
    const manaCost = data.manaCost;
    const canAfford = this.scene.gameScene.playerState.mana >= manaCost;
    
    // 무기가 없을 때 공격/특수 스킬은 사용 불가
    const hasWeapon = this.scene.gameScene.playerState.currentSword !== null;
    const needsWeapon = !isSword && ((card.data as SkillCard).type === 'attack' || (card.data as SkillCard).type === 'special');
    const isDisabledByNoWeapon = needsWeapon && !hasWeapon;
    
    // 이어베기: 이번 턴에 공격/무기를 사용했어야 함
    const isFollowUpSkill = !isSword && (card.data as SkillCard).effect?.type === 'followUp';
    const isDisabledByFollowUp = isFollowUpSkill && !this.scene.gameScene.playerState.usedAttackThisTurn;
    
    const isUsable = canAfford && !isDisabledByNoWeapon && !isDisabledByFollowUp;
    
    const bgColor = isSword ? COLORS.background.light : COLORS.background.dark;
    // 신속 스킬은 금색, 일반 스킬은 청록색
    const skillBorderColor = isSwiftSkill ? COLORS.card.swift : COLORS.card.skill;
    const borderColor = isUsable ? (isSword ? COLORS.card.sword : skillBorderColor) : COLORS.border.dark;
    
    // 카드 배경 (스케일)
    const bg = this.scene.add.rectangle(0, 0, 165, 253, bgColor);
    bg.setStrokeStyle(isUsable ? 5 : 3, borderColor);
    container.add(bg);
    
    // 카드 번호 (스케일)
    const numKey = index < 9 ? `${index + 1}` : '0';
    const numText = this.scene.add.text(-68, -112, `[${numKey}]`, {
      font: 'bold 22px monospace',
      color: isUsable ? COLORS_STR.primary.main : COLORS_STR.text.disabled,
    });
    container.add(numText);
    
    // 마나 비용 (스케일)
    const manaText = this.scene.add.text(34, -112, `◈${manaCost}`, {
      font: 'bold 22px monospace',
      color: isUsable ? COLORS_STR.primary.main : COLORS_STR.text.disabled,
    });
    container.add(manaText);
    
    // 카드 내용
    if (isSword) {
      this.renderSwordCard(container, card.data as SwordCard, isUsable);
    } else {
      this.renderSkillCard(container, card.data as SkillCard, isUsable, isDisabledByNoWeapon);
    }
    
    // 무기 없음으로 비활성화된 경우 오버레이 표시 (스케일)
    if (isDisabledByNoWeapon) {
      const disabledOverlay = this.scene.add.rectangle(0, 0, 165, 253, 0x000000, 0.5);
      const noWeaponIcon = this.scene.add.text(0, 0, '🚫', {
        font: '52px Arial',
      }).setOrigin(0.5);
      container.add([disabledOverlay, noWeaponIcon]);
    }
    
    // 이어베기 비활성화 (먼저 공격해야 함) (스케일)
    if (isDisabledByFollowUp) {
      const disabledOverlay = this.scene.add.rectangle(0, 0, 165, 253, 0x000000, 0.5);
      const followUpIcon = this.scene.add.text(0, 0, '🔗', {
        font: '52px Arial',
      }).setOrigin(0.5);
      container.add([disabledOverlay, followUpIcon]);
    }
    
    // 교환 모드일 때 교환 표시 (스케일)
    if (this.scene.gameScene.isExchangeMode) {
      const exchangeOverlay = this.scene.add.rectangle(0, 0, 165, 253, COLORS.primary.dark, 0.3);
      const exchangeIcon = this.scene.add.text(0, 0, '↻', {
        font: 'bold 60px monospace',
        color: COLORS_STR.primary.dark,
      }).setOrigin(0.5);
      container.add([exchangeOverlay, exchangeIcon]);
      
      bg.setStrokeStyle(5, COLORS.primary.dark);
    }
    
    // 호버 효과
    bg.setInteractive({ useHandCursor: isUsable || this.scene.gameScene.isExchangeMode });
    bg.on('pointerover', () => {
      const hover = UI_LAYOUT.interactions.cardHover;
      if (this.scene.gameScene.isExchangeMode) {
        this.scene.tweens.killTweensOf(container);
        this.scene.tweens.add({
          targets: container,
          y: y - hover.liftY,
          duration: hover.durationInMs,
          ease: hover.easeIn,
        });
        bg.setStrokeStyle(5, COLORS.primary.light);
      } else if (isUsable) {
        this.scene.tweens.killTweensOf(container);
        this.scene.tweens.add({
          targets: container,
          y: y - hover.liftY,
          duration: hover.durationInMs,
          ease: hover.easeIn,
        });
        bg.setStrokeStyle(5, COLORS.primary.light);
      }
      const containerPos = this.getContainerPosition();
      this.scene.tooltipUI.show(
        containerPos.x + x,
        containerPos.y + y,
        card,
        bg  // 원본 히트 영역 전달
      );
    });
    bg.on('pointerout', () => {
      const hover = UI_LAYOUT.interactions.cardHover;
      this.scene.tweens.killTweensOf(container);
      this.scene.tweens.add({
        targets: container,
        y,
        duration: hover.durationOutMs,
        ease: hover.easeOut,
      });
      // 카드에서 툴팁으로 이동하는 짧은 구간을 허용하기 위해 약간 지연 후 판정
      this.scene.time.delayedCall(24, () => {
        if (this.scene.tooltipUI.shouldHideForSource(bg)) {
          this.scene.tooltipUI.hide();
        }
      });
      if (this.scene.gameScene.isExchangeMode) {
        bg.setStrokeStyle(5, COLORS.primary.dark);
      } else {
        bg.setStrokeStyle(isUsable ? 4 : 2, borderColor);
      }
    });
    bg.on('pointerdown', () => {
      if (this.scene.gameScene.isExchangeMode) {
        this.scene.gameScene.exchangeCard(index);
        this.scene.tooltipUI.hide();
      } else if (isUsable) {
        this.scene.gameScene.useCard(index);
        this.scene.tooltipUI.hide();
      }
    });
    
    return container;
  }
  
  private renderSwordCard(container: Phaser.GameObjects.Container, sword: SwordCard, canAfford: boolean) {
    // 등급별 색상
    const textColor = canAfford ? COLORS_STR.rarity[sword.rarity as keyof typeof COLORS_STR.rarity || 'common'] : COLORS_STR.text.disabled;
    const subColor = canAfford ? COLORS_STR.text.secondary : COLORS_STR.text.disabled;
    
    // 이모지 (스케일)
    const emoji = this.scene.add.text(0, -84, sword.emoji, {
      font: '51px Arial',
    }).setOrigin(0.5);
    
    // 검 이름 (displayName 사용, 스케일)
    const displayName = sword.displayName || sword.name;
    const shortName = displayName.length > 6 ? displayName.slice(0, 5) + '..' : displayName;
    const nameText = this.scene.add.text(0, -34, shortName, {
      font: 'bold 22px monospace',
      color: textColor,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    
    // 스탯 - 간략화 (스케일)
    const reachText = i18n.getRangeText(sword.reach);

    const statsText = this.scene.add.text(0, 9, `${t('ui.cards.attack')}${sword.attack} ${sword.attackCount}${t('ui.cards.attackCount')} ${reachText}`, {
      font: '18px monospace',
      color: subColor,
      align: 'center',
    }).setOrigin(0.5);
    
    // 내구도 (1이면 경고 색상, 스케일)
    const durColor = sword.durability === 1 ? COLORS_STR.secondary.main : (canAfford ? COLORS_STR.primary.main : COLORS_STR.text.disabled);
    const durText = this.scene.add.text(0, 43, `${t('ui.cards.durability')}${sword.durability} ${t('ui.cards.defense')}${sword.defense}`, {
      font: '18px monospace',
      color: durColor,
    }).setOrigin(0.5);
    
    // 타입 라벨 (스케일)
    const rarityLabel = sword.rarity === 'unique' ? '★' : 
                        sword.rarity === 'rare' ? '◆' : 
                        sword.rarity === 'uncommon' ? '◇' : '';
    const typeLabel = this.scene.add.text(0, 84, `${rarityLabel}검`, {
      font: 'bold 18px monospace',
      color: textColor,
    }).setOrigin(0.5);
    
    container.add([emoji, nameText, statsText, durText, typeLabel]);
  }
  
  private renderSkillCard(container: Phaser.GameObjects.Container, skill: SkillCard, canAfford: boolean, isDisabledByNoWeapon: boolean = false) {
    // 신속 스킬은 금색, 일반 스킬은 청록
    const isSwift = skill.isSwift === true;
    const skillColor = isSwift ? COLORS_STR.card.swift : COLORS_STR.card.skill;
    
    // 무기 없음으로 비활성화된 경우 더 어둡게
    const textColor = canAfford ? skillColor : (isDisabledByNoWeapon ? COLORS_STR.background.medium : COLORS_STR.text.disabled);
    const subColor = canAfford ? COLORS_STR.text.secondary : (isDisabledByNoWeapon ? COLORS_STR.background.medium : COLORS_STR.text.disabled);
    
    // 이모지 (스케일)
    const emoji = this.scene.add.text(0, -84, skill.emoji, {
      font: '51px Arial',
    }).setOrigin(0.5);
    
    // 스킬 이름 (스케일)
    const nameText = this.scene.add.text(0, -34, skill.name, {
      font: 'bold 22px monospace',
      color: textColor,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    
    // 타입
    const typeMap: Record<string, string> = {
      attack: '⚔',
      defense: '🛡',
      buff: '✨',
      special: '💥',
    };
    
    // 스탯
    const reachMap: Record<string, string> = {
      single: i18n.t('ui.range.single'),
      double: i18n.t('ui.range.double'),
      triple: i18n.t('ui.range.triple'),
      all: i18n.t('ui.range.all'),
    };
    
    // 간결한 스탯 표시 (스케일)
    let statLine = typeMap[skill.type];
    if (skill.attackMultiplier > 0) {
      statLine += ` x${skill.attackMultiplier}`;
    }
    if (skill.defenseBonus > 0) {
      statLine += ` +${skill.defenseBonus}`;
    }
    
    const statsText = this.scene.add.text(0, 9, statLine, {
      font: '18px monospace',
      color: subColor,
      align: 'center',
    }).setOrigin(0.5);
    
    // 범위 & 타수배율 표시 (스케일)
    let subLine = '';
    if (skill.type === 'attack' || skill.type === 'special') {
      // 범위: single이면 '무기', swordDouble이면 '무기x2', 아니면 자체 범위
      let rangeText = '';
      if (skill.reach === 'single') {
        rangeText = i18n.t('ui.range.weapon');
      } else if (skill.reach === 'swordDouble') {
        rangeText = i18n.t('ui.range.swordDouble');
      } else {
        rangeText = reachMap[skill.reach] || skill.reach;
      }
      // 타수배율: 1이면 '무기', 아니면 x배율
      const hitsText = skill.attackCount === 1 ? i18n.t('ui.range.weapon') : `x${skill.attackCount}`;
      subLine = `${rangeText} ${hitsText}${i18n.t('ui.misc.hits')}`;
    } else if (skill.type === 'defense') {
      subLine = i18n.t('ui.misc.defenseSkill');
    } else if (skill.type === 'buff') {
      subLine = i18n.t('ui.misc.buffSkill');
    }
    
    const costText = this.scene.add.text(0, 43, subLine, {
      font: '18px monospace',
      color: canAfford ? COLORS_STR.primary.dark : COLORS_STR.text.disabled,
    }).setOrigin(0.5);
    
    // 타입 라벨 (신속 스킬은 ⚡ 표시, 스케일)
    const typeText = isSwift ? i18n.t('ui.skillType.swift') : i18n.t('ui.skillType.skill');
    const typeLabel = this.scene.add.text(0, 84, typeText, {
      font: 'bold 18px monospace',
      color: textColor,
    }).setOrigin(0.5);
    
    container.add([emoji, nameText, statsText, costText, typeLabel]);
  }
}

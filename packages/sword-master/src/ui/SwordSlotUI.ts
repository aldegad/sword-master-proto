import Phaser from 'phaser';
import type { UIScene } from '../scenes/UIScene';
import type { SwordCard } from '../types';
import { MAX_SWORD_SLOTS, getEquipCost } from '../types';
import { COLORS, COLORS_STR } from '../constants/colors';
import { CardRenderer, CARD_SIZE } from './CardRenderer';
import { USE_SVG, SWORD_ID_TO_SVG } from '../constants/sprites';

// 검 슬롯 레이아웃 상수
const SLOT_LAYOUT = {
  SLOT_WIDTH: 70,
  SLOT_HEIGHT: 100,
  SLOT_SPACING: 8,
  Y_OFFSET: 290,  // 화면 하단에서 위로 얼마나
};

/**
 * 검 슬롯 UI
 * - 손패 위쪽에 7개 슬롯 배치
 * - 클릭하여 장착 변경 (마나 소모 + 발도 공격)
 * - 호버 시 검 정보 툴팁
 */
export class SwordSlotUI {
  private scene: UIScene;
  private container: Phaser.GameObjects.Container;
  private slots: Phaser.GameObjects.Container[] = [];
  private cardRenderer: CardRenderer;
  private tooltipContainer: Phaser.GameObjects.Container;

  constructor(scene: UIScene) {
    this.scene = scene;
    this.cardRenderer = new CardRenderer(scene);

    const centerX = scene.cameras.main.width / 2;
    const y = scene.cameras.main.height - SLOT_LAYOUT.Y_OFFSET;

    this.container = scene.add.container(centerX, y);
    this.container.setDepth(100);

    // 툴팁 컨테이너
    this.tooltipContainer = scene.add.container(0, 0);
    this.tooltipContainer.setDepth(9000);
    this.tooltipContainer.setVisible(false);

    this.createSlots();

    // 이벤트 리스너
    scene.gameScene.events.on('statsUpdated', () => this.update());
    scene.gameScene.events.on('swordEquipped', () => this.update());
    scene.gameScene.events.on('swordAcquired', () => this.update());
    scene.gameScene.events.on('swordReplaced', () => this.update());
  }

  private createSlots() {
    const totalWidth = MAX_SWORD_SLOTS * (SLOT_LAYOUT.SLOT_WIDTH + SLOT_LAYOUT.SLOT_SPACING) - SLOT_LAYOUT.SLOT_SPACING;
    const startX = -totalWidth / 2 + SLOT_LAYOUT.SLOT_WIDTH / 2;

    for (let i = 0; i < MAX_SWORD_SLOTS; i++) {
      const x = startX + i * (SLOT_LAYOUT.SLOT_WIDTH + SLOT_LAYOUT.SLOT_SPACING);
      const slot = this.createSlot(i, x, 0);
      this.container.add(slot);
      this.slots.push(slot);
    }
  }

  private createSlot(index: number, x: number, y: number): Phaser.GameObjects.Container {
    const slot = this.scene.add.container(x, y);

    // 슬롯 배경
    const bg = this.scene.add.rectangle(0, 0, SLOT_LAYOUT.SLOT_WIDTH, SLOT_LAYOUT.SLOT_HEIGHT, COLORS.background.dark, 0.7);
    bg.setStrokeStyle(2, COLORS.border.medium);
    slot.add(bg);

    // 슬롯 번호
    const numText = this.scene.add.text(0, SLOT_LAYOUT.SLOT_HEIGHT / 2 - 12, `${index + 1}`, {
      font: '12px monospace',
      color: COLORS_STR.text.muted,
    }).setOrigin(0.5);
    slot.add(numText);

    // 인터랙션 설정
    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => {
      this.onSlotHover(index);
    });

    bg.on('pointerout', () => {
      this.hideTooltip();
    });

    bg.on('pointerdown', () => {
      this.onSlotClick(index);
    });

    return slot;
  }

  private onSlotHover(index: number) {
    const inventory = this.scene.gameScene.playerState.swordInventory;
    if (index >= inventory.length) return;

    const sword = inventory[index];
    this.showTooltip(sword, index);
  }

  private onSlotClick(index: number) {
    const gameScene = this.scene.gameScene;
    const inventory = gameScene.playerState.swordInventory;

    if (index >= inventory.length) return;

    // 전투 중에만 장착 변경 가능
    if (gameScene.gameState.phase !== 'combat') {
      gameScene.animationHelper.showMessage('전투 중에만 장착 변경 가능!', COLORS.message.error);
      return;
    }

    gameScene.swordSlotSystem.equipSword(index);
    this.update();
  }

  private showTooltip(sword: SwordCard, slotIndex: number) {
    this.tooltipContainer.removeAll(true);

    const isEquipped = this.scene.gameScene.playerState.equippedSwordIndex === slotIndex;
    const cost = getEquipCost(sword);
    const canAfford = this.scene.gameScene.playerState.mana >= cost;

    // 상세 카드 생성
    const detailCard = this.cardRenderer.createDetailCard({ type: 'sword', data: sword }, null);

    // 장착 상태 표시
    if (isEquipped) {
      const equippedLabel = this.scene.add.text(0, -CARD_SIZE.DETAIL.height / 2 - 20, '⚔️ 장착 중', {
        font: 'bold 18px monospace',
        color: '#FFD700',
      }).setOrigin(0.5);
      this.tooltipContainer.add(equippedLabel);
    } else {
      // 장착 비용 표시
      const costColor = canAfford ? '#5DADE2' : '#FF6B6B';
      const costLabel = this.scene.add.text(0, -CARD_SIZE.DETAIL.height / 2 - 20, `장착 비용: ◈${cost}`, {
        font: 'bold 16px monospace',
        color: costColor,
      }).setOrigin(0.5);
      this.tooltipContainer.add(costLabel);
    }

    // 위치 설정 (슬롯 위쪽에 표시)
    const slot = this.slots[slotIndex];
    const slotWorldPos = slot.getWorldTransformMatrix();
    const tooltipX = slotWorldPos.tx;
    const tooltipY = slotWorldPos.ty - SLOT_LAYOUT.SLOT_HEIGHT / 2 - CARD_SIZE.DETAIL.height / 2 - 40;

    this.tooltipContainer.setPosition(tooltipX, tooltipY);
    this.tooltipContainer.add(detailCard);
    this.tooltipContainer.setVisible(true);
  }

  private hideTooltip() {
    this.tooltipContainer.setVisible(false);
  }

  update() {
    const inventory = this.scene.gameScene.playerState.swordInventory;
    const equippedIdx = this.scene.gameScene.playerState.equippedSwordIndex;
    const mana = this.scene.gameScene.playerState.mana;

    this.slots.forEach((slot, i) => {
      // 기존 내용 제거 (배경과 번호는 유지)
      while (slot.list.length > 2) {
        const obj = slot.list[slot.list.length - 1];
        if (obj instanceof Phaser.GameObjects.GameObject) {
          obj.destroy();
        }
        slot.remove(obj, true);
      }

      const bg = slot.list[0] as Phaser.GameObjects.Rectangle;

      if (i < inventory.length) {
        const sword = inventory[i];
        const isEquipped = i === equippedIdx;
        const cost = getEquipCost(sword);
        const canAfford = mana >= cost;

        // 검 이미지 (SVG 또는 이모지 폴백)
        const svgKey = SWORD_ID_TO_SVG[sword.id];
        if (USE_SVG && svgKey && this.scene.textures.exists(svgKey)) {
          const swordImage = this.scene.add.image(0, -15, svgKey);
          swordImage.setDisplaySize(48, 48);
          slot.add(swordImage);
        } else {
          const emoji = this.scene.add.text(0, -15, sword.emoji, {
            font: '32px Arial',
          }).setOrigin(0.5);
          slot.add(emoji);
        }

        // 내구도 바
        const durabilityPercent = sword.currentDurability / sword.durability;
        const barWidth = SLOT_LAYOUT.SLOT_WIDTH - 16;
        const barBg = this.scene.add.rectangle(0, 25, barWidth, 6, 0x333333);
        const barFill = this.scene.add.rectangle(
          -barWidth / 2 + (barWidth * durabilityPercent) / 2,
          25,
          barWidth * durabilityPercent,
          6,
          durabilityPercent > 0.3 ? COLORS.success.main : COLORS.effect.damageHard
        );
        slot.add(barBg);
        slot.add(barFill);

        // 마나 비용 표시 (장착되지 않은 경우)
        if (!isEquipped && cost > 0) {
          const costBg = this.scene.add.circle(SLOT_LAYOUT.SLOT_WIDTH / 2 - 8, -SLOT_LAYOUT.SLOT_HEIGHT / 2 + 8, 12,
            canAfford ? COLORS.primary.main : COLORS.effect.damageHard, 0.9);
          const costText = this.scene.add.text(SLOT_LAYOUT.SLOT_WIDTH / 2 - 8, -SLOT_LAYOUT.SLOT_HEIGHT / 2 + 8, `${cost}`, {
            font: 'bold 12px monospace',
            color: '#FFFFFF',
          }).setOrigin(0.5);
          slot.add(costBg);
          slot.add(costText);
        }

        // 장착 중 하이라이트
        if (isEquipped) {
          bg.setStrokeStyle(3, COLORS.primary.light);
          bg.setFillStyle(COLORS.primary.dark, 0.3);
        } else {
          bg.setStrokeStyle(2, canAfford ? COLORS.border.medium : COLORS.border.dark);
          bg.setFillStyle(COLORS.background.dark, 0.7);
        }
      } else {
        // 빈 슬롯
        bg.setStrokeStyle(1, COLORS.border.dark);
        bg.setFillStyle(COLORS.background.dark, 0.3);

        const emptyText = this.scene.add.text(0, 0, '─', {
          font: '24px monospace',
          color: COLORS_STR.text.muted,
        }).setOrigin(0.5);
        slot.add(emptyText);
      }
    });
  }

  setVisible(visible: boolean) {
    this.container.setVisible(visible);
    if (!visible) {
      this.tooltipContainer.setVisible(false);
    }
  }
}

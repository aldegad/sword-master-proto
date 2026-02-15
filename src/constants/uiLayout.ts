/**
 * UI layout tuning constants.
 *
 * How to tune:
 * - Anchor positions are scene-world references.
 * - Each UI block then uses local offsets from its anchor.
 * - Change only numeric values here to move UI without touching logic code.
 */
export const UI_LAYOUT = {
  anchors: {
    marginX: 38,
    marginTop: 20,
    marginBottom: 50,
    depth: 1200,
  },

  // Anchor > Container 계층 루트
  // topLeft: HP + 마나 + 소드패널 + 패시브
  // topRight: 설정 + 턴 + 점수 + 은전
  hud: {
    topLeft: {
      rootX: 0,
      rootY: 0,
      sections: {
        hp: { x: 0, y: 0 },
        mana: { x: 0, y: 0 },
        swordInfo: { x: 0, y: 0 },
        passive: { x: 0, y: 0 },
      },
    },
    topRight: {
      rootX: 8,
      rootY: 38, // 기존 대비 +30px 하향
      flowX: 0,  // 우측 정렬 기준선 (text origin 1,0)
      itemY: {
        settings: 0,
        turn: 36, // settings ↔ turn 간격 축소
        score: 94,
        silver: 152,
      },
      fontSize: 48,
    },
  },

  settings: {
    root: {
      depth: 4000,
    },
    gear: {
      // right-aligned HUD 기준에서 gear의 미세 X 보정
      // (아이콘 중심 좌표이므로 -iconSize/2 정도를 주면 오른쪽 기준선과 맞음)
      x: -22,
      hitX: -22,
      iconSize: 44,
      fallbackFontSize: 44,
      hitSize: 64,
      hoverAlpha: 0.7,
    },
    menu: {
      // 5개 항목(전체화면~메인메뉴) 3x 스케일
      // 메뉴 우측 끝이 HUD 기준선(0)에 오도록 구성
      x: -660,
      y: 48,
      bgX: 330,
      bgY: 348,
      bgWidth: 660,
      bgHeight: 708,
      itemX: 330,
      itemBgWidth: 594,
      itemBgHeight: 108,
      itemIconX: -234,
      itemIconSize: 42,
      itemLabelX: -180,
      itemLabelFontSize: 48,
      itemY: {
        fullscreen: 108,
        locale: 228,
        rulebook: 348,
        restart: 468,
        mainMenu: 588,
      },
      animation: {
        dropY: 16,
        durationInMs: 170,
        durationOutMs: 130,
      },
    },
  },

  topBar: {
    hp: {
      panelX: 0,
      panelY: 22,
      panelWidth: 525,
      panelHeight: 34,
      textX: 262,
      textY: 38,
      textFontSize: 20,
      labelX: 0,
      labelY: -10,
      labelFontSize: 22,
      levelX: 132,
      levelY: -10,
      levelFontSize: 22,
      fillX: 4,
      fillY: 4,
      fillWidth: 517,
      fillHeight: 26,
    },
    mana: {
      labelX: 0,
      labelY: 70,
      labelFontSize: 20,
      containerX: 162,
      containerY: 92,
      orbSpacing: 38,
      orbSize: 14,
    },
    center: {
      waveX: 0,
      waveY: 0,
      waveFontSize: 50,
      phaseX: 0,
      phaseY: 56,
      phaseFontSize: 28,
    },
    passive: {
      statsX: 0,
      statsY: 540,
      statsFontSize: 20,
      containerX: 0,
      containerY: 125,
      tooltipX: 0,
      tooltipY: 180,
    },
  },

  swordInfo: {
    panelX: 0,
    panelY: 140,
    panelWidth: 488,
    panelHeight: 188,
    titleX: 18,
    titleY: 152,
    titleFontSize: 26,
    emojiX: 394,
    emojiY: 233,
    emojiFontSize: 75,
    infoX: 18,
    infoY: 190,
    infoFontSize: 22,
    infoLineSpacing: 8,
    specialX: 18,
    specialY: 302,
    specialFontSize: 18,
    tooltipGapX: 20,
    tooltipTopMargin: 50,
  },

  cardArea: {
    background: {
      x: 0,
      y: -98,
      width: 1838,
      height: 300,
    },
    handLabel: {
      x: 0,
      y: -248,
      fontSize: 24,
    },
    handContainer: {
      x: 0,
      y: -95,
    },
    graveButton: {
      x: 62,
      y: 0,
      width: 140,
      height: 50,
      iconX: -50,
      iconFontSize: 24,
      textX: 10,
      textFontSize: 18,
    },
    deckButton: {
      x: -62,
      y: 0,
      width: 140,
      height: 50,
      iconX: -50,
      iconFontSize: 24,
      textX: 10,
      textFontSize: 18,
    },
  },

  interactions: {
    cardHover: {
      liftY: 38,
      durationInMs: 130,
      durationOutMs: 130,
      easeIn: 'Sine.out',
      easeOut: 'Sine.in',
    },
    tooltip: {
      depth: 9000,
      popOffsetY: 12,
      showDurationMs: 120,
      hideDurationMs: 90,
      easeShow: 'Sine.out',
      easeHide: 'Sine.in',
    },
  },

  actionButtons: {
    startX: 74,
    y: -266,
    buttonWidth: 168,
    buttonHeight: 56,
    spacing: 15,
    labelY: -8,
    labelFontSize: 20,
    subLabelY: 16,
    subLabelFontSize: 16,
  },

  countEffects: {
    rootOffsetY: -470,
    item: {
      containerX: 0,
      yStep: 60,
      bgX: 150,
      bgY: 0,
      bgWidth: 338,
      bgHeight: 49,
      textX: 150,
      textY: 0,
      textFontSize: 26,
    },
    primaryAnchorOffset: {
      x: 168,
      y: 60,
    },
    tooltipOffsetX: 375,
  },
} as const;

export type UILayout = typeof UI_LAYOUT;
